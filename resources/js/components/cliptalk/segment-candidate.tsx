import type { KeyboardEvent, Ref } from 'react';

import { RangeBar } from '@/components/cliptalk/range-bar';
import { Badge } from '@/components/ui/badge';
import { copy } from '@/lib/copy';
import { formatDuration, formatRange } from '@/lib/time';
import { cn } from '@/lib/utils';

type SegmentCandidateProps = {
    title: string;
    start: number;
    end: number;
    /** Durasi video sumber (detik), untuk RangeBar compact. */
    total: number;
    score: number;
    selected: boolean;
    /** Bisa difokus dengan Tab walau belum terpilih (kandidat pertama saat belum ada pilihan). */
    focusable?: boolean;
    onSelect: () => void;
    onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
    ref?: Ref<HTMLButtonElement>;
};

// Badge kuning hanya untuk skor ≥ 90 (RULE.md §3.2).
const HIGH_SCORE = 90;

export function SegmentCandidate({ title, start, end, total, score, selected, focusable = false, onSelect, onKeyDown, ref }: SegmentCandidateProps) {
    return (
        <button
            ref={ref}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected || focusable ? 0 : -1}
            onClick={onSelect}
            onKeyDown={onKeyDown}
            className={cn(
                'grid w-full cursor-pointer grid-cols-[18px_1fr_auto] items-start gap-3 px-4 py-4 text-left transition-colors duration-150 sm:px-6',
                selected ? 'bg-range-soft' : 'hover:bg-accent',
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'mt-0.5 size-4 rounded-full',
                    selected ? 'shadow-[inset_0_0_0_5px_var(--foreground)]' : 'shadow-[inset_0_0_0_1px_var(--input)]',
                )}
            />
            <span className="grid min-w-0 gap-2">
                <span className="leading-5 font-medium">{title}</span>
                <span className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs leading-4 text-muted-foreground tabular-nums">
                    <span className={cn(selected && 'text-range-ink')}>{formatRange(start, end)}</span>
                    <span>{formatDuration(end - start, true)}</span>
                </span>
                <RangeBar total={total} start={start} end={end} compact />
            </span>
            <Badge tone={score >= HIGH_SCORE ? 'range' : 'outline'} mono>
                {copy.segments.score(score)}
            </Badge>
        </button>
    );
}
