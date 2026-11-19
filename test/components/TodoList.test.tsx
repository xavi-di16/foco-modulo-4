import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { TodoList } from '../../src/components/TodoList';
import { makeTask } from '../fixtures';

it('permite completar, editar y pedir confirmación de borrado para la tarea correcta', async () => {
    const user = userEvent.setup();
    const task = makeTask('1');
    const onToggle = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<TodoList tasks={[task]} filter="all" onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />);

    await user.click(screen.getByRole('checkbox', { name: /completar: preparar informe/i }));
    await user.click(screen.getByRole('button', { name: /editar preparar informe/i }));
    await user.click(screen.getByRole('button', { name: /eliminar preparar informe/i }));

    expect(onToggle).toHaveBeenCalledWith(task);
    expect(onEdit).toHaveBeenCalledWith(task);
    expect(onDelete).toHaveBeenCalledWith(task);
});

it('muestra el estado vacío del filtro activo', () => {
    render(<TodoList tasks={[]} filter="completed" onToggle={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Todavía no completaste tareas' })).toBeInTheDocument();
});
