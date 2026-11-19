import {
    GetIdentityVerificationAttributesCommand,
    SESClient,
    SendEmailCommand,
    VerifyEmailIdentityCommand,
} from '@aws-sdk/client-ses';
import { errorIdentifier, requireEnv } from './env.js';
import type { SummaryEmail } from './summary.js';

type DeliveryStatus = 'sent' | 'verification-requested' | 'verification-pending' | 'verification-completed';

function requiresRecipientVerification(error: unknown, recipient: string, source: string) {
    if (!(error instanceof Error) || errorIdentifier(error) !== 'MessageRejected') return false;
    const address = recipient.toLowerCase();
    if (source.toLowerCase() === address) return false;

    // SES incluye las identidades rechazadas en el mensaje. Solo iniciamos la verificación si falta el destinatario.
    const failed = /email address (?:is )?not verified\.\s*the following identities failed the check in region [^:]+:\s*(.+)$/i
        .exec(error.message.trim())?.[1];
    return failed?.trim().toLowerCase() === address;
}

export function createSummarySender() {
    const source = requireEnv('SES_FROM_EMAIL');
    const client = new SESClient({
        region: requireEnv('SES_AWS_REGION'),
        credentials: {
            accessKeyId: requireEnv('SES_AWS_ACCESS_KEY_ID'),
            secretAccessKey: requireEnv('SES_AWS_SECRET_ACCESS_KEY'),
        },
        maxAttempts: 1,
    });

    return async (recipient: string, summary: SummaryEmail): Promise<DeliveryStatus> => {
        try {
            await client.send(new SendEmailCommand({
                Source: source,
                Destination: { ToAddresses: [recipient] },
                Message: {
                    Subject: { Data: 'Resumen de tus tareas · Foco', Charset: 'UTF-8' },
                    Body: {
                        Html: { Data: summary.html, Charset: 'UTF-8' },
                        Text: { Data: summary.text, Charset: 'UTF-8' },
                    },
                },
            }));
            return 'sent';
        } catch (error) {
            if (!requiresRecipientVerification(error, recipient, source)) throw error;
        }

        const result = await client.send(new GetIdentityVerificationAttributesCommand({ Identities: [recipient] }));
        const status = result.VerificationAttributes?.[recipient]?.VerificationStatus;
        if (status === 'Success') return 'verification-completed';
        if (status === 'Pending' || status === 'TemporaryFailure') return 'verification-pending';

        await client.send(new VerifyEmailIdentityCommand({ EmailAddress: recipient }));
        return 'verification-requested';
    };
}
