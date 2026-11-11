<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\Process\Process;

class TranscriptionService
{
    /**
     * Ubah segmen dari transcript.json menjadi bentuk TranscriptSegment (SYSTEM-DESIGN.md §4).
     * Id = urutan di file, jadi tetap sama walau halaman hanya menampilkan sebagian segmen.
     *
     * @param  array<int, mixed>  $rawSegments
     * @return list<array{id: int, start: float, end: float, text: string, speaker: null, avgLogprob: float, words: list<array{start: float, end: float, text: string, probability: float}>}>
     */
    public static function toTranscriptSegments(array $rawSegments): array
    {
        $segments = [];

        foreach (array_values($rawSegments) as $index => $segment) {
            if (! is_array($segment) || ! isset($segment['start'], $segment['end'], $segment['text'])) {
                continue;
            }

            $words = [];
            foreach (is_array($segment['words'] ?? null) ? $segment['words'] : [] as $word) {
                if (is_array($word) && isset($word['start'], $word['end'], $word['text'])) {
                    $words[] = [
                        'start' => (float) $word['start'],
                        'end' => (float) $word['end'],
                        'text' => (string) $word['text'],
                        'probability' => (float) ($word['probability'] ?? 1),
                    ];
                }
            }

            $segments[] = [
                'id' => $index + 1,
                'start' => (float) $segment['start'],
                'end' => (float) $segment['end'],
                'text' => (string) $segment['text'],
                'speaker' => null,
                // Transkrip lama tanpa avg_logprob dianggap yakin (0), jadi tidak diberi penanda.
                'avgLogprob' => (float) ($segment['avg_logprob'] ?? 0),
                'words' => $words,
            ];
        }

        return $segments;
    }

    /**
     * Jalankan Faster-Whisper dan kembalikan lokasi JSON
     * relatif terhadap local storage.
     */
    public function transcribe(Project $project): string
    {
        $python = config('services.transcription.python_binary');
        $script = config('services.transcription.script');

        $disk = Storage::disk('local');

        $videoPath = $disk->path($project->file_path);

        if (! is_file($python)) {
            throw new RuntimeException(
                "Python tidak ditemukan: {$python}"
            );
        }

        if (! is_file($script)) {
            throw new RuntimeException(
                "Skrip transkripsi tidak ditemukan: {$script}"
            );
        }

        if (! is_file($videoPath)) {
            throw new RuntimeException(
                'File video proyek tidak ditemukan.'
            );
        }

        $relativeOutputPath =
            "projects/{$project->id}/transcript.json";

        $disk->makeDirectory("projects/{$project->id}");

        $outputPath = $disk->path($relativeOutputPath);

        $process = new Process([
            $python,
            $script,
            $videoPath,
            $outputPath,
            '--model',
            'base',
        ]);

        $process->setTimeout(
            (int) config('services.transcription.timeout', 1800)
        );

        $process->mustRun();

        if (! $disk->exists($relativeOutputPath)) {
            throw new RuntimeException(
                'Skrip selesai tetapi file transkrip tidak ditemukan.'
            );
        }

        $json = json_decode(
            $disk->get($relativeOutputPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        if (
            ! is_array($json) ||
            ! isset($json['segments']) ||
            ! is_array($json['segments'])
        ) {
            $disk->delete($relativeOutputPath);

            throw new RuntimeException(
                'Format JSON hasil transkripsi tidak valid.'
            );
        }

        return $relativeOutputPath;
    }
}
