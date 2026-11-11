<?php

use App\Http\Controllers\ChunkUploadController;
use App\Http\Controllers\ClipController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\UploadController;
use App\Models\Project;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

// Id selain UUID atau "demo" langsung 404 tanpa query; PostgreSQL menolak string non-UUID di kolom uuid.
Route::pattern('project', 'demo|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');
Route::pattern('clip', 'demo|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');

Route::get('/', UploadController::class)->name('upload');

Route::pattern('upload', '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}');

Route::post('/uploads', [ChunkUploadController::class, 'store'])->name('uploads.store');
Route::get('/uploads/{upload}', [ChunkUploadController::class, 'show'])->name('uploads.show');
Route::post('/uploads/{upload}/chunks', [ChunkUploadController::class, 'append'])->name('uploads.chunks');

Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
Route::get('/projects/{project}/processing', [ProjectController::class, 'processing'])->name('projects.processing');
Route::get('/projects/{project}/status', [ProjectController::class, 'status'])->name('projects.status');
Route::get('/projects/{project}/segments', [ProjectController::class, 'segments'])->name('projects.segments');

Route::post('/projects/{project}/clips', [ClipController::class, 'store'])->name('clips.store');
Route::get('/clips/{clip}/preview', [ClipController::class, 'preview'])->name('clips.preview');
Route::post('/clips/{clip}/render', [ClipController::class, 'render'])->name('clips.render');
Route::get('/clips/{clip}/status', [ClipController::class, 'status'])->name('clips.status');
Route::get('/clips/{clip}', [ClipController::class, 'show'])->name('clips.show');

Route::get('/clips/{clip}/download/video', [ClipController::class, 'downloadVideo'])->name('clips.download.video');

Route::get('/clips/{clip}/download/subtitle', [ClipController::class, 'downloadSubtitle'])->name('clips.download.subtitle');

Route::get('/clips/{clip}/play', [ClipController::class, 'playVideo'])->name('clips.play.video');

// Video sumber untuk pemutar di halaman Pilih bagian dan Pratinjau.
Route::get('/projects/{project}/video', function (string $project) {
    $record = Project::findOrFail($project);
    $path = $record->file_path;
    $disk = Storage::disk('local');

    abort_unless($disk->exists($path), 404);

    return response()->file($disk->path($path), [
        'Content-Type' => $record->mime_type,
        'Content-Disposition' => 'inline; filename="'.
            addslashes(basename($record->file_name)).'"',
        'Cache-Control' => 'private, no-store',
        'X-Content-Type-Options' => 'nosniff',
    ]);
})->name('projects.video');

if (app()->isLocal()) {
    Route::inertia('/_design', 'design')->name('design');
}
