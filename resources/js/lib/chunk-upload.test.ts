/// <reference types="node" />
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import { CHUNK_BYTES, ChunkUploadError, uploadInChunks } from './chunk-upload.ts';

const realFetch = globalThis.fetch;
afterEach(() => {
    globalThis.fetch = realFetch;
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** Server tiruan: menyimpan jumlah byte yang diterima dan bisa disuruh gagal pada percobaan tertentu. */
function fakeServer({ failChunkCalls = [] as number[], startReceived = 0 } = {}) {
    const state = { received: startReceived, chunkCalls: 0, offsets: [] as number[], created: 0 };

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === '/uploads') {
            state.created++;
            return json({ id: 'u1', received: 0 }, 201);
        }
        if (url === '/uploads/u1' || url === '/uploads/lama') {
            return url === '/uploads/u1' ? json({ id: 'u1', received: state.received }) : json({ message: 'Not found' }, 404);
        }

        state.chunkCalls++;
        if (failChunkCalls.includes(state.chunkCalls)) throw new TypeError('Failed to fetch');

        const body = init?.body as FormData;
        const offset = Number(body.get('offset'));
        state.offsets.push(offset);
        if (offset !== state.received) return json({ received: state.received }, 409);

        state.received += (body.get('chunk') as Blob).size;
        return json({ received: state.received });
    }) as typeof fetch;

    return state;
}

const fileOf = (bytes: number) => new File([new Uint8Array(bytes)], 'podcast.mp4', { type: 'video/mp4' });

test('mengirim file per bagian berurutan dan melaporkan progres sampai 100', async () => {
    const server = fakeServer();
    const progress: number[] = [];

    const id = await uploadInChunks(fileOf(CHUNK_BYTES * 2 + 10), { onProgress: (p) => progress.push(p), retryDelayMs: 0 });

    assert.equal(id, 'u1');
    assert.deepEqual(server.offsets, [0, CHUNK_BYTES, CHUNK_BYTES * 2]);
    assert.equal(server.received, CHUNK_BYTES * 2 + 10);
    assert.equal(progress.at(-1), 100);
});

test('koneksi putus di tengah: bagian yang sama dikirim ulang dari posisi server', async () => {
    const server = fakeServer({ failChunkCalls: [2] });

    await uploadInChunks(fileOf(CHUNK_BYTES * 2), { retryDelayMs: 0 });

    assert.deepEqual(server.offsets, [0, CHUNK_BYTES]);
    assert.equal(server.received, CHUNK_BYTES * 2);
});

test('melanjutkan unggahan lama tanpa membuat unggahan baru', async () => {
    const server = fakeServer({ startReceived: CHUNK_BYTES });

    const id = await uploadInChunks(fileOf(CHUNK_BYTES + 5), { uploadId: 'u1', retryDelayMs: 0 });

    assert.equal(id, 'u1');
    assert.equal(server.created, 0);
    assert.deepEqual(server.offsets, [CHUNK_BYTES]);
});

test('id lama yang sudah tidak ada diganti unggahan baru', async () => {
    const server = fakeServer();
    const ids: string[] = [];

    await uploadInChunks(fileOf(10), { uploadId: 'lama', onUploadId: (id) => ids.push(id), retryDelayMs: 0 });

    assert.equal(server.created, 1);
    assert.deepEqual(ids, ['u1']);
});

test('berhenti setelah 3 kali gagal berturut-turut', async () => {
    fakeServer({ failChunkCalls: [1, 2, 3] });

    await assert.rejects(uploadInChunks(fileOf(10), { retryDelayMs: 0 }), (error) => error instanceof ChunkUploadError && error.serverMessage === null);
});

test('pesan validasi server diteruskan tanpa mencoba ulang', async () => {
    globalThis.fetch = (async () => json({ errors: { sizeBytes: ['File melebihi 2 GB.'] } }, 422)) as typeof fetch;

    await assert.rejects(uploadInChunks(fileOf(10)), (error) => error instanceof ChunkUploadError && error.serverMessage === 'File melebihi 2 GB.');
});
