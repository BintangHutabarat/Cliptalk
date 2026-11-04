import { Head, Link, router } from '@inertiajs/react';
import { CircleX } from 'lucide-react';
import { useEffect } from 'react';

import { JobProgress } from '@/components/cliptalk/job-progress';
import { PageHeading } from '@/components/cliptalk/page-heading';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useJobPolling } from '@/hooks/use-job-polling';
import { ClipFlowLayout } from '@/layouts/clip-flow-layout';
import { copy } from '@/lib/copy';
import { routes } from '@/lib/routes';
import type { Project, ProjectStatus } from '@/types/cliptalk';

type ProcessingProps = {
    project: Project;
    status: ProjectStatus;
};

// Jeda singkat setelah "Siap dipilih" supaya pengguna sempat melihat semua tahap selesai.
const REDIRECT_DELAY_MS = 800;

export default function Processing({ project, status: initial }: ProcessingProps) {
    // shortcut: ?simulasi=gagal memaksa state gagal untuk pengujian fase 1; hapus saat polling sungguhan (TASK 6.6).
    const fail = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('simulasi') === 'gagal';
    const { status, retry } = useJobPolling(initial, { fail });

    useEffect(() => {
        if (status.stage !== 'ready') return;
        const id = window.setTimeout(() => router.visit(routes.projects.segments(project.id)), REDIRECT_DELAY_MS);
        return () => window.clearTimeout(id);
    }, [status.stage, project.id]);

    const failed = status.stage === 'failed';

    return (
        <ClipFlowLayout step={1} width="upload">
            <Head title={copy.processing.pageTitle} />
            <PageHeading title={copy.processing.title(project.fileName)} description={copy.processing.description} />

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>{copy.processing.cardTitle}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <JobProgress percent={status.percent} stages={status.stages} label={copy.processing.progressLabel} />
                    {failed && (
                        <Alert tone="error">
                            <CircleX strokeWidth={1.75} />
                            {status.error ?? copy.processing.failed}
                        </Alert>
                    )}
                </CardContent>
                {failed && (
                    <CardFooter>
                        <Button variant="ghost" asChild>
                            <Link href={routes.upload()}>{copy.actions.back}</Link>
                        </Button>
                        <Button onClick={retry}>{copy.actions.retry}</Button>
                    </CardFooter>
                )}
            </Card>
        </ClipFlowLayout>
    );
}
