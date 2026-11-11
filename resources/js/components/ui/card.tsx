import * as React from 'react';

import { cn } from '@/lib/utils';

// Garis, bukan bayangan (RULE.md §3.4).
function Card({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card" className={cn('min-w-0 rounded-lg border bg-card text-card-foreground', className)} {...props} />;
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-header"
            className={cn('flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-6', className)}
            {...props}
        />
    );
}

function CardTitle({ className, ...props }: React.ComponentProps<'h2'>) {
    return <h2 data-slot="card-title" className={cn('text-base leading-6 font-semibold tracking-[-0.01em]', className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
    return <p data-slot="card-description" className={cn('text-[13px] leading-5 text-muted-foreground', className)} {...props} />;
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
    return <div data-slot="card-content" className={cn('p-4 sm:p-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="card-footer"
            className={cn('flex items-center justify-end gap-2 border-t px-4 py-4 sm:px-6', className)}
            {...props}
        />
    );
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
