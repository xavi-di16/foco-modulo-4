import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function SessionLoading() {
    return <div className="session-loading" role="status">Verificando tu sesión…</div>;
}

export function ProtectedRoute() {
    const { user, loading } = useAuth();
    if (loading) return <SessionLoading />;
    return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function GuestRoute() {
    const { user, loading } = useAuth();
    if (loading) return <SessionLoading />;
    return user ? <Navigate to="/tareas" replace /> : <Outlet />;
}
