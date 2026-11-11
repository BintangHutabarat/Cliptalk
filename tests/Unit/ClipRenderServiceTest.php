<?php

namespace Tests\Unit;

use App\Services\ClipRenderService;
use PHPUnit\Framework\TestCase;

class ClipRenderServiceTest extends TestCase
{
    /**
     * @return list<string>
     */
    private function dialogues(string $ass): array
    {
        return array_values(array_filter(explode("\n", $ass), fn (string $line) => str_starts_with($line, 'Dialogue:')));
    }

    public function test_ass_uses_vertical_canvas_and_spec_font(): void
    {
        $ass = (new ClipRenderService)->buildAss([], 0, 10, 'outline');

        $this->assertStringContainsString("PlayResX: 1080\nPlayResY: 1920", $ass);
        $this->assertStringContainsString('Style: Default,Geist,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,3,0,2,76,76,420,1', $ass);
    }

    public function test_plate_style_uses_opaque_box(): void
    {
        $ass = (new ClipRenderService)->buildAss([], 0, 10, 'plate');

        $this->assertStringContainsString(',&H48000000,&H48000000,-1,0,0,0,100,100,0,0,3,14,0,2,', $ass);
    }

    public function test_captions_have_at_most_two_lines_of_32_characters(): void
    {
        $text = 'Menurut saya, perkembangan teknologi itu bukan cuma soal alat baru, tapi soal cara kita bekerja setiap hari dan bagaimana tim kita beradaptasi.';
        $ass = (new ClipRenderService)->buildAss([['start' => 10, 'end' => 30, 'text' => $text]], 10, 30, 'outline');

        $events = $this->dialogues($ass);
        $this->assertGreaterThan(1, count($events));

        $words = [];
        foreach ($events as $event) {
            $caption = explode(',', $event, 10)[9];
            $lines = explode('\N', $caption);
            $this->assertLessThanOrEqual(2, count($lines), $caption);
            foreach ($lines as $line) {
                $this->assertLessThanOrEqual(32, mb_strlen($line), $line);
                array_push($words, ...explode(' ', $line));
            }
        }
        $this->assertSame($text, implode(' ', $words));
    }

    public function test_times_are_relative_to_clip_and_clipped_to_its_range(): void
    {
        $segments = [
            ['start' => 5, 'end' => 9, 'text' => 'Sebelum klip.'],
            ['start' => 9, 'end' => 12, 'text' => 'Mulai.'],
            ['start' => 19, 'end' => 25, 'text' => 'Akhir.'],
            ['start' => 30, 'end' => 32, 'text' => 'Sesudah klip.'],
        ];
        $events = $this->dialogues((new ClipRenderService)->buildAss($segments, 10, 20, 'outline'));

        $this->assertSame([
            'Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,Mulai.',
            'Dialogue: 0,0:00:09.00,0:00:10.00,Default,,0,0,0,,Akhir.',
        ], $events);
    }

    public function test_override_braces_are_removed_from_text(): void
    {
        $events = $this->dialogues((new ClipRenderService)->buildAss([['start' => 0, 'end' => 2, 'text' => 'Halo {\b1}dunia']], 0, 2, 'outline'));

        $this->assertSame(['Dialogue: 0,0:00:00.00,0:00:02.00,Default,,0,0,0,,Halo \b1dunia'], $events);
    }

    public function test_word_timestamps_drive_caption_timing(): void
    {
        // Dua kata panjang per baris, jadi potongan pertama berisi 4 kata dan kata ke-5 pindah potongan.
        $texts = ['Perkembangan', ' teknologinya', ' mempercepat', ' pekerjaannya', ' sekarang.'];
        $words = [];
        foreach ($texts as $i => $text) {
            $words[] = ['start' => 10 + $i * 2, 'end' => 11 + $i * 2, 'text' => $text, 'probability' => 0.9];
        }
        $segment = ['start' => 10, 'end' => 30, 'text' => trim(implode('', $texts)), 'words' => $words];

        $events = $this->dialogues((new ClipRenderService)->buildAss([$segment], 10, 30, 'outline'));

        // Potongan berakhir saat kata terakhirnya selesai (detik 17), bukan dibagi rata sepanjang segmen.
        $this->assertSame([
            'Dialogue: 0,0:00:00.00,0:00:07.00,Default,,0,0,0,,Perkembangan teknologinya\Nmempercepat pekerjaannya',
            'Dialogue: 0,0:00:08.00,0:00:09.00,Default,,0,0,0,,sekarang.',
        ], $events);
    }
}
