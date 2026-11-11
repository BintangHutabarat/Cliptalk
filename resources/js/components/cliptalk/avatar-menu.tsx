import { Monitor, Moon, Sun } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { copy } from '@/lib/copy';
import type { Theme } from '@/lib/theme';

const options = [
    { value: 'light', label: copy.theme.light, Icon: Sun },
    { value: 'dark', label: copy.theme.dark, Icon: Moon },
    { value: 'system', label: copy.theme.system, Icon: Monitor },
] as const;

type AvatarMenuProps = { initials: string };

export function AvatarMenu({ initials }: AvatarMenuProps) {
    const [theme, setTheme] = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                aria-label={copy.theme.menu}
                className="grid size-8 cursor-pointer place-items-center rounded-full bg-muted text-xs font-medium text-foreground transition-colors duration-150 hover:bg-accent"
            >
                {initials}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{copy.theme.label}</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => setTheme(value as Theme)}>
                    {options.map(({ value, label, Icon }) => (
                        <DropdownMenuRadioItem key={value} value={value}>
                            <Icon strokeWidth={1.75} />
                            {label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
