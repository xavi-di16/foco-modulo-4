import type { Firestore } from 'firebase-admin/firestore';

const COOLDOWN_SECONDS = 30;

export function reserveSummary(db: Firestore, userId: string) {
    const reference = db.collection('emailSummaryLimits').doc(userId);

    return db.runTransaction(async transaction => {
        const snapshot = await transaction.get(reference);
        const now = Date.now();
        const nextAllowedAt: unknown = snapshot.get('nextAllowedAt');
        if (typeof nextAllowedAt === 'number' && nextAllowedAt > now) {
            return Math.ceil((nextAllowedAt - now) / 1000);
        }

        transaction.set(reference, { nextAllowedAt: now + COOLDOWN_SECONDS * 1000 });
        return 0;
    });
}
