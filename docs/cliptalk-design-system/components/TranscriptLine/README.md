# TranscriptLine

Satu kalimat transkrip Faster-Whisper; klik untuk melompat ke waktunya.

- Konsumen memberi: `time` (detik), `speaker` (opsional — diarization belum ada di MVP, sembunyikan bila kosong), `text`, `inRange` (masuk rentang kandidat terpilih), `playing` (kalimat yang sedang diputar), `onSelect`.
- Bungkus dalam `.ct-transcript` di dalam Card `flush`; daftar panjang di-scroll di dalam Card, bukan seluruh halaman.
- Kalimat dalam rentang terpilih berlatar `range-soft` dengan timecode `range-ink`.
