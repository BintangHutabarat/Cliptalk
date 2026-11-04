import type { ReactNode } from 'react';

import { AppHeader } from '@/components/cliptalk/app-header';
import type { Step } from '@/components/cliptalk/stepper';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Lebar kolom per halaman (DESIGN.md "Tata letak").
const widths = {
    upload: 'max-w-[640px]',
    segments: 'max-w-[1200px]',
    preview: 'max-w-[680px]',
    show: 'max-w-[720px]',
} as const;

type ClipFlowLayoutProps = {
    step: Step;
    width: keyof typeof widths;
    children: ReactNode;
};

// shortcut: inisial avatar masih statis karena belum ada auth, ambil dari user saat auth ditambahkan.
const INITIALS = 'NP';

export function ClipFlowLayout({ step, width, children }: ClipFlowLayoutProps) {
    return (
        <TooltipProvider>
            <div className="min-h-svh bg-background">
                <AppHeader current={step} initials={INITIALS} />
                <main className={cn('mx-auto w-full px-4 py-8 sm:px-6 sm:py-12', widths[width])}>{children}</main>
            </div>
            <Toaster />
        </TooltipProvider>
    );
}
