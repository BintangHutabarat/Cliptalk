import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import * as React from 'react';

import { cn } from '@/lib/utils';

// Dipakai sebagai SegmentedControl (DESIGN.md §6): latar muted, item aktif background + shadow-xs.
function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
    return (
        <ToggleGroupPrimitive.Root
            data-slot="toggle-group"
            className={cn('inline-flex w-fit max-w-full items-center gap-0.5 rounded-md bg-muted p-0.5', className)}
            {...props}
        />
    );
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
    return (
        <ToggleGroupPrimitive.Item
            data-slot="toggle-group-item"
            className={cn(
                'h-7 shrink-0 cursor-pointer rounded-sm px-3 text-[13px] leading-5 font-medium whitespace-nowrap text-muted-foreground transition-colors duration-150 hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
                'data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-[var(--shadow-xs),inset_0_0_0_1px_var(--color-border)]',
                className,
            )}
            {...props}
        />
    );
}

export { ToggleGroup, ToggleGroupItem };
