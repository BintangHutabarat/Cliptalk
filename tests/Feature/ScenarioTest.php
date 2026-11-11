<?php

namespace Tests\Feature;

use App\Jobs\RenderClip;
use App\Jobs\TranscribeProject;
use App\Models\Clip;
use App\Models\Project;
use App\Services\TranscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Symfony\Component\Process\ExecutableFinder;
use Tests\TestCase;

/**
 * Tujuh skenario pengujian di naskah, Tabel 1 (SYSTEM-DESIGN.md §9).
 *
 * FFmpeg dan FFprobe dijalankan sungguhan pada video uji 12 detik. Faster-Whisper tidak dijalankan
 * di sini (butuh model dan waktu lama), jadi transkripnya disiapkan oleh test.
 */
class ScenarioTest extends TestCase
{
    use RefreshDatabase;

    private const SOURCE = 'projects/uji/source.mp4';

    private const TRANSCRIPT = 'projects/uji/transcript.json';

    protected function setUp(): void
    {
        parent::setUp();

        $finder = new ExecutableFinder;

        if (! $finder->find('ffmpeg') || ! $finder->find('ffprobe')) {
            $this->markTestSkipped('FFmpeg dan FFprobe diperlukan. Jalankan test di dalam container Sail.');
        }

        Storage::fake('local');
    }

    /**
     * Video lanskap 1280×720, 12 detik, dengan audio. Dibuat sekali lalu dipakai ulang antar-test.
     */
    private function sampleVideoPath(): string
    {
        $path = sys_get_temp_dir().'/cliptalk-scenario-source.mp4';

        if (! is_file($path)) {
            Process::run([
                'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                '-f', 'lavfi', '-i', 'testsrc2=s=1280x720:r=30',
                '-f', 'lavfi', '-i', 'sine=frequency=440',
                '-t', '12', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', '-c:a', 'aac',
                $path,
            ])->throw();
        }

        return $path;
    }

    /**
     * Sepuluh kalimat masing-masing 9 detik (0–90 detik), dengan jeda 1 detik di antaranya.
     *
     * @return list<array{start: int, end: int, text: string}>
     */
    private function podcastSegments(): array
    {
        return array_map(
            fn (int $i) => ['start' => $i * 9, 'end' => $i * 9 + 8, 'text' => "Kalimat ke-{$i} tentang teknologi."],
            range(0, 9)
        );
    }

    /**
     * @param  list<array<string, mixed>>  $segments
     */
    private function projectWithTranscript(array $segments, int $targetDuration = 30): Project
    {
        $disk = Storage::disk('local');
        $disk->put(self::SOURCE, file_get_contents($this->sampleVideoPath()));
        $disk->put(self::TRANSCRIPT, json_encode(['segments' => $segments]));

        return Project::create([
            'file_name' => 'podcast.mp4',
            'file_path' => self::SOURCE,
            'transcript_path' => self::TRANSCRIPT,
            'mime_type' => 'video/mp4',
            'size_bytes' => $disk->size(self::SOURCE),
            'target_duration' => $targetDuration,
            'duration_sec' => 12,
            'width' => 1280,
            'height' => 720,
            'stage' => 'ready',
        ]);
    }

    /**
     * Render sungguhan klip detik 2–8 dari video uji lewat job RenderClip.
     */
    private function renderedClip(bool $showCaptions = true): Clip
    {
        $project = $this->projectWithTranscript([
            ['start' => 2, 'end' => 5, 'text' => 'Halo, selamat datang.'],
            ['start' => 5, 'end' => 8, 'text' => 'Kita bahas teknologi.'],
        ]);

        $clip = Clip::create([
            'project_id' => $project->id,
            'candidate_id' => 'candidate-1',
            'title' => 'Selamat datang',
            'start_sec' => 2,
            'end_sec' => 8,
            'show_captions' => $showCaptions,
            'caption_style' => 'outline',
            'stage' => 'queued',
        ]);

        RenderClip::dispatchSync($clip->id);

        return $clip->refresh();
    }

    /**
     * @return array{width: int, height: int, duration: float, codecs: list<string>}
     */
    private function probe(string $relativePath): array
    {
        $data = json_decode(Process::run([
            'ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,width,height:format=duration', '-of', 'json',
            Storage::disk('local')->path($relativePath),
        ])->throw()->output(), true, 512, JSON_THROW_ON_ERROR);

        $video = collect($data['streams'])->firstWhere('width');

        return [
            'width' => (int) $video['width'],
            'height' => (int) $video['height'],
            'duration' => (float) $data['format']['duration'],
            'codecs' => array_column($data['streams'], 'codec_name'),
        ];
    }

    public function test_scenario_1_uploading_a_video_stores_it_and_reads_its_metadata(): void
    {
        Queue::fake();

        $this->post(route('projects.store'), [
            'video' => UploadedFile::fake()->createWithContent('catatan.txt', 'bukan video'),
            'targetDuration' => 60,
        ])->assertSessionHasErrors('video');

        $this->assertSame(0, Project::count());

        $this->post(route('projects.store'), [
            'video' => new UploadedFile($this->sampleVideoPath(), 'podcast.mp4', 'video/mp4', null, true),
            'targetDuration' => 60,
        ])->assertSessionHasNoErrors();

        $project = Project::firstOrFail();

        $this->assertSame([1280, 720, 12, 'uploaded'], [$project->width, $project->height, $project->duration_sec, $project->stage]);
        Storage::disk('local')->assertExists($project->file_path);
        Queue::assertPushed(TranscribeProject::class, fn (TranscribeProject $job) => $job->projectId === $project->id);
    }

