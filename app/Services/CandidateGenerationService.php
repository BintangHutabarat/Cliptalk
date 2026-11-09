<?php

namespace App\Services;

class CandidateGenerationService
{
    /**
     * Membuat kandidat klip dari transkrip bertimestamp.
     *
     * Skor adalah heuristik awal, bukan prediksi viralitas.
     *
     * @param array<int, array<string, mixed>> $segments
     * @return array<int, array<string, mixed>>
     */
    public function generate(array $segments, int $targetDuration, string $projectId): array
    {
        $segments = array_values(array_filter(
            $segments,
            fn (array $segment): bool =>
                isset($segment['start'], $segment['end'], $segment['text'])
                && is_numeric($segment['start'])
                && is_numeric($segment['end'])
                && (float) $segment['end'] > (float) $segment['start']
                && trim((string) $segment['text']) !== ''
        ));

        if ($segments === []) {
            return [];
        }

        $candidates = [];
        $count = count($segments);
        $target = max(1, $targetDuration);

        // Mulai dari beberapa titik berbeda di sepanjang video.
        $step = max(1, (int) floor($target * 0.75));
        $lastStart = max(0, (float) $segments[$count - 1]['end'] - $target);

        for ($desiredStart = 0; $desiredStart <= $lastStart; $desiredStart += $step) {
            $startIndex = null;

            foreach ($segments as $index => $segment) {
                if ((float) $segment['start'] >= $desiredStart) {
                    $startIndex = $index;
                    break;
                }
            }

            if ($startIndex === null) {
                continue;
            }

            $start = (float) $segments[$startIndex]['start'];
            $endIndex = $startIndex;

            for ($i = $startIndex; $i < $count; $i++) {
                $endIndex = $i;

                if ((float) $segments[$i]['end'] >= $start + $target) {
                    break;
                }
            }

            $end = (float) $segments[$endIndex]['end'];
            $duration = $end - $start;

            // Hindari kandidat yang terlalu jauh dari durasi target.
            if ($duration < $target * 0.70 || $duration > $target * 1.25) {
                continue;
            }

            $selectedSegments = array_slice(
                $segments,
                $startIndex,
                $endIndex - $startIndex + 1
            );

            $text = trim(implode(' ', array_column($selectedSegments, 'text')));

            $score = $this->score($text, $duration, $target);

            $candidate = [
                'id' => 'candidate-' . ($startIndex + 1),
                'projectId' => $projectId,
                'title' => $this->title($text),
                'start' => $start,
                'end' => $end,
                'score' => $score,
                'reason' => 'Skor heuristik berdasarkan pola kalimat, kata pemicu, dan kesesuaian durasi. Perlu ditinjau secara manual.',
                'segmentIds' => array_map(
                    fn (int $index): int => $index + 1,
                    range($startIndex, $endIndex)
                ),
            ];

            $candidates[] = $candidate;
        }

        // Hapus kandidat dengan rentang yang sama.
        $unique = [];

        foreach ($candidates as $candidate) {
            $key = $candidate['start'] . '-' . $candidate['end'];
            $unique[$key] ??= $candidate;
        }

        usort(
            $unique,
            fn (array $a, array $b): int => $b['score'] <=> $a['score']
        );

        return array_values(array_slice($unique, 0, 5));
    }

    private function score(string $text, float $duration, int $target): int
    {
        $score = 50;
        $lower = mb_strtolower($text);

        $hooks = [
            'kenapa',
            'mengapa',
            'ternyata',
            'sebenarnya',
            'masalahnya',
            'intinya',
            'menurut gue',
            'menurut saya',
            'caranya',
            'jangan',
        ];

        foreach ($hooks as $hook) {
            if (str_contains($lower, $hook)) {
                $score += 5;
            }
        }

        if (str_contains($text, '?')) {
            $score += 5;
        }

        if (preg_match('/[.!?]["\']?$/u', trim($text))) {
            $score += 5;
        }

        $deviation = abs($duration - $target) / $target;
        $score -= (int) round($deviation * 30);

        return max(0, min(100, $score));
    }

    private function title(string $text): string
    {
        $text = trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
        $words = preg_split('/\s+/u', $text) ?: [];

        $title = implode(' ', array_slice($words, 0, 9));

        if (count($words) > 9) {
            $title .= '...';
        }

        return mb_substr($title, 0, 60);
    }
}
