import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex h-[22px] w-fit shrink-0 items-center gap-1 rounded-sm px-2 text-xs leading-4 font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3',
    {
        variants: {
            tone: {
                neutral: 'bg-muted text-foreground',
                outline: 'bg-transparent text-foreground shadow-[inset_0_0_0_1px_var(--color-border)]',
                // Hanya skor kandidat ≥ 90 atau penanda "Terpilih" (RULE.md §3.2).
                range: 'bg-range text-range-foreground',
                success: 'bg-success-soft text-success',
                warning: 'bg-warning-soft text-warning',
                destructive: 'bg-destructive-soft text-destructive',
            },
            mono: {
                true: 'font-mono tabular-nums',
                false: '',
            },
        },
        defaultVariants: {
            tone: 'neutral',
            mono: false,
        },
    },
);

function Badge({
    className,
    tone,
    mono,
    asChild = false,
    ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Comp = asChild ? Slot.Root : 'span';

    return <Comp data-slot="badge" data-tone={tone} className={cn(badgeVariants({ tone, mono }), className)} {...props} />;
}

export { Badge, badgeVariants };
