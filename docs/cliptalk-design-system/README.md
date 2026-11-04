ClipTalk mengubah video podcast berbahasa Indonesia yang panjang menjadi klip vertikal pendek bersubtitle. Antarmukanya terasa seperti meja editor yang tenang: monokrom ala buku besar, garis rambut sebagai struktur, dan satu warna kuning yang hanya berarti satu hal, yaitu **rentang klip**.

Dasarnya template [Vercel Platforms](https://github.com/vercel/platforms) (Tailwind CSS 4 + shadcn/ui, netral zinc, Geist). Nama token warna sengaja dibuat sama dengan variabel shadcn/ui, jadi bisa langsung ditempel ke starter kit Laravel 12 (React/Vue) yang juga memakai shadcn/ui.

## Suara dan bahasa

- Gunakan Bahasa Indonesia baku yang santai. Sapa pengguna dengan **Anda**, dan konsisten di semua layar.
- Pakai kapitalisasi kalimat biasa (sentence case) di semua judul, label dan tombol: "Pilih bagian video", bukan "Pilih Bagian Video".
- Tombol diawali kata kerja yang menyebut hasilnya: **Mulai**, **Buat klip**, **Unduh video**, **Buat klip lain**. Jangan menambahkan panah `→` di belakang label.
- Nama aksi tetap sama sepanjang alur. Kalau tombolnya "Buat klip", status selesainya "Klip siap" dan toast-nya "Klip dibuat".
- Error menyebut apa yang terjadi dan cara memperbaikinya, tanpa minta maaf. Contoh: "File melebihi 2 GB. Kompres video atau potong bagian awal sebelum mengunggah."
- Angka ditulis apa adanya: "44 detik", "342 MB", "Skor 98". Jangan menulis "98% menarik", karena skor itu perkiraan sistem, bukan fakta.
- Tanpa emoji, tanpa label huruf kapital semua di atas judul, dan tanpa string meta yang dipisah titik tengah ("A · B · C"). Kalau nilai perlu dipisah, gunakan dua spasi atau letakkan di kolom yang berbeda.

## Warna

- Bangun layar dari `background`, `card`, `muted`, `foreground`, `muted-foreground` dan `border`. Sekitar 95% layar berwarna hitam, putih dan abu-abu.
- **`range` (kuning #f5b800) adalah satu-satunya warna merek.** Pakai hanya untuk: isian RangeBar, langkah aktif di Stepper, Badge skor ≥ 90, dan latar `range-soft` untuk kalimat atau kandidat yang terpilih. Teks di atas `range` selalu memakai `range-foreground`. Tepi dan timecode rentang memakai `range-ink`.
- Jangan memakai `range` untuk tombol, link, progres unggah atau render, maupun dekorasi.
- Tombol utama memakai `primary` (hitam di tema terang, putih di tema gelap). Hanya satu tombol utama per layar.
- Cincin fokus memakai `ring` (alias `foreground`): 2px solid dengan offset 2px.
- Warna status (`success`, `warning`, `destructive`) selalu disertai kata atau ikon, dan masing-masing punya pasangan `-soft` untuk latarnya.
- Pemutar video dan ClipFrame memakai `stage` (hitam) di kedua tema. Subtitle memakai `caption-ink`, `caption-edge` dan `caption-plate`.

## Tipografi

- **Geist** dipakai untuk semua teks antarmuka. **Geist Mono** hanya untuk waktu, durasi, ukuran file, resolusi, codec, skor dan penghitung karakter, selalu dengan `font-variant-numeric: tabular-nums`. Timecode ditulis `hh:mm:ss` (`00:02:14`), dan rentang memakai en dash dengan spasi (`00:02:14 – 00:02:58`).
- Skala yang dipakai: `display` 36, `title` 24, `heading` 16, `body` 14, `label` 14/500, `small` 13, `caption` 12. Setiap layar hanya punya satu `display`.
- Subtitle yang dibakar ke video memakai `caption-burn`: Geist 700 ukuran 64 pada kanvas 1080×1920, maksimal 2 baris dan sekitar 32 karakter per baris.

## Ruang, garis dan bentuk

- Kelipatan 4px: `space-1` 4 sampai `space-16` 64. Padding Card memakai `space-6`, jarak antar panel `space-6`, dan judul langkah ke konten `space-8`.
- Struktur dibangun dengan **garis rambut 1px `border`**, bukan bayangan. Baris pengaturan, transkrip dan kandidat disusun seperti buku besar: baris-baris yang dipisah garis, di dalam satu panel.
- Radius mengikuti peran, tidak seragam: `radius-xs` untuk rentang waktu (presisi), `radius-sm` untuk badge, `radius-md` untuk kontrol, `radius-lg` untuk panel, `radius-frame` hanya untuk bingkai ponsel 9:16, dan `radius-full` hanya untuk switch dan avatar.
- Bayangan: `shadow-xs` hanya untuk thumb switch dan segmen aktif, `shadow-pop` hanya untuk elemen yang melayang (menu, toast).

## Tata letak

- Tanpa sidebar. Gunakan AppHeader 56px (wordmark, Stepper, avatar), lalu satu kolom konten di tengah.
- Unggah: kolom 640px. Pilih bagian: dua kolom (video + kandidat 7/12, transkrip 5/12), max 1200px. Pratinjau: ClipFrame 270px + panel pengaturan 360px. Unduh: kolom 720px.
- Konten rata kiri di dalam kolomnya. Tombol aksi berada di footer panel atau di bawah konten, rata kanan, dengan "Kembali" (ghost) di kiri tombol utama.
- Di bawah 720px semua kolom ditumpuk dan gutter minimal 16px.

## Ikon

- Pakai **Lucide** dengan stroke 1.75 (`lucide-react`, `lucide-vue-next`, atau `mallardduck/blade-lucide-icons` untuk Blade). Komponen Icon di sistem ini meniru bentuk Lucide untuk pratinjau.
- Ukuran 16 di dalam tombol dan teks, 20 di FileRow, 24 di Dropzone. Warnanya selalu `currentColor`.

## Logo

Belum ada logo resmi. Wordmark-nya terdiri dari dua kurung in/out bergaris `foreground`, kotak `range` di tengahnya, lalu kata "ClipTalk" dalam Geist 600. Lihat AppHeader. Jangan menambahkan maskot atau gradien.

## Penerapan di Laravel

- Starter kit Laravel 12 (React atau Vue) sudah memakai Tailwind 4 + shadcn/ui. Timpa variabel di `resources/css/app.css` dengan nilai dari `tokens.json` (`--background`, `--foreground`, `--primary`, `--border`, `--input`, `--ring`, dan seterusnya), lalu tambahkan token khusus ClipTalk (`--range`, `--range-foreground`, `--range-ink`, `--range-soft`, `--stage`, `--caption-*`) ke blok `@theme inline` sebagai `--color-range` dan seterusnya.
- Font: `@fontsource-variable/geist` dan `@fontsource-variable/geist-mono` lewat npm, atau Google Fonts.
- Komponen di sistem ini adalah acuan visual. Di project, bangun di atas komponen shadcn/ui (Button, Badge, Card, Input, Switch, ToggleGroup, Progress) dan buat komponen khusus untuk RangeBar, TranscriptLine, SegmentCandidate, JobProgress dan ClipFrame.
