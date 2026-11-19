import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import type { User } from 'firebase/auth';
import { requestEmailVerification } from '../services/auth';
import { sendTaskSummary } from '../services/email';
import { authErrorMessage } from '../utils/authValidation';
import { Notice } from './Notice';

type Feedback =
    | { type: 'success' | 'error'; message: string }
    | { type: 'verification'; message: string }
    | null;

export function EmailSummary({ user, disabled }: { user: User; disabled?: boolean }) {
    const [busy, setBusy] = useState<'summary' | 'verification' | null>(null);
    const [feedback, setFeedback] = useState<Feedback>(null);

    async function sendSummary() {
        setBusy('summary');
        setFeedback(null);

        try {
            const result = await sendTaskSummary(user);
            if (result.status === 'unverified') {
                setFeedback({ type: 'verification', message: 'Verificá tu correo para recibir el resumen.' });
            } else if (result.status === 'sent') {
                setFeedback({ type: 'success', message: 'Resumen enviado. Revisá tu correo.' });
            } else {
                setFeedback({ type: 'error', message: result.message });
            }
        } catch (error) {
            setFeedback({ type: 'error', message: authErrorMessage(error, 'No se pudo enviar el resumen. Volvé a intentar.') });
        } finally {
            setBusy(null);
        }
    }

    async function verifyEmail() {
        setBusy('verification');
        try {
            await requestEmailVerification(user);
            setFeedback({
                type: 'success',
                message: 'Te enviamos un enlace de verificación. Abrilo y volvé a enviar el resumen.',
            });
        } catch (error) {
            setFeedback({
                type: 'verification',
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
                onClick={sendSummary}
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
                    <Notice tone={feedback.type === 'verification' ? 'info' : feedback.type}>
                        <p>{feedback.message}</p>
                        {feedback.type === 'verification' && (
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
