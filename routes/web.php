<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'upload')->name('upload');

if (app()->isLocal()) {
    Route::inertia('/_design', 'design')->name('design');
}
