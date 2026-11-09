<?php

namespace Tests\Feature;

use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;
use App\Services\VideoMetadataService;
use Illuminate\Support\Facades\Bus;

class CliptalkPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_upload_page_sends_limits_and_durations(): void
    {
        $this->get(route('upload'))->assertInertia(fn (Assert $page) => $page
            ->component('upload')
            ->where('limits.maxBytes', 2147483648)
            ->where('limits.mimeTypes', ['video/mp4', 'video/quicktime', 'video/webm'])
            ->where('durations', [30, 60, 90])
        );
    }


    public function test_processing_page_sends_project_and_status(): void
    {
        $project = Project::create([
            'file_name' => 'podcast.mp4',
            'file_path' => 'projects/test/podcast.mp4',
            'mime_type' => 'video/mp4',
            'size_bytes' => 1024,
            'target_duration' => 60,
            'duration_sec' => 173,
            'stage' => 'uploaded',
        ]);

        $this->get(route('projects.processing', $project->id))
            ->assertInertia(fn (Assert $page) => $page
                ->component('projects/processing')
                ->where('project.id', $project->id)
                ->where('project.stage', 'uploaded')
                ->where('status.stage', 'uploaded')
                ->has('status.stages', 4)
            );
    }


    public function test_segments_page_sends_transcript_and_candidates(): void
    {
        $this->get(route('projects.segments', 'demo'))->assertInertia(fn (Assert $page) => $page
            ->component('projects/segments')
            ->where('project.durationSec', 2300)
            ->has('transcript', 55)
            ->has('candidates', 3)
            ->where('candidates.0.score', 98)
        );
    }

    public function test_preview_page_only_sends_segments_inside_the_clip_range(): void
    {
        $this->get(route('clips.preview', 'demo'))->assertInertia(fn (Assert $page) => $page
            ->component('clips/preview')
            ->where('clip.start', 134)
            ->where('clip.end', 178)
            ->has('transcript', 5)
            ->where('transcript.0.start', 134)
            ->where('transcript.4.end', 178)
        );
    }

    public function test_show_page_sends_a_ready_clip(): void
    {
        $this->get(route('clips.show', 'demo'))->assertInertia(fn (Assert $page) => $page
            ->component('clips/show')
            ->where('clip.stage', 'ready')
            ->where('clip.progress', 100)
            ->where('project.fileName', 'podcast_teknologi_ep14.mp4')
        );
    }



    public function test_upload_requires_a_supported_target_duration(): void
    {
        Bus::fake();
        Storage::fake('local');

        // Durasi yang tidak didukung harus ditolak oleh validasi.
        $this->post(route('projects.store'), [
            'video' => UploadedFile::fake()->create(
                'podcast.mp4',
                100,
                'video/mp4'
            ),
            'targetDuration' => 45,
        ])->assertSessionHasErrors('targetDuration');

        // Simulasikan hasil FFprobe untuk file video pengujian.
        $this->mock(
            VideoMetadataService::class,
            function ($mock) {
                $mock->shouldReceive('inspect')
                    ->once()
                    ->andReturn([
                        'codec' => 'h264',
                        'width' => 1920,
                        'height' => 1080,
                        'fps' => 29.97,
                        'duration_sec' => 173,
                    ]);
            }
        );

        // Durasi yang didukung harus berhasil diproses.
        $this->post(route('projects.store'), [
            'video' => UploadedFile::fake()->create(
                'podcast.mp4',
                100,
                'video/mp4'
            ),
            'targetDuration' => 60,
        ])->assertSessionHasNoErrors();

        $project = Project::query()->firstOrFail();

        $this->assertSame(60, $project->target_duration);
        $this->assertSame(173, $project->duration_sec);
        $this->assertSame(1920, $project->width);
        $this->assertSame(1080, $project->height);

        $this->assertStringStartsWith(
            "projects/{$project->id}/",
            $project->file_path
        );

        Storage::disk('local')->assertExists($project->file_path);

        $this->assertDatabaseHas('projects', [
            'id' => $project->id,
            'target_duration' => 60,
        ]);
    }



    public function test_choosing_a_candidate_carries_its_range_to_the_preview(): void
    {
        $this->post(route('clips.store', 'demo'), ['candidateId' => 'c2'])->assertRedirect(route('clips.preview', 'demo'));

        $this->get(route('clips.preview', 'demo'))->assertInertia(fn (Assert $page) => $page
            ->where('clip.candidateId', 'c2')
            ->where('clip.title', 'Kreativitas vs otomatisasi alat digital')
            ->where('clip.start', 854)
            ->where('clip.end', 906)
            ->has('transcript', 6)
        );
    }

    public function test_choosing_an_unknown_candidate_is_rejected(): void
    {
        $this->post(route('clips.store', 'demo'), ['candidateId' => 'c9'])->assertSessionHasErrors('candidateId');
    }

    public function test_render_saves_title_and_caption_settings_for_the_download_page(): void
    {
        $this->post(route('clips.render', 'demo'), [
            'title' => 'Judul baru',
            'showCaptions' => false,
            'captionStyle' => 'plate',
        ])->assertRedirect(route('clips.show', 'demo'));

        $this->get(route('clips.show', 'demo'))->assertInertia(fn (Assert $page) => $page
            ->where('clip.title', 'Judul baru')
            ->where('clip.showCaptions', false)
            ->where('clip.captionStyle', 'plate')
        );
    }

    public function test_render_validates_title_and_caption_style(): void
    {
        $this->post(route('clips.render', 'demo'), [
            'title' => str_repeat('a', 61),
            'showCaptions' => true,
            'captionStyle' => 'neon',
        ])->assertSessionHasErrors(['title', 'captionStyle']);

        $this->post(route('clips.render', 'demo'), [
            'title' => '',
            'showCaptions' => true,
            'captionStyle' => 'outline',
        ])->assertSessionHasErrors('title');
    }

    public function test_unknown_ids_render_the_not_found_page(): void
    {
        $this->get(route('projects.segments', 'lain'))
            ->assertNotFound()
            ->assertInertia(fn (Assert $page) => $page->component('not-found'));
        $this->get(route('clips.show', 'lain'))->assertNotFound();
        $this->post(route('clips.store', 'lain'), ['candidateId' => 'c1'])->assertNotFound();
    }

    public function test_unknown_ids_return_json_404_for_json_requests(): void
    {
        $this->getJson(route('clips.show', 'lain'))->assertNotFound()->assertJsonStructure(['message']);
    }
}
