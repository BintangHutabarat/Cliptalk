import { Link } from '@inertiajs/react';

import { AvatarMenu } from '@/components/cliptalk/avatar-menu';
import { Stepper, type Step } from '@/components/cliptalk/stepper';
import { Wordmark } from '@/components/cliptalk/wordmark';
import { copy } from '@/lib/copy';

type AppHeaderProps = {
    current?: Step;
    initials: string;
};

// Satu-satunya navigasi global (RULE.md §3.7): wordmark, Stepper, avatar. Tanpa sidebar.
export function AppHeader({ current, initials }: AppHeaderProps) {
    return (
        <header className="@container flex h-14 items-center justify-between gap-2 border-b bg-background px-4 @min-[640px]:gap-4 @min-[640px]:px-6">
            <Link href="/" aria-label={copy.app.home} className="shrink-0 rounded-sm">
                <Wordmark compact />
            </Link>
            <Stepper current={current} className="min-w-0" />
            <AvatarMenu initials={initials} />
        </header>
    );
}
