import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle({ className = '' }: { className?: string }) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';
    const nextThemeLabel = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

    return (
        <button
            type="button"
            className={`icon-button theme-toggle ${className}`.trim()}
            onClick={toggleTheme}
            aria-label={nextThemeLabel}
            aria-pressed={isDark}
            title={nextThemeLabel}
        >
            {isDark ? (
                <Sun size={19} aria-hidden="true" />
            ) : (
                <Moon size={19} aria-hidden="true" />
            )}
            <span className="sr-only">
                {isDark ? 'Modo oscuro activo. Cambiar a modo claro.' : 'Modo claro activo. Cambiar a modo oscuro.'}
            </span>
        </button>
    );
}

