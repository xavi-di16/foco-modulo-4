import type { VercelRequest, VercelResponse } from '@vercel/node';
import { reserveSummary } from '../server/emailCooldown.js';
import { errorIdentifier } from '../server/env.js';
import { getFirebaseAdmin } from '../server/firebaseAdmin.js';
import { createSummarySender } from '../server/ses.js';
import { formatSummary } from '../server/summary.js';

const invalidTokenCodes = new Set([
    'auth/argument-error',
    'auth/id-token-expired',
    'auth/id-token-revoked',
    'auth/invalid-id-token',
    'auth/user-disabled',
    'auth/user-not-found',
]);

function hasEmptyBody(body: unknown) {
    return body == null || body === ''
        || (typeof body === 'object' && !Array.isArray(body) && Object.keys(body).length === 0);
}

export default async function sendSummary(request: VercelRequest, response: VercelResponse) {
    response.setHeader('Cache-Control', 'no-store');
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return response.status(405).json({ message: 'Usá POST para solicitar el resumen.' });
    }

    const token = request.headers.authorization?.match(/^Bearer (\S+)$/i)?.[1];
    if (!token) {
        return response.status(401).json({ message: 'Iniciá sesión para solicitar el resumen.' });
    }

    if (!hasEmptyBody(request.body)) {
        return response.status(400).json({ message: 'La solicitud debe tener el cuerpo vacío.' });
    }

    try {
        const { auth, db } = getFirebaseAdmin();
        const identity = await auth.verifyIdToken(token, true);
        if (!identity.email || !identity.email_verified) {
            return response.status(403).json({
                code: 'EMAIL_NOT_VERIFIED',
                message: 'Verificá tu correo para recibir el resumen.',
            });
        }

        const send = createSummarySender();
        const waitSeconds = await reserveSummary(db, identity.uid);
        if (waitSeconds > 0) {
            response.setHeader('Retry-After', String(waitSeconds));
            return response.status(429).json({ message: `Esperá ${waitSeconds} segundos antes de enviar otro resumen.` });
        }

        const tasks = await db.collection('tasks').where('userId', '==', identity.uid).get();
        const summary = formatSummary(tasks.docs.map(task => ({
            title: String(task.get('title')),
            completed: task.get('completed') === true,
        })));
        await send(identity.email, summary);
        return response.status(200).json({ ok: true });
    } catch (error) {
        const code = errorIdentifier(error);
        if (invalidTokenCodes.has(code)) {
            return response.status(401).json({ message: 'Tu sesión ya no es válida. Volvé a iniciar sesión.' });
        }

        console.error('Error en el envío del resumen', code);
        if (code === 'MessageRejected') {
            return response.status(502).json({ message: 'AWS SES rechazó el envío. Revisá las identidades verificadas de esa región.' });
        }
        return response.status(500).json({ message: 'No pudimos enviar el resumen. Volvé a intentar en unos segundos.' });
    }
}
