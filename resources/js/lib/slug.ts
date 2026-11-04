/** "Bagaimana teknologi mengubah cara kerja" → "bagaimana-teknologi-mengubah-cara-kerja" */
export function slugify(text: string): string {
    return text
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** Nama file hasil render: cliptalk_<slug>.mp4 (TASK 4.5). */
export function clipFileName(title: string, extension = 'mp4'): string {
    return `cliptalk_${slugify(title) || 'klip'}.${extension}`;
}
