import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PageHeadingProps = {
    title: string;
    description?: string;
    /** Elemen di atas judul, misalnya Badge status. */
    eyebrow?: ReactNode;
    className?: string;
};

// Satu `display` per layar; di mobile turun ke ukuran `title` (DESIGN.md §3).
export function PageHeading({ title, description, eyebrow, className }: PageHeadingProps) {
    return (
        <div className={cn('grid gap-2', className)}>
            {eyebrow}
            <h1 className="text-2xl font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-4xl">{title}</h1>
            {description && <p className="text-[13px] leading-5 text-muted-foreground">{description}</p>}
        </div>
    );
}
