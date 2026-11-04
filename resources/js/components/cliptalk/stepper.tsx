import { Check } from 'lucide-react';

import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export type Step = 1 | 2 | 3 | 4;

type StepperProps = {
    current: Step;
    className?: string;
};

export function Stepper({ current, className }: StepperProps) {
    return (
        <ol aria-label={copy.steps.label} className={cn('flex items-center gap-1.5 text-[13px] leading-5 @min-[640px]:gap-2', className)}>
            {copy.steps.items.map((label, index) => {
                const n = index + 1;
                const done = n < current;
                const active = n === current;

                return (
                    <li
                        key={label}
                        aria-current={active ? 'step' : undefined}
                        className={cn(
                            'flex items-center gap-1.5 whitespace-nowrap @min-[640px]:gap-2',
                            active ? 'font-medium text-foreground' : 'text-muted-foreground',
                        )}
                    >
                        {index > 0 && <span aria-hidden="true" className="h-px w-2 shrink-0 bg-border @min-[640px]:w-4" />}
                        <span
                            aria-hidden="true"
                            className={cn(
                                'grid size-5 shrink-0 place-items-center rounded-sm font-mono text-[11px] tabular-nums',
                                active && 'bg-range text-range-foreground',
                                done && 'bg-muted text-foreground',
                                !active && !done && 'shadow-[inset_0_0_0_1px_var(--border)]',
                            )}
                        >
                            {done ? <Check className="size-3" strokeWidth={1.75} /> : n}
                        </span>
                        {/* Di bawah 720px hanya label langkah aktif yang tampil. */}
                        <span className={cn(!active && '@max-[719px]:sr-only')}>
                            {label}
                            {done && <span className="sr-only"> ({copy.steps.done})</span>}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}
