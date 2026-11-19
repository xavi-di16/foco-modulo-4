import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, it } from 'vitest';
import { AuthContext } from '../../src/features/auth/context';
import type { AuthState } from '../../src/features/auth/context';
import { ProtectedRoute } from '../../src/routes/ProtectedRoute';

function showPrivateRoute(session: AuthState) {
    render(
        <AuthContext.Provider value={session}>
            <MemoryRouter initialEntries={['/tareas']}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route path="/tareas" element={<h1>Tareas privadas</h1>} />
                    </Route>
                    <Route path="/login" element={<h1>Iniciar sesión</h1>} />
                </Routes>
            </MemoryRouter>
        </AuthContext.Provider>,
    );
}

it('espera la comprobación de la sesión antes de redirigir o mostrar las tareas', () => {
    showPrivateRoute({ user: null, loading: true, error: null });
    expect(screen.getByRole('status')).toHaveTextContent('Verificando tu sesión…');
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
});

it('redirige una visita anónima a la pantalla de inicio de sesión', async () => {
    showPrivateRoute({ user: null, loading: false, error: null });
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByText('Tareas privadas')).not.toBeInTheDocument();
});
