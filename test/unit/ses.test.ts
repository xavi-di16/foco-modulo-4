// @vitest-environment node
import {
    GetIdentityVerificationAttributesCommand,
    SendEmailCommand,
    VerifyEmailIdentityCommand,
} from '@aws-sdk/client-ses';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createSummarySender } from '../../server/ses';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@aws-sdk/client-ses', async importOriginal => ({
    ...await importOriginal<typeof import('@aws-sdk/client-ses')>(),
    SESClient: class { send = send; },
}));

const recipient = 'persona@example.com';
const source = 'foco@example.com';
const summary = { text: 'Resumen de tus tareas', html: '<h1>Resumen de tus tareas</h1>' };

function unverified(identities: string) {
    return Object.assign(new Error(
        'Email address is not verified. The following identities failed the check in region US-EAST-2: ' + identities,
    ), { name: 'MessageRejected' });
}

beforeEach(() => {
    send.mockReset();
    vi.stubEnv('SES_FROM_EMAIL', source);
    vi.stubEnv('SES_AWS_REGION', 'us-east-2');
    vi.stubEnv('SES_AWS_ACCESS_KEY_ID', 'test-access');
    vi.stubEnv('SES_AWS_SECRET_ACCESS_KEY', 'test-secret');
});
afterEach(() => vi.unstubAllEnvs());

it('envía HTML y texto cuando AWS acepta al destinatario', async () => {
    send.mockResolvedValueOnce({ MessageId: 'ses-mock' });

    await expect(createSummarySender()(recipient, summary)).resolves.toBe('sent');

    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toBeInstanceOf(SendEmailCommand);
    expect(send.mock.calls[0][0].input).toMatchObject({
        Destination: { ToAddresses: [recipient] },
        Message: { Body: { Html: { Data: summary.html }, Text: { Data: summary.text } } },
    });
});

it.each([undefined, 'Failed'])('solicita el enlace de SES para una identidad ausente o vencida (%s)', async status => {
    send.mockRejectedValueOnce(unverified(recipient));
    send.mockResolvedValueOnce({
        VerificationAttributes: status ? { [recipient]: { VerificationStatus: status } } : {},
    });
    send.mockResolvedValueOnce({});

    await expect(createSummarySender()(recipient, summary)).resolves.toBe('verification-requested');

    expect(send.mock.calls[1][0]).toBeInstanceOf(GetIdentityVerificationAttributesCommand);
    expect(send.mock.calls[1][0].input).toEqual({ Identities: [recipient] });
    expect(send.mock.calls[2][0]).toBeInstanceOf(VerifyEmailIdentityCommand);
    expect(send.mock.calls[2][0].input).toEqual({ EmailAddress: recipient });
});

it('evita duplicar un enlace de verificación pendiente', async () => {
    send.mockRejectedValueOnce(unverified(recipient));
    send.mockResolvedValueOnce({ VerificationAttributes: { [recipient]: { VerificationStatus: 'Pending' } } });

    await expect(createSummarySender()(recipient, summary)).resolves.toBe('verification-pending');
    expect(send).toHaveBeenCalledTimes(2);
});

it('reconoce una verificación confirmada durante el envío', async () => {
    send.mockRejectedValueOnce(unverified(recipient));
    send.mockResolvedValueOnce({ VerificationAttributes: { [recipient]: { VerificationStatus: 'Success' } } });

    await expect(createSummarySender()(recipient, summary)).resolves.toBe('verification-completed');
    expect(send).toHaveBeenCalledTimes(2);
});

it.each([source, source + ', ' + recipient])('preserva el rechazo de un remitente sin verificar (%s)', async addresses => {
    const error = unverified(addresses);
    send.mockRejectedValueOnce(error);

    await expect(createSummarySender()(recipient, summary)).rejects.toBe(error);
    expect(send).toHaveBeenCalledOnce();
});
