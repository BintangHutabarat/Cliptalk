<?php

namespace App\Http\Controllers;

use App\Support\MockData;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClipController extends Controller
{
    /**
     * Fase 1: kandidat yang dipilih belum disimpan, langsung ke klip demo.
     */
    public function store(string $project): RedirectResponse
    {
        MockData::project($project);

        return to_route('clips.preview', MockData::DEMO_ID);
    }

    public function preview(string $clip): Response
    {
        $clip = MockData::clip($clip);

        return Inertia::render('clips/preview', [
            'project' => MockData::project($clip['projectId']),
            'clip' => $clip,
            'transcript' => MockData::transcriptBetween($clip['start'], $clip['end']),
        ]);
    }

    /**
     * Fase 1: render disimulasikan di frontend, lalu langsung ke halaman unduh.
     */
    public function render(string $clip): RedirectResponse
    {
        MockData::clip($clip);

        return to_route('clips.show', MockData::DEMO_ID);
    }

    public function show(string $clip): Response
    {
        $clip = MockData::clip($clip);

        return Inertia::render('clips/show', [
            'project' => MockData::project($clip['projectId']),
            'clip' => [
                ...$clip,
                'stage' => 'ready',
                'progress' => 100,
                'outputSizeBytes' => 19_293_798,
            ],
        ]);
    }
}
