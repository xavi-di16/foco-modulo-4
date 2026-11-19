export type AuthMode = 'login' | 'register';

export interface Credentials {
    email: string;
    password: string;
}

export function validateCredentials({ email, password }: Credentials, mode: AuthMode) {
    const errors: Partial<Record<keyof Credentials, string>> = {};

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        errors.email = 'Ingresá un correo válido.';
    }

    if (!password) {
        errors.password = 'Ingresá tu contraseña.';
    } else if (mode === 'register' && password.length < 6) {
        errors.password = 'Usá al menos 6 caracteres.';
    }

    return errors;
}

const authMessages: Record<string, string> = {
    'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Podés iniciar sesión.',
    'auth/invalid-email': 'Ingresá un correo válido.',
    'auth/invalid-credential': 'El correo o la contraseña son incorrectos.',
    'auth/user-not-found': 'El correo o la contraseña son incorrectos.',
    'auth/wrong-password': 'El correo o la contraseña son incorrectos.',
    'auth/weak-password': 'Usá una contraseña de al menos 6 caracteres.',
    'auth/password-does-not-meet-requirements': 'La contraseña no cumple los requisitos de seguridad.',
    'auth/user-disabled': 'Esta cuenta está deshabilitada.',
    'auth/too-many-requests': 'Hubo demasiados intentos. Probá de nuevo en unos minutos.',
    'auth/network-request-failed': 'Revisá tu conexión y volvé a intentar.',
    'auth/operation-not-allowed': 'Habilitá Correo electrónico/contraseña en Firebase Authentication.',
    'auth/invalid-api-key': 'Revisá la configuración web de Firebase.',
};

export function authErrorMessage(error: unknown, fallback = 'La operación no pudo completarse. Volvé a intentar.') {
    if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
        return authMessages[error.code] ?? fallback;
    }
    return fallback;
}
