/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { TranscriptWord } from '../types/cliptalk.ts';
import { captionAt, chunkWords } from './captions.ts';

const words = (text: string, start = 0, step = 0.5): TranscriptWord[] =>
    text.split(' ').map((t, i) => ({ start: start + i * step, end: start + i * step + 0.4, text: i ? ` ${t}` : t, probability: 0.9 }));

test('chunkWords: maks 32 karakter per baris dan 2 baris per potongan', () => {
    const chunks = chunkWords(words('Menurut saya perkembangan teknologi itu bukan cuma soal alat baru tapi soal cara kita bekerja setiap hari'));
    assert.ok(chunks.length > 1);
    for (const c of chunks) {
        assert.ok(c.lines.length <= 2);
        c.lines.forEach((l) => assert.ok(l.length <= 32, l));
    }
    assert.equal(chunks.flatMap((c) => c.lines).join(' '), 'Menurut saya perkembangan teknologi itu bukan cuma soal alat baru tapi soal cara kita bekerja setiap hari');
});

test('chunkWords: potongan diputus di akhir kalimat', () => {
    const chunks = chunkWords(words('Halo semua. Apa kabar?'));
    assert.deepEqual(
        chunks.map((c) => c.lines),
        [['Halo semua.'], ['Apa kabar?']],
    );
});

test('captionAt: tampil saat diucapkan, hilang setelah jeda panjang', () => {
    const chunks = chunkWords([...words('Halo semua.', 0), ...words('Apa kabar?', 10)]);
    assert.equal(captionAt(chunks, -1), null);
    assert.deepEqual(captionAt(chunks, 0.2), ['Halo semua.']);
    assert.deepEqual(captionAt(chunks, 1.2), ['Halo semua.']);
    assert.equal(captionAt(chunks, 5), null);
    assert.deepEqual(captionAt(chunks, 10.1), ['Apa kabar?']);
});
