import { useCallback, useEffect, useState } from 'react';

import { copy } from '@/lib/copy';
import type { JobStageItem, ProjectStatus } from '@/types/cliptalk';

const TICK_MS = 1500;
const STAGE_ORDER = ['uploaded', 'transcribing', 'extracting', 'ready'] as const;

// Urutan status yang dilewati simulasi: [tahap aktif, persen keseluruhan, persen tahap aktif].
const STEPS: [ProjectStatus['stage'], number, string?][] = [
    ['transcribing', 35, '35%'],
    ['transcribing', 60, '60%'],
    ['transcribing', 85, '85%'],
    ['extracting', 92],
    ['ready', 100],
];

function statusAt(base: JobStageItem[], index: number): ProjectStatus {
    const [stage, percent, meta] = STEPS[index];
    const activeIndex = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);

    return {
        stage,
        percent,
        error: null,
        stages: base.map((item, i) => {
            if (stage === 'ready' || i < activeIndex) return { ...item, state: 'done', meta: item.key === 'uploaded' ? item.meta : undefined };
            if (i === activeIndex) return { ...item, state: 'active', meta };
            return { ...item, state: 'pending', meta: undefined };
        }),
    };
}

function failedFrom(status: ProjectStatus): ProjectStatus {
    return {
        ...status,
        stage: 'failed',
        error: copy.processing.failed,
        stages: status.stages.map((item) => (item.state === 'active' ? { ...item, state: 'error', meta: undefined } : item)),
    };
}

/**
 * Status job yang maju tiap 1,5 detik (SYSTEM-DESIGN.md §8).
 * shortcut: simulasi fase 1; ganti dengan polling GET /api/projects/{id}/status tiap 2 detik di TASK 6.6.
 * `fail` membuat percobaan pertama gagal di tengah transkripsi; "Coba lagi" lalu berhasil.
 */
export function useJobPolling(initial: ProjectStatus, { fail = false }: { fail?: boolean } = {}) {
    const [index, setIndex] = useState(0);
    const [failed, setFailed] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (failed || index >= STEPS.length - 1) return;
        const id = window.setTimeout(() => {
            if (fail && attempt === 0 && index === 1) setFailed(true);
            else setIndex((i) => i + 1);
        }, TICK_MS);
        return () => window.clearTimeout(id);
    }, [index, failed, fail, attempt]);

    const retry = useCallback(() => {
        setFailed(false);
        setIndex(0);
        setAttempt((a) => a + 1);
    }, []);

    const current = statusAt(initial.stages, index);
    return { status: failed ? failedFrom(current) : current, retry };
}
