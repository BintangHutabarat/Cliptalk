// Semua string UI dikumpulkan di sini (RULE.md §4).
// Sapa dengan "Anda", kapitalisasi kalimat biasa, tombol diawali kata kerja, tanpa emoji dan tanpa panah.
// Nama aksi tetap sama dari tombol sampai notifikasi: "Render klip" → "Merender klip…" → "Klip siap".

export const copy = {
    app: {
        name: 'ClipTalk',
        home: 'Beranda ClipTalk',
    },

    theme: {
        menu: 'Menu akun dan tema',
        label: 'Tema',
        light: 'Terang',
        dark: 'Gelap',
        system: 'Ikuti sistem',
    },

    steps: {
        label: 'Langkah',
        items: ['Unggah', 'Pilih bagian', 'Pratinjau', 'Unduh'],
        done: 'selesai',
        current: 'langkah saat ini',
    },

    actions: {
        start: 'Mulai',
        back: 'Kembali',
        retry: 'Coba lagi',
        remove: 'Hapus',
        chooseFile: 'Pilih dari komputer',
        createClip: 'Buat klip',
        renderClip: 'Render klip',
        downloadVideo: 'Unduh video',
        downloadSrt: 'Unduh SRT',
        createAnother: 'Buat klip lain',
        createNew: 'Buat klip baru',
    },

    upload: {
        pageTitle: 'Unggah',
        title: 'Buat klip dari podcast',
        description: 'Unggah video podcast, lalu pilih bagian yang ingin dijadikan klip.',
        dropTitle: 'Tarik video podcast ke sini',
        dropActive: 'Lepaskan untuk mengunggah',
        dropHint: 'MP4, MOV, atau WebM. Maksimal 2 GB.',
        uploading: 'Mengunggah…',
        removeFile: (name: string) => `Hapus ${name}`,
        durationTitle: 'Durasi klip',
        durationDescription: 'Target panjang tiap klip.',
        formatTitle: 'Format',
        formatValue: '9:16  1080×1920',
        languageTitle: 'Bahasa transkrip',
        languageValue: 'Bahasa Indonesia',
        footnote: 'Lama proses tergantung durasi video.',
        errors: {
            type: 'Format file tidak didukung. Unggah video MP4, MOV, atau WebM.',
            size: 'File melebihi 2 GB. Kompres video atau potong bagian awal sebelum mengunggah.',
            multiple: 'Pilih satu video saja. Setiap proses hanya menerima satu file.',
        },
    },

    processing: {
        pageTitle: 'Memproses',
        title: (fileName: string) => `Memproses ${fileName}`,
        description: 'Halaman ini pindah otomatis ke langkah berikutnya setelah selesai. Anda boleh membiarkan tab ini terbuka.',
        cardTitle: 'Status proses',
        progressLabel: 'Progres pemrosesan',
        stages: {
            uploaded: 'Video diunggah',
            transcribing: 'Transkripsi dengan Faster-Whisper',
            extracting: 'Mencari bagian menarik',
            ready: 'Siap dipilih',
        },
        state: {
            done: 'Selesai',
            active: 'Berjalan',
            pending: 'Menunggu',
            error: 'Gagal',
        },
        failed: 'Transkripsi gagal karena audio tidak terbaca. Pastikan video memiliki suara, lalu coba lagi.',
    },

    segments: {
        pageTitle: 'Pilih bagian',
        title: 'Pilih bagian video',
        description: 'Klik kalimat untuk melompat. Pilih satu kandidat untuk dijadikan klip.',
        candidatesTitle: 'Rekomendasi bagian',
        candidatesCount: (n: number) => `${n} kandidat`,
        candidatesLabel: 'Kandidat klip',
        transcriptTitle: 'Transkrip',
        transcriptTotal: 'total',
        lowConfidence: 'Kurang yakin',
        footnote: 'Rasio 9:16 diterapkan otomatis di langkah berikutnya.',
        score: (n: number) => `Skor ${n}`,
    },

    player: {
        play: 'Putar',
        pause: 'Jeda',
        back5: 'Mundur 5 detik',
        forward5: 'Maju 5 detik',
        speed: 'Kecepatan putar',
        seek: 'Posisi video',
        noVideo: 'Video contoh tidak ditemukan.',
        range: (start: string, end: string) => `Rentang klip dari ${start} sampai ${end}`,
    },

    preview: {
        pageTitle: 'Pratinjau',
        title: 'Pratinjau klip',
        titleLabel: 'Judul klip',
        titleHint: 'Dipakai sebagai nama file dan judul metadata.',
        titleRequired: 'Isi judul klip. Judul dipakai sebagai nama file.',
        captionsTitle: 'Tampilkan subtitle',
        captionsDescription: 'Subtitle dibakar langsung ke video.',
        styleTitle: 'Gaya subtitle',
        styles: {
            outline: 'Outline',
            plate: 'Latar gelap',
        },
        rendering: 'Merender klip…',
    },

    show: {
        pageTitle: 'Unduh',
        badge: 'Klip siap',
        title: 'Klip siap diunduh',
        expiry: 'File dihapus otomatis 24 jam setelah dibuat.',
        downloaded: 'Video diunduh',
    },

    spec: {
        fileName: 'Nama file',
        duration: 'Durasi',
        size: 'Ukuran',
        ratio: 'Rasio',
        format: 'Format',
        captions: 'Subtitle',
        captionsOn: (style: string) => `Aktif, ${style.toLowerCase()}`,
        captionsOff: 'Tidak aktif',
        ratioValue: '9:16  1080×1920',
        formatValue: 'MP4  H.264 + AAC',
    },

    notFound: {
        pageTitle: 'Klip tidak ditemukan',
        title: 'Klip tidak ditemukan',
        description: 'Klip ini sudah dihapus. File disimpan 24 jam setelah dibuat.',
    },

    toast: {
        clipCreated: 'Klip dibuat',
        clipReady: 'Klip siap',
    },
} as const;
