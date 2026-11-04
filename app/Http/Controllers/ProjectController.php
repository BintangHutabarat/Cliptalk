<?php

namespace App\Http\Controllers;

use App\Support\MockData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Fase 1: file belum benar-benar diunggah, langsung lanjut ke project demo.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'targetDuration' => ['required', 'integer', Rule::in([30, 60, 90])],
        ]);

        return to_route('projects.processing', MockData::DEMO_ID);
    }

    public function processing(string $project): Response
    {
        $status = MockData::get('project-status');

        return Inertia::render('projects/processing', [
            'project' => [...MockData::project($project), 'stage' => $status['stage']],
            'status' => $status,
        ]);
    }

    public function segments(string $project): Response
    {
        return Inertia::render('projects/segments', [
            'project' => MockData::project($project),
            'transcript' => MockData::get('transcript'),
            'candidates' => MockData::get('candidates'),
        ]);
    }
}
