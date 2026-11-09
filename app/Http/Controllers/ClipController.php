<?php

namespace App\Http\Controllers;

use App\Models\Clip;
use App\Models\Project;
use App\Support\MockData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use App\Services\ClipRenderService;
use Illuminate\Support\Facades\Log;
use Throwable;

class ClipController extends Controller
{
    /**
     * Membuat draf klip dari kandidat project.
     */
    public function store(Request $request, string $project): RedirectResponse
    {
        // Pertahankan alur demo untuk pengujian dan halaman contoh.
        if ($project === 'demo') {
            MockData::project($project);

            $candidates = collect(MockData::get('candidates'));

            $validated = $request->validate([
                'candidateId' => [
                    'required',
                    'string',
                    Rule::in($candidates->pluck('id')->all()),
                ],
            ]);

            $candidate = $candidates->firstWhere(
                'id',
                $validated['candidateId']
            );

            MockData::rememberClip([
                'candidateId' => $candidate['id'],
                'title' => $candidate['title'],
                'start' => $candidate['start'],
                'end' => $candidate['end'],
            ]);

            return to_route('clips.preview', MockData::DEMO_ID);
        }

        $record = Project::findOrFail($project);

        abort_unless(
            $record->stage === 'ready',
            409,
            'Project belum selesai diproses.'
        );

        $disk = Storage::disk('local');
        $candidatePath = "projects/{$record->id}/candidates.json";

        abort_unless(
            $disk->exists($candidatePath),
            404,
            'File kandidat tidak ditemukan.'
        );

        $candidates = json_decode(
            $disk->get($candidatePath),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        abort_unless(
            is_array($candidates),
            500,
            'Format kandidat tidak valid.'
        );

        $validated = $request->validate([
            'candidateId' => ['required', 'string'],
        ]);

        $candidate = collect($candidates)->first(
            fn ($item) => is_array($item)
                && ($item['id'] ?? null) === $validated['candidateId']
                && ($item['projectId'] ?? null) === $record->id
        );

        abort_if(
            $candidate === null,
            422,
            'Kandidat tidak ditemukan pada project ini.'
        );

        $start = (float) ($candidate['start'] ?? 0);
        $end = (float) ($candidate['end'] ?? 0);

        abort_if(
            $start < 0
                || $end <= $start
                || $end > (float) $record->duration_sec + 1,
            422,
            'Rentang waktu kandidat tidak valid.'
        );

        $clip = Clip::create([
            'project_id' => $record->id,
            'candidate_id' => $candidate['id'],
            'title' => mb_substr(
                trim((string) ($candidate['title'] ?? 'Klip baru')),
                0,
                60
            ),
            'start_sec' => $start,
            'end_sec' => $end,
            'show_captions' => true,
            'caption_style' => 'outline',
            'stage' => 'draft',
            'progress' => 0,
        ]);

        return to_route('clips.preview', $clip->id);
    }

    public function preview(string $clip): Response
    {
        // Halaman demo tetap menggunakan data demo.
        if ($clip === MockData::DEMO_ID) {
            $demoClip = MockData::clip($clip);

            return Inertia::render('clips/preview', [
                'project' => MockData::project($demoClip['projectId']),
                'clip' => $demoClip,
                'transcript' => MockData::transcriptBetween(
                    $demoClip['start'],
                    $demoClip['end']
                ),
            ]);
        }

        $record = Clip::with('project')->findOrFail($clip);
        $project = $record->project;

        $disk = Storage::disk('local');
        $transcript = [];

        if ($project->transcript_path
            && $disk->exists($project->transcript_path)) {
            $data = json_decode(
                $disk->get($project->transcript_path),
                true,
                512,
                JSON_THROW_ON_ERROR
            );

            foreach (($data['segments'] ?? []) as $index => $segment) {
                if (! isset($segment['start'], $segment['end'], $segment['text'])) {
                    continue;
                }

                $segmentStart = (float) $segment['start'];
                $segmentEnd = (float) $segment['end'];

                // Ambil hanya segmen yang bersinggungan dengan klip.
                if (
                    $segmentEnd <= $record->start_sec
                    || $segmentStart >= $record->end_sec
                ) {
                    continue;
                }

                $transcript[] = [
                    'id' => $index + 1,
                    'start' => $segmentStart,
                    'end' => $segmentEnd,
                    'text' => (string) $segment['text'],
                    'speaker' => null,
                    'avgLogprob' => 0,
                    'words' => [],
                ];
            }
        }

        return Inertia::render('clips/preview', [
            'project' => $this->projectData($project),
            'clip' => $this->clipData($record),
            'transcript' => $transcript,
        ]);
    }


    public function render(
        Request $request,
        string $clip
    ): RedirectResponse {
        if ($clip === MockData::DEMO_ID) {
            MockData::clip($clip);

            $validated = $request->validate([
                'title' => ['required', 'string', 'max:60'],
                'showCaptions' => ['required', 'boolean'],
                'captionStyle' => [
                    'required',
                    Rule::in(['outline', 'plate']),
                ],
            ]);

            MockData::rememberClip([
                'title' => $validated['title'],
                'showCaptions' => (bool) $validated['showCaptions'],
                'captionStyle' => $validated['captionStyle'],
            ]);

            return to_route('clips.show', MockData::DEMO_ID);
        }

        $record = Clip::with('project')->findOrFail($clip);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:60'],
            'showCaptions' => ['required', 'boolean'],
            'captionStyle' => [
                'required',
                Rule::in(['outline', 'plate']),
            ],
        ]);

        if ($record->stage === 'processing') {
            return back()->withErrors([
                'render' => 'Klip ini sedang diproses.',
            ]);
        }

