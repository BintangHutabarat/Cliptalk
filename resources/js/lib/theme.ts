export type Theme = 'light' | 'dark' | 'system';

const KEY = 'theme';
const EVENT = 'themechange';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function getTheme(): Theme {
    try {
        const value = localStorage.getItem(KEY);
        return value === 'light' || value === 'dark' ? value : 'system';
    } catch {
        return 'system';
    }
}

function apply(theme: Theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && media().matches));
}

export function setTheme(theme: Theme) {
    try {
        if (theme === 'system') localStorage.removeItem(KEY);
        else localStorage.setItem(KEY, theme);
    } catch {
        // localStorage bisa diblokir; tema tetap berlaku untuk sesi ini.
    }
    apply(theme);
    window.dispatchEvent(new Event(EVENT));
}

export function subscribeTheme(callback: () => void) {
    window.addEventListener(EVENT, callback);
    return () => window.removeEventListener(EVENT, callback);
}

/** Ikuti perubahan tema sistem selama pengguna memilih "Sistem". */
export function initTheme() {
    media().addEventListener('change', () => {
        if (getTheme() === 'system') apply('system');
    });
}
