# RULE.md — Aturan kerja project ClipTalk

Aturan ini wajib diikuti siapa pun yang menulis kode di repo ini, termasuk AI coding agent. Kalau ada yang bertentangan, urutan yang menang: **RULE.md → DESIGN.md → SYSTEM-DESIGN.md → TASK.md**.

---

## 1. Lingkup fase saat ini

- **Fase sekarang: frontend saja.** Backend (upload sungguhan, Faster-Whisper, FFmpeg, queue) belum dikerjakan.
- Semua data berasal dari **mock** di `resources/js/mocks/`, dengan bentuk yang persis sama dengan type di `resources/js/types/cliptalk.ts`. Kontrak data ini nantinya dipakai backend, jadi jangan mengubah bentuknya tanpa memperbarui SYSTEM-DESIGN.md.
- Halaman tetap dirender lewat route Laravel + Inertia, supaya routing-nya sudah final. Controller sementara hanya mengirim data mock.
- Jangan memasang package backend (Horizon, Redis, FFmpeg wrapper, dll.) di fase ini.

## 2. Stack (jangan diganti tanpa diskusi)

- Laravel 12, starter kit **React** (Inertia 2 + React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui).
- Font: `@fontsource-variable/geist`, `@fontsource-variable/geist-mono`.
- Ikon: `lucide-react`, selalu dengan `strokeWidth={1.75}`.
- Package manager: npm. PHP ≥ 8.2, Node ≥ 20.
- Tidak boleh ada library UI lain (MUI, Chakra, DaisyUI, Flowbite, dll.) dan tidak boleh ada CSS-in-JS.

## 3. Aturan desain (ringkas dari DESIGN.md)

1. **Hanya pakai token.** Tidak boleh ada hex atau rgb literal di komponen. Pakai kelas Tailwind dari token (`bg-background`, `text-muted-foreground`, `bg-range`, …). Pengecualian satu-satunya adalah `app.css`.
2. **Kuning (`range`) hanya untuk rentang klip.** Kuning boleh dipakai untuk RangeBar, langkah aktif Stepper, Badge skor ≥ 90, kandidat atau kalimat yang terpilih, dan wordmark. Selain itu tidak boleh, termasuk untuk tombol, link, dan progress.
3. **Satu tombol `primary` per layar.**
4. **Garis, bukan bayangan.** Card ditulis `border rounded-lg bg-card` tanpa `shadow-*`. Daftar dibuat dengan `divide-y`, bukan kartu bertumpuk.
5. **Radius sesuai peran** (`rounded-xs` rentang, `rounded-sm` badge, `rounded-md` kontrol, `rounded-lg` panel, `rounded-[20px]` hanya ClipFrame, `rounded-full` hanya switch/avatar).
6. **Mono hanya untuk data waktu dan teknis**, selalu dengan `tabular-nums`. Format waktu `hh:mm:ss` dan rentang `a – b` (en dash).
7. **Tanpa sidebar.** Navigasi global hanya AppHeader.
8. Pola yang dilarang: gradien dekoratif, emoji, label HURUF KAPITAL di atas judul, meta dengan titik tengah `A · B · C`, panah `→` di label tombol, kartu dengan aksen garis kiri berwarna, dan bayangan abu-abu di setiap kartu.
9. Dukung **dua tema** (terang/gelap) lewat kelas `.dark`. Setiap komponen baru harus dicek di kedua tema.

## 4. Aturan copy (Bahasa Indonesia)

- Sapa pengguna dengan "Anda". Pakai kapitalisasi kalimat biasa di semua teks UI.
- Tombol diawali kata kerja: Mulai, Buat klip, Render klip, Unduh video, Buat klip lain, Coba lagi, Kembali.
- Nama aksi tetap sama dari tombol sampai notifikasi ("Render klip" → "Merender klip…" → "Klip siap").
- Error menyebut masalahnya dan cara memperbaikinya, tanpa minta maaf.
  - ✅ "File melebihi 2 GB. Kompres video atau potong bagian awal sebelum mengunggah."
  - ❌ "Maaf, terjadi kesalahan."
