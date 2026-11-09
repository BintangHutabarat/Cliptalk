import type { Ref } from 'react';

import { copy } from '@/lib/copy';
import { formatTimecode } from '@/lib/time';
import { cn } from '@/lib/utils';

type TranscriptLineProps = {
    /** Waktu mulai kalimat (detik). */
    time: number;
    text: string;
    /** Kosong di MVP (belum ada diarization); disembunyikan bila tidak ada. */
    speaker?: string | null;
    /** Masuk rentang kandidat terpilih. */
    inRange?: boolean;
    /** Kalimat yang sedang diputar. */
    playing?: boolean;
    /** Keyakinan ASR rendah (avgLogprob kecil). */
    lowConfidence?: boolean;
    onSelect: () => void;
    ref?: Ref<HTMLButtonElement>;
};

export function TranscriptLine({ time, text, speaker, inRange = false, playing = false, lowConfidence = false, onSelect, ref }: TranscriptLineProps) {
    return (
        <button
            ref={ref}
            type="button"
            onClick={onSelect}
            aria-current={playing ? 'true' : undefined}
            className={cn(
                'grid w-full cursor-pointer grid-cols-[76px_1fr] gap-3 px-4 py-3 text-left transition-colors duration-150 sm:px-6',
                inRange ? 'bg-range-soft' : 'hover:bg-accent',
            )}
        >
            <span
                className={cn(
                    'font-mono text-[13px] leading-[22px] font-medium tabular-nums',
                    inRange ? 'text-range-ink' : 'text-muted-foreground',
                    // Segitiga kecil sebelum timecode untuk kalimat yang sedang diputar.
                    playing &&
                        "before:mr-1.5 before:inline-block before:border-y-4 before:border-l-[6px] before:border-y-transparent before:border-l-foreground before:align-[1px] before:content-['']",
                )}
            >
                {formatTimecode(time)}
            </span>
            <span className="min-w-0">
                {(speaker || lowConfidence) && (
                    <span className="flex gap-2 text-xs leading-4 text-muted-foreground">
                        {speaker && <span>{speaker}</span>}
                        {lowConfidence && <span className="text-warning">{copy.segments.lowConfidence}</span>}
                    </span>
                )}
                <span className="block text-sm leading-[22px] text-foreground">{text}</span>
            </span>
        </button>
    );
}
