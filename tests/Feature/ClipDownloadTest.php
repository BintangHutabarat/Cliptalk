<?php

namespace Tests\Feature;

use App\Models\Clip;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ClipDownloadTest extends TestCase
{
    use RefreshDatabase;

    private function readyClip(): Clip
    {
        Storage::fake('local');

        $project = Project::create([
            'file_name' => 'podcast.mp4',
            'file_path' => 'projects/x/source.mp4',
            'mime_type' => 'video/mp4',
            'size_bytes' => 1000,
            'target_duration' => 60,
            'stage' => 'ready',
        ]);

        Storage::disk('local')->put('projects/x/clip.mp4', 'mp4');
        Storage::disk('local')->put('projects/x/clip.srt', 'srt');

        return Clip::create([
            'project_id' => $project->id,
            'candidate_id' => 'c1',
            'title' => 'Bagaimana teknologi mengubah cara kerja!',
            'start_sec' => 134,
            'end_sec' => 178,
            'stage' => 'ready',
            'output_path' => 'projects/x/clip.mp4',
            'subtitle_path' => 'projects/x/clip.srt',
        ]);
    }

    public function test_video_download_uses_title_slug_file_name(): void
    {
        $clip = $this->readyClip();

        $this->get(route('clips.download.video', $clip->id))
            ->assertOk()
            ->assertDownload('cliptalk_bagaimana-teknologi-mengubah-cara-kerja.mp4');
    }

    public function test_subtitle_download_uses_title_slug_file_name(): void
    {
        $clip = $this->readyClip();

        $this->get(route('clips.download.subtitle', $clip->id))
            ->assertOk()
            ->assertDownload('cliptalk_bagaimana-teknologi-mengubah-cara-kerja.srt');
    }

    public function test_download_is_not_found_before_render_finishes(): void
    {
        $clip = $this->readyClip();
        $clip->update(['stage' => 'rendering']);

        $this->get(route('clips.download.video', $clip->id))->assertNotFound();
    }
}
