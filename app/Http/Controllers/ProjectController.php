<?php

namespace App\Http\Controllers;

use App\Jobs\TranscribeProject;
use App\Models\Project;
use App\Services\TranscriptionService;
use App\Services\VideoMetadataService;
use App\Support\MockData;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function store(Request $request, VideoMetadataService $metadataService): RedirectResponse
    {
        $validated = $request->validate([
            'video' => [
                'required',
                'file',
                'max:2097152',
                'mimetypes:video/mp4,video/quicktime,video/webm',
            ],
            'targetDuration' => [
                'required',
                'integer',
                Rule::in([30, 60, 90]),
            ],
            'durationSec' => ['nullable', 'numeric', 'min:0'],
        ]);

        $file = $request->file('video');

        try {
            $metadata = $metadataService->inspect($file->getRealPath());
        } catch (\Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'video' => 'Video tidak dapat dibaca. Pastikan file valid dan FFprobe tersedia.',
            ]);
        }

        $project = new Project([
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType() ?: 'application/octet-stream',
            'size_bytes' => $file->getSize(),
            'target_duration' => (int) $validated['targetDuration'],
            'duration_sec' => $metadata['duration_sec'],
            'width' => $metadata['width'],
            'height' => $metadata['height'],
            'fps' => $metadata['fps'],
            'stage' => 'uploaded',
        ]);

        // Buat UUID sebelum menentukan lokasi penyimpanan video.
        $project->id = (string) Str::uuid();

        $path = $file->store("projects/{$project->id}", 'local');

        if ($path === false) {
            abort(500, 'Video gagal disimpan. Silakan coba kembali.');
        }

        $project->file_path = $path;

        try {
            $project->save();
        } catch (\Throwable $exception) {
            Storage::disk('local')->delete($path);

            throw $exception;
        }

        TranscribeProject::dispatch($project->id);

        return to_route('projects.processing', [
            'project' => $project->id,
        ]);
    }

    public function processing(string $project): Response
    {
        $record = Project::findOrFail($project);

        return Inertia::render('projects/processing', [
            'project' => [
                'id' => $record->id,
                'fileName' => $record->file_name,
                'durationSec' => $record->duration_sec ?? 0,
                'sizeBytes' => $record->size_bytes,
                'mimeType' => $record->mime_type,
                'width' => $record->width ?? 0,
                'height' => $record->height ?? 0,
                'fps' => $record->fps ?? 0,
                'sourceUrl' => '',
                'targetDuration' => $record->target_duration,
                'language' => 'id',
                'stage' => $record->stage,
                'error' => $record->error,
                'createdAt' => $record->created_at->toISOString(),
                'expiresAt' => $record->created_at
                    ->copy()
                    ->addDay()
                    ->toISOString(),
            ],
            'status' => [
                'stage' => $record->stage,
                'percent' => 0,
                'stages' => [
                    [
                        'key' => 'uploaded',
                        'label' => 'Video diunggah',
                        'state' => 'done',
                        'meta' => round($record->size_bytes / 1024 / 1024).' MB',
                    ],
                    [
                        'key' => 'transcribing',
                        'label' => 'Transkripsi dengan Faster-Whisper',
                        'state' => 'pending',
                    ],
                    [
                        'key' => 'extracting',
                        'label' => 'Mencari bagian menarik',
                        'state' => 'pending',
                    ],
                    [
                        'key' => 'ready',
                        'label' => 'Siap dipilih',
                        'state' => 'pending',
                    ],
                ],
                'error' => $record->error,
            ],
        ]);
    }

    public function status(string $project)
    {
        $record = Project::findOrFail($project);

        $labels = [
            'uploaded' => 'Video diunggah',
            'transcribing' => 'Transkripsi dengan Faster-Whisper',
            'extracting' => 'Mencari bagian menarik',
            'ready' => 'Siap dipilih',
            'failed' => 'Pemrosesan gagal',
        ];

        $order = [
            'uploaded',
            'transcribing',
            'extracting',
            'ready',
        ];

        $currentIndex = array_search($record->stage, $order, true);

        $stages = [];

        foreach ($order as $index => $key) {
            $state = 'pending';

            if ($record->stage === 'failed') {
                if ($index < 2) {
                    $state = 'done';
                } elseif ($index === 2) {
                    $state = 'error';
                }
            } elseif ($currentIndex !== false) {
                if ($index < $currentIndex) {
                    $state = 'done';
                } elseif ($index === $currentIndex) {
                    $state = $key === 'ready' ? 'done' : 'active';
                }
            }

            $stages[] = [
                'key' => $key,
                'label' => $labels[$key],
                'state' => $state,
            ];
        }

        $percentages = [
            'uploaded' => 0,
            'transcribing' => 35,
            'extracting' => 70,
            'ready' => 100,
            'failed' => 0,
        ];

        return response()->json([
            'stage' => $record->stage,
            'percent' => $percentages[$record->stage] ?? 0,
            'stages' => $stages,
            'error' => $record->error,
        ]);
    }

    public function segments(string $project): Response
    {
        // Pertahankan halaman demo.
        if ($project === 'demo') {
            return Inertia::render('projects/segments', [
                'project' => MockData::project($project),
                'transcript' => MockData::get('transcript'),
                'candidates' => MockData::get('candidates'),
            ]);
        }

        $record = Project::findOrFail($project);

        abort_unless(
            $record->stage === 'ready',
            409,
            'Pemrosesan video belum selesai.'
        );

        $disk = Storage::disk('local');

        $transcriptPath = $record->transcript_path;
        $candidatePath = "projects/{$record->id}/candidates.json";

        abort_unless(
            $transcriptPath && $disk->exists($transcriptPath),
            404,
            'File transkrip tidak ditemukan.'
        );

        abort_unless(
            $disk->exists($candidatePath),
            404,
            'File kandidat tidak ditemukan.'
        );

        $transcriptData = json_decode(
            $disk->get($transcriptPath),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        $rawSegments = $transcriptData['segments'] ?? [];

        abort_unless(is_array($rawSegments), 500, 'Format transkrip tidak valid.');

        $transcript = TranscriptionService::toTranscriptSegments($rawSegments);

        $candidates = json_decode(
            $disk->get($candidatePath),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        abort_unless(is_array($candidates), 500, 'Format kandidat tidak valid.');

        return Inertia::render('projects/segments', [
            'project' => [
                'id' => $record->id,
                'fileName' => $record->file_name,
                'durationSec' => $record->duration_sec ?? 0,
                'sizeBytes' => $record->size_bytes,
                'mimeType' => $record->mime_type,
                'width' => $record->width ?? 0,
                'height' => $record->height ?? 0,
                'fps' => (float) ($record->fps ?? 0),
                'sourceUrl' => route('projects.video', $record->id),
                'targetDuration' => $record->target_duration,
                'language' => 'id',
                'stage' => $record->stage,
                'error' => $record->error,
                'createdAt' => $record->created_at->toISOString(),
                'expiresAt' => $record->created_at->copy()->addDay()->toISOString(),
            ],
            'transcript' => $transcript,
            'candidates' => $candidates,
        ]);
    }
}
