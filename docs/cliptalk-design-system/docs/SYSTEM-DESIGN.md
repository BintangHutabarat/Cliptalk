# SYSTEM-DESIGN.md — Arsitektur ClipTalk

Rancangan sistem auto clipper video podcast berbahasa Indonesia. Dasarnya naskah *"Rancang Bangun dan Evaluasi Sistem Auto Clipper Video Podcast Berbahasa Indonesia Berbasis Transkripsi Otomatis dan Ekstraksi Segmen"* (Sulaiman & Rifaldi, ITI).

Status: **Fase 1 = frontend dengan data mock.** Bagian backend di dokumen ini adalah rancangan untuk fase berikutnya. Kontrak datanya sudah final supaya frontend tidak perlu diubah nanti.

---

## 1. Gambaran umum

```
 Browser (Inertia + React)
     │  upload, pilih segmen, atur subtitle, unduh
     ▼
 Laravel 13 ── DB (PostgreSQL) ── Storage (local disk: storage/app/cliptalk)
     │  dispatch job
     ▼
 Queue worker (database driver)
     ├─ TranscribeVideo      → python worker/transcribe.py  (Faster-Whisper)
     ├─ GenerateCandidates   → heuristik + (opsional) LLM
     └─ RenderClip           → ffmpeg (cut, crop 9:16, burn ASS subtitle)
     ▼
 Scheduler: PurgeExpiredFiles (hapus file > 24 jam)
```

Alur pengguna (sesuai naskah dan mockup): **Unggah → (Memproses) → Pilih bagian → Pratinjau → Unduh.**

## 2. Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Web | Laravel 13 + Inertia 3 + React 19, TS, Tailwind 4, shadcn/ui (dipasang manual, tanpa starter kit) | Sama dengan gaya vercel/platforms (shadcn + Tailwind 4) tapi tetap Laravel |
| DB | PostgreSQL 18 (kolom JSON memakai `jsonb`) | Aman untuk worker queue yang menulis status bersamaan; SQLite mengunci seluruh database saat menulis. File video tetap di disk, bukan di DB |
| Lingkungan dev | Docker lewat Laravel Sail (`compose.yaml`, Dockerfile di `docker/8.5`): PHP 8.5, PostgreSQL 18, FFmpeg 6.1, Faster-Whisper 1.2.1 di `/opt/whisper`, dan queue worker lewat supervisord | Lingkungan sama di semua mesin; model Whisper diunduh sekali ke `storage/app/whisper` |
| Queue | `database` driver | Tanpa Redis; `php artisan queue:work` |
| ASR | Faster-Whisper (Python 3.10+, CTranslate2), model `small`/`medium`, `language="id"`, `word_timestamps=True`, `vad_filter=True` | Sesuai naskah [3] |
| Video | FFmpeg 6+ | Sesuai naskah [5] |
| Ekstraksi segmen | Heuristik berbasis transkrip (fase 2), opsional LLM untuk judul + skor (fase 3) | Naskah menyebut "aturan pemilihan berdasarkan isi transkrip" |
| Realtime status | Polling `GET /api/projects/{id}/status` tiap 2 detik | Paling sederhana. Reverb bisa ditambahkan nanti |

## 3. Route

### Halaman (Inertia)

| Method | URI | Name | Page | Fase 1 |
|---|---|---|---|---|
| GET | `/` | `upload` | `upload` | mock |
| POST | `/projects` | `projects.store` | redirect → processing | mock: langsung redirect |
| GET | `/projects/{project}/processing` | `projects.processing` | `projects/processing` | mock + timer |
| GET | `/projects/{project}/segments` | `projects.segments` | `projects/segments` | mock |
| POST | `/projects/{project}/clips` | `clips.store` | redirect → preview | mock |
| GET | `/clips/{clip}/preview` | `clips.preview` | `clips/preview` | mock |
| POST | `/clips/{clip}/render` | `clips.render` | redirect → show | mock |
| GET | `/clips/{clip}` | `clips.show` | `clips/show` | mock |
| GET | `/clips/{clip}/download` | `clips.download` | file | fase 2 |

### JSON (polling)

| Method | URI | Respons |
|---|---|---|
| GET | `/api/projects/{project}/status` | `ProjectStatus` |
| GET | `/api/clips/{clip}/status` | `ClipStatus` |

Di fase 1, `{project}` dan `{clip}` cukup memakai id mock `demo`.

## 4. Kontrak data (`resources/js/types/cliptalk.ts`)

Semua waktu dalam **detik** (number). Semua ukuran dalam **byte**.

