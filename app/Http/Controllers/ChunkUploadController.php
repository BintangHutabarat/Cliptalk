<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Unggahan video per bagian (TASK 6.2). Bagian ditempel berurutan ke uploads/{id}/source.part;
 * kalau koneksi putus, klien menanyakan jumlah byte yang sudah diterima lalu melanjutkan dari sana.
 */
class ChunkUploadController extends Controller
{
    /** Batas satu bagian dalam KB; klien mengirim 8 MB per bagian. */
    public const CHUNK_MAX_KB = 16 * 1024;

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fileName' => ['required', 'string', 'max:255'],
            'sizeBytes' => ['required', 'integer', 'min:1', 'max:'.UploadController::MAX_BYTES],
            'mimeType' => ['required', 'string', Rule::in(array_keys(UploadController::EXTENSIONS))],
        ], [
            'sizeBytes.max' => 'File melebihi 2 GB. Kompres video atau potong bagian awal sebelum mengunggah.',
            'mimeType.in' => 'Format file tidak didukung. Unggah video MP4, MOV, atau WebM.',
        ]);

        $id = (string) Str::uuid();
        $disk = Storage::disk('local');

        $disk->put("uploads/{$id}/meta.json", json_encode($validated, JSON_THROW_ON_ERROR));
        $disk->put("uploads/{$id}/source.part", '');

        return response()->json(['id' => $id, 'received' => 0], 201);
    }

    public function show(string $upload): JsonResponse
    {
        self::meta($upload) ?? abort(404);

        return response()->json(['id' => $upload, 'received' => Storage::disk('local')->size(self::partPath($upload))]);
    }

    public function append(Request $request, string $upload): JsonResponse
    {
        $meta = self::meta($upload) ?? abort(404);

        $validated = $request->validate([
            'offset' => ['required', 'integer', 'min:0'],
            'chunk' => ['required', 'file', 'max:'.self::CHUNK_MAX_KB],
        ]);

        $path = Storage::disk('local')->path(self::partPath($upload));
        $chunk = $validated['chunk'];
        $target = fopen($path, 'ab');

        // Kunci file supaya dua permintaan untuk unggahan yang sama tidak menempel bersamaan.
        flock($target, LOCK_EX);

        try {
            clearstatcache(true, $path);
            $received = (int) filesize($path);

            if ((int) $validated['offset'] !== $received || $received + $chunk->getSize() > $meta['sizeBytes']) {
                return response()->json(['received' => $received], 409);
            }

            $source = fopen($chunk->getRealPath(), 'rb');
            stream_copy_to_stream($source, $target);
            fclose($source);
            fflush($target);

            clearstatcache(true, $path);
            $received = (int) filesize($path);
        } finally {
            flock($target, LOCK_UN);
            fclose($target);
        }

        return response()->json(['received' => $received]);
    }

    /**
     * @return array{fileName: string, sizeBytes: int, mimeType: string}|null
     */
    public static function meta(string $upload): ?array
    {
        $disk = Storage::disk('local');

        if (! $disk->exists("uploads/{$upload}/meta.json") || ! $disk->exists(self::partPath($upload))) {
            return null;
        }

        return json_decode($disk->get("uploads/{$upload}/meta.json"), true, 512, JSON_THROW_ON_ERROR);
    }

    public static function partPath(string $upload): string
    {
        return "uploads/{$upload}/source.part";
    }
}
