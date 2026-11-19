import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { authErrorMessage, validateCredentials } from '../utils/authValidation';
import type { AuthMode, Credentials } from '../utils/authValidation';
import { Notice } from './Notice';

interface AuthFormProps {
    mode: AuthMode;
    onSubmit: (email: string, password: string) => Promise<unknown>;
    disabled?: boolean;
}

export function AuthForm({ mode, onSubmit, disabled }: AuthFormProps) {
    const [values, setValues] = useState<Credentials>({ email: '', password: '' });
    const [fieldErrors, setFieldErrors] = useState<Partial<Credentials>>({});
    const [error, setError] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const isRegister = mode === 'register';

    function change(field: keyof Credentials, value: string) {
        setValues(current => ({ ...current, [field]: value }));
        setFieldErrors(current => ({ ...current, [field]: undefined }));
        setError(null);
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting || disabled) return;

        const errors = validateCredentials(values, mode);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        setError(null);
        setSubmitting(true);
        try {
            await onSubmit(values.email.trim(), values.password);
        } catch (requestError) {
            setError(authErrorMessage(requestError));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="auth-form" onSubmit={submit} noValidate aria-busy={submitting}>
            <div className="field">
                <label htmlFor="email">Correo electrónico</label>
                <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nombre@ejemplo.com"
                    required
                    value={values.email}
                    onChange={event => change('email', event.target.value)}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                {fieldErrors.email && <p className="field-error" id="email-error">{fieldErrors.email}</p>}
            </div>
            <div className="field">
                <label htmlFor="password">Contraseña</label>
                <div className="password-field">
                    <input
                        id="password"
                        type={visible ? 'text' : 'password'}
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        placeholder={isRegister ? 'Al menos 6 caracteres' : 'Tu contraseña'}
                        required
                        value={values.password}
                        onChange={event => change('password', event.target.value)}
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    />
                    <button
                        type="button"
                        className="icon-button password-toggle"
                        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        onClick={() => setVisible(current => !current)}
                    >
                        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                    </button>
                </div>
                {fieldErrors.password && <p className="field-error" id="password-error">{fieldErrors.password}</p>}
            </div>
            {error && <Notice>{error}</Notice>}
            <button className="button button-primary auth-submit" type="submit" disabled={submitting || disabled}>
                {submitting ? 'Un momento…' : isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
                {!submitting && <ArrowRight size={18} aria-hidden="true" />}
            </button>
        </form>
    );
}
