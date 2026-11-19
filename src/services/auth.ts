import {
    connectAuthEmulator,
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { getFirebaseApp, useEmulators } from './firebase';

function getFirebaseAuth() {
    const auth = getAuth(getFirebaseApp());
    if (useEmulators && !auth.emulatorConfig) {
        connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    }
    return auth;
}

export function watchSession(onChange: (user: User | null) => void, onError: (error: Error) => void) {
    return onAuthStateChanged(getFirebaseAuth(), onChange, onError);
}

export function register(email: string, password: string) {
    return createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export function login(email: string, password: string) {
    return signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return signInWithPopup(getFirebaseAuth(), provider);
}

export function logout() {
    return signOut(getFirebaseAuth());
}

export function requestEmailVerification(user: User) {
    return sendEmailVerification(user);
}
