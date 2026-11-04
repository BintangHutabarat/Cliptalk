# JobProgress

Progres job antrean Laravel (upload → transkripsi → ekstraksi segmen → render).

- Konsumen memberi: `percent` (0–100), `stages` `[{label, state: 'done'|'active'|'pending'|'error', meta}]`. `meta` mono di kanan (durasi atau ukuran).
- Bar berwarna `foreground`, bukan `range`. Status gagal: `state:'error'` + Notice `error` di bawahnya dengan cara memperbaiki.
- Data diambil dengan polling status job (mis. tiap 2 detik) atau broadcasting; jangan menampilkan estimasi waktu yang tidak diukur.
