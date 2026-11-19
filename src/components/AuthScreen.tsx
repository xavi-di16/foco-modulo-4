import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { login, loginWithGoogle, register } from '../services/auth';
import type { AuthMode } from '../utils/authValidation';
import { AuthForm } from './AuthForm';
import { Brand } from './Brand';
import { ContactFooter } from './ContactFooter';
import { Notice } from './Notice';

export function AuthScreen({ mode }: { mode: AuthMode }) {
    const { error } = useAuth();
    const isRegister = mode === 'register';

    return (
        <div className="auth-shell">
            <main className="auth-main">
                <Brand />
                <div className="auth-content">
                    <header className="auth-intro">
                        <h1>{isRegister ? 'Creá tu cuenta' : 'Iniciá sesión'}</h1>
                        <p>{isRegister ? 'Empezá a organizar tus tareas en Foco.' : 'Entrá a tu espacio de tareas.'}</p>
                    </header>
                    {error && <Notice>{error}</Notice>}
                    <AuthForm
                        mode={mode}
                        onSubmit={isRegister ? register : login}
                        onGoogleSignIn={loginWithGoogle}
                        disabled={Boolean(error)}
                    />
                    <p className="auth-switch">
                        {isRegister ? '¿Ya tenés una cuenta?' : '¿Todavía no tenés cuenta?'}{' '}
                        <Link to={isRegister ? '/login' : '/registro'}>
                            {isRegister ? 'Iniciá sesión' : 'Registrate'}
                        </Link>
                    </p>
                </div>
                <ContactFooter />
                <p className="auth-footer">Gestor de tareas de MateCode</p>
            </main>
            <div className="auth-visual" aria-hidden="true"><img src="/escritorio.jpg" alt="" /></div>
        </div>
    );
}
