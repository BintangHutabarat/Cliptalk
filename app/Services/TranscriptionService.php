<?php

namespace App\Services;

use App\Models\Project;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\Process\Process;

class TranscriptionService
{
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
