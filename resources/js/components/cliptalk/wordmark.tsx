import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

type WordmarkProps = {
    /** Sembunyikan kata "ClipTalk" di layar sempit (tetap terbaca screen reader). */
    compact?: boolean;
    className?: string;
};

export function Wordmark({ compact = false, className }: WordmarkProps) {
    return (
        <span className={cn('inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-foreground', className)}>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="shrink-0">
                <rect x="6" y="6" width="8" height="8" rx="1" className="fill-range" />
                <path
                    d="M5 3H3v14h2M15 3h2v14h-2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <span className={cn(compact && '@max-[639px]:sr-only')}>{copy.app.name}</span>
        </span>
    );
}
