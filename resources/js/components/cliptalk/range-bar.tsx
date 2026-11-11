import type { KeyboardEvent, MouseEvent } from 'react';

import { copy } from '@/lib/copy';
import { formatTimecode } from '@/lib/time';
import { cn } from '@/lib/utils';

type RangeBarProps = {
    /** Durasi video sumber (detik). */
    total: number;
    /** Rentang klip (detik). Tanpa keduanya, isian kuning tidak tampil. */
    start?: number;
    end?: number;
    /** Posisi putar (detik). */
    playhead?: number;
    /** Label waktu awal, tengah, dan akhir di bawah track. */
    ticks?: boolean;
    /** Versi 12px tanpa handle, untuk daftar kandidat. */
    compact?: boolean;
    /** Kalau diisi, track bisa diklik dan dipakai dengan keyboard untuk seek. */
    onSeek?: (sec: number) => void;
    className?: string;
};

const STEP_SEC = 5;
const PAGE_SEC = 30;

export function RangeBar({ total, start, end, playhead, ticks = false, compact = false, onSeek, className }: RangeBarProps) {
    const clamp = (sec: number) => Math.min(Math.max(sec, 0), total);
    const pct = (sec: number) => (total > 0 ? (clamp(sec) / total) * 100 : 0);
    const hasRange = start != null && end != null;
    const rangeLabel = hasRange ? copy.player.range(formatTimecode(start), formatTimecode(end)) : undefined;
    const now = playhead ?? 0;

    const seekFromPointer = (event: MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        onSeek?.(clamp(((event.clientX - rect.left) / rect.width) * total));
    };

    const seekFromKey = (event: KeyboardEvent<HTMLDivElement>) => {
        const next: Record<string, number> = {
            ArrowLeft: now - STEP_SEC,
            ArrowDown: now - STEP_SEC,
            ArrowRight: now + STEP_SEC,
            ArrowUp: now + STEP_SEC,
            PageDown: now - PAGE_SEC,
            PageUp: now + PAGE_SEC,
            Home: 0,
            End: total,
        };
        if (!(event.key in next)) return;
        event.preventDefault();
        onSeek?.(clamp(next[event.key]));
    };

    const a11y = onSeek
        ? {
              role: 'slider',
              tabIndex: 0,
              'aria-label': copy.player.seek,
              'aria-valuemin': 0,
              'aria-valuemax': Math.round(total),
              'aria-valuenow': Math.round(now),
              'aria-valuetext': formatTimecode(now),
              'aria-description': rangeLabel,
              onClick: seekFromPointer,
              onKeyDown: seekFromKey,
          }
        : compact
          ? { 'aria-hidden': true } // rentang sudah ditulis sebagai teks di kandidat
          : { role: 'img', 'aria-label': rangeLabel };

    return (
        <div className={cn('grid gap-1', className)}>
            <div {...a11y} className={cn('relative rounded-xs', compact ? 'h-3' : 'h-6', onSeek && 'cursor-pointer')}>
                <div className={cn('absolute inset-x-0 rounded-xs bg-muted', compact ? 'top-[5px] h-0.5' : 'top-2.5 h-1')} />
                {hasRange && (
                    <div
                        className={cn(
                            'absolute min-w-1 rounded-xs bg-range transition-[left,width] duration-200 ease-out',
                            compact
                                ? 'top-0.5 h-2'
                                : "top-1.5 h-3 shadow-[inset_0_0_0_1px_var(--range-ink)] before:absolute before:-top-[3px] before:-left-px before:h-[18px] before:w-[3px] before:rounded-[1px] before:bg-range-ink before:content-[''] after:absolute after:-top-[3px] after:-right-px after:h-[18px] after:w-[3px] after:rounded-[1px] after:bg-range-ink after:content-['']",
                        )}
                        style={{ left: `${pct(start)}%`, width: `${pct(end) - pct(start)}%` }}
                    />
                )}
                {playhead != null && (
                    <div
                        className={cn('absolute top-0 -ml-px w-0.5 bg-foreground', compact ? 'h-3' : 'h-6')}
                        style={{ left: `${pct(playhead)}%` }}
                    />
                )}
            </div>
            {ticks && (
                <div aria-hidden="true" className="flex justify-between font-mono text-[11px] leading-4 text-muted-foreground tabular-nums">
                    <span>{formatTimecode(0)}</span>
                    <span>{formatTimecode(total / 2)}</span>
                    <span>{formatTimecode(total)}</span>
                </div>
            )}
        </div>
    );
}
