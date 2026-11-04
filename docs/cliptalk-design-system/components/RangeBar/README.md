# RangeBar

Elemen khas ClipTalk: posisi klip (in–out) di sepanjang video sumber.

- Konsumen memberi: `total`, `start`, `end` (detik), `playhead` (detik, opsional), `ticks` (label awal/tengah/akhir), `compact` (versi 12px untuk daftar kandidat).
- Isian `range` dengan handle `range-ink` di kedua ujung; playhead garis 2px `foreground`.
- Ini satu-satunya tempat warna kuning tampil besar. Jangan pakai pola ini untuk progres unggah atau progres render — itu JobProgress (hitam).
