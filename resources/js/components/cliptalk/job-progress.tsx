import { Check, CircleX } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import type { JobStageItem } from '@/types/cliptalk';

type JobProgressProps = {
    percent: number;
    stages: JobStageItem[];
    /** Nama progres untuk screen reader. */
    label: string;
    className?: string;
};

function StageIcon({ state }: { state: JobStageItem['state'] }) {
    if (state === 'done') return <Check className="size-4 text-success" strokeWidth={1.75} />;
    if (state === 'error') return <CircleX className="size-4" strokeWidth={1.75} />;
    if (state === 'active') return <span className="size-3 animate-spin rounded-full border-2 border-border border-t-foreground" />;
    return <span className="size-1.5 rounded-full bg-input" />;
}

// Bar foreground, bukan kuning. Status selalu berupa teks, bukan warna saja (RULE.md §7).
export function JobProgress({ percent, stages, label, className }: JobProgressProps) {
    const value = Math.round(Math.min(Math.max(percent, 0), 100));

    return (
        <div className={cn('grid gap-4', className)}>
            <div className="grid gap-2">
                <div className="flex items-baseline justify-between gap-4 text-[13px] leading-5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-xs tabular-nums">{value}%</span>
                </div>
                <Progress value={value} aria-label={label} className="h-1" />
            </div>
            <ol className="grid divide-y">
                {stages.map((stage) => (
                    <li
                        key={stage.key}
                        className={cn(
                            'flex items-center gap-3 py-2',
                            stage.state === 'pending' && 'text-muted-foreground',
                            stage.state === 'done' && 'text-foreground',
                            stage.state === 'active' && 'font-medium text-foreground',
                            stage.state === 'error' && 'text-destructive',
                        )}
                    >
                        <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
                            <StageIcon state={stage.state} />
                        </span>
                        <span className="min-w-0 flex-1">
                            {stage.label}
                            <span className="sr-only">, {copy.processing.state[stage.state]}</span>
                        </span>
                        {stage.meta && <span className="font-mono text-xs font-normal tabular-nums">{stage.meta}</span>}
                    </li>
                ))}
            </ol>
        </div>
    );
}
