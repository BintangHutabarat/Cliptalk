/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { clipFileName, slugify } from './slug.ts';

test('slugify', () => {
    assert.equal(slugify('Bagaimana teknologi mengubah cara kerja'), 'bagaimana-teknologi-mengubah-cara-kerja');
    assert.equal(slugify('Kreativitas vs otomatisasi: alat digital!'), 'kreativitas-vs-otomatisasi-alat-digital');
    assert.equal(slugify('  Hook 3 detik — pertama  '), 'hook-3-detik-pertama');
    assert.equal(slugify('Café résumé'), 'cafe-resume');
});

test('clipFileName', () => {
    assert.equal(clipFileName('Pentingnya hook 3 detik pertama video'), 'cliptalk_pentingnya-hook-3-detik-pertama-video.mp4');
    assert.equal(clipFileName('!!!'), 'cliptalk_klip.mp4');
    assert.equal(clipFileName('Halo', 'srt'), 'cliptalk_halo.srt');
});
