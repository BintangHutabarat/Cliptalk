import { useCallback, useEffect, useRef, useState } from 'react';

const TICK_MS = 100;

/**
 * Progres 0–100 dalam `durationMs`, lalu memanggil `onDone(reset)`.
 * shortcut: simulasi fase 1 untuk unggah dan render; ganti dengan progres upload chunk dan polling ClipStatus di fase 2.
 */
export function useSimulatedProgress(durationMs: number, onDone: (reset: () => void) => void) {
    const [progress, setProgress] = useState<number | null>(null);
    const onDoneRef = useRef(onDone);

    useEffect(() => {
        onDoneRef.current = onDone;
    });

    const start = useCallback(() => setProgress(0), []);
    const reset = useCallback(() => setProgress(null), []);

    useEffect(() => {
        if (progress === null) return;
        if (progress >= 100) {
            onDoneRef.current(reset);
            return;
        }
        const id = window.setTimeout(() => setProgress((p) => Math.min(100, (p ?? 0) + (100 * TICK_MS) / durationMs)), TICK_MS);
        return () => window.clearTimeout(id);
    }, [progress, durationMs, reset]);

    return { progress, running: progress !== null, start, reset };
}
