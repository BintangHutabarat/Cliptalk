<?php

use App\Http\Controllers\ClipController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use App\Models\Project;

Route::get('/', UploadController::class)->name('upload');

Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
Route::get('/projects/{project}/processing', [ProjectController::class, 'processing'])->name('projects.processing');
Route::get('/projects/{project}/status',[ProjectController::class, 'status'])->name('projects.status');
Route::get('/projects/{project}/segments', [ProjectController::class, 'segments'])->name('projects.segments');

Route::post('/projects/{project}/clips', [ClipController::class, 'store'])->name('clips.store');
Route::get('/clips/{clip}/preview', [ClipController::class, 'preview'])->name('clips.preview');
Route::post('/clips/{clip}/render', [ClipController::class, 'render'])->name('clips.render');
Route::get('/clips/{clip}', [ClipController::class, 'show'])->name('clips.show');

Route::get('/clips/{clip}/download/video', [ClipController::class,'downloadVideo'])->name('clips.download.video');

Route::get('/clips/{clip}/download/subtitle', [ClipController::class,'downloadSubtitle'])->name('clips.download.subtitle');

Route::get('/clips/{clip}/play', [ClipController::class,'playVideo'])->name('clips.play.video');

if (app()->isLocal()) {
    Route::get('/projects/{project}/video', function (string $project) {
        $record = Project::findOrFail($project);
        $path = $record->file_path;
        $disk = Storage::disk('local');

        abort_unless($disk->exists($path), 404);

        return response()->file($disk->path($path), [
            'Content-Type' => $record->mime_type,
            'Content-Disposition' => 'inline; filename="' .
                addslashes(basename($record->file_name)) . '"',
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    })->name('projects.video');
    Route::inertia('/_design', 'design')->name('design');
}
