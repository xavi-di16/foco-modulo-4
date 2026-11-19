import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'foco-theme';

export function getSystemTheme(): Theme {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getSavedTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
    } catch {
        // Fallback si localStorage está bloqueado o restringido
    }
    return getSystemTheme();
}

export function applyTheme(theme: Theme) {
    if (typeof document === 'undefined') return;
    document.documentElement.setAttribute('data-theme', theme);
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#11140d' : '#f5f6ef');
    }
}

const listeners = new Set<(theme: Theme) => void>();

export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        const initial = getSavedTheme();
        applyTheme(initial);
        return initial;
    });

    useEffect(() => {
        listeners.add(setTheme);
        return () => {
            listeners.delete(setTheme);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (event: MediaQueryListEvent) => {
            try {
                if (!localStorage.getItem(THEME_STORAGE_KEY)) {
                    const next = event.matches ? 'dark' : 'light';
                    applyTheme(next);
                    setTheme(next);
                    listeners.forEach(listener => listener(next));
                }
            } catch {
                // Ignore storage read error
            }
        };

        mediaQuery.addEventListener?.('change', handleChange);
        return () => mediaQuery.removeEventListener?.('change', handleChange);
    }, []);

    function toggleTheme() {
        const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
        try {
            localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        } catch {
            // Ignore storage write error
        }
        applyTheme(nextTheme);
        setTheme(nextTheme);
        listeners.forEach(listener => listener(nextTheme));
    }

    return { theme, toggleTheme };
}

