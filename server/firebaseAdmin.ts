import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { requireEnv } from './env.js';

const appName = 'foco-email';

export function getFirebaseAdmin() {
    const existing = getApps().find(app => app.name === appName);
    const app = existing ?? initializeAdmin();
    return { auth: getAuth(app), db: getFirestore(app) };
}

function initializeAdmin() {
    const projectId = requireEnv('FIREBASE_PROJECT_ID');
    const clientEmail = requireEnv('FIREBASE_CLIENT_EMAIL');
    const privateKey = requireEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n');

    return initializeApp({
        projectId,
        credential: cert({ projectId, clientEmail, privateKey }),
    }, appName);
}
