import { Head, Link } from '@inertiajs/react';
import { Check, Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

import { ClipFrame } from '@/components/cliptalk/clip-frame';
import { PageHeading } from '@/components/cliptalk/page-heading';
import { SpecList } from '@/components/cliptalk/spec-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ClipFlowLayout } from '@/layouts/clip-flow-layout';
import { copy } from '@/lib/copy';
import { routes } from '@/lib/routes';
import { clipFileName } from '@/lib/slug';
import { formatBytes, formatDuration } from '@/lib/time';
import type { Clip, Project } from '@/types/cliptalk';

type ShowProps = {
    project: Project;
    clip: Clip;
};

const icon = { strokeWidth: 1.75 };

function DownloadButton({ href, fileName, variant, children }: { href?: string | null; fileName: string; variant: 'default' | 'outline'; children: ReactNode }) {
    // File baru ada setelah RenderClip berjalan di server (fase 2); di fase 1 beri tahu, jangan pura-pura mengunduh.
    if (!href) {
        return (
            <Button variant={variant} onClick={() => toast.info(copy.show.downloadUnavailable)}>
                {children}
            </Button>
        );
    }
    return (
        <Button variant={variant} asChild>
            <a href={href} download={fileName}>
                {children}
            </a>
        </Button>
    );
}

export default function Show({ project, clip }: ShowProps) {
    const fileName = clipFileName(clip.title);
    const duration = clip.end - clip.start;

    return (
        <ClipFlowLayout step={4} width="show">
            <Head title={copy.show.pageTitle} />
            <PageHeading
                title={copy.show.title}
                eyebrow={
                    <Badge tone="success">
                        <Check {...icon} />
                        {copy.show.badge}
                    </Badge>
                }
            />

            <Card className="mt-8">
                <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-start">
                    <ClipFrame
                        className="max-w-[200px] shrink-0"
                        words={[]}
                        start={clip.start}
                        end={clip.end}
                        time={clip.start}
                        showCaptions={false}
                        captionStyle={clip.captionStyle}
                    >
                        {clip.outputUrl && <video src={clip.outputUrl} controls playsInline aria-label={clip.title} />}
                    </ClipFrame>
                    <div className="grid min-w-0 flex-1 gap-3">
                        <p className="leading-5 font-medium [overflow-wrap:anywhere]">{clip.title}</p>
                        <SpecList
                            items={[
                                { label: copy.spec.fileName, value: fileName, mono: true },
                                { label: copy.spec.duration, value: formatDuration(duration) },
                                ...(clip.outputSizeBytes ? [{ label: copy.spec.size, value: formatBytes(clip.outputSizeBytes), mono: true }] : []),
                                { label: copy.spec.ratio, value: copy.spec.ratioValue, mono: true },
                                { label: copy.spec.format, value: copy.spec.formatValue, mono: true },
                                {
                                    label: copy.spec.captions,
                                    value: clip.showCaptions ? copy.spec.captionsOn(copy.preview.styles[clip.captionStyle]) : copy.spec.captionsOff,
                                },
                                { label: copy.spec.source, value: project.fileName, mono: true },
                            ]}
                        />
                    </div>
                </CardContent>
            </Card>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                <Button variant="ghost" asChild className="mr-auto">
                    <Link href={routes.upload()}>{copy.actions.createAnother}</Link>
                </Button>
                <DownloadButton href={clip.srtUrl} fileName={clipFileName(clip.title, 'srt')} variant="outline">
                    {copy.actions.downloadSrt}
                </DownloadButton>
                <DownloadButton href={clip.outputUrl} fileName={fileName} variant="default">
                    <Download {...icon} />
                    {copy.actions.downloadVideo}
                </DownloadButton>
            </div>

            <p className="mt-6 text-[13px] leading-5 text-muted-foreground">{copy.show.expiry}</p>
        </ClipFlowLayout>
    );
}
