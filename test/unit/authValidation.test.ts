import { expect, it } from 'vitest';
import { authErrorMessage, validateCredentials } from '../../src/utils/authValidation';

it('valida correo y contraseña antes del registro', () => {
    expect(validateCredentials({ email: 'incorrecto', password: 'abc' }, 'register')).toEqual({
        email: 'Ingresá un correo válido.',
        password: 'Usá al menos 6 caracteres.',
    });
});

it('presenta un error de inicio de sesión comprensible y uniforme', () => {
    const message = 'El correo o la contraseña son incorrectos.';
    expect(authErrorMessage({ code: 'auth/invalid-credential' })).toBe(message);
    expect(authErrorMessage({ code: 'auth/user-not-found' })).toBe(message);
});
