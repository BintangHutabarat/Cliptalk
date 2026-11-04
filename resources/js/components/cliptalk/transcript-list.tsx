import { useEffect, useRef } from 'react';

import { TranscriptLine } from '@/components/cliptalk/transcript-line';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { copy } from '@/lib/copy';
import { formatShort } from '@/lib/time';
import { cn } from '@/lib/utils';
import type { TranscriptSegment } from '@/types/cliptalk';

type TranscriptListProps = {
    segments: TranscriptSegment[];
    /** Durasi sumber (detik), untuk label total di header. */
    total: number;
    /** Segmen yang sedang diputar. */
    playingId?: number | null;
    /** Rentang kandidat terpilih; kalimat di dalamnya diberi range-soft. */
    range?: { start: number; end: number } | null;
    onSelect: (segment: TranscriptSegment) => void;
    className?: string;
};

// Di bawah ambang ini Faster-Whisper biasanya kurang yakin.
const LOW_CONFIDENCE_LOGPROB = -0.8;
// Setelah pengguna menggulir sendiri, auto-scroll berhenti sebentar.
const USER_SCROLL_PAUSE_MS = 3000;

export function TranscriptList({ segments, total, playingId, range, onSelect, className }: TranscriptListProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const lineRefs = useRef(new Map<number, HTMLButtonElement>());
    const userScrolledAt = useRef(0);

    useEffect(() => {
        const container = scrollRef.current;
        const line = playingId != null ? lineRefs.current.get(playingId) : undefined;
        if (!container || !line || Date.now() - userScrolledAt.current < USER_SCROLL_PAUSE_MS) return;

        // Gulir container saja (bukan halaman) dan taruh kalimat di tengah.
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        container.scrollTo({
            top: line.offsetTop - container.clientHeight / 2 + line.clientHeight / 2,
            behavior: reduceMotion ? 'auto' : 'smooth',
        });
    }, [playingId]);

    const markUserScroll = () => {
        userScrolledAt.current = Date.now();
    };

    return (
        <Card className={cn('flex min-h-0 flex-col', className)}>
            <CardHeader className="items-baseline">
                <CardTitle>{copy.segments.transcriptTitle}</CardTitle>
                <span className="text-[13px] text-muted-foreground">
                    <span className="font-mono text-xs tabular-nums">{formatShort(total)}</span> {copy.segments.transcriptTotal}
                </span>
            </CardHeader>
            <div
                ref={scrollRef}
                onWheel={markUserScroll}
                onTouchMove={markUserScroll}
                onPointerDown={(e) => e.target === e.currentTarget && markUserScroll()}
                className="relative max-h-[420px] min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain lg:max-h-[560px]"
            >
                {segments.map((segment) => (
                    <TranscriptLine
                        key={segment.id}
                        ref={(el) => {
                            if (el) lineRefs.current.set(segment.id, el);
                            else lineRefs.current.delete(segment.id);
                        }}
                        time={segment.start}
                        text={segment.text}
                        speaker={segment.speaker}
                        lowConfidence={segment.avgLogprob < LOW_CONFIDENCE_LOGPROB}
                        inRange={!!range && segment.start >= range.start && segment.end <= range.end}
                        playing={segment.id === playingId}
                        onSelect={() => onSelect(segment)}
                    />
                ))}
            </div>
        </Card>
    );
}
