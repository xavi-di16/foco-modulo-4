import { useCallback, useEffect, useRef, useState } from 'react';
import { Mail, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { requestEmailVerification } from '../services/auth';
import { sendTaskSummary } from '../services/email';
import { authErrorMessage } from '../utils/authValidation';
import { Notice } from './Notice';

type Feedback =
    | { type: 'success' | 'error'; message: string }
    | { type: 'firebase' | 'firebase-link' | 'ses'; message: string }
    | null;

export function EmailSummary({ user, disabled }: { user: User; disabled?: boolean }) {
    const [busy, setBusy] = useState<'summary' | 'verification' | null>(null);
    const [feedback, setFeedback] = useState<Feedback>(null);
    const sending = useRef(false);
    const waitingForFirebase = feedback?.type === 'firebase-link';

    const sendSummary = useCallback(async (token?: string) => {
        if (disabled || sending.current) return;
        sending.current = true;
        setBusy('summary');
        setFeedback(null);

        try {
            const result = await sendTaskSummary(user, token);
            if (result.status === 'unverified') {
                setFeedback({ type: 'firebase', message: 'Verificá tu correo para recibir el resumen.' });
            } else if (result.status === 'ses-verification') {
                setFeedback({
                    type: 'ses',
                    message: result.requested
                        ? 'Amazon SES te envió un enlace. Confirmá tu dirección y volvé a tocar Enviar resumen.'
                        : 'Amazon SES está esperando tu confirmación. Abrí su enlace y volvé a tocar Enviar resumen.',
                });
            } else if (result.status === 'sent') {
                setFeedback({ type: 'success', message: 'Resumen enviado. Revisá tu correo.' });
            } else {
                setFeedback({ type: 'error', message: result.message });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: authErrorMessage(error, 'No se pudo enviar el resumen. Volvé a intentar.') });
        } finally {
            sending.current = false;
            setBusy(null);
        }
    }, [disabled, user]);

    useEffect(() => {
        if (!waitingForFirebase || disabled) return;

        let active = true;
        let checking = false;
        async function continueSummary() {
            if (document.hidden || checking || sending.current) return;
            checking = true;
            try {
                const identity = await user.getIdTokenResult(true);
                if (active && identity.claims.email_verified === true) void sendSummary(identity.token);
            } catch {
                // El botón permite continuar si el dispositivo todavía está sin conexión.
            } finally {
                checking = false;
            }
        }

        window.addEventListener('focus', continueSummary);
        document.addEventListener('visibilitychange', continueSummary);
        return () => {
            active = false;
            window.removeEventListener('focus', continueSummary);
            document.removeEventListener('visibilitychange', continueSummary);
        };
    }, [disabled, sendSummary, user, waitingForFirebase]);

    async function verifyEmail() {
        setBusy('verification');
        try {
            await requestEmailVerification(user);
            setFeedback({
                type: 'firebase-link',
                message: 'Te enviamos un enlace de verificación de Firebase. Abrilo y volvé a Foco para continuar.',
            });
        } catch (error) {
            setFeedback({
                type: 'firebase',
                message: authErrorMessage(error, 'No pudimos enviar el enlace de verificación. Volvé a intentar.'),
            });
        } finally {
            setBusy(null);
        }
    }

    return (
        <div className="email-summary">
            <button
                type="button"
                className="button button-secondary"
                onClick={() => void sendSummary()}
                disabled={disabled || Boolean(busy)}
            >
                <Mail size={17} aria-hidden="true" />
                {busy === 'summary' ? 'Enviando…' : 'Enviar resumen'}
            </button>
            {feedback && (
                <div className="email-feedback">
                    <button type="button" className="icon-button email-feedback-close" aria-label="Cerrar aviso"
                        onClick={() => setFeedback(null)} disabled={Boolean(busy)}>
                        <X size={17} aria-hidden="true" />
                    </button>
                    <Notice tone={feedback.type === 'success' || feedback.type === 'error' ? feedback.type : 'info'}>
                        <p>{feedback.message}</p>
                        {feedback.type === 'firebase' && (
                            <button type="button" className="text-button" onClick={verifyEmail} disabled={Boolean(busy)}>
                                {busy === 'verification' ? 'Enviando enlace…' : 'Enviar enlace de verificación'}
                            </button>
                        )}
                    </Notice>
                </div>
            )}
        </div>
    );
}
