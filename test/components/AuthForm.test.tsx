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
