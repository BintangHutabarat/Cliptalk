# ClipFrame

Bingkai ponsel 9:16 untuk pratinjau klip dan gaya subtitle.

- Konsumen memberi: `caption`, `captionStyle` (`outline` | `plate`), `showCaption`, `duration`, `current` (detik), `onPlay`. Di aplikasi, taruh `<video>` hasil render di dalam `.ct-frame` menggantikan `.ct-frame-scene`.
- Subtitle selalu `caption-ink` putih: Outline = garis `caption-edge` 3px pada kanvas 1080; Latar gelap = kotak `caption-plate`. Gaya ini harus sama persis dengan file ASS yang dibakar FFmpeg.
- Satu-satunya elemen dengan `radius-frame` dan latar `stage`.
