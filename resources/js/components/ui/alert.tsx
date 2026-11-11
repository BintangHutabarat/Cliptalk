import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Dipakai sebagai Notice (DESIGN.md §6): info / warning / error.
const alertVariants = cva(
    'flex w-full items-start gap-3 rounded-md px-4 py-3 text-[13px] leading-5 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
    {
        variants: {
            tone: {
                info: 'bg-muted text-foreground',
                warning: 'bg-warning-soft text-warning',
                error: 'bg-destructive-soft text-destructive',
            },
        },
        defaultVariants: {
            tone: 'info',
        },
    },
);

function Alert({ className, tone, ...props }: React.ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
    return (
        <div
            data-slot="alert"
            role={tone === 'error' ? 'alert' : 'status'}
            className={cn(alertVariants({ tone }), className)}
            {...props}
        />
    );
}

export { Alert };