- Tulis skor sebagai "Skor 98", bukan "98% menarik". Satuan durasi: "44 detik" di teks, "44 dtk" di tempat sempit.
- Semua string UI dikumpulkan di `resources/js/lib/copy.ts` agar konsisten.

## 5. Struktur folder frontend

```
resources/js/
├─ app.tsx
├─ pages/
│  ├─ upload.tsx                  # langkah 1
│  ├─ projects/processing.tsx     # status job
│  ├─ projects/segments.tsx       # langkah 2
│  ├─ clips/preview.tsx           # langkah 3
│  └─ clips/show.tsx              # langkah 4 (unduh)
├─ layouts/
│  └─ clip-flow-layout.tsx        # AppHeader + container
├─ components/
│  ├─ ui/                         # hasil `npx shadcn add`, boleh diubah gayanya
│  └─ cliptalk/                   # komponen khusus (lihat DESIGN.md §6)
│     ├─ app-header.tsx  stepper.tsx  wordmark.tsx
│     ├─ dropzone.tsx  file-row.tsx  setting-row.tsx
│     ├─ range-bar.tsx  transcript-line.tsx  segment-candidate.tsx
│     ├─ job-progress.tsx  clip-frame.tsx  spec-list.tsx  video-player.tsx
├─ hooks/
│  ├─ use-video-time.ts           # sinkron currentTime video ↔ transkrip
│  └─ use-job-polling.ts          # polling status (mock: timer)
├─ lib/
│  ├─ time.ts                     # formatTimecode, parseTimecode, formatDuration, formatBytes
│  ├─ copy.ts
│  └─ utils.ts                    # cn()
├─ mocks/
│  ├─ project.ts  transcript.ts  candidates.ts  clip.ts
└─ types/
   └─ cliptalk.ts
```

## 6. Konvensi kode

- File kebab-case, komponen PascalCase, hook `useXxx`. Satu komponen per file.
- TypeScript strict. Tidak boleh ada `any`. Props diberi type eksplisit, dan type domain diimpor dari `types/cliptalk.ts`.
- **Waktu selalu disimpan dalam detik (number, boleh desimal).** Konversi ke string hanya lewat `lib/time.ts`.
- Komponen di `components/cliptalk/` harus presentational, yaitu menerima data lewat props. Data diambil oleh halaman (dari props Inertia).
- Gabungkan kelas dengan `cn()`. Jangan membuat string kelas Tailwind secara dinamis (`bg-${x}`), karena kelasnya tidak akan ter-generate.
- Route PHP diberi nama (`->name('projects.segments')`), dan di frontend dipanggil lewat helper `route()` (Ziggy) atau Wayfinder bawaan starter kit.
- Jalankan `npm run lint`, `npm run types` (atau `tsc --noEmit`), dan `npm run build` tanpa error sebelum commit.

## 7. Aksesibilitas (wajib)

- Semua elemen interaktif bisa dipakai dengan keyboard dan punya fokus yang terlihat (`focus-visible:outline-2 outline-ring outline-offset-2`).
- Kalimat transkrip berupa `<button>`. Daftar kandidat memakai `role="radiogroup"` dengan `role="radio"` + `aria-checked`.
- Progress memakai `role="progressbar"` + `aria-valuenow`. Status selalu berupa teks, bukan warna saja.
- Hormati `prefers-reduced-motion`.
- Halaman tetap bisa dipakai di lebar 360px tanpa scroll horizontal.

## 8. Git

- Branch: `feat/<nama>`, `fix/<nama>`. Commit memakai format conventional (`feat: halaman pilih bagian`).
- Satu task di TASK.md = satu PR atau satu commit yang bisa ditinjau.
- Centang task di TASK.md di commit yang menyelesaikannya.
