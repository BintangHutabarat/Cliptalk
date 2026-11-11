// Satu-satunya tempat konversi detik ↔ string (RULE.md §6).

const pad = (n: number) => String(n).padStart(2, '0');

/** 134 → "00:02:14" */
export function formatTimecode(sec: number): string {
    const s = Math.max(0, Math.floor(sec));
    return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/** (134, 178) → "00:02:14 – 00:02:58" (en dash dengan spasi) */
export function formatRange(start: number, end: number): string {
    return `${formatTimecode(start)} – ${formatTimecode(end)}`;
}

/** 134 → "02:14". Menit tidak dibatasi 59: 2300 → "38:20". */
export function formatShort(sec: number): string {
    const s = Math.max(0, Math.floor(sec));
    return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** "00:02:14" atau "02:14" → 134. String tidak valid → NaN. */
export function parseTimecode(value: string): number {
    const parts = value.trim().split(':');
    if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return NaN;
    return parts.map(Number).reduce((total, part) => total * 60 + part, 0);
}

/** 44 → "44 detik", 125 → "2 menit 5 detik". `short` untuk tempat sempit: "44 dtk". */
export function formatDuration(sec: number, short = false): string {
    const s = Math.max(0, Math.round(sec));
    const [min, det] = short ? ['mnt', 'dtk'] : ['menit', 'detik'];
    if (s < 60) return `${s} ${det}`;
    const m = Math.floor(s / 60);
    return s % 60 ? `${m} ${min} ${s % 60} ${det}` : `${m} ${min}`;
}

/** 358612992 → "342 MB". Satuan biner (1 MB = 1024² byte), desimal pakai koma. */
export function formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = Math.max(0, bytes);
    let i = 0;
    while (value >= 1024 && i < units.length - 1) {
        value /= 1024;
        i++;
    }
    const digits = i >= 3 && value < 10 ? 1 : 0;
    return `${value.toFixed(digits).replace('.', ',').replace(/,0$/, '')} ${units[i]}`;
}
