import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { requireEnv } from './env.js';

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

    return (recipient: string, summary: string) => client.send(new SendEmailCommand({
        Source: source,
        Destination: { ToAddresses: [recipient] },
        Message: {
            Subject: { Data: 'Resumen de tus tareas · Foco', Charset: 'UTF-8' },
            Body: { Text: { Data: summary, Charset: 'UTF-8' } },
        },
    }));
}
