# SegmentCandidate

Satu kandidat klip hasil ekstraksi segmen, dipilih seperti radio.

- Konsumen memberi: `title` (dari LLM/heuristik, ≤ 60 karakter), `start`, `end`, `total` (detik), `score` (0–100), `selected`, `onSelect`.
- Bungkus dalam `.ct-cands` dengan `role="radiogroup"`. Urutkan dari skor tertinggi.
- Skor ≥ 90 memakai Badge `range`; di bawahnya `outline`. Skor adalah perkiraan sistem — tulis "Skor 98", bukan "98% menarik".
