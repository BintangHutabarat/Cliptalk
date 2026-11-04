<?php

namespace App\Support;

use Illuminate\Support\Facades\File;

/**
 * Data mock fase 1 (SYSTEM-DESIGN.md §8). Membaca resources/mocks/*.json,
 * file yang sama dengan yang diimpor resources/js/mocks/*.ts.
 *
 * shortcut: hanya id "demo" yang dikenal, ganti dengan model Eloquent di TASK 6.1.
 */
class MockData
{
    public const DEMO_ID = 'demo';

    /**
     * @return array<mixed>
     */
    public static function get(string $name): array
    {
        return File::json(resource_path("mocks/{$name}.json"), JSON_THROW_ON_ERROR);
    }

    /**
     * @return array<string, mixed>
     */
    public static function project(string $id): array
    {
        abort_unless($id === self::DEMO_ID, 404);

        return self::get('project');
    }

    /**
     * @return array<string, mixed>
     */
    public static function clip(string $id): array
    {
        abort_unless($id === self::DEMO_ID, 404);

        return self::get('clip');
    }

    /**
     * Segmen transkrip yang seluruhnya berada di dalam rentang [start, end].
     *
     * @return list<array<string, mixed>>
     */
    public static function transcriptBetween(float $start, float $end): array
    {
        return collect(self::get('transcript'))
            ->filter(fn (array $segment) => $segment['start'] >= $start && $segment['end'] <= $end)
            ->values()
            ->all();
    }
}
