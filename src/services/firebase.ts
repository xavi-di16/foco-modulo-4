import { initializeApp } from 'firebase/app';

export const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';

function initializeFirebase() {
    const configuration = useEmulators
        ? {
            apiKey: 'demo-foco-key',
            authDomain: 'demo-foco.firebaseapp.com',
            projectId: 'demo-foco',
            appId: 'demo-foco-web',
        }
        : {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
        };

    if (Object.values(configuration).some(value => !value?.trim())) {
        throw new Error('Falta configurar Firebase. Completá las variables web indicadas en el README.');
    }

    return initializeApp(configuration);
}

let app: ReturnType<typeof initializeFirebase> | undefined;

export function getFirebaseApp() {
    app ??= initializeFirebase();
    return app;
}
