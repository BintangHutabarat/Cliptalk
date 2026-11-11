<?php

namespace App\Services;

use App\Models\Clip;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ClipRenderService
{
    /**
     * @param  (callable(int): void)|null  $onProgress  dipanggil dengan persen 0–99 selama FFmpeg berjalan
     * @return array{output_path: string, subtitle_path: string|null, output_size_bytes: int, sha256: string}
     */
    public function render(Clip $clip, ?callable $onProgress = null): array
    {
        $clip->loadMissing('project');

        $project = $clip->project;
        $disk = Storage::disk('local');

        $sourceRelativePath = $project->file_path;

        if (! $sourceRelativePath || ! $disk->exists($sourceRelativePath)) {
            throw new RuntimeException('File video sumber tidak ditemukan.');
        }

        $directory = "projects/{$project->id}/clips/{$clip->id}";

        $disk->makeDirectory($directory);

        $outputRelativePath = "{$directory}/clip.mp4";
        $subtitleRelativePath = "{$directory}/subtitles.srt";

        $workingDirectory = $disk->path($directory);
        $sourcePath = $disk->path($sourceRelativePath);

        $segments = $this->readTranscript($project->transcript_path);

        $srt = $this->buildSrt(
            $segments,
            (float) $clip->start_sec,
            (float) $clip->end_sec
        );

        if ($srt !== '') {
            $disk->put($subtitleRelativePath, $srt);
        }

        $duration = (float) $clip->end_sec - (float) $clip->start_sec;

        if ($duration <= 0) {
            throw new RuntimeException('Durasi klip tidak valid.');
        }

        $command = [
            'ffmpeg',
            '-hide_banner',
            '-y',
            '-nostats',
            '-progress',
            'pipe:1',
            '-ss',
            (string) $clip->start_sec,
            '-i',
            $sourcePath,
            '-t',
            (string) $duration,
            '-map',
            '0:v:0',
            '-map',
            '0:a?',
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            '23',
            '-pix_fmt',
            'yuv420p',
            '-c:a',
            'aac',
            '-b:a',
            '128k',
            '-movflags',
            '+faststart',
        ];

        // Center crop 9:16 lalu 1080×1920 (SYSTEM-DESIGN §6); min() menjaga sumber yang sudah vertikal.
        $videoFilters = [
            "crop='min(iw,ih*9/16)':'min(ih,iw*16/9)'",
            'scale=1080:1920',
            'setsar=1',
        ];

        if ($clip->show_captions && $srt !== '') {
            $disk->put(
                "{$directory}/clip.ass",
                $this->buildAss(
                    $segments,
                    (float) $clip->start_sec,
                    (float) $clip->end_sec,
                    (string) $clip->caption_style
                )
            );
            $videoFilters[] = 'ass=clip.ass';
        }

        $command[] = '-vf';
        $command[] = implode(',', $videoFilters);

        $command[] = $disk->path($outputRelativePath);

        $lastPercent = 0;

        $result = Process::path($workingDirectory)
            ->timeout(600)
            ->run($command, function (string $type, string $buffer) use (&$lastPercent, $duration, $onProgress): void {
                // -progress menulis out_time_us (mikrodetik video yang sudah jadi) ke stdout.
                if ($onProgress === null || ! preg_match_all('/out_time_us=(\d+)/', $buffer, $matches)) {
                    return;
                }

                $percent = (int) min(99, floor(end($matches[1]) / 1_000_000 / $duration * 100));

                if ($percent >= $lastPercent + 5) {
                    $lastPercent = $percent;
                    $onProgress($percent);
                }
            });

        if (! $result->successful()) {
            $message = trim($result->errorOutput());

            if ($message === '') {
                $message = trim($result->output());
            }

            throw new RuntimeException(
                'FFmpeg gagal merender video: '
                .mb_substr($message, 0, 1500)
            );
        }

        if (! $disk->exists($outputRelativePath)) {
            throw new RuntimeException(
                'FFmpeg selesai tetapi file video tidak ditemukan.'
            );
        }

        $size = $disk->size($outputRelativePath);

        if ($size <= 0) {
            throw new RuntimeException('File video hasil render kosong.');
        }

        return [
            'output_path' => $outputRelativePath,
            'subtitle_path' => $srt !== ''
                ? $subtitleRelativePath
                : null,
            'output_size_bytes' => $size,
            'sha256' => hash_file('sha256', $disk->path($outputRelativePath)),
        ];
    }

    private function readTranscript(?string $path): array
    {
        if (! $path) {
            return [];
        }

        $disk = Storage::disk('local');

        if (! $disk->exists($path)) {
            return [];
        }

        $data = json_decode(
            $disk->get($path),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        return is_array($data['segments'] ?? null)
            ? $data['segments']
            : [];
    }

    private function buildSrt(
        array $segments,
        float $clipStart,
        float $clipEnd
    ): string {
        $entries = [];

        foreach ($segments as $segment) {
            if (
                ! is_array($segment)
                || ! isset(
                    $segment['start'],
                    $segment['end'],
                    $segment['text']
                )
            ) {
                continue;
            }

            $start = max((float) $segment['start'], $clipStart);
            $end = min((float) $segment['end'], $clipEnd);
            $text = trim((string) $segment['text']);

            if ($end <= $start || $text === '') {
                continue;
            }

            $entries[] = [
                'start' => $start - $clipStart,
                'end' => $end - $clipStart,
                'text' => $text,
            ];
        }

        usort(
            $entries,
            fn (array $a, array $b) => $a['start'] <=> $b['start']
        );

        $output = [];

        foreach ($entries as $index => $entry) {
            $output[] = (string) ($index + 1);
            $output[] = $this->formatSrtTime($entry['start'])
                .' --> '
                .$this->formatSrtTime($entry['end']);
            $output[] = str_replace(
                ["\r\n", "\r"],
                "\n",
                $entry['text']
            );
            $output[] = '';
        }

        return implode("\n", $output);
    }

    /**
     * Subtitle ASS untuk dibakar ke video 1080×1920 (SYSTEM-DESIGN §6):
     * Geist 700 ukuran 64, maks 2 baris dan ~32 karakter per baris, gaya outline atau latar gelap.
     *
     * @param  array<int, mixed>  $segments
     */
    public function buildAss(
        array $segments,
        float $clipStart,
        float $clipEnd,
        string $style
    ): string {
        // Warna ASS &HAABBGGRR; alpha 48 ≈ 72% buram, sama dengan token caption-plate.
        $border = $style === 'plate'
            ? '&H48000000,&H48000000,-1,0,0,0,100,100,0,0,3,14,0'
            : '&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,0';

        $lines = [
            '[Script Info]',
            'ScriptType: v4.00+',
            'PlayResX: 1080',
            'PlayResY: 1920',
            'WrapStyle: 2',
            'ScaledBorderAndShadow: yes',
            '',
            '[V4+ Styles]',
            'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
            "Style: Default,Geist,64,&H00FFFFFF,&H00FFFFFF,{$border},2,76,76,420,1",
            '',
            '[Events]',
            'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
        ];

        foreach ($segments as $segment) {
            if (! is_array($segment) || ! isset($segment['start'], $segment['end'], $segment['text'])) {
                continue;
            }

            foreach ($this->timedChunks($segment) as [$chunkStart, $chunkEnd, $chunkLines]) {
                $start = max($chunkStart, $clipStart);
                $end = min($chunkEnd, $clipEnd);

                if ($end <= $start) {
                    continue;
                }

                $lines[] = sprintf(
                    'Dialogue: 0,%s,%s,Default,,0,0,0,,%s',
                    $this->formatAssTime($start - $clipStart),
                    $this->formatAssTime($end - $clipStart),
                    implode('\\N', $chunkLines)
                );
            }
        }

        return implode("\n", $lines)."\n";
    }

    /**
     * Potongan subtitle sebuah segmen beserta waktunya. Dengan words dari Whisper, waktu potongan
     * mengikuti kata pertama dan terakhirnya; tanpa words (transkrip lama), durasi segmen dibagi
     * sebanding jumlah karakter.
     *
     * @param  array<string, mixed>  $segment
     * @return list<array{0: float, 1: float, 2: list<string>}>
     */
    private function timedChunks(array $segment): array
    {
        // Kurung kurawal adalah tag override ASS, jadi dibuang dari teks.
        $clean = fn (string $text) => trim(str_replace(['{', '}', "\n", "\r"], ['', '', ' ', ' '], $text));

        $words = array_values(array_filter(
            is_array($segment['words'] ?? null) ? $segment['words'] : [],
            fn ($word) => is_array($word) && isset($word['start'], $word['end'], $word['text']) && $clean((string) $word['text']) !== ''
        ));

        if ($words !== []) {
            $timed = [];
            $index = 0;

            foreach ($this->chunkCaption(array_map(fn (array $word) => $clean((string) $word['text']), $words)) as [$chunkLines, $count]) {
                $timed[] = [(float) $words[$index]['start'], (float) $words[$index + $count - 1]['end'], $chunkLines];
                $index += $count;
            }

            return $timed;
        }

        $tokens = preg_split('/\s+/u', $clean((string) $segment['text']), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $chunks = $this->chunkCaption($tokens);
        $start = (float) $segment['start'];
        $length = (float) $segment['end'] - $start;
        $totalChars = max(1, array_sum(array_map(fn (array $chunk) => mb_strlen(implode(' ', $chunk[0])), $chunks)));
        $timed = [];

        foreach ($chunks as [$chunkLines]) {
            $share = $length * mb_strlen(implode(' ', $chunkLines)) / $totalChars;
            $timed[] = [$start, $start + $share, $chunkLines];
            $start += $share;
        }

        return $timed;
    }

    /**
     * Susun kata menjadi potongan berisi maks 2 baris, masing-masing ~32 karakter.
     *
     * @param  list<string>  $tokens
     * @return list<array{0: list<string>, 1: int}> baris-baris potongan dan jumlah kata di dalamnya
     */
    private function chunkCaption(array $tokens, int $maxChars = 32, int $maxLines = 2): array
    {
        $chunks = [];
        $lines = [];
        $line = '';
        $count = 0;

        foreach ($tokens as $token) {
            $candidate = $line === '' ? $token : "{$line} {$token}";

            if ($line === '' || mb_strlen($candidate) <= $maxChars) {
                $line = $candidate;
                $count++;

                continue;
            }

            $lines[] = $line;
            $line = $token;

            if (count($lines) === $maxLines) {
                $chunks[] = [$lines, $count];
                $lines = [];
                $count = 0;
            }

            $count++;
        }

        if ($line !== '') {
            $lines[] = $line;
        }

        if ($lines !== []) {
            $chunks[] = [$lines, $count];
        }

        return $chunks;
    }

    private function formatAssTime(float $seconds): string
    {
        $centiseconds = (int) round(max(0, $seconds) * 100);

        return sprintf(
            '%d:%02d:%02d.%02d',
            intdiv($centiseconds, 360_000),
            intdiv($centiseconds % 360_000, 6_000),
            intdiv($centiseconds % 6_000, 100),
            $centiseconds % 100
        );
    }

    private function formatSrtTime(float $seconds): string
    {
        $milliseconds = (int) round(max(0, $seconds) * 1000);

        $hours = intdiv($milliseconds, 3_600_000);
        $milliseconds %= 3_600_000;

        $minutes = intdiv($milliseconds, 60_000);
        $milliseconds %= 60_000;

        $wholeSeconds = intdiv($milliseconds, 1000);
        $milliseconds %= 1000;

        return sprintf(
            '%02d:%02d:%02d,%03d',
            $hours,
            $minutes,
            $wholeSeconds,
            $milliseconds
        );
    }
}
