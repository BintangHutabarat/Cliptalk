# TASK.md — Daftar pekerjaan ClipTalk

Kerjakan dari atas ke bawah. Satu task = satu commit atau PR. Centang `[x]` saat task selesai.
Acuan: RULE.md (aturan), DESIGN.md (visual), SYSTEM-DESIGN.md (data dan route).

Legenda: **DoD** = *definition of done*, yaitu syarat sebuah task dianggap selesai.

---

## Fase 1 — Frontend (data mock)

### 1. Setup

- [x] **1.1 Buat project.** Jalankan `laravel new cliptalk` → pilih starter kit **React**, auth **none/Laravel built-in** (boleh dimatikan untuk MVP), testing Pest, database SQLite.
  DoD: `composer run dev` berjalan dan halaman welcome tampil.
- [x] **1.2 Bersihkan starter kit.** Hapus halaman dashboard/settings yang tidak dipakai, dan matikan sidebar layout bawaan.
  DoD: route `/` merender halaman kosong `upload` lewat Inertia.
- [x] **1.3 Pasang dependensi.** Jalankan `npm i @fontsource-variable/geist @fontsource-variable/geist-mono lucide-react`, lalu `npx shadcn@latest add button badge card input label switch toggle-group progress alert separator tooltip sonner`.
  DoD: build sukses.
- [x] **1.4 Pasang token.** Ganti isi `resources/css/app.css` dengan blok token dari DESIGN.md §2, lalu sesuaikan varian Button/Badge shadcn (tambahkan Badge tone `range`, `success`, `warning`, dan Button `destructive` berupa teks tanpa isian).
  DoD: halaman uji `/_design` (khusus dev) menampilkan semua varian di tema terang dan gelap.
- [x] **1.5 Toggle tema.** Tambahkan tombol tema di menu avatar, simpan pilihannya di `localStorage`, dan default ikut sistem.

### 2. Fondasi

- [x] **2.1 Type domain.** Salin `resources/js/types/cliptalk.ts` persis dari SYSTEM-DESIGN.md §4.
- [x] **2.2 Util waktu.** Buat `lib/time.ts` berisi `formatTimecode(sec) → "00:02:14"`, `formatRange(a,b) → "00:02:14 – 00:02:58"`, `formatShort(sec) → "02:14"`, `formatDuration(sec) → "44 detik"`, dan `formatBytes(n) → "342 MB"`.
  DoD: ada unit test Vitest atau minimal pemeriksaan di `/_design`.
- [x] **2.3 Copy.** Kumpulkan semua string UI di `lib/copy.ts`.
- [x] **2.4 Mock.** Buat `mocks/project.ts`, `transcript.ts` (≥ 40 segmen Bahasa Indonesia, 00:00–38:20, ada word timestamps), `candidates.ts` (3 kandidat: 98/89/85), dan `clip.ts`. Siapkan juga controller Laravel yang mengirim props mock ke setiap halaman (SYSTEM-DESIGN.md §3).

### 3. Komponen (`components/cliptalk/`)

- [x] **3.1** `Wordmark`, `Stepper`, `AppHeader`, dan `clip-flow-layout` (header 56px, tanpa sidebar, container dengan lebar per halaman).
- [x] **3.2** `Dropzone` (drag & drop, validasi tipe/ukuran di client, state drag-over) dan `FileRow`.
- [x] **3.3** `SettingRow` (baris dalam satu Card dengan `divide-y`).
- [x] **3.4** `RangeBar` dengan props `total`, `start`, `end`, `playhead`, `ticks`, `compact`.
- [x] **3.5** `VideoPlayer`: `<video>` di atas `stage`, kontrol play/pause, mundur/maju 5 detik, timecode `00:02:14 / 00:38:20`, kecepatan putar, RangeBar dengan `ticks`, dan klik di track untuk seek. Ekspos `seek(sec)` lewat ref dan event `onTimeUpdate`.
- [x] **3.6** `TranscriptLine` dan daftar transkrip yang di-scroll di dalam Card. Kalimat yang sedang diputar ikut di-scroll ke tengah secara otomatis (`scrollIntoView({block:'nearest'})`, matikan saat pengguna sedang menggulir).
- [x] **3.7** `SegmentCandidate` dan daftar dengan `role="radiogroup"` (bisa dinavigasi dengan panah atas/bawah).
- [x] **3.8** `JobProgress`.
- [x] **3.9** `ClipFrame` (9:16, overlay subtitle gaya `outline` dan `plate`, subtitle mengikuti `currentTime` dari kata-kata di transkrip).
- [x] **3.10** `SpecList`.
- [x] **3.11** Halaman `/_design` (hanya di env local) yang menampilkan semua komponen di atas. Ini pengganti Storybook.
  DoD: semua komponen tampil benar di 360px dan 1280px, dalam tema terang dan gelap.

