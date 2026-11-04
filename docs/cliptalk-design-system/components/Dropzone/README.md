# Dropzone

Area unggah video podcast: tarik-lepas atau pilih file.

- Konsumen memberi: `onFile(File)`, `hint`, `id`.
- Format yang diterima: `video/mp4`, `video/quicktime`, `video/webm`, maks 2 GB. Validasi ulang di server (Laravel `mimetypes:` + `max:`).
- Saat file diseret di atasnya, garis berubah jadi solid `range-ink` dengan latar `range-soft`.
- Setelah file dipilih, ganti Dropzone dengan FileRow.
