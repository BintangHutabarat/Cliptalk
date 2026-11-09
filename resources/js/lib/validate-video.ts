export interface VideoLimits {
    maxBytes: number;
    mimeTypes: readonly string[];
}

export type VideoFileError = 'type' | 'size';

// Sebagian browser (mis. .mov di Windows) mengirim type kosong, jadi ekstensi dipakai sebagai cadangan.
const MIME_BY_EXTENSION: Record<string, string> = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
};

/** Validasi di client. Server tetap memvalidasi ulang (SYSTEM-DESIGN.md §7). */
export function validateVideoFile(file: { name: string; type: string; size: number }, limits: VideoLimits): VideoFileError | null {
    const type = file.type || MIME_BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''] || '';
    if (!limits.mimeTypes.includes(type)) return 'type';
    if (file.size > limits.maxBytes) return 'size';
    return null;
}
