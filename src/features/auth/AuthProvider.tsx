import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { watchSession } from '../../services/auth';
import { authErrorMessage } from '../../utils/authValidation';
import { AuthContext } from './context';
import type { AuthState } from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<AuthState>({ user: null, loading: true, error: null });

    useEffect(() => {
        try {
            return watchSession(
                user => setSession({ user, loading: false, error: null }),
                error => setSession({ user: null, loading: false, error: authErrorMessage(error) }),
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo iniciar Firebase.';
            setSession({ user: null, loading: false, error: message });
        }
    }, []);

    return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

