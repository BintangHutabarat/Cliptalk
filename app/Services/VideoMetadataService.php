<?php

namespace App\Services;

use RuntimeException;
use Symfony\Component\Process\Process;

class VideoMetadataService
{
    public function inspect(string $path): array
    {
        $binary = config('services.ffprobe.binary', 'ffprobe');

        $process = new Process([
            $binary,
            '-v', 'error',
            '-select_streams', 'v:0',
            '-show_entries', 'stream=codec_name,width,height,avg_frame_rate',
            '-show_entries', 'format=duration',
            '-of', 'json',
            $path,
        ]);

        $process->setTimeout(30);
        $process->mustRun();

        $data = json_decode(
            $process->getOutput(),
            true,
            512,
            JSON_THROW_ON_ERROR
        );

        $stream = $data['streams'][0] ?? null;
        $format = $data['format'] ?? [];

        if (
            !$stream ||
            empty($stream['width']) ||
            empty($stream['height']) ||
            !isset($format['duration'])
        ) {
            throw new RuntimeException(
                'Metadata video tidak lengkap atau stream video tidak ditemukan.'
            );
        }

        $frameRate = $stream['avg_frame_rate'] ?? '0/0';
        $parts = explode('/', $frameRate);

        $numerator = (float) ($parts[0] ?? 0);
        $denominator = (float) ($parts[1] ?? 0);

        $fps = $denominator > 0
            ? $numerator / $denominator
            : 0;

        return [
            'codec' => $stream['codec_name'] ?? null,
            'width' => (int) $stream['width'],
            'height' => (int) $stream['height'],
            'fps' => round($fps, 3),
            'duration_sec' => (int) round((float) $format['duration']),
        ];
    }
}