        $record->update([
            'title' => trim($validated['title']),
            'show_captions' => (bool) $validated['showCaptions'],
            'caption_style' => $validated['captionStyle'],
            'stage' => 'processing',
            'progress' => 10,
            'error' => null,
        ]);

        try {
            $result = app(ClipRenderService::class)->render($record);

            $record->update([
                ...$result,
                'stage' => 'ready',
                'progress' => 100,
                'error' => null,
            ]);

            return to_route('clips.show', $record->id);
        } catch (Throwable $exception) {
            Log::error('Clip rendering failed.', [
                'clip_id' => $record->id,
                'exception' => $exception,
            ]);

            $record->update([
                'stage' => 'failed',
                'progress' => 0,
                'error' => mb_substr($exception->getMessage(), 0, 2000),
            ]);

            return back()->withErrors([
                'render' => 'Render gagal. Periksa log Laravel untuk detailnya, lalu coba lagi.',
            ]);
        }
    }


    public function show(string $clip): Response
    {
        if ($clip === MockData::DEMO_ID) {
            $demoClip = MockData::clip($clip);

            return Inertia::render('clips/show', [
                'project' => MockData::project($demoClip['projectId']),
                'clip' => [
                    ...$demoClip,
                    'stage' => 'ready',
                    'progress' => 100,
                    'outputSizeBytes' => 19_293_798,
                ],
            ]);
        }

        $record = Clip::with('project')->findOrFail($clip);

        abort_unless(
            $record->stage === 'ready' && $record->output_path,
            409,
            'Klip belum selesai dirender.'
        );

        // URL unduhan akan ditambahkan setelah endpoint file hasil dibuat.
        return Inertia::render('clips/show', [
            'project' => $this->projectData($record->project),
            'clip' => $this->clipData($record),
        ]);
    }

    public function playVideo(string $clip)
    {
        $record = Clip::findOrFail($clip);
        $disk = Storage::disk('local');

        abort_unless(
            $record->stage === 'ready'
                && $record->output_path
                && $disk->exists($record->output_path),
            404,
            'Video hasil render tidak ditemukan.'
        );

        return response()->file(
            $disk->path($record->output_path),
            [
                'Content-Type' => 'video/mp4',
                'Content-Disposition' => 'inline; filename="clip.mp4"',
                'Cache-Control' => 'private, no-store',
                'X-Content-Type-Options' => 'nosniff',
            ]
        );
    }

    public function downloadVideo(string $clip)
    {
        $record = Clip::findOrFail($clip);
        $disk = Storage::disk('local');

        abort_unless(
            $record->stage === 'ready'
                && $record->output_path
                && $disk->exists($record->output_path),
            404,
            'Video hasil render tidak ditemukan.'
        );

        return $disk->download(
            $record->output_path,
            'clip-' . $record->id . '.mp4'
        );
    }

    public function downloadSubtitle(string $clip)
    {
        $record = Clip::findOrFail($clip);
        $disk = Storage::disk('local');

        abort_unless(
            $record->stage === 'ready'
                && $record->subtitle_path
                && $disk->exists($record->subtitle_path),
            404,
            'File subtitle tidak ditemukan.'
        );

        return $disk->download(
            $record->subtitle_path,
            'clip-' . $record->id . '.srt'
        );
    }


    private function projectData(Project $project): array
    {
        return [
            'id' => $project->id,
            'fileName' => $project->file_name,
            'durationSec' => $project->duration_sec ?? 0,
            'sizeBytes' => $project->size_bytes,
            'mimeType' => $project->mime_type,
            'width' => $project->width ?? 0,
            'height' => $project->height ?? 0,
            'fps' => (float) ($project->fps ?? 0),
            'sourceUrl' => route('projects.video', $project->id),
            'targetDuration' => $project->target_duration,
            'language' => 'id',
            'stage' => $project->stage,
            'error' => $project->error,
            'createdAt' => $project->created_at->toISOString(),
            'expiresAt' => $project->created_at
                ->copy()
                ->addDay()
                ->toISOString(),
        ];
    }


    private function clipData(Clip $clip): array
    {
        $disk = Storage::disk('local');

        $hasVideo = $clip->stage === 'ready'
            && $clip->output_path
            && $disk->exists($clip->output_path);

        $hasSubtitle = $clip->stage === 'ready'
            && $clip->subtitle_path
            && $disk->exists($clip->subtitle_path);

        return [
            'id' => $clip->id,
            'projectId' => $clip->project_id,
            'candidateId' => $clip->candidate_id,
            'title' => $clip->title,
            'start' => (float) $clip->start_sec,
            'end' => (float) $clip->end_sec,
            'showCaptions' => $clip->show_captions,
            'captionStyle' => $clip->caption_style,
            'width' => (int) ($clip->project->width ?? 0),
            'height' => (int) ($clip->project->height ?? 0),
            'videoCodec' => 'h264',
            'audioCodec' => 'aac',
            'stage' => $clip->stage,
            'progress' => $clip->progress,
            'outputUrl' => $hasVideo
                ? route('clips.play.video', $clip->id)
                : null,
            'downloadUrl' => $hasVideo
                ? route('clips.download.video', $clip->id)
                : null,
            'outputSizeBytes' => $clip->output_size_bytes,
            'srtUrl' => $hasSubtitle
                ? route('clips.download.subtitle', $clip->id)
                : null,
            'outputSizeBytes' => $clip->output_size_bytes,
            'srtUrl' => $hasSubtitle
                ? route('clips.download.subtitle', $clip->id)
                : null,
            'sha256' => null,
            'error' => $clip->error,
            'expiresAt' => $clip->created_at
                ->copy()
                ->addDay()
                ->toISOString(),
        ];
    }


}
