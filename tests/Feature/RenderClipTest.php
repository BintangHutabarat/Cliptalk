<?php

namespace Tests\Feature;

use App\Jobs\RenderClip;
use App\Jobs\TranscribeProject;
use App\Models\Clip;
use App\Models\Project;
use App\Services\ClipRenderService;
use App\Services\TranscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class RenderClipTest extends TestCase
{
    use RefreshDatabase;

    private function draftClip(string $stage = 'draft'): Clip
    {
        $project = Project::create([
            'file_name' => 'podcast.mp4',
            'file_path' => 'projects/x/source.mp4',
            'mime_type' => 'video/mp4',
            'size_bytes' => 1000,
            'target_duration' => 60,
            'stage' => 'ready',
        ]);

        return Clip::create([
            'project_id' => $project->id,
            'candidate_id' => 'c1',
            'title' => 'Judul awal',
            'start_sec' => 10,
            'end_sec' => 70,
            'stage' => $stage,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function settings(): array
    {
        return ['title' => 'Judul baru', 'showCaptions' => true, 'captionStyle' => 'plate'];
    }

    public function test_render_request_queues_the_job_and_returns_to_preview(): void
    {
        Queue::fake();
        $clip = $this->draftClip();

        $this->post(route('clips.render', $clip->id), $this->settings())
            ->assertRedirect(route('clips.preview', $clip->id));

        Queue::assertPushed(RenderClip::class, fn (RenderClip $job) => $job->clipId === $clip->id);
        $clip->refresh();
        $this->assertSame(['queued', 'Judul baru', 'plate'], [$clip->stage, $clip->title, $clip->caption_style]);
    }

    public function test_render_request_is_rejected_while_a_render_is_running(): void
    {
        Queue::fake();
        $clip = $this->draftClip('rendering');

        $this->post(route('clips.render', $clip->id), $this->settings())->assertSessionHasErrors('render');

        Queue::assertNothingPushed();
        $this->assertSame('Judul awal', $clip->refresh()->title);
    }

    public function test_status_endpoint_returns_clip_status(): void
    {
        $clip = $this->draftClip('rendering');
        $clip->update(['progress' => 45]);

        $this->getJson(route('clips.status', $clip->id))
            ->assertOk()
            ->assertExactJson(['stage' => 'rendering', 'percent' => 45, 'error' => null]);
    }

    public function test_job_reports_progress_and_marks_the_clip_ready(): void
    {
        $clip = $this->draftClip('queued');

        $this->mock(ClipRenderService::class)
            ->shouldReceive('render')
            ->once()
            ->andReturnUsing(function (Clip $rendering, callable $onProgress) {
                $onProgress(40);
                $this->assertSame(['rendering', 40], [$rendering->fresh()->stage, $rendering->fresh()->progress]);

                return ['output_path' => 'projects/x/clip.mp4', 'subtitle_path' => null, 'output_size_bytes' => 123];
            });

        RenderClip::dispatchSync($clip->id);

        $clip->refresh();
        $this->assertSame(['ready', 100, 'projects/x/clip.mp4'], [$clip->stage, $clip->progress, $clip->output_path]);
    }

    public function test_failed_job_stores_a_fixable_message_without_technical_details(): void
    {
        $clip = $this->draftClip('rendering');

        (new RenderClip($clip->id))->failed(new RuntimeException('FFmpeg gagal: Invalid data found'));

        $clip->refresh();
        $this->assertSame('failed', $clip->stage);
        $this->assertSame('Render klip gagal. Coba render lagi. Jika masih gagal, unggah ulang videonya.', $clip->error);
    }

    public function test_project_without_a_fitting_candidate_fails_with_a_fixable_message(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('projects/x/transcript.json', json_encode([
            'segments' => [['start' => 0, 'end' => 5, 'text' => 'Terlalu pendek.']],
        ]));
        $project = $this->draftClip()->project;
        $project->update(['stage' => 'uploaded']);

        $this->mock(TranscriptionService::class)
            ->shouldReceive('transcribe')
            ->andReturn('projects/x/transcript.json');

        TranscribeProject::dispatchSync($project->id);

        $project->refresh();
        $this->assertSame('failed', $project->stage);
        $this->assertStringStartsWith('Tidak ada bagian yang cocok untuk klip 60 detik.', $project->error);
    }
}
