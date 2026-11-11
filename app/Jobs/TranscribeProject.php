<?php

namespace App\Jobs;

use App\Models\Project;
use App\Services\CandidateGenerationService;
use App\Services\TranscriptionService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

class TranscribeProject implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 1860;

    public function __construct(
        public string $projectId
    ) {}

    public function handle(
        TranscriptionService $transcriptionService,
        CandidateGenerationService $candidateService
    ): void {
        $project = Project::findOrFail($this->projectId);

        $project->update([
            'stage' => 'transcribing',
            'error' => null,
        ]);

        // Tahap 1: transkripsi video.
        $transcriptPath = $transcriptionService->transcribe($project);

        $disk = Storage::disk('local');

        $transcript = json_decode(
            $disk->get($transcriptPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        $segments = $transcript['segments'] ?? null;

        if (! is_array($segments)) {
            throw new RuntimeException(
                'Data segmen transkrip tidak valid.'
            );
        }

        $project->update([
            'transcript_path' => $transcriptPath,
            'stage' => 'extracting',
            'error' => null,
        ]);

        // Tahap 2: membuat kandidat dari transkrip.
        $candidates = $candidateService->generate(
            $segments,
            (int) $project->target_duration,
            $project->id
        );

        if ($candidates === []) {
            $project->update([
                'stage' => 'failed',
                'error' => "Tidak ada bagian yang cocok untuk klip {$project->target_duration} detik. Pilih durasi klip yang lebih pendek atau unggah video dengan pembicaraan yang lebih panjang.",
            ]);

            return;
        }

        // Simpan kandidat agar tidak perlu dihitung ulang
        // setiap kali halaman segmen dibuka.
        $candidatePath = "projects/{$project->id}/candidates.json";

        $saved = $disk->put(
            $candidatePath,
            json_encode(
                $candidates,
                JSON_PRETTY_PRINT
                    | JSON_UNESCAPED_UNICODE
                    | JSON_THROW_ON_ERROR
            )
        );

        if (! $saved) {
            throw new RuntimeException(
                'Gagal menyimpan hasil generasi kandidat.'
            );
        }

        // Proyek baru siap setelah kedua tahap berhasil.
        $project->update([
            'stage' => 'ready',
            'error' => null,
        ]);
    }

    public function failed(Throwable $exception): void
    {
        $project = Project::find($this->projectId);

        if (! $project) {
            return;
        }

        report($exception);

        $project->update([
            'stage' => 'failed',
            'error' => 'Pemrosesan video gagal. Pastikan video memiliki suara yang jelas, lalu unggah ulang.',
        ]);
    }
}