### 4. Halaman

- [x] **4.1 Unggah (`upload`).** Layout DESIGN.md §7.1 dengan state kosong, file dipilih, mengunggah (simulasi progres), dan error validasi. Tombol "Mulai" melakukan POST mock lalu redirect ke processing.
- [x] **4.2 Memproses (`projects/processing`).** JobProgress dengan simulasi polling, otomatis pindah ke segments saat `ready`, dan state gagal dengan tombol "Coba lagi".
- [x] **4.3 Pilih bagian (`projects/segments`).** Grid 7/5 berisi video + kandidat dan transkrip.
  - Kandidat pertama terpilih secara default.
  - Klik kandidat → `seek(start)`, kalimat di dalam rentang diberi `range-soft`.
  - Klik kalimat → `seek(time)`.
  - Kalimat yang sedang diputar ditandai.
  - "Buat klip" melakukan POST mock lalu ke preview.
  DoD: pada layar ≤ 1024px susunannya menjadi satu kolom (video → kandidat → transkrip).
- [x] **4.4 Pratinjau (`clips/preview`).** ClipFrame + Input judul (penghitung 60), Switch subtitle, SegmentedControl gaya, dan SpecList. Perubahan langsung tampil di ClipFrame. "Render klip" menampilkan progres singkat lalu ke show.
- [x] **4.5 Unduh (`clips/show`).** Badge "Klip siap", ClipFrame kecil, SpecList (nama file dari slug judul: `cliptalk_<slug>.mp4`), tombol "Unduh video", "Unduh SRT", dan "Buat klip lain", plus catatan "File dihapus otomatis 24 jam setelah dibuat."
- [x] **4.6 Halaman 404/kedaluwarsa.** "Klip ini sudah dihapus. File disimpan 24 jam setelah dibuat." dengan tombol "Buat klip baru".

### 5. Polesan dan QA frontend

- [ ] **5.1** Cek aksesibilitas: navigasi keyboard di semua alur, fokus terlihat, label ARIA, dan kontras di dua tema.
- [ ] **5.2** Cek responsif di 360, 768, 1024, dan 1440px. Pastikan tidak ada scroll horizontal.
- [ ] **5.3** Cek `prefers-reduced-motion`.
- [ ] **5.4** Pastikan `npm run lint`, `npm run types`, dan `npm run build` bersih.
- [ ] **5.5** Ambil screenshot setiap halaman (terang/gelap) untuk bab Hasil & Pembahasan naskah.

---

## Fase 2 — Backend inti

- [ ] 6.1 Migration + model + enum (`projects`, `transcripts`, `candidates`, `clips`).
- [ ] 6.2 Upload sungguhan (chunk) ke `storage/app/cliptalk/{project}/source.*` + `ProbeVideo`.
- [ ] 6.3 `worker/transcribe.py` (Faster-Whisper, `language="id"`, `word_timestamps=True`, `vad_filter=True`, output JSON + progres di stdout) dan `requirements.txt`.
- [ ] 6.4 Job `TranscribeVideo` (Process, timeout, retry 1x, simpan transcript, update stage/progress).
- [ ] 6.5 Job `GenerateCandidates` dengan heuristik dari SYSTEM-DESIGN.md §6.
- [ ] 6.6 Endpoint status + ganti mock polling dengan polling sungguhan.
- [ ] 6.7 Generator ASS (2 gaya) + job `RenderClip` (FFmpeg center crop 1080×1920, burn subtitle, progres, sha256).
- [ ] 6.8 Unduh MP4 + SRT (`Storage::download`).
- [ ] 6.9 Scheduler `PurgeExpiredFiles` (setiap jam).
- [ ] 6.10 Feature test Pest untuk 7 skenario di Tabel 1 naskah.

## Fase 3 — Opsional

- [ ] 7.1 Edit rentang dengan menyeret handle RangeBar.
- [ ] 7.2 Judul + skor + alasan dari LLM.
- [ ] 7.3 Reframe blur-background / face tracking.
- [ ] 7.4 Diarization (nama pembicara).
- [ ] 7.5 Banyak klip per project + riwayat.
