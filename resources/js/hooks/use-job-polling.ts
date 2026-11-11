
import { useEffect, useState } from 'react';

import { routes } from '@/lib/routes';
import type { ProjectStatus } from '@/types/cliptalk';

export function useJobPolling(
    initial: ProjectStatus,
    projectId: string,
) {
    const [status, setStatus] = useState(initial);

    useEffect(() => {
        // Polling hanya berhenti pada status terminal.
        if (
            status.stage === 'ready' ||
            status.stage === 'failed'
        ) {
            return;
        }

        let active = true;

        const poll = async () => {
            try {
                const response = await fetch(
                    routes.projects.status(projectId),
                    {
                        method: 'GET',
                        headers: {
                            Accept: 'application/json',
                        },
                        credentials: 'same-origin',
                    },
                );

                if (!response.ok) {
                    return;
                }

                const nextStatus =
                    (await response.json()) as ProjectStatus;

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
    }, [projectId, status.stage]);

    return { status };
}
