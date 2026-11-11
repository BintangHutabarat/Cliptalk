import { createInertiaApp } from '@inertiajs/react';
import type { ComponentType } from 'react';
import { createRoot } from 'react-dom/client';

import { initTheme } from '@/lib/theme';

const pages = import.meta.glob<{ default: ComponentType }>('./pages/**/*.tsx');

createInertiaApp({
    title: (title) => (title ? `${title} - ClipTalk` : 'ClipTalk'),
    resolve: async (name) => (await pages[`./pages/${name}.tsx`]()).default,
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
    progress: { color: 'var(--foreground)' },
});

initTheme();
