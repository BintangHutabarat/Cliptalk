<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CliptalkPagesTest extends TestCase
{
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
        // Halaman React dibuat di TASK 4, jadi keberadaan file page belum dicek.
        $this->get(route('projects.processing', 'demo'))->assertInertia(fn (Assert $page) => $page
            ->component('projects/processing', false)
            ->where('project.id', 'demo')
            ->where('project.stage', 'transcribing')
            ->where('status.stage', 'transcribing')
            ->has('status.stages', 4)
        );
    }

    public function test_segments_page_sends_transcript_and_candidates(): void
    {
        $this->get(route('projects.segments', 'demo'))->assertInertia(fn (Assert $page) => $page
            ->component('projects/segments', false)
            ->where('project.durationSec', 2300)
            ->has('transcript', 55)
            ->has('candidates', 3)
            ->where('candidates.0.score', 98)
        );
    }

    public function test_preview_page_only_sends_segments_inside_the_clip_range(): void
    {
        $this->get(route('clips.preview', 'demo'))->assertInertia(fn (Assert $page) => $page
            ->component('clips/preview', false)
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
            ->component('clips/show', false)
            ->where('clip.stage', 'ready')
            ->where('clip.progress', 100)
            ->where('project.fileName', 'podcast_teknologi_ep14.mp4')
        );
    }

    public function test_mock_posts_redirect_through_the_flow(): void
    {
        $this->post(route('projects.store'))->assertRedirect(route('projects.processing', 'demo'));
        $this->post(route('clips.store', 'demo'))->assertRedirect(route('clips.preview', 'demo'));
        $this->post(route('clips.render', 'demo'))->assertRedirect(route('clips.show', 'demo'));
    }

    public function test_unknown_ids_return_not_found(): void
    {
        $this->get(route('projects.segments', 'lain'))->assertNotFound();
        $this->get(route('clips.show', 'lain'))->assertNotFound();
        $this->post(route('clips.store', 'lain'))->assertNotFound();
    }
}
