<?php

namespace Tests\Unit;

use App\Services\CandidateGenerationService;
use PHPUnit\Framework\TestCase;

class CandidateGenerationServiceTest extends TestCase
{
    /**
     * Segmen 10 detik berurutan tanpa jeda sepanjang $seconds.
     *
     * @return list<array{start: int, end: int, text: string}>
     */
    private function segments(int $seconds, array $texts = []): array
    {
        $segments = [];
        for ($start = 0; $start < $seconds; $start += 10) {
            $segments[] = ['start' => $start, 'end' => $start + 10, 'text' => $texts[$start] ?? 'Kalimat biasa saja.'];
        }

        return $segments;
    }

    public function test_candidates_never_overlap(): void
    {
        $candidates = (new CandidateGenerationService)->generate($this->segments(600), 60, 'p1');

        $this->assertGreaterThan(1, count($candidates));
        $this->assertLessThanOrEqual(5, count($candidates));

        foreach ($candidates as $i => $a) {
            foreach (array_slice($candidates, $i + 1) as $b) {
                $this->assertFalse(
                    $a['start'] < $b['end'] && $b['start'] < $a['end'],
                    "Tumpang-tindih: {$a['start']}-{$a['end']} dan {$b['start']}-{$b['end']}"
                );
            }
        }
    }

    public function test_top_candidate_contains_the_hook_sentences_and_results_are_sorted_by_score(): void
    {
        // Kata pemicu di detik 90–120 membuat jendela yang memuatnya berskor paling tinggi.
        $texts = [90 => 'Menurut saya masalahnya begini.', 100 => 'Intinya jangan menyerah.', 110 => 'Kenapa begitu?'];
        $candidates = (new CandidateGenerationService)->generate($this->segments(300, $texts), 60, 'p1');

        // Kandidat teratas memuat ketiga kalimat pemicu (detik 90–120).
        $this->assertLessThanOrEqual(90.0, $candidates[0]['start']);
        $this->assertGreaterThanOrEqual(120.0, $candidates[0]['end']);
        $this->assertSame($candidates, array_values($candidates));
        $scores = array_column($candidates, 'score');
        $sorted = $scores;
        rsort($sorted);
        $this->assertSame($sorted, $scores);
    }

    public function test_video_shorter_than_target_yields_no_candidates(): void
    {
        $this->assertSame([], (new CandidateGenerationService)->generate($this->segments(20), 60, 'p1'));
    }
}
