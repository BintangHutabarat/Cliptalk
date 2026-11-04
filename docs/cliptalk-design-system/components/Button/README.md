# Button

Tombol aksi; `primary` hanya satu per layar, untuk langkah maju di alur (Mulai, Buat klip, Unduh video).

- Konsumen memberi: `children` (label), `variant` (`primary` | `secondary` | `outline` | `ghost` | `destructive`), `size` (`sm` | `md` | `lg`), `icon` / `iconRight` (nama dari Icon), plus atribut `<button>` biasa.
- Label: kata kerja, kalimat biasa (sentence case), tanpa panah `→`. Nama aksi sama dari tombol sampai toast: "Unduh video" menghasilkan "Video diunduh".
- `primary` berwarna `primary` (hitam di tema terang, putih di tema gelap). Kuning `range` tidak pernah dipakai untuk tombol.
- `destructive` berupa teks merah tanpa isian; konfirmasi hapus ditaruh di halaman, bukan `confirm()`.
- Saat menunggu proses, ganti label menjadi gerund ("Memproses…") dan set `disabled`.
