/// <reference types="node" />
// Memastikan mock konsisten: segmen urut, kata di dalam segmennya, dan kandidat benar-benar mencakup segmen transkrip.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import type { Candidate, Clip, Project, TranscriptSegment } from '../types/cliptalk.ts';

const load = <T>(name: string): T => JSON.parse(readFileSync(new URL(`../../mocks/${name}.json`, import.meta.url), 'utf8')) as T;

const project = load<Project>('project');
const transcript = load<TranscriptSegment[]>('transcript');
const candidates = load<Candidate[]>('candidates');
const clip = load<Clip>('clip');

test('transkrip: ≥ 40 segmen, urut, tidak tumpang-tindih, 00:00:00–00:38:20', () => {
    assert.ok(transcript.length >= 40);
    assert.equal(transcript[0].start, 0);
    assert.equal(transcript.at(-1)?.end, project.durationSec);
    transcript.forEach((s, i) => {
        assert.ok(s.start < s.end, `segmen ${s.id}`);
        if (i > 0) assert.ok(transcript[i - 1].end <= s.start, `segmen ${s.id} tumpang-tindih`);
    });
    assert.equal(new Set(transcript.map((s) => s.id)).size, transcript.length);
});

test('transkrip: word timestamps di dalam segmen dan menyusun teksnya', () => {
    for (const s of transcript) {
        assert.ok(s.words.length > 0);
        assert.equal(s.words.map((w) => w.text).join(''), s.text);
        s.words.forEach((w, i) => {
            assert.ok(w.start >= s.start && w.end <= s.end && w.start < w.end, `kata ${i} di segmen ${s.id}`);
            if (i > 0) assert.ok(s.words[i - 1].end <= w.start);
            assert.ok(w.probability > 0 && w.probability <= 1);
        });
        assert.ok(s.avgLogprob < 0);
    }
});

test('kandidat: 98/89/85, judul ≤ 60, segmentIds sama persis dengan segmen di rentangnya', () => {
    assert.deepEqual(
        candidates.map((c) => c.score),
        [98, 89, 85],
    );
    for (const c of candidates) {
        assert.ok(c.title.length <= 60);
        assert.equal(c.projectId, project.id);
        const inside = transcript.filter((s) => s.start >= c.start && s.end <= c.end).map((s) => s.id);
        assert.deepEqual(c.segmentIds, inside);
        assert.equal(transcript.find((s) => s.id === inside[0])?.start, c.start);
        assert.equal(transcript.find((s) => s.id === inside.at(-1))?.end, c.end);
    }
});

test('klip: mengikuti kandidat pertama dan memenuhi validasi rentang', () => {
    const c = candidates.find((x) => x.id === clip.candidateId);
    assert.ok(c);
    assert.equal(clip.start, c.start);
    assert.equal(clip.end, c.end);
    assert.ok(clip.start >= 0 && clip.end <= project.durationSec);
    assert.ok(clip.end - clip.start >= 5 && clip.end - clip.start <= 180);
});
