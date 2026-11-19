import { useContext } from 'react';
import { AuthContext } from '../features/auth/context';

export function useAuth() {
    const session = useContext(AuthContext);
    if (!session) throw new Error('useAuth requiere un AuthProvider.');
    return session;
}
