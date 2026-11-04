# PROMPT.md — Prompt untuk AI coding agent

Salin salah satu prompt di bawah ke Claude Code, Cursor, Copilot, atau agent lain yang kamu pakai, lalu jalankan dari root project Laravel. Taruh `DESIGN.md`, `RULE.md`, `SYSTEM-DESIGN.md`, dan `TASK.md` di root repo terlebih dahulu.

---

## Prompt utama (sekali di awal)

```
Kamu adalah senior frontend engineer di project ClipTalk: web auto clipper video podcast berbahasa Indonesia (Laravel 12 + Inertia + React + TypeScript + Tailwind CSS 4 + shadcn/ui).

Sebelum menulis kode, baca empat file ini sampai habis:
1. RULE.md          → aturan wajib (paling tinggi prioritasnya)
2. DESIGN.md        → token, tipografi, komponen, layout tiap layar
3. SYSTEM-DESIGN.md → route, type data (kontrak), props tiap halaman, mock
4. TASK.md          → urutan pekerjaan

Konteks penting:
- Fase sekarang HANYA frontend. Semua data dari mock yang bentuknya persis type di SYSTEM-DESIGN.md §4. Jangan membuat migration, job, atau integrasi Whisper/FFmpeg.
- Gaya visual mengikuti template vercel/platforms: netral zinc, Geist + Geist Mono, garis rambut 1px, tanpa bayangan di kartu, tanpa sidebar. Satu-satunya warna merek adalah kuning `range` (#f5b800), dan hanya boleh dipakai untuk rentang klip (RangeBar, langkah aktif, kandidat/kalimat terpilih, skor ≥ 90).
- Semua teks UI dalam Bahasa Indonesia, kapitalisasi kalimat biasa, menyapa dengan "Anda", tombol diawali kata kerja, tanpa emoji dan tanpa panah "→".
- Waktu selalu dalam detik (number); format tampilan lewat lib/time.ts (00:02:14, rentang "00:02:14 – 00:02:58").

Cara kerja:
- Kerjakan TASK.md berurutan, satu task per langkah. Sebelum mulai satu task, sebutkan task-nya dan file yang akan disentuh.
- Setelah tiap task: jalankan `npm run lint`, `npm run types` (atau `npx tsc --noEmit`), dan `npm run build`, perbaiki semua error, lalu centang task di TASK.md.
- Jangan memakai warna literal di komponen (hanya kelas token Tailwind). Jangan memasang library UI lain.
- Kalau ada yang ambigu atau bertentangan antar dokumen, ikuti urutan RULE > DESIGN > SYSTEM-DESIGN > TASK, lalu tulis keputusanmu di akhir jawaban.
- Berhenti dan tanya kalau sebuah task butuh mengubah kontrak data di SYSTEM-DESIGN.md.

Mulai dari TASK 1.1 sampai 1.5 (setup + token + halaman /_design), lalu tunjukkan hasilnya.
```

---

## Prompt lanjutan per bagian

**Fondasi + mock**
```
Lanjut TASK 2.1–2.4. Mock transkrip harus terasa seperti obrolan podcast teknologi berbahasa Indonesia yang natural (≥ 40 segmen, 00:00:00–00:38:20, ada word timestamps dan avgLogprob). Kandidat: "Bagaimana teknologi mengubah cara kerja" 00:02:14–00:02:58 skor 98, "Kreativitas vs otomatisasi alat digital" 00:14:14–00:15:06 skor 89, "Pentingnya hook 3 detik pertama video" 00:27:05–00:27:48 skor 85. Pastikan segmen transkrip benar-benar ada di rentang tersebut.
```

**Komponen**
```
Lanjut TASK 3.1–3.11. Ikuti tabel komponen di DESIGN.md §6 dan aturan warna di §2. RangeBar adalah elemen khas: track 4px bg-muted, isian bg-range 12px dengan handle range-ink 3×18px di kedua ujung, dan playhead 2px bg-foreground; varian compact 12px tanpa handle. Tampilkan semua komponen di /_design dalam tema terang dan gelap, di lebar 360px dan 1280px.
```

**Halaman**
```
Lanjut TASK 4.1–4.6. Ikuti wireframe di DESIGN.md §7 dan props di SYSTEM-DESIGN.md §4. Di halaman Pilih bagian, sinkronkan video ↔ transkrip ↔ kandidat lewat satu hook use-video-time: klik kandidat → seek ke start dan tandai kalimat di dalam rentang (range-soft); klik kalimat → seek; kalimat yang sedang diputar ditandai dan ikut di-scroll ke tengah kecuali pengguna sedang menggulir.
```

**QA**
```
Lanjut TASK 5.1–5.5. Audit setiap halaman terhadap RULE.md §3, §4, dan §7. Buat daftar pelanggaran (file:baris → perbaikan), perbaiki semuanya, lalu ambil screenshot tiap halaman di tema terang dan gelap.
```

---

## Prompt review desain (kapan saja)

```
Review halaman <nama halaman> terhadap DESIGN.md dan RULE.md. Cek: (1) warna kuning hanya untuk rentang klip, (2) hanya satu tombol primary, (3) kartu tanpa shadow dan daftar memakai divide-y, (4) mono hanya untuk waktu/data teknis + tabular-nums, (5) copy Bahasa Indonesia sesuai aturan, (6) fokus keyboard dan ARIA, (7) tampilan di 360px dan tema gelap. Laporkan per poin: lulus / gagal + perbaikan, lalu terapkan perbaikannya.
```
