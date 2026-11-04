import { useId, useRef, type KeyboardEvent } from 'react';

import { SegmentCandidate } from '@/components/cliptalk/segment-candidate';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/types/cliptalk';

type CandidateListProps = {
    candidates: Candidate[];
    /** Durasi video sumber (detik). */
    total: number;
    selectedId: string | null;
    onSelect: (candidate: Candidate) => void;
    className?: string;
};

const MOVES: Record<string, (index: number, length: number) => number> = {
    ArrowDown: (i, n) => (i + 1) % n,
    ArrowRight: (i, n) => (i + 1) % n,
    ArrowUp: (i, n) => (i - 1 + n) % n,
    ArrowLeft: (i, n) => (i - 1 + n) % n,
    Home: () => 0,
    End: (_, n) => n - 1,
};

export function CandidateList({ candidates, total, selectedId, onSelect, className }: CandidateListProps) {
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const titleId = useId();
    const sorted = [...candidates].sort((a, b) => b.score - a.score);
    // Tanpa pilihan, kandidat pertama tetap bisa difokus dengan Tab (pola radiogroup).
    const focusableId = selectedId ?? sorted[0]?.id;

    // Pola radio: panah memindahkan fokus sekaligus memilih.
    const onKeyDown = (index: number) => (event: KeyboardEvent<HTMLButtonElement>) => {
        const move = MOVES[event.key];
        if (!move) return;
        event.preventDefault();
        const next = move(index, sorted.length);
        onSelect(sorted[next]);
        refs.current[next]?.focus();
    };

    return (
        <Card className={cn(className)}>
            <CardHeader className="items-baseline">
                <CardTitle id={titleId}>{copy.segments.candidatesTitle}</CardTitle>
                <span className="text-[13px] text-muted-foreground">{copy.segments.candidatesCount(sorted.length)}</span>
            </CardHeader>
            <div role="radiogroup" aria-labelledby={titleId} className="divide-y">
                {sorted.map((candidate, index) => (
                    <SegmentCandidate
                        key={candidate.id}
                        ref={(el) => {
                            refs.current[index] = el;
                        }}
                        title={candidate.title}
                        start={candidate.start}
                        end={candidate.end}
                        total={total}
                        score={candidate.score}
                        selected={candidate.id === selectedId}
                        onSelect={() => onSelect(candidate)}
                        focusable={candidate.id === focusableId}
                        onKeyDown={onKeyDown(index)}
                    />
                ))}
            </div>
        </Card>
    );
}
