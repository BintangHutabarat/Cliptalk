<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Http\UploadedFile;

abstract class TestCase extends BaseTestCase
{
    /**
     * Unggah isi file lewat endpoint per bagian, seperti yang dilakukan halaman unggah.
     */
    protected function uploadInChunks(string $contents, string $fileName = 'podcast.mp4', string $mimeType = 'video/mp4', int $chunkBytes = 1024): string
    {
        $id = $this->postJson(route('uploads.store'), [
            'fileName' => $fileName,
            'sizeBytes' => strlen($contents),
            'mimeType' => $mimeType,
        ])->assertCreated()->json('id');

        foreach (str_split($contents, $chunkBytes) as $index => $chunk) {
            $this->post(route('uploads.chunks', $id), [
                'offset' => $index * $chunkBytes,
                'chunk' => UploadedFile::fake()->createWithContent('chunk', $chunk),
            ], ['Accept' => 'application/json'])->assertOk();
        }

        return $id;
    }
}
