import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { TodoForm } from '../../src/components/TodoForm';
import { makeTask } from '../fixtures';

it('muestra errores de campos requeridos y evita un envío vacío', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<TodoForm onSubmit={submit} onCancel={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Crear tarea' }));

    expect(screen.getByLabelText('Título')).toHaveAccessibleDescription('Ingresá un título.');
    expect(screen.getByLabelText('Descripción')).toHaveAccessibleDescription('Ingresá una descripción.');
    expect(submit).not.toHaveBeenCalled();
});

it('precarga los datos al editar y emite cambios validados', async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const task = makeTask('1', { dueDate: '2027-03-14', priority: 'high' });
    render(<TodoForm initial={task} onSubmit={submit} onCancel={vi.fn()} />);

    const title = screen.getByLabelText('Título');
    expect(title).toHaveValue(task.title);
    expect(screen.getByLabelText(/vencimiento/i)).toHaveValue('2027-03-14');
    await user.clear(title);
    await user.type(title, '  Informe actualizado  ');
    await user.selectOptions(screen.getByLabelText('Prioridad'), 'low');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(submit).toHaveBeenCalledOnce();
    expect(submit).toHaveBeenCalledWith({
        title: 'Informe actualizado',
        description: task.description,
        dueDate: '2027-03-14',
        priority: 'low',
    });
});
