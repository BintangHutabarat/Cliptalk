<?php

namespace App\Console\Commands;

use App\Models\Project;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

#[Signature('cliptalk:purge-expired')]
#[Description('Hapus project, klip, dan file yang sudah lewat 24 jam (TASK 6.9)')]
class PurgeExpiredProjects extends Command
{
    /**
     * Project baru dihapus setelah project dan semua klipnya lewat 24 jam,
     * supaya klip tidak hilang sebelum waktu kedaluwarsa yang tampil di halaman unduh.
     */
    public function handle(): int
    {
        $cutoff = now()->subDay();
        $disk = Storage::disk('local');
        $deleted = 0;

        Project::query()
            ->where('created_at', '<', $cutoff)
            ->whereDoesntHave('clips', fn ($query) => $query->where('created_at', '>=', $cutoff))
            ->lazyById()
            ->each(function (Project $project) use ($disk, &$deleted) {
                $disk->deleteDirectory("projects/{$project->id}");
                $project->delete();
                $deleted++;
            });

        $this->info("Project kedaluwarsa dihapus: {$deleted}");

        return self::SUCCESS;
    }
}
