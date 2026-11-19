import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { User } from 'firebase/auth';
import { beforeEach, expect, it, vi } from 'vitest';
import { EmailSummary } from '../../src/components/EmailSummary';
import { requestEmailVerification } from '../../src/services/auth';
import { sendTaskSummary } from '../../src/services/email';

vi.mock('../../src/services/auth', () => ({ requestEmailVerification: vi.fn() }));
vi.mock('../../src/services/email', () => ({ sendTaskSummary: vi.fn() }));

const account = { uid: 'user-a', email: 'persona@example.com' } as User;

beforeEach(() => vi.resetAllMocks());

it('muestra el error de la función y vuelve a habilitar el botón', async () => {
    const user = userEvent.setup();
    vi.mocked(sendTaskSummary).mockResolvedValue({ status: 'error', message: 'SES rechazó el envío.' });
    render(<EmailSummary user={account} />);

    await user.click(screen.getByRole('button', { name: 'Enviar resumen' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('SES rechazó el envío.');
    expect(screen.getByRole('button', { name: 'Enviar resumen' })).toBeEnabled();
});

it('permite solicitar el enlace de verificación cuando el correo está pendiente', async () => {
    const user = userEvent.setup();
    vi.mocked(sendTaskSummary).mockResolvedValue({ status: 'unverified' });
    vi.mocked(requestEmailVerification).mockResolvedValue(undefined);
    render(<EmailSummary user={account} />);

    await user.click(screen.getByRole('button', { name: 'Enviar resumen' }));
    await user.click(await screen.findByRole('button', { name: 'Enviar enlace de verificación' }));

    expect(requestEmailVerification).toHaveBeenCalledWith(account);
    expect(await screen.findByText(/te enviamos un enlace de verificación/i)).toBeInTheDocument();
});
