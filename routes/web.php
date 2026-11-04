<?php

use App\Http\Controllers\ClipController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

Route::get('/', UploadController::class)->name('upload');

Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
Route::get('/projects/{project}/processing', [ProjectController::class, 'processing'])->name('projects.processing');
Route::get('/projects/{project}/segments', [ProjectController::class, 'segments'])->name('projects.segments');

Route::post('/projects/{project}/clips', [ClipController::class, 'store'])->name('clips.store');
Route::get('/clips/{clip}/preview', [ClipController::class, 'preview'])->name('clips.preview');
Route::post('/clips/{clip}/render', [ClipController::class, 'render'])->name('clips.render');
Route::get('/clips/{clip}', [ClipController::class, 'show'])->name('clips.show');

if (app()->isLocal()) {
    Route::inertia('/_design', 'design')->name('design');
}
