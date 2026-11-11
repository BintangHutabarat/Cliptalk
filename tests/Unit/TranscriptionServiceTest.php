<?php

namespace Tests\Unit;

use App\Services\TranscriptionService;
use PHPUnit\Framework\TestCase;

class TranscriptionServiceTest extends TestCase
{
    public function test_segments_are_mapped_to_the_contract_shape(): void
    {
        $segments = TranscriptionService::toTranscriptSegments([
            [
                'start' => 1.5,
                'end' => 4,
                'text' => 'Halo semua.',
                'avg_logprob' => -0.92,
                'words' => [
                    ['start' => 1.5, 'end' => 2, 'text' => 'Halo', 'probability' => 0.8],
                    ['start' => 2.1, 'end' => 3, 'text' => ' semua.', 'probability' => 0.7],
                ],
            ],
        ]);

        $this->assertSame([
            [
                'id' => 1,
                'start' => 1.5,
                'end' => 4.0,
                'text' => 'Halo semua.',
                'speaker' => null,
                'avgLogprob' => -0.92,
                'words' => [
                    ['start' => 1.5, 'end' => 2.0, 'text' => 'Halo', 'probability' => 0.8],
                    ['start' => 2.1, 'end' => 3.0, 'text' => ' semua.', 'probability' => 0.7],
                ],
            ],
        ], $segments);
    }

    public function test_old_transcripts_without_words_still_work(): void
    {
        $segments = TranscriptionService::toTranscriptSegments([
            ['start' => 0, 'end' => 2, 'text' => 'Lama.'],
        ]);

        $this->assertSame(0.0, $segments[0]['avgLogprob']);
        $this->assertSame([], $segments[0]['words']);
    }

    public function test_invalid_segments_are_skipped_but_ids_keep_file_order(): void
    {
        $segments = TranscriptionService::toTranscriptSegments([
            ['start' => 0, 'end' => 2, 'text' => 'Satu.'],
            ['text' => 'Tanpa waktu.'],
            'bukan array',
            ['start' => 5, 'end' => 7, 'text' => 'Empat.'],
        ]);

        $this->assertSame([1, 4], array_column($segments, 'id'));
    }
}
