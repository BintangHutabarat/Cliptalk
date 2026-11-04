# DESIGN.md — ClipTalk

Spesifikasi visual ClipTalk: auto clipper video podcast berbahasa Indonesia.
Sumber kebenaran visual adalah artifact **ClipTalk Design System** (token, komponen, preview). File ini adalah versi yang bisa dibawa ke repo.

---

## 1. Arah desain

- **Referensi:** template [vercel/platforms](https://github.com/vercel/platforms): Tailwind CSS 4, shadcn/ui, netral zinc, font Geist.
- **Gaya:** *achromatic ledger* tanpa sidebar. Layar dibangun dari hitam, putih dan abu-abu. Struktur dibentuk dengan garis rambut 1px, bukan bayangan. Baris-baris disusun seperti buku besar.
- **Satu warna merek:** kuning `range` `#f5b800`. Warna ini hanya berarti **rentang klip** (in–out). Bayangkan stabilo kuning di atas transkrip.
- **Elemen khas:** RangeBar, yaitu track timeline dengan isian kuning dan handle in/out. Elemen ini muncul di pemutar, di setiap kandidat segmen, dan di wordmark.

## 2. Token warna (`resources/css/app.css`)

Nama variabel mengikuti shadcn/ui, jadi bisa langsung menimpa variabel bawaan starter kit Laravel 12.

```css
@import "tailwindcss";
@import "@fontsource-variable/geist";
@import "@fontsource-variable/geist-mono";

:root {
  --background: #ffffff;
  --foreground: #09090b;
  --card: #ffffff;
  --card-foreground: #09090b;
  --popover: #ffffff;
  --popover-foreground: #09090b;
  --muted: #f4f4f5;
  --muted-foreground: #68686f;
  --accent: #f4f4f5;
  --accent-foreground: #09090b;
  --primary: #09090b;
  --primary-foreground: #fafafa;
  --secondary: #f4f4f5;
  --secondary-foreground: #09090b;
  --border: #e4e4e7;
  --input: #8a8a93;          /* border kontrol, ≥3:1 */
  --ring: #09090b;
  --destructive: #b91c1c;
  --destructive-soft: #fef2f2;
  --success: #15803d;
  --success-soft: #f0fdf4;
  --warning: #c2410c;
  --warning-soft: #fff7ed;

  /* ClipTalk */
  --range: #f5b800;
  --range-foreground: #09090b;
  --range-ink: #8a5d00;
  --range-soft: #fff6d6;
  --stage: #000000;
  --stage-foreground: #ffffff;
  --stage-muted: #a1a1aa;
  --caption-ink: #ffffff;
  --caption-edge: #000000;
  --caption-plate: rgba(0, 0, 0, 0.72);

  --radius: 10px;
}

.dark {
  --background: #09090b;
  --foreground: #fafafa;
  --card: #111113;
  --card-foreground: #fafafa;
  --popover: #111113;
  --popover-foreground: #fafafa;
  --muted: #1c1c1f;
  --muted-foreground: #a1a1aa;
  --accent: #27272a;
  --accent-foreground: #fafafa;
  --primary: #fafafa;
  --primary-foreground: #09090b;
  --secondary: #1c1c1f;
  --secondary-foreground: #fafafa;
  --border: #27272a;
  --input: #6b6b75;
  --ring: #fafafa;
  --destructive: #f87171;
  --destructive-soft: #2a0b0b;
  --success: #4ade80;
  --success-soft: #052e16;
  --warning: #fb923c;
  --warning-soft: #2b1406;
  --range-ink: #ffd24d;
  --range-soft: #2b2108;
}

@theme inline {
  --font-sans: "Geist Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono Variable", ui-monospace, Consolas, monospace;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-destructive: var(--destructive);
  --color-destructive-soft: var(--destructive-soft);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-warning: var(--warning);
  --color-warning-soft: var(--warning-soft);
  --color-range: var(--range);
  --color-range-foreground: var(--range-foreground);
  --color-range-ink: var(--range-ink);
  --color-range-soft: var(--range-soft);
  --color-stage: var(--stage);
  --color-stage-foreground: var(--stage-foreground);
  --color-stage-muted: var(--stage-muted);

  --radius-xs: 2px;     /* rentang waktu */
  --radius-sm: 4px;     /* badge */
  --radius-md: 6px;     /* button, input */
  --radius-lg: 10px;    /* card, dropzone, player */
  --radius-frame: 20px; /* bingkai 9:16 saja */
}
```

### Aturan pemakaian warna

| Token | Dipakai untuk | Tidak boleh untuk |
|---|---|---|
| `range` | Isian RangeBar, langkah aktif di Stepper, Badge skor ≥ 90, wordmark | Tombol, link, progres unggah/render, teks di atas putih |
| `range-ink` | Handle in/out, tepi range, timecode rentang aktif | Isian besar |
| `range-soft` | Latar kalimat transkrip di dalam rentang, latar kandidat terpilih | Latar halaman atau Card |
| `primary` | Satu tombol aksi utama per layar | Badge, ikon dekoratif |
| `success` / `warning` / `destructive` | Status, selalu bersama kata atau ikon | Hiasan |
| `stage` | Latar pemutar video dan ClipFrame (hitam di kedua tema) | Panel biasa |

Kontras sudah dicek: semua teks ≥ 4.5:1 di kedua tema, dan border kontrol (`input`) ≥ 3:1.

## 3. Tipografi

- **Geist** untuk seluruh UI. **Geist Mono** hanya untuk data waktu dan teknis: timecode, durasi, ukuran file, resolusi, codec, skor, dan penghitung karakter. Selalu pakai `tabular-nums`.
- Timecode ditulis dengan format `hh:mm:ss` → `00:02:14`. Rentang memakai en dash dengan spasi → `00:02:14 – 00:02:58`.

| Style | Ukuran / line-height | Berat | Tailwind | Dipakai |
|---|---|---|---|---|
| display | 36 / 40, tracking -0.025em | 600 | `text-4xl font-semibold tracking-tight` | Judul langkah, 1 per layar |
| title | 24 / 32, -0.02em | 600 | `text-2xl font-semibold tracking-tight` | Judul di mobile, dialog |
| heading | 16 / 24, -0.01em | 600 | `text-base font-semibold` | Judul Card |
| body | 14 / 22 | 400 | `text-sm leading-[22px]` | Teks isi, transkrip |
| label | 14 / 20 | 500 | `text-sm font-medium` | Label kontrol, tombol |
| small | 13 / 20 | 400 | `text-[13px] text-muted-foreground` | Deskripsi, metadata |
| caption | 12 / 16 | 400 | `text-xs text-muted-foreground` | Nama pembicara |
| timecode | 13 / 20 | 500 | `font-mono text-[13px] font-medium tabular-nums` | Waktu |
| timecode-sm | 12 / 16 | 400 | `font-mono text-xs tabular-nums` | Spesifikasi |
| caption-burn | 64 / 76 pada kanvas 1080 | 700 | (ASS `FontSize=64`) | Subtitle di video |

## 4. Ruang, garis, bentuk

- Spasi memakai kelipatan 4px: 4, 8, 12, 16, 24, 32, 48, 64.
- Padding Card `p-6` (`p-4` di mobile). Jarak antar panel `gap-6`. Jarak dari judul langkah ke konten `mt-8`.
- **Garis, bukan bayangan.** Card = `border border-border rounded-lg bg-card`, tanpa `shadow`.
- Daftar (pengaturan, transkrip, kandidat) dibuat sebagai baris dalam satu Card dengan `divide-y divide-border`, bukan kartu terpisah.
- Radius mengikuti peran. Lihat `@theme` di atas. Jangan pakai satu radius untuk semua elemen.
- `shadow-xs` hanya untuk thumb switch dan segmen aktif. `shadow-pop` (`0 8px 24px -8px rgb(9 9 11 / .18)`) hanya untuk menu dan toast.

## 5. Ikon dan logo

- **Lucide** dengan `strokeWidth={1.75}`. Ukuran 16 di dalam tombol, 20 di baris file, 24 di Dropzone.
- Tanpa emoji.
- **Wordmark:** SVG 20×20 berisi dua kurung `[ ]` bergaris `foreground` (stroke 1.75) dan kotak `range` 8×8 rx 1 di tengahnya, diikuti teks "ClipTalk" dalam Geist 600 ukuran 15px, tracking -0.02em.

```svg
<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
  <rect x="6" y="6" width="8" height="8" rx="1" fill="var(--range)"/>
  <path d="M5 3H3v14h2M15 3h2v14h-2" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

## 6. Komponen

| Komponen | Basis | Catatan |
|---|---|---|
| Button | shadcn `button` | Varian: `default` (primary), `secondary`, `outline`, `ghost`, `destructive` (teks merah tanpa isian). Tinggi 36, sm 32, lg 40 |
| Badge | shadcn `badge` | Tone: neutral, outline, range, success, warning, destructive. `mono` untuk angka |
| Card | shadcn `card` | Header dengan `border-b`, footer dengan `border-t`, tombol rata kanan |
| Input | shadcn `input` + `label` | Penghitung `34/60` mono di kanan label |
| Switch | shadcn `switch` | Hanya untuk efek yang langsung berlaku |
| SegmentedControl | shadcn `toggle-group` (single) | Latar `muted`, item aktif `background` + `shadow-xs` |
| Stepper | custom | 4 langkah bernomor. Aktif = kotak `range`, selesai = centang |
| AppHeader | custom | 56px: wordmark, Stepper, avatar. Tanpa sidebar |
| Dropzone | custom | Border dashed `input`. Saat file diseret di atasnya: solid `range-ink` + `range-soft` |
| FileRow | custom | Ikon film, nama (elipsis), durasi + ukuran mono, tombol Hapus |
| SettingRow | custom | Judul + deskripsi di kiri, kontrol di kanan. Baris dalam satu Card |
| **RangeBar** | custom | Track 4px `muted`, isian `range` 12px dengan handle `range-ink` 3×18, playhead 2px `foreground`. Varian `compact` 12px untuk daftar |
| TranscriptLine | custom | Grid `76px 1fr`: timecode mono, pembicara (caption), teks. In-range = `range-soft`. Playing = segitiga kecil sebelum timecode |
| SegmentCandidate | custom | Radio + judul + rentang mono + durasi + RangeBar compact + Badge skor |
| JobProgress | shadcn `progress` + list | Bar `foreground` (bukan kuning). Tahap: done/active/pending/error |
| ClipFrame | custom | Bingkai 9:16, max-w 270px, `radius-frame`, latar `stage`, subtitle overlay |
| SpecList | custom `dl` | Baris label–nilai bergaris, nilai teknis mono |
| Notice | shadcn `alert` | info / warning / error |

## 7. Layar

Semua layar memakai AppHeader dan satu kolom konten. Konten rata kiri di dalam kolomnya.

### 7.1 Unggah (`/`) — kolom 640px

```
┌ [■] ClipTalk ─────── (1)Unggah — 2 Pilih bagian — 3 Pratinjau — 4 Unduh ─── (NP) ┐
│                                                                                  │
│   Buat klip dari podcast                                   ← display             │
│   Unggah video podcast, lalu pilih bagian yang ingin dijadikan klip.             │
│                                                                                  │
│   ┌ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ┐                  │
│   ╎                 ⇪  Tarik video podcast ke sini             ╎  ← Dropzone     │
│   ╎                    [ Pilih dari komputer ]                 ╎                  │
│   ╎              MP4, MOV, atau WebM. Maksimal 2 GB.           ╎                  │
│   └ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ┘                  │
│   ┌──────────────────────────────────────────────────────────┐                  │
│   │ ▤ podcast_teknologi_ep14.mp4      38:20  342 MB    Hapus │  ← FileRow       │
│   └──────────────────────────────────────────────────────────┘                  │
│   ┌──────────────────────────────────────────────────────────┐                  │
│   │ Durasi klip                         [30 dtk|60 dtk|90 dtk]│  ← SettingRow   │
│   │ Target panjang tiap klip.                                 │                  │
│   ├──────────────────────────────────────────────────────────┤                  │
│   │ Format                                   [9:16 1080×1920] │                  │
│   ├──────────────────────────────────────────────────────────┤                  │
│   │ Bahasa transkrip                         Bahasa Indonesia │                  │
│   └──────────────────────────────────────────────────────────┘                  │
│                                                                                  │
│   ⓘ Lama proses tergantung durasi video.                         [ Mulai ]      │
└──────────────────────────────────────────────────────────────────────────────────┘
```

State: kosong (hanya Dropzone), file dipilih (FileRow muncul, tombol Mulai aktif), mengunggah (FileRow + progress), error validasi (Notice error di bawah Dropzone).

### 7.2 Memproses (`/projects/{id}/processing`) — kolom 640px

Judul "Memproses podcast_teknologi_ep14.mp4", lalu JobProgress di dalam Card: Video diunggah → Transkripsi dengan Faster-Whisper → Mencari bagian menarik → Siap dipilih. Halaman otomatis pindah ke langkah 2 setelah selesai. Kalau gagal, tampilkan Notice error dan tombol "Coba lagi".

### 7.3 Pilih bagian (`/projects/{id}/segments`) — max 1200px, grid 12 kolom

```
  Pilih bagian video                                              ← display
  Klik kalimat untuk melompat. Pilih satu kandidat untuk dijadikan klip.

  ┌ col 7 ───────────────────────────────┐  ┌ col 5 ─────────────────────────┐
  │ ███████████ VIDEO (stage, 16:9) ████ │  │ Transkrip            38:20 total│
  │ ▶  00:02:14 / 00:38:20         1.0×  │  ├────────────────────────────────┤
  │ [====■■■■=========================]  │  │▸00:02:14 Pembicara 1            │ ← range-soft
  │ 00:00:00      00:19:10     00:38:20  │  │  Menurut saya, perkembangan…    │
  └──────────────────────────────────────┘  ├────────────────────────────────┤
  ┌──────────────────────────────────────┐  │ 00:02:21 Masalahnya bukan…      │ ← range-soft
  │ Rekomendasi bagian       3 kandidat  │  ├────────────────────────────────┤
  ├──────────────────────────────────────┤  │ 00:02:40 Ketika semua serba…    │
  │ ◉ Bagaimana teknologi mengubah…  98  │  │            (scroll di dalam)    │
  │   00:02:14 – 00:02:58  44 dtk        │  └────────────────────────────────┘
  │   ─■───────────────────────────────  │
  │ ○ Kreativitas vs otomatisasi…    89  │
  │ ○ Pentingnya hook 3 detik…       85  │
  └──────────────────────────────────────┘
  ⓘ Rasio 9:16 diterapkan otomatis di langkah berikutnya.   [Kembali] [ Buat klip ]
```

Interaksi: klik kandidat → video melompat ke `start`, kalimat dalam rentang diberi `range-soft`. Klik kalimat → video melompat ke waktunya. Rentang bisa disesuaikan dengan menyeret handle RangeBar di pemutar (fase 2). Di mobile, susunannya video, lalu kandidat, lalu transkrip.

### 7.4 Pratinjau (`/clips/{id}/preview`) — ClipFrame 270px + panel 360px

```
  Pratinjau klip
  ┌──────────┐   Judul klip                                 39/60
  │          │   [Bagaimana teknologi mengubah cara kerja       ]
  │  9:16    │   Dipakai sebagai nama file dan judul metadata.
  │  stage   │   ┌───────────────────────────────────────────┐
  │          │   │ Tampilkan subtitle                    (●) │
  │ "Menurut │   ├───────────────────────────────────────────┤
  │  saya…"  │   │ Gaya subtitle         [Outline|Latar gelap]│
  │ ──●───── │   └───────────────────────────────────────────┘
  │00:12 00:44   Durasi       44 detik  (SpecList)
  └──────────┘   Rasio        9:16  1080×1920
                 Format       MP4  H.264 + AAC
  [Kembali]                                           [ Render klip ]
```

### 7.5 Unduh (`/clips/{id}`) — kolom 720px

Badge success "Klip siap". Judul "Klip siap diunduh". Card berisi ClipFrame kecil (200px) dan SpecList (nama file, durasi, ukuran, format, subtitle). Tombol: `[ Unduh video ]` (primary), `Buat klip lain` (ghost), dan `Unduh SRT` (outline). Catatan kecil: "File dihapus otomatis 24 jam setelah dibuat."

## 8. Gerak

- Transisi 150ms hanya untuk warna latar dan border saat hover/fokus, serta pergeseran thumb switch.
- Satu momen yang disengaja: saat kandidat dipilih, isian RangeBar bergeser ke posisi barunya (200ms ease-out).
- Hormati `prefers-reduced-motion` dengan mematikan semua transisi dan spinner.

## 9. Aksesibilitas

- Fokus: `outline-2 outline-ring outline-offset-2` pada semua elemen interaktif.
- Daftar kandidat memakai `role="radiogroup"`. Kalimat transkrip berupa `<button>`. RangeBar diberi `aria-label` berisi rentang dalam kata.
- Status tidak boleh hanya mengandalkan warna. Progres memakai `role="progressbar"` beserta nilainya.
