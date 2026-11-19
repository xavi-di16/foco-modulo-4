import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { AuthForm } from '../../src/components/AuthForm';

it('muestra un error de Firebase en español y permite volver a intentar', async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockRejectedValueOnce({ code: 'auth/invalid-credential' });
    render(<AuthForm mode="login" onSubmit={submit} />);

    await user.type(screen.getByLabelText('Correo electrónico'), 'persona@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'password');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El correo o la contraseña son incorrectos.');
    expect(submit).toHaveBeenCalledWith('persona@example.com', 'password');
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled();
});

it('abre Google aunque los campos de correo y contraseña estén vacíos', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const google = vi.fn().mockResolvedValue(undefined);
    render(<AuthForm mode="login" onSubmit={submit} onGoogleSignIn={google} />);

    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }));

    expect(google).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
    expect(screen.queryByText('Ingresá un correo válido.')).not.toBeInTheDocument();
});

it('informa que Google fue bloqueado y permite volver a intentarlo', async () => {
    const user = userEvent.setup();
    const google = vi.fn().mockRejectedValue({ code: 'auth/popup-blocked' });
    render(<AuthForm mode="login" onSubmit={vi.fn()} onGoogleSignIn={google} />);

    await user.click(screen.getByRole('button', { name: 'Continuar con Google' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El navegador bloqueó la ventana de Google.');
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeEnabled();
});