    public function test_scenario_2_transcription_job_saves_a_timestamped_transcript(): void
    {
        $project = $this->projectWithTranscript($this->podcastSegments());
        $project->update(['stage' => 'uploaded', 'transcript_path' => null]);

        $this->mock(TranscriptionService::class)->shouldReceive('transcribe')->once()->andReturn(self::TRANSCRIPT);

        TranscribeProject::dispatchSync($project->id);

        $project->refresh();
        $this->assertSame(['ready', self::TRANSCRIPT], [$project->stage, $project->transcript_path]);

        $this->get(route('projects.segments', $project->id))->assertInertia(fn (Assert $page) => $page
            ->has('transcript', 10)
            ->where('transcript.1.start', 9)
            ->where('transcript.1.end', 17)
            ->where('transcript.1.text', 'Kalimat ke-1 tentang teknologi.')
        );
    }

    public function test_scenario_3_candidates_follow_sentence_boundaries_without_overlap(): void
    {
        $project = $this->projectWithTranscript($this->podcastSegments());
        $project->update(['stage' => 'uploaded']);

        $this->mock(TranscriptionService::class)->shouldReceive('transcribe')->andReturn(self::TRANSCRIPT);

        TranscribeProject::dispatchSync($project->id);

        $candidates = json_decode(Storage::disk('local')->get("projects/{$project->id}/candidates.json"), true);
        $starts = array_column($this->podcastSegments(), 'start');
        $ends = array_column($this->podcastSegments(), 'end');

        $this->assertGreaterThanOrEqual(2, count($candidates));

        foreach ($candidates as $index => $candidate) {
            $this->assertContains($candidate['start'], $starts);
            $this->assertContains($candidate['end'], $ends);
            // Target 30 detik; kandidat boleh 70%–125% dari target.
            $this->assertEqualsWithDelta(30, $candidate['end'] - $candidate['start'], 9);

            foreach (array_slice($candidates, $index + 1) as $other) {
                $this->assertTrue($candidate['end'] <= $other['start'] || $other['end'] <= $candidate['start']);
            }
        }

        $this->get(route('projects.segments', $project->id))->assertInertia(fn (Assert $page) => $page
            ->has('candidates', count($candidates))
        );
    }

    public function test_scenario_4_rendered_clip_lasts_exactly_the_chosen_range(): void
    {
        $clip = $this->renderedClip();

        $this->assertSame(['ready', 100], [$clip->stage, $clip->progress]);
        $this->assertEqualsWithDelta(6.0, $this->probe($clip->output_path)['duration'], 0.15);
    }

    public function test_scenario_5_subtitles_are_burned_in_and_timed_from_the_clip_start(): void
    {
        $withCaptions = $this->renderedClip();
        $disk = Storage::disk('local');
        $directory = dirname($withCaptions->output_path);

        $ass = $disk->get("{$directory}/clip.ass");
        $this->assertStringContainsString('Dialogue: 0,0:00:00.00,0:00:03.00,Default,,0,0,0,,Halo, selamat datang.', $ass);
        $this->assertStringContainsString('Dialogue: 0,0:00:03.00,0:00:06.00,Default,,0,0,0,,Kita bahas teknologi.', $ass);

        $this->assertStringContainsString("1\n00:00:00,000 --> 00:00:03,000\nHalo, selamat datang.", $disk->get($withCaptions->subtitle_path));

        // Video yang sama tanpa subtitle harus menghasilkan gambar berbeda.
        Clip::query()->delete();
        Project::query()->delete();
        $withoutCaptions = $this->renderedClip(showCaptions: false);

        $this->assertNotSame($withCaptions->sha256, $withoutCaptions->sha256);
    }

    public function test_scenario_6_landscape_source_becomes_a_1080_by_1920_h264_video(): void
    {
        $output = $this->probe($this->renderedClip()->output_path);

        $this->assertSame([1080, 1920], [$output['width'], $output['height']]);
        $this->assertEqualsCanonicalizing(['h264', 'aac'], $output['codecs']);
    }

    public function test_scenario_7_rendered_clip_can_be_reviewed_played_and_downloaded(): void
    {
        $clip = $this->renderedClip();

        $this->get(route('clips.preview', $clip->id))->assertInertia(fn (Assert $page) => $page
            ->component('clips/preview')
            ->has('transcript', 2)
            ->where('project.sourceUrl', route('projects.video', $clip->project_id))
        );

        $this->get(route('clips.show', $clip->id))->assertInertia(fn (Assert $page) => $page
            ->component('clips/show')
            ->where('clip.stage', 'ready')
            ->where('clip.downloadUrl', route('clips.download.video', $clip->id))
            ->where('clip.sha256', hash_file('sha256', Storage::disk('local')->path($clip->output_path)))
        );

        $this->get(route('clips.play.video', $clip->id))->assertOk()->assertHeader('Content-Type', 'video/mp4');
        $this->get(route('clips.download.video', $clip->id))->assertOk()->assertDownload('cliptalk_selamat-datang.mp4');
        $this->get(route('clips.download.subtitle', $clip->id))->assertOk()->assertDownload('cliptalk_selamat-datang.srt');
    }
}
