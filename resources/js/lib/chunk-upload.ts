import { routes } from './routes.ts';

/** Ukuran satu bagian; server menerima maksimal 16 MB (ChunkUploadController::CHUNK_MAX_KB). */
export const CHUNK_BYTES = 8 * 1024 * 1024;

const MAX_ATTEMPTS = 3;

export class ChunkUploadError extends Error {
    /** Pesan validasi dari server (mis. file terlalu besar), atau null kalau koneksinya yang gagal. */
    readonly serverMessage: string | null;

    constructor(serverMessage: string | null = null) {
        super(serverMessage ?? 'Unggahan terputus.');
        this.serverMessage = serverMessage;
    }
}

type UploadOptions = {
    /** Id unggahan sebelumnya untuk file yang sama; dilanjutkan dari byte yang sudah diterima server. */
    uploadId?: string | null;
    onUploadId?: (id: string) => void;
    onProgress?: (percent: number) => void;
    retryDelayMs?: number;
};

function request(url: string, init: RequestInit = {}): Promise<Response> {
    // Laravel menaruh token CSRF di cookie XSRF-TOKEN; fetch harus mengirimnya sendiri.
    const token = /(?:^|; )XSRF-TOKEN=([^;]*)/.exec(globalThis.document?.cookie ?? '')?.[1];

    return fetch(url, {
        credentials: 'same-origin',
        ...init,
        headers: {
            Accept: 'application/json',
            ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}),
            ...init.headers,
        },
    });
}

async function validationMessage(response: Response): Promise<string | null> {
    if (response.status !== 422) return null;

    const body = (await response.json().catch(() => null)) as { errors?: Record<string, string[]> } | null;

    return Object.values(body?.errors ?? {})[0]?.[0] ?? null;
}

async function receivedBytes(id: string): Promise<number | null> {
    try {
        const response = await request(routes.uploads.show(id));

        return response.ok ? ((await response.json()) as { received: number }).received : null;
    } catch {
        return null;
    }
}

/**
 * Kirim file per bagian dan kembalikan id unggahan. Setiap bagian dicoba ulang sampai 3 kali;
 * sebelum mencoba ulang, posisi disamakan dengan jumlah byte yang benar-benar diterima server.
 */
export async function uploadInChunks(file: File, options: UploadOptions = {}): Promise<string> {
    const { onUploadId, onProgress, retryDelayMs = 1000 } = options;
    let id = options.uploadId ?? null;
    let received = id ? await receivedBytes(id) : null;

    if (id === null || received === null) {
        const response = await request(routes.uploads.store(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: file.name, sizeBytes: file.size, mimeType: file.type }),
        }).catch(() => null);

        if (!response?.ok) {
            throw new ChunkUploadError(response ? await validationMessage(response) : null);
        }

        id = ((await response.json()) as { id: string }).id;
        received = 0;
        onUploadId?.(id);
    }

    let failures = 0;

    while (received < file.size) {
        onProgress?.((received / file.size) * 100);

        const body = new FormData();
        body.append('offset', String(received));
        body.append('chunk', file.slice(received, received + CHUNK_BYTES), 'chunk');

        const response = await request(routes.uploads.chunks(id), { method: 'POST', body }).catch(() => null);

        if (response?.ok) {
            received = ((await response.json()) as { received: number }).received;
            failures = 0;
            continue;
        }

        const message = response ? await validationMessage(response) : null;
        failures++;

        if (message || failures >= MAX_ATTEMPTS) {
            throw new ChunkUploadError(message);
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * failures));
        received = (await receivedBytes(id)) ?? received;
    }

    onProgress?.(100);

    return id;
}
