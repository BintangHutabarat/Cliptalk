import { Pause, Play } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';

import { captionAt, chunkWords } from '@/lib/captions';
import { copy } from '@/lib/copy';
import { formatShort } from '@/lib/time';
import { cn } from '@/lib/utils';
import type { CaptionStyle, TranscriptWord } from '@/types/cliptalk';

type ClipFrameProps = {
    /** Kata-kata di dalam rentang klip, dengan waktu absolut terhadap video sumber. */
    words: TranscriptWord[];
    start: number;
    end: number;
    /** Waktu putar saat ini (detik, absolut). */
    time: number;
    showCaptions: boolean;
    captionStyle: CaptionStyle;
    playing?: boolean;
    onPlayToggle?: () => void;
    /** Slot media, misalnya <video> hasil render. Tanpa media, latar stage polos. */
    children?: ReactNode;
    className?: string;
};

// Gaya harus sama dengan ASS yang dibakar FFmpeg (ClipRenderService::buildAss): Geist 700, 72 pada kanvas 1920×1080.
const captionStyles: Record<CaptionStyle, string> = {
    outline: '[-webkit-text-stroke:0.5cqw_var(--caption-edge)] [paint-order:stroke_fill]',
    plate: 'rounded-sm bg-caption-plate px-[0.45em] py-[0.3em] leading-[1.55] box-decoration-clone',
};

export function ClipFrame({ words, start, end, time, showCaptions, captionStyle, playing = false, onPlayToggle, children, className }: ClipFrameProps) {
    const chunks = useMemo(() => chunkWords(words), [words]);
    const lines = showCaptions ? captionAt(chunks, time) : null;
    const length = Math.max(end - start, 0);
    const elapsed = Math.min(Math.max(time - start, 0), length);

    return (
        <div
            className={cn(
                '@container relative aspect-video w-full max-w-[480px] overflow-hidden rounded-frame bg-stage text-stage-foreground',
                className,
            )}
        >
            {children && <div className="absolute inset-0 [&>video]:size-full [&>video]:object-contain">{children}</div>}

            {lines && (
                <p
                    aria-live="off"
                    className="absolute inset-x-[8%] bottom-[14%] text-center text-[3.75cqw] leading-[1.2] font-bold text-caption-ink"
                >
                    <span className={captionStyles[captionStyle]}>
                        {lines.map((line, i) => (
                            <span key={i}>
                                {i > 0 && <br />}
                                {line}
                            </span>
                        ))}
                    </span>
                </p>
            )}

            {onPlayToggle && (
                <button
                    type="button"
                    onClick={onPlayToggle}
                    aria-label={playing ? copy.player.pause : copy.player.play}
                    className={cn(
                        'absolute top-[42%] left-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-stage-foreground/15 text-stage-foreground transition-opacity duration-150',
                        playing && 'opacity-0 hover:opacity-100 focus-visible:opacity-100',
                    )}
                >
                    {playing ? <Pause className="size-5" strokeWidth={1.75} /> : <Play className="size-5" strokeWidth={1.75} />}
                </button>
            )}

            <div className="absolute inset-x-[6%] bottom-[5%] grid gap-1.5">
                <div className="h-[3px] overflow-hidden rounded-xs bg-stage-foreground/25">
                    <div className="h-full bg-stage-foreground" style={{ width: `${length ? (elapsed / length) * 100 : 0}%` }} />
                </div>
                <div className="flex justify-between font-mono text-[4cqw] text-stage-muted tabular-nums">
                    <span>{formatShort(elapsed)}</span>
                    <span>{formatShort(length)}</span>
                </div>
            </div>
        </div>
    );
}
