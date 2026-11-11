import { useEffect, useState } from 'react';

const TERMINAL_STAGES: readonly string[] = ['ready', 'failed'];

/**
 * Memantau status job (ProjectStatus atau ClipStatus) tiap 2 detik selama stage-nya belum diam.
 * `idleStages` harus stabil antar-render (konstanta modul).
 */
export function useJobPolling<T extends { stage: string }>(initial: T, url: string, idleStages: readonly string[] = TERMINAL_STAGES) {
    const [status, setStatus] = useState(initial);

    // Props dari server berganti stage (mis. draft ke queued setelah minta render): ikuti saat render, bukan di effect.
    const [seenStage, setSeenStage] = useState(initial.stage);
    if (seenStage !== initial.stage) {
        setSeenStage(initial.stage);
        setStatus(initial);
    }

    const idle = idleStages.includes(status.stage);

    useEffect(() => {
        if (idle) {
            return;
        }

        let active = true;

        const poll = async () => {
            try {
                const response = await fetch(url, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });

                if (!response.ok) {
                    return;
                }

                const nextStatus = (await response.json()) as T;

                if (active) {
                    setStatus(nextStatus);
                }
            } catch {
                // Gangguan jaringan sementara akan dicoba kembali.
            }
        };

        void poll();

        const interval = window.setInterval(() => {
            void poll();
        }, 2000);

        return () => {
            active = false;
            window.clearInterval(interval);
        };
    }, [url, idle]);

    return { status };
}
