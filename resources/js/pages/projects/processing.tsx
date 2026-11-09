
import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';
import { CircleX } from 'lucide-react';

import { JobProgress } from '@/components/cliptalk/job-progress';
import { PageHeading } from '@/components/cliptalk/page-heading';
import { Alert } from '@/components/ui/alert';
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

export default function Processing({
    project,
    status: initial,
}: ProcessingProps) {
    const { status } = useJobPolling(initial, project.id);
    const failed = status.stage === 'failed';

    useEffect(() => {
        if (status.stage === 'ready') {
            router.visit(
                `/projects/${encodeURIComponent(project.id)}/segments`,
                { replace: true },
            );
        }
    }, [status.stage, project.id]);

    return (
        <ClipFlowLayout step={1} width="upload">
            <Head title={copy.processing.pageTitle} />

            <PageHeading
                title={copy.processing.title(project.fileName)}
                description={copy.processing.description}
            />

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>{copy.processing.cardTitle}</CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4">
                    <JobProgress
                        percent={status.percent}
                        stages={status.stages}
                        label={copy.processing.progressLabel}
                    />

                    {failed && (
                        <Alert tone="error">
                            <CircleX strokeWidth={1.75} />
                            {status.error ?? copy.processing.failed}
                        </Alert>
                    )}

                    {status.stage === 'extracting' && (
                        <Alert>
                            Transkripsi selesai. Integrasi pencarian
                            kandidat klip belum tersedia. Proses belum
                            dapat dilanjutkan secara otomatis.
                        </Alert>
                    )}

                    {status.stage === 'ready' && (
                        <Alert>
                            Pemrosesan selesai, tetapi halaman kandidat
                            klip proyek nyata belum terintegrasi.
                        </Alert>
                    )}
                </CardContent>

                {failed && (
                    <CardFooter>
                        <Link
                            href={routes.upload()}
                            className="text-sm underline underline-offset-4"
                        >
                            {copy.actions.back}
                        </Link>
                    </CardFooter>
                )}
            </Card>
        </ClipFlowLayout>
    );
}
