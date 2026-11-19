import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ThemeToggle } from '../../src/components/ThemeToggle';
import { applyTheme, THEME_STORAGE_KEY } from '../../src/hooks/useTheme';

beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
});

afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
});

it('inicia en modo claro por defecto y permite cambiar a modo oscuro', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /Cambiar a modo oscuro/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    await user.click(button);

    expect(screen.getByRole('button', { name: /Cambiar a modo claro/i })).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
});

it('lee la preferencia guardada en localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    applyTheme('dark');
    render(<ThemeToggle />);

    const button = screen.getByRole('button', { name: /Cambiar a modo claro/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
});

it('se puede activar con el teclado y mantiene foco accesible', async () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');

    button.focus();
    expect(button).toHaveFocus();

    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    // Click triggers toggle
    fireEvent.click(button);

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
});
