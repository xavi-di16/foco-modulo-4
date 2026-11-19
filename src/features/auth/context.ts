import { createContext } from 'react';
import type { User } from 'firebase/auth';

export interface AuthState {
    user: User | null;
    loading: boolean;
    error: string | null;
}

export const AuthContext = createContext<AuthState | null>(null);
