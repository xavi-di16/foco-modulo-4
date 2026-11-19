// @vitest-environment node
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../../api/send-summary';

const mocks = vi.hoisted(() => ({
    verify: vi.fn(),
    collection: vi.fn(),
    where: vi.fn(),
    get: vi.fn(),
    reserve: vi.fn(),
    createSender: vi.fn(),
    send: vi.fn(),
}));

vi.mock('../../server/firebaseAdmin', () => ({
    getFirebaseAdmin: () => ({ auth: { verifyIdToken: mocks.verify }, db: { collection: mocks.collection } }),
}));
vi.mock('../../server/emailCooldown', () => ({ reserveSummary: mocks.reserve }));
vi.mock('../../server/ses', () => ({ createSummarySender: mocks.createSender }));

function request(fields: Partial<VercelRequest> = {}) {
    return { method: 'POST', headers: { authorization: 'Bearer sesion-de-prueba' }, ...fields } as VercelRequest;
}

function mockResponse() {
    return { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), setHeader: vi.fn() };
}

describe('POST /api/send-summary', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.verify.mockResolvedValue({ uid: 'user-a', email: 'persona@example.com', email_verified: true });
        mocks.collection.mockReturnValue({ where: mocks.where });
        mocks.where.mockReturnValue({ get: mocks.get });
        mocks.get.mockResolvedValue({
            docs: [{ get: (field: string) => field === 'title' ? 'Informe' : true }],
        });
        mocks.reserve.mockResolvedValue(0);
        mocks.createSender.mockReturnValue(mocks.send);
        mocks.send.mockResolvedValue('sent');
    });

    it('rechaza métodos distintos de POST', async () => {
        const response = mockResponse();
        await handler(request({ method: 'GET' }), response as unknown as VercelResponse);

        expect(response.status).toHaveBeenCalledWith(405);
        expect(response.setHeader).toHaveBeenCalledWith('Allow', 'POST');
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('exige autenticación antes de usar los servicios externos', async () => {
        const response = mockResponse();
        await handler(request({ headers: {} }), response as unknown as VercelResponse);

        expect(response.status).toHaveBeenCalledWith(401);
        expect(mocks.verify).not.toHaveBeenCalled();
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('valida la solicitud y rechaza destinatarios aportados por el navegador', async () => {
        const response = mockResponse();
        await handler(request({ body: { to: 'otra-persona@example.com' } }), response as unknown as VercelResponse);

        expect(response.status).toHaveBeenCalledWith(400);
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('rechaza sesiones revocadas', async () => {
        const response = mockResponse();
        mocks.verify.mockRejectedValue({ code: 'auth/id-token-revoked' });

        await handler(request(), response as unknown as VercelResponse);

        expect(response.status).toHaveBeenCalledWith(401);
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('solicita verificar el correo antes de enviar', async () => {
        const response = mockResponse();
        mocks.verify.mockResolvedValue({ uid: 'user-a', email: 'persona@example.com', email_verified: false });

        await handler(request(), response as unknown as VercelResponse);

        expect(response.status).toHaveBeenCalledWith(403);
        expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'EMAIL_NOT_VERIFIED' }));
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('consulta por uid y prepara el correo para la dirección verificada de esa sesión', async () => {
        const response = mockResponse();
        await handler(request(), response as unknown as VercelResponse);

        expect(mocks.verify).toHaveBeenCalledWith('sesion-de-prueba', true);
        expect(mocks.where).toHaveBeenCalledWith('userId', '==', 'user-a');
        expect(mocks.send).toHaveBeenCalledWith('persona@example.com', expect.objectContaining({
            text: expect.stringContaining('Completada: Informe'),
            html: expect.stringContaining('Informe'),
        }));
        expect(response.status).toHaveBeenCalledWith(200);
    });

    it.each([
        ['verification-requested', true],
        ['verification-pending', false],
    ])('informa el estado de verificación de SES para %s', async (result, requested) => {
        const response = mockResponse();
        mocks.send.mockResolvedValue(result);
        await handler(request(), response as unknown as VercelResponse);

        expect(response.status).toHaveBeenCalledWith(202);
        expect(response.json).toHaveBeenCalledWith({ code: 'SES_VERIFICATION_REQUIRED', requested });
    });

    it('informa el tiempo restante sin reenviar cuando hay un límite activo', async () => {
        const response = mockResponse();
        mocks.reserve.mockResolvedValue(18);
        await handler(request(), response as unknown as VercelResponse);

        expect(response.status).toHaveBeenCalledWith(429);
        expect(response.setHeader).toHaveBeenCalledWith('Retry-After', '18');
        expect(mocks.get).not.toHaveBeenCalled();
        expect(mocks.send).not.toHaveBeenCalled();
    });

    it('comunica un rechazo de SES sin divulgar los detalles de la excepción', async () => {
        const response = mockResponse();
        mocks.send.mockRejectedValue({ code: 'MessageRejected', message: 'detalle interno' });
        const log = vi.spyOn(console, 'error').mockImplementation(() => { });
        try {
            await handler(request(), response as unknown as VercelResponse);

            expect(response.status).toHaveBeenCalledWith(502);
            expect(response.json).toHaveBeenCalledWith({ message: expect.stringContaining('AWS SES rechazó') });
            expect(response.json).not.toHaveBeenCalledWith({ message: 'detalle interno' });
        } finally {
            log.mockRestore();
        }
    });
});