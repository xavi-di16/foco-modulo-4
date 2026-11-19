import type { User } from 'firebase/auth';

export type SummaryResult =
    | { status: 'sent' }
    | { status: 'unverified' }
    | { status: 'ses-verification'; requested: boolean }
    | { status: 'error'; message: string };

export async function sendTaskSummary(user: User, currentToken?: string): Promise<SummaryResult> {
    const token = currentToken ?? await user.getIdToken(true);
    const response = await fetch('/api/send-summary', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });

    const body: unknown = await response.json().catch(() => null);
    if (body && typeof body === 'object') {
        if (response.ok && 'ok' in body && body.ok === true) return { status: 'sent' };
        if (response.status === 403 && 'code' in body && body.code === 'EMAIL_NOT_VERIFIED') {
            return { status: 'unverified' };
        }
        if (response.status === 202 && 'code' in body && body.code === 'SES_VERIFICATION_REQUIRED') {
            return { status: 'ses-verification', requested: 'requested' in body && body.requested === true };
        }
        if ('message' in body && typeof body.message === 'string') {
            return { status: 'error', message: body.message };
        }
    }

    return {
        status: 'error',
        message: 'No se pudo conectar con la función de correo. Para probarla localmente, usá vercel dev.',
    };
}
