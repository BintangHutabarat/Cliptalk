import { Head, Link, router } from '@inertiajs/react';
import { Info } from 'lucide-react';
import { useEffect, useState } from 'react';

import { CandidateList } from '@/components/cliptalk/candidate-list';
import { PageHeading } from '@/components/cliptalk/page-heading';
import { TranscriptList } from '@/components/cliptalk/transcript-list';
import { VideoPlayer } from '@/components/cliptalk/video-player';
import { Button } from '@/components/ui/button';
import { useVideoTime } from '@/hooks/use-video-time';
import { ClipFlowLayout } from '@/layouts/clip-flow-layout';
import { copy } from '@/lib/copy';
import { routes } from '@/lib/routes';
import type { Candidate, Project, TranscriptSegment } from '@/types/cliptalk';

type SegmentsProps = {
    project: Project;
    transcript: TranscriptSegment[];
    candidates: Candidate[];
};

export default function Segments({ project, transcript, candidates }: SegmentsProps) {
    const best = [...candidates].sort((a, b) => b.score - a.score)[0] ?? null;
    const [selectedId, setSelectedId] = useState<string | null>(best?.id ?? null);
    const [submitting, setSubmitting] = useState(false);
    const { playerRef, onTimeUpdate, seek, playingId } = useVideoTime(transcript);
    const selected = candidates.find((c) => c.id === selectedId) ?? null;

    // Kandidat pertama terpilih secara default, dan video langsung siap di awal rentangnya.
    useEffect(() => {
        if (best) seek(best.start);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya saat halaman dibuka
    }, []);

    const selectCandidate = (candidate: Candidate) => {
        setSelectedId(candidate.id);
        seek(candidate.start);
    };

    const createClip = () => {
        if (!selected) return;
        router.post(
            routes.clips.store(project.id),
            { candidateId: selected.id },
            { onStart: () => setSubmitting(true), onFinish: () => setSubmitting(false) },
        );
    };

    return (
        <ClipFlowLayout step={2} width="segments">
            <Head title={copy.segments.pageTitle} />
            <PageHeading title={copy.segments.title} description={copy.segments.description} />

            {/* ≤ 1024px satu kolom: video, kandidat, lalu transkrip (urutan DOM). */}
            <div className="mt-8 grid gap-6 min-[1025px]:grid-cols-12">
                <div className="grid min-w-0 content-start gap-6 min-[1025px]:col-span-7">
                    <VideoPlayer ref={playerRef} src={project.sourceUrl} duration={project.durationSec} range={selected} onTimeUpdate={onTimeUpdate} />
                    <CandidateList candidates={candidates} total={project.durationSec} selectedId={selectedId} onSelect={selectCandidate} />
                </div>
                <TranscriptList
                    // h-0 + min-h-full: tinggi card mengikuti kolom kiri, transkrip menggulir di dalamnya.
                    className="min-[1025px]:col-span-5 min-[1025px]:h-0 min-[1025px]:min-h-full"
                    scrollClassName="max-h-[420px] min-[1025px]:max-h-none"
                    segments={transcript}
                    total={project.durationSec}
                    playingId={playingId}
                    range={selected}
                    onSelect={(segment) => seek(segment.start)}
                />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                <p className="flex items-center gap-2 text-[13px] leading-5 text-muted-foreground">
                    <Info className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    {copy.segments.footnote}
                </p>
                <div className="ml-auto flex gap-2">
                    <Button variant="ghost" asChild>
                        <Link href={routes.upload()}>{copy.actions.back}</Link>
                    </Button>
                    <Button disabled={!selected || submitting} onClick={createClip}>
                        {copy.actions.createClip}
                    </Button>
                </div>
            </div>
        </ClipFlowLayout>
    );
}
