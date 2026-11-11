<?php

namespace App\Services;

use App\Models\Clip;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class ClipRenderService
{
    public function render(Clip $clip): array
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

        $videoFilters = [
            'scale=1920:1080:force_original_aspect_ratio=decrease',
            'pad=1920:1080:(ow-iw)/2:(oh-ih)/2',
        ];

        if ($clip->show_captions && $srt !== '') {
            $videoFilters[] = 'subtitles=filename=subtitles.srt';
        }

        $command[] = '-vf';
        $command[] = implode(',', $videoFilters);

        $command[] = $disk->path($outputRelativePath);

        $result = Process::path($workingDirectory)
            ->timeout(600)
            ->run($command);

        if (! $result->successful()) {
            $message = trim($result->errorOutput());

            if ($message === '') {
                $message = trim($result->output());
            }

            throw new RuntimeException(
                'FFmpeg gagal merender video: '
                . mb_substr($message, 0, 1500)
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
                . ' --> '
                . $this->formatSrtTime($entry['end']);
            $output[] = str_replace(
                ["\r\n", "\r"],
                "\n",
                $entry['text']
            );
            $output[] = '';
        }

        return implode("\n", $output);
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
