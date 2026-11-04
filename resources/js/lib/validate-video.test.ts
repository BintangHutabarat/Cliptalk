/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateVideoFile } from './validate-video.ts';

const limits = { maxBytes: 2 * 1024 ** 3, mimeTypes: ['video/mp4', 'video/quicktime', 'video/webm'] };

test('validateVideoFile', () => {
    assert.equal(validateVideoFile({ name: 'a.mp4', type: 'video/mp4', size: 1000 }, limits), null);
    assert.equal(validateVideoFile({ name: 'a.mov', type: '', size: 1000 }, limits), null);
    assert.equal(validateVideoFile({ name: 'a.mkv', type: 'video/x-matroska', size: 1000 }, limits), 'type');
    assert.equal(validateVideoFile({ name: 'a.mp4', type: 'video/mp4', size: limits.maxBytes + 1 }, limits), 'size');
    assert.equal(validateVideoFile({ name: 'a.mp4', type: 'video/mp4', size: limits.maxBytes }, limits), null);
});
