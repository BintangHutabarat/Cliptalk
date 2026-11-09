import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

import { useTheme } from '@/hooks/use-theme';

const iconProps = { className: 'size-4', strokeWidth: 1.75 };

const Toaster = (props: ToasterProps) => {
    const [theme] = useTheme();

    return (
        <Sonner
            theme={theme}
            className="toaster group"
            icons={{
                success: <CircleCheckIcon {...iconProps} />,
                info: <InfoIcon {...iconProps} />,
                warning: <TriangleAlertIcon {...iconProps} />,
                error: <OctagonXIcon {...iconProps} />,
                loading: <Loader2Icon {...iconProps} className="size-4 animate-spin" />,
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    '--border-radius': 'var(--radius-md)',
                } as CSSProperties
            }
            toastOptions={{ style: { boxShadow: 'var(--shadow-pop-value)' } }}
            {...props}
        />
    );
};

export { Toaster };
