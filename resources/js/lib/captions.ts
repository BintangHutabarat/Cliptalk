import type { TranscriptWord } from '@/types/cliptalk';

export interface CaptionChunk {
    start: number;
    end: number;
    lines: string[];
}

// Sama dengan aturan ASS di RenderClip (SYSTEM-DESIGN.md §6): maks 2 baris, sekitar 32 karakter per baris.
const MAX_CHARS = 32;
const MAX_LINES = 2;
// Subtitle tetap tampil sebentar setelah kata terakhir, lalu hilang kalau jedanya panjang.
const LINGER_SEC = 0.6;

/** Memecah kata menjadi potongan subtitle. Potongan juga diputus di akhir kalimat (. ? !). */
export function chunkWords(words: TranscriptWord[]): CaptionChunk[] {
    const chunks: CaptionChunk[] = [];
    let current: CaptionChunk | null = null;

    for (const word of words) {
        const text = word.text.trim();
        if (!text) continue;

        if (!current) {
            current = { start: word.start, end: word.end, lines: [text] };
        } else {
            const last = current.lines[current.lines.length - 1];
            if (`${last} ${text}`.length <= MAX_CHARS) {
                current.lines[current.lines.length - 1] = `${last} ${text}`;
                current.end = word.end;
            } else if (current.lines.length < MAX_LINES) {
                current.lines.push(text);
                current.end = word.end;
            } else {
                chunks.push(current);
                current = { start: word.start, end: word.end, lines: [text] };
            }
        }

        if (/[.?!]$/.test(text)) {
            chunks.push(current);
            current = null;
        }
    }
    if (current) chunks.push(current);
    return chunks;
}

/** Baris subtitle yang tampil di detik `time`, atau null kalau tidak ada yang diucapkan. */
export function captionAt(chunks: CaptionChunk[], time: number): string[] | null {
    for (let i = chunks.length - 1; i >= 0; i--) {
        const chunk = chunks[i];
        if (time >= chunk.start) {
            const next = chunks[i + 1];
            const until = Math.min(chunk.end + LINGER_SEC, next ? next.start : Infinity);
            return time < until ? chunk.lines : null;
        }
    }
    return null;
}
