import { cn } from '@/lib/utils';

export type SpecItem = {
    label: string;
    value: string;
    /** Nilai teknis (durasi, resolusi, codec, nama file) memakai mono. */
    mono?: boolean;
};

type SpecListProps = {
    items: SpecItem[];
    className?: string;
};

// Pemisah antar nilai dalam satu baris = dua spasi, bukan titik tengah.
export function SpecList({ items, className }: SpecListProps) {
    return (
        <dl className={cn('grid border-t', className)}>
            {items.map((item) => (
                <div key={item.label} className="flex justify-between gap-4 border-b py-2 text-[13px] leading-5">
                    <dt className="shrink-0 text-muted-foreground">{item.label}</dt>
                    <dd className={cn('min-w-0 text-right [overflow-wrap:anywhere] whitespace-pre-wrap', item.mono && 'font-mono text-xs leading-5 tabular-nums')}>
                        {item.value}
                    </dd>
                </div>
            ))}
        </dl>
    );
}
