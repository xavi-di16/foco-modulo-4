
workspace
shared
downloads
Foco - Modulo - 4.zip
Foco
src
routes
AppRouter.tsx
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { GuestRoute, ProtectedRoute } from './ProtectedRoute';

const TasksPage = lazy(() => import('../pages/TasksPage'));

export function AppRouter() {
    return (
        <Routes>
            <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />
            </Route>
            <Route element={<ProtectedRoute />}>
                <Route path="/tareas" element={
                    <Suspense fallback={<div className="session-loading" role="status">Cargando tus tareas…</div>}>
                        <TasksPage />
                    </Suspense>
                } />
            </Route>
            <Route path="*" element={<Navigate to="/tareas" replace />} />
        </Routes>
    );
}

Filtrar archivos