```ts
export type ProjectStage = 'uploaded' | 'transcribing' | 'extracting' | 'ready' | 'failed';
export type ClipStage = 'draft' | 'queued' | 'rendering' | 'ready' | 'failed';
export type ClipDuration = 30 | 60 | 90;
export type CaptionStyle = 'outline' | 'plate';

export interface Project {
  id: string;
  fileName: string;             // "podcast_teknologi_ep14.mp4"
  durationSec: number;          // 2300
  sizeBytes: number;            // 358612992
  mimeType: 'video/mp4' | 'video/quicktime' | 'video/webm';
  width: number; height: number; fps: number;
  sourceUrl: string;            // URL video untuk <video>
  targetDuration: ClipDuration;
  language: 'id';
  stage: ProjectStage;
  error?: string | null;
  createdAt: string;            // ISO
  expiresAt: string;            // createdAt + 24 jam
}

export interface TranscriptWord { start: number; end: number; text: string; probability: number }
export interface TranscriptSegment {
  id: number;
  start: number; end: number;
  text: string;
  speaker?: string | null;      // null di MVP (belum ada diarization)
  avgLogprob: number;           // dari Faster-Whisper, untuk tanda "kurang yakin"
  words: TranscriptWord[];
}

export interface Candidate {
  id: string;
  projectId: string;
  title: string;                // ≤ 60 karakter
  start: number; end: number;
  score: number;                // 0–100
  reason: string;               // alasan singkat (untuk evaluasi kualitatif)
  segmentIds: number[];         // TranscriptSegment yang tercakup
}

export interface Clip {
  id: string;
  projectId: string;
  candidateId: string | null;   // null jika rentang diatur manual
  title: string;
  start: number; end: number;
  showCaptions: boolean;
  captionStyle: CaptionStyle;
  width: 1920; height: 1080; // sementara landscape; lihat catatan di §6
  videoCodec: 'h264'; audioCodec: 'aac';
  stage: ClipStage;
  progress: number;             // 0–100
  outputUrl?: string | null;
  outputSizeBytes?: number | null;
  srtUrl?: string | null;
  sha256?: string | null;
  error?: string | null;
  expiresAt: string;
}

export interface JobStageItem { key: string; label: string; state: 'done' | 'active' | 'pending' | 'error'; meta?: string }
export interface ProjectStatus { stage: ProjectStage; percent: number; stages: JobStageItem[]; error?: string | null }
export interface ClipStatus { stage: ClipStage; percent: number; error?: string | null }
```

### Props tiap halaman Inertia

| Page | Props |
|---|---|
| `upload` | `{ limits: { maxBytes: number; mimeTypes: string[] }, durations: ClipDuration[] }` |
| `projects/processing` | `{ project: Project, status: ProjectStatus }` |
| `projects/segments` | `{ project: Project, transcript: TranscriptSegment[], candidates: Candidate[] }` |
| `clips/preview` | `{ project: Project, clip: Clip, transcript: TranscriptSegment[] }` (hanya segmen di dalam rentang) |
| `clips/show` | `{ project: Project, clip: Clip }` |

## 5. Basis data (fase 2)

```
projects    id(ulid) file_name disk path duration_sec size_bytes mime width height fps
            target_duration language stage error created_at expires_at
transcripts id project_id(fk) segments(json) model language duration_ms created_at
candidates  id(ulid) project_id(fk) title start end score reason segment_ids(json)
clips       id(ulid) project_id(fk) candidate_id(fk,null) title start end show_captions
            caption_style stage progress output_path output_size srt_path sha256 error
            created_at expires_at
```

Model: `Project hasOne Transcript, hasMany Candidate, hasMany Clip`. Enum PHP: `ProjectStage`, `ClipStage`, `CaptionStyle`.

## 6. Pipeline job (fase 2)

1. **`ProbeVideo`** menjalankan `ffprobe -v quiet -print_format json -show_streams -show_format` untuk mengisi durasi, resolusi dan fps, serta menolak video tanpa audio.
2. **`TranscribeVideo`** melakukan dua hal:
   - Mengekstrak audio dengan `ffmpeg -i in.mp4 -vn -ac 1 -ar 16000 audio.wav`.
   - Menjalankan `python worker/transcribe.py audio.wav --model small --lang id --out transcript.json` lewat `Process::timeout(0)`. Script menulis JSON berisi `TranscriptSegment[]` dan mencetak progres `PROGRESS <0-100>` ke stdout, yang dibaca Laravel untuk memperbarui status.
