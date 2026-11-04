<?php

namespace App\Http\Controllers;

use App\Support\MockData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClipController extends Controller
{
    /**
     * Fase 1: kandidat terpilih disimpan di session sebagai draf klip demo.
     */
    public function store(Request $request, string $project): RedirectResponse
    {
        MockData::project($project);
        $candidates = collect(MockData::get('candidates'));

        $validated = $request->validate([
            'candidateId' => ['required', 'string', Rule::in($candidates->pluck('id'))],
        ]);

        $candidate = $candidates->firstWhere('id', $validated['candidateId']);

        MockData::rememberClip([
            'candidateId' => $candidate['id'],
            'title' => $candidate['title'],
            'start' => $candidate['start'],
            'end' => $candidate['end'],
        ]);

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
     * Fase 1: render disimulasikan di frontend; pengaturan akhir disimpan lalu ke halaman unduh.
     */
    public function render(Request $request, string $clip): RedirectResponse
    {
        MockData::clip($clip);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:60'],
            'showCaptions' => ['required', 'boolean'],
            'captionStyle' => ['required', Rule::in(['outline', 'plate'])],
        ]);

        MockData::rememberClip([
            'title' => $validated['title'],
            'showCaptions' => (bool) $validated['showCaptions'],
            'captionStyle' => $validated['captionStyle'],
        ]);

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
