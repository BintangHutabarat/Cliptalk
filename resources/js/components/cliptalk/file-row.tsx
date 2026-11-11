import { Film } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { formatBytes, formatShort, formatTimecode } from '@/lib/time';
import { cn } from '@/lib/utils';

type FileRowProps = {
    name: string;
    sizeBytes: number;
    /** Durasi dalam detik; belum diketahui sebelum metadata video terbaca. */
    durationSec?: number | null;
    /** Elemen status, misalnya Badge. */
    status?: ReactNode;
    onRemove?: () => void;
    className?: string;
};

export function FileRow({ name, sizeBytes, durationSec, status, onRemove, className }: FileRowProps) {
    return (
        <div className={cn('flex min-w-0 items-center gap-3 rounded-lg border bg-card px-4 py-3', className)}>
            <Film className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.75} aria-hidden="true" />
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="min-w-0 flex-1 basis-40 truncate font-medium" title={name}>
                    {name}
                </span>
                <span className="flex gap-3 font-mono text-xs text-muted-foreground tabular-nums">
                    {durationSec != null && <span>{durationSec >= 3600 ? formatTimecode(durationSec) : formatShort(durationSec)}</span>}
                    <span>{formatBytes(sizeBytes)}</span>
                </span>
            </div>
            {status}
            {onRemove && (
                <Button type="button" variant="destructive" size="sm" onClick={onRemove} aria-label={copy.upload.removeFile(name)}>
                    {copy.actions.remove}
                </Button>
            )}
        </div>
    );
}
