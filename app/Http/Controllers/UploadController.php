<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class UploadController extends Controller
{
    public const MAX_BYTES = 2 * 1024 ** 3;

    /** Tipe MIME yang diterima beserta ekstensi file yang disimpan. */
    public const EXTENSIONS = [
        'video/mp4' => 'mp4',
        'video/quicktime' => 'mov',
        'video/webm' => 'webm',
    ];

    public function __invoke(): Response
    {
        return Inertia::render('upload', [
            'limits' => [
                'maxBytes' => self::MAX_BYTES,
                'mimeTypes' => array_keys(self::EXTENSIONS),
            ],
            'durations' => [30, 60, 90],
        ]);
    }
}
