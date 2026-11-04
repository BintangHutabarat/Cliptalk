/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatBytes, formatDuration, formatRange, formatShort, formatTimecode, parseTimecode } from './time.ts';

test('formatTimecode', () => {
    assert.equal(formatTimecode(0), '00:00:00');
    assert.equal(formatTimecode(134), '00:02:14');
    assert.equal(formatTimecode(134.9), '00:02:14');
    assert.equal(formatTimecode(2300), '00:38:20');
    assert.equal(formatTimecode(3725), '01:02:05');
    assert.equal(formatTimecode(-5), '00:00:00');
});

test('formatRange memakai en dash dengan spasi', () => {
    assert.equal(formatRange(134, 178), '00:02:14 – 00:02:58');
});

test('formatShort', () => {
    assert.equal(formatShort(134), '02:14');
    assert.equal(formatShort(2300), '38:20');
});

test('parseTimecode kebalikan formatTimecode', () => {
    assert.equal(parseTimecode('00:02:14'), 134);
    assert.equal(parseTimecode('02:14'), 134);
    assert.equal(parseTimecode('00:00:01.5'), 1.5);
    assert.equal(parseTimecode(formatTimecode(2300)), 2300);
    assert.ok(Number.isNaN(parseTimecode('2:x')));
    assert.ok(Number.isNaN(parseTimecode('134')));
});

test('formatDuration', () => {
    assert.equal(formatDuration(44), '44 detik');
    assert.equal(formatDuration(44, true), '44 dtk');
    assert.equal(formatDuration(125), '2 menit 5 detik');
    assert.equal(formatDuration(120, true), '2 mnt');
});

test('formatBytes', () => {
    assert.equal(formatBytes(358612992), '342 MB');
    assert.equal(formatBytes(2 * 1024 ** 3), '2 GB');
    assert.equal(formatBytes(1.5 * 1024 ** 3), '1,5 GB');
    assert.equal(formatBytes(512), '512 B');
});
