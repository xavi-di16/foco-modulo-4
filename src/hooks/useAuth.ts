import { useContext } from 'react';
import { AuthContext } from '../features/auth/context';
import type { AuthState } from '../features/auth/context';

export function useAuth(): AuthState {
    const session = useContext(AuthContext);
    if (!session) throw new Error('useAuth requiere un AuthProvider.');
    return session;
}
