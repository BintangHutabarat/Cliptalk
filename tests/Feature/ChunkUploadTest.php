<?php

namespace Tests\Feature;

use App\Jobs\TranscribeProject;
use App\Models\Project;
use App\Services\VideoMetadataService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ChunkUploadTest extends TestCase
{
    use RefreshDatabase;

    /** Header MP4 minimal: cukup untuk dikenali finfo sebagai video/mp4. */
    private const MP4_BYTES = "\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom";

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
        Queue::fake();
    }

    private function mp4(int $bytes = 5000): string
    {
        return str_pad(self::MP4_BYTES, $bytes, "\x00");
    }

    private function fakeMetadata(): void
    {
        $this->mock(VideoMetadataService::class)->shouldReceive('inspect')->andReturn([
            'codec' => 'h264', 'width' => 1920, 'height' => 1080, 'fps' => 30.0, 'duration_sec' => 173,
        ]);
    }

    private function chunk(string $bytes): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('chunk', $bytes);
    }

    public function test_chunks_are_joined_into_the_project_video(): void
    {
        $this->fakeMetadata();
        $contents = $this->mp4();
        $uploadId = $this->uploadInChunks($contents, 'Podcast Ep 14.mp4');

        $this->post(route('projects.store'), ['uploadId' => $uploadId, 'targetDuration' => 60])
            ->assertSessionHasNoErrors();

        $project = Project::firstOrFail();

        $this->assertSame("projects/{$project->id}/source.mp4", $project->file_path);
        $this->assertSame($contents, Storage::disk('local')->get($project->file_path));
        $this->assertSame(['Podcast Ep 14.mp4', 'video/mp4', 5000, 173], [$project->file_name, $project->mime_type, $project->size_bytes, $project->duration_sec]);
        Storage::disk('local')->assertMissing("uploads/{$uploadId}");
        Queue::assertPushed(TranscribeProject::class);
    }

    public function test_upload_resumes_from_the_bytes_the_server_already_has(): void
    {
        $contents = $this->mp4();
        $id = $this->postJson(route('uploads.store'), ['fileName' => 'a.mp4', 'sizeBytes' => 5000, 'mimeType' => 'video/mp4'])->json('id');

        $this->post(route('uploads.chunks', $id), ['offset' => 0, 'chunk' => $this->chunk(substr($contents, 0, 2000))], ['Accept' => 'application/json'])
            ->assertJson(['received' => 2000]);

        // Klien mengira bagian kedua belum terkirim dan mengulang dari 0: ditolak dengan posisi yang benar.
        $this->post(route('uploads.chunks', $id), ['offset' => 0, 'chunk' => $this->chunk(substr($contents, 0, 2000))], ['Accept' => 'application/json'])
            ->assertStatus(409)
            ->assertJson(['received' => 2000]);

        $this->getJson(route('uploads.show', $id))->assertJson(['received' => 2000]);

        $this->post(route('uploads.chunks', $id), ['offset' => 2000, 'chunk' => $this->chunk(substr($contents, 2000))], ['Accept' => 'application/json'])
            ->assertJson(['received' => 5000]);

        $this->assertSame($contents, Storage::disk('local')->get("uploads/{$id}/source.part"));
    }

    public function test_chunk_beyond_the_declared_size_is_rejected(): void
    {
        $id = $this->postJson(route('uploads.store'), ['fileName' => 'a.mp4', 'sizeBytes' => 10, 'mimeType' => 'video/mp4'])->json('id');

        $this->post(route('uploads.chunks', $id), ['offset' => 0, 'chunk' => $this->chunk(str_repeat('x', 11))], ['Accept' => 'application/json'])
            ->assertStatus(409)
            ->assertJson(['received' => 0]);
    }

    public function test_start_rejects_files_over_2_gb_and_unsupported_types(): void
    {
        $this->postJson(route('uploads.store'), ['fileName' => 'a.mp4', 'sizeBytes' => 2 * 1024 ** 3 + 1, 'mimeType' => 'video/mp4'])
            ->assertJsonValidationErrors(['sizeBytes' => 'File melebihi 2 GB.']);

        $this->postJson(route('uploads.store'), ['fileName' => 'a.txt', 'sizeBytes' => 10, 'mimeType' => 'text/plain'])
            ->assertJsonValidationErrors(['mimeType' => 'Format file tidak didukung.']);
    }

    public function test_incomplete_upload_cannot_become_a_project(): void
    {
        $id = $this->postJson(route('uploads.store'), ['fileName' => 'a.mp4', 'sizeBytes' => 5000, 'mimeType' => 'video/mp4'])->json('id');
        $this->post(route('uploads.chunks', $id), ['offset' => 0, 'chunk' => $this->chunk(substr($this->mp4(), 0, 1000))], ['Accept' => 'application/json']);

        $this->post(route('projects.store'), ['uploadId' => $id, 'targetDuration' => 60])
            ->assertSessionHasErrors(['video' => 'Unggahan belum lengkap. Klik Mulai untuk melanjutkan dari bagian terakhir.']);

        $this->assertSame(0, Project::count());
        Storage::disk('local')->assertExists("uploads/{$id}/source.part");
    }

    public function test_content_that_is_not_a_video_is_rejected_even_with_a_video_mime_type(): void
    {
        $id = $this->uploadInChunks(str_repeat('bukan video ', 100), 'palsu.mp4', 'video/mp4');

        $this->post(route('projects.store'), ['uploadId' => $id, 'targetDuration' => 60])
            ->assertSessionHasErrors(['video' => 'Format file tidak didukung. Unggah video MP4, MOV, atau WebM.']);

        $this->assertSame(0, Project::count());
        Storage::disk('local')->assertMissing("uploads/{$id}");
    }

    public function test_unknown_upload_id_is_rejected(): void
    {
        $this->post(route('projects.store'), ['uploadId' => '00000000-0000-4000-8000-000000000000', 'targetDuration' => 60])
            ->assertSessionHasErrors('video');

        $this->getJson(route('uploads.show', '00000000-0000-4000-8000-000000000000'))->assertNotFound();
    }

    public function test_purge_removes_uploads_untouched_for_24_hours(): void
    {
        $stale = $this->postJson(route('uploads.store'), ['fileName' => 'a.mp4', 'sizeBytes' => 10, 'mimeType' => 'video/mp4'])->json('id');
        $fresh = $this->postJson(route('uploads.store'), ['fileName' => 'b.mp4', 'sizeBytes' => 10, 'mimeType' => 'video/mp4'])->json('id');
        touch(Storage::disk('local')->path("uploads/{$stale}/source.part"), now()->subHours(25)->getTimestamp());

        $this->artisan('cliptalk:purge-expired')->assertSuccessful();

        Storage::disk('local')->assertMissing("uploads/{$stale}");
        Storage::disk('local')->assertExists("uploads/{$fresh}/source.part");
    }
}
