<?php

namespace Tests\Feature;

use App\Models\Clip;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PurgeExpiredProjectsTest extends TestCase
{
    use RefreshDatabase;

    private function projectCreatedHoursAgo(int $hours): Project
    {
        return $this->travelTo(now()->subHours($hours), function () {
            $project = Project::create([
                'file_name' => 'podcast.mp4',
                'file_path' => 'projects/tmp/source.mp4',
                'mime_type' => 'video/mp4',
                'size_bytes' => 1000,
                'target_duration' => 60,
                'stage' => 'ready',
            ]);
            Storage::disk('local')->put("projects/{$project->id}/source.mp4", 'video');

            return $project;
        });
    }

    private function clipCreatedHoursAgo(Project $project, int $hours): Clip
    {
        return $this->travelTo(now()->subHours($hours), fn () => Clip::create([
            'project_id' => $project->id,
            'candidate_id' => 'c1',
            'title' => 'Klip',
            'start_sec' => 0,
            'end_sec' => 30,
        ]));
    }

    public function test_projects_older_than_24_hours_are_deleted_with_their_files_and_clips(): void
    {
        Storage::fake('local');
        $expired = $this->projectCreatedHoursAgo(25);
        $clip = $this->clipCreatedHoursAgo($expired, 25);
        $fresh = $this->projectCreatedHoursAgo(23);

        $this->artisan('cliptalk:purge-expired')
            ->expectsOutput('Project kedaluwarsa dihapus: 1')
            ->assertSuccessful();

        $this->assertModelMissing($expired);
        $this->assertModelMissing($clip);
        Storage::disk('local')->assertMissing("projects/{$expired->id}/source.mp4");
        $this->assertModelExists($fresh);
        Storage::disk('local')->assertExists("projects/{$fresh->id}/source.mp4");
    }

    public function test_old_project_is_kept_while_one_of_its_clips_is_still_fresh(): void
    {
        Storage::fake('local');
        $project = $this->projectCreatedHoursAgo(30);
        $this->clipCreatedHoursAgo($project, 2);

        $this->artisan('cliptalk:purge-expired')->assertSuccessful();

        $this->assertModelExists($project);
        Storage::disk('local')->assertExists("projects/{$project->id}/source.mp4");
    }

    public function test_purge_is_scheduled_hourly(): void
    {
        $this->artisan('schedule:list')
            ->expectsOutputToContain('cliptalk:purge-expired')
            ->assertSuccessful();
    }
}
