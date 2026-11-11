import { useId, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

type SettingRowProps = {
    title: string;
    description?: string;
    /** Kontrol di kanan. Nilai yang belum bisa diubah cukup ditulis sebagai teks, bukan kontrol nonaktif. */
    children: ReactNode;
    className?: string;
};

/**
 * Satu baris pengaturan ala buku besar. Bungkus beberapa baris dalam satu panel bergaris:
 * `<div className="divide-y rounded-lg border bg-card">…</div>`.
 */
export function SettingRow({ title, description, children, className }: SettingRowProps) {
    const titleId = useId();

    return (
        <div className={cn('flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6', className)}>
            <div className="grid min-w-0 flex-[1_1_220px]">
                <span id={titleId} className="leading-5 font-medium">
                    {title}
                </span>
                {description && <span className="text-[13px] leading-5 text-muted-foreground">{description}</span>}
            </div>
            <div role="group" aria-labelledby={titleId} className="min-w-0 text-[13px] text-muted-foreground">
                {children}
            </div>
        </div>
    );
}