3. **`GenerateCandidates`** berjalan dengan heuristik awal:
   - Gabungkan segmen berurutan sampai panjangnya mendekati `targetDuration` (±25%). Potong hanya di batas kalimat (segmen yang berakhir dengan `. ? !`) atau di jeda ≥ 0.6 detik.
   - Beri skor setiap jendela dengan kombinasi berbobot: kepadatan kata per detik, rata-rata `avgLogprob` (keyakinan ASR), keberadaan kalimat tanya atau pendapat ("menurut saya", "intinya", "yang penting"), serta penalti jika jendela diawali kata sambung ("dan", "tapi", "jadi").
   - Ambil 3–5 jendela teratas yang tidak saling tumpang-tindih. Judul awal diambil dari kalimat pertama, dipangkas sampai 60 karakter.
   - Opsional (fase 3): kirim transkrip ke LLM untuk memperoleh `title`, `score` dan `reason` dalam format JSON.
4. **`RenderClip`** melakukan tiga hal:
   - Membuat `clip.ass` dari kata-kata di dalam rentang, dengan waktu dikurangi `start`, maksimal 2 baris dan sekitar 32 karakter per baris. Style ASS untuk Outline: `Fontname=Geist,FontSize=64,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=3,Shadow=0,Alignment=2,MarginV=420`. Untuk Latar gelap: `BorderStyle=3,BackColour=&H48000000`.
   - Menjalankan FFmpeg (center crop dari sumber 16:9):
     ```
     ffmpeg -ss {start} -to {end} -i in.mp4 \
       -vf "crop=ih*9/16:ih,scale=1080:1920,subtitles=clip.ass:fontsdir=fonts" \
       -c:v libx264 -preset veryfast -crf 20 -c:a aac -b:a 160k -movflags +faststart out.mp4
     ```
   - Menghitung `sha256` dan ukuran file. Progres dibaca dari `-progress pipe:1`.
5. **`PurgeExpiredFiles`** dijadwalkan tiap jam dan menghapus file serta baris yang `expires_at < now()`.

> **Sementara (keputusan 11 November 2026):** hasil render berformat landscape 16:9, 1920×1080. Gambar dimuatkan utuh tanpa dipotong; sumber dengan rasio lain diberi bingkai hitam. Subtitle ASS memakai Geist 72 dengan margin bawah 150. Format 9:16 di bawah ini dipakai lagi nanti.

Mode reframe 9:16 untuk MVP adalah **center crop**. Rencana berikutnya adalah blur background atau face tracking (OpenCV/MediaPipe).

## 7. Validasi

- Upload: `required|file|mimetypes:video/mp4,video/quicktime,video/webm|max:2097152` (KB). Gunakan upload chunk (mis. `pion/laravel-chunk-upload`) untuk file besar di fase 2.
- Rentang klip: `0 ≤ start < end ≤ durationSec`, dan `5 ≤ end - start ≤ 180` detik.
- Judul: `required|string|max:60`.

## 8. Mock fase 1

- `resources/js/mocks/*.ts` mengekspor objek yang mematuhi type di §4. Isinya data contoh dari mockup: podcast 38:20, sekitar 40 segmen transkrip berbahasa Indonesia, dan 3 kandidat (skor 98, 89, 85).
- `app/Http/Controllers/*` di fase 1 mengirim props mock yang sama (dari `resources/mocks/*.json` atau array PHP) supaya halaman Inertia sudah memakai jalur props sungguhan.
- Video contoh: file MP4 lokal apa pun di `public/samples/podcast.mp4` (tidak di-commit), dengan fallback ke `stage` hitam jika file tidak ada.
- `use-job-polling` di fase 1 mensimulasikan status yang maju tiap 1,5 detik.

## 9. Pemetaan ke pengujian (naskah, Tabel 1)

| No | Skenario | Halaman / job | Bukti |
|---|---|---|---|
| 1 | Mengunggah video | `upload`, `projects.store` | File diterima, validasi format/ukuran |
| 2 | Membuat transkrip | `TranscribeVideo` | `transcript.json` dengan timestamp |
| 3 | Menentukan kandidat | `GenerateCandidates`, `projects/segments` | Rentang kandidat sesuai percakapan |
| 4 | Memotong video | `RenderClip` | Durasi output = `end - start` |
| 5 | Menambahkan subtitle | `RenderClip` (ASS) | Teks terbaca dan selaras |
| 6 | Mengubah format | `RenderClip` | Output 1920×1080 (sementara; rencana 1080×1920) |
| 7 | Meninjau & mengunduh | `clips/preview`, `clips/show` | Bisa diputar dan diunduh |
