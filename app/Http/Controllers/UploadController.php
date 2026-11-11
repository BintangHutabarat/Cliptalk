<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class UploadController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('upload', [
            'limits' => [
                'maxBytes' => 2 * 1024 ** 3,
                'mimeTypes' => ['video/mp4', 'video/quicktime', 'video/webm'],
            ],
            'durations' => [30, 60, 90],
        ]);
    }
}
