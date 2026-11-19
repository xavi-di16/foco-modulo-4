import { describe, expect, it } from 'vitest';
import { countTasks, filterTasks, sortTasks, toTaskInput, validateTask } from '../../src/utils/tasks';
import type { TaskFormValues } from '../../src/utils/tasks';
import { makeTask } from '../fixtures';

const input: TaskFormValues = {
    title: '  Preparar informe  ',
    description: '  Revisar cifras  ',
    priority: 'high',
    dueDate: '',
};

describe('validación de tareas', () => {
    it('rechaza títulos y descripciones compuestos solo por espacios', () => {
        expect(validateTask({ ...input, title: '  ', description: '  ' })).toEqual({
            title: 'Ingresá un título.',
            description: 'Ingresá una descripción.',
        });
    });

    it('rechaza fechas inexistentes y acepta días bisiestos válidos', () => {
        expect(validateTask({ ...input, dueDate: '2027-02-29' }).dueDate).toBe('Ingresá una fecha válida.');
        expect(validateTask({ ...input, dueDate: '2028-02-29' })).toEqual({});
    });

    it('recorta espacios y guarda null cuando no se indicó una fecha', () => {
        expect(toTaskInput(input)).toEqual({
            title: 'Preparar informe',
            description: 'Revisar cifras',
            priority: 'high',
            dueDate: null,
        });
    });
});

describe('listado y orden de tareas', () => {
    const first = makeTask('1', { priority: 'high', dueDate: '2027-03-01' });
    const second = makeTask('2', { priority: 'low', completed: true, dueDate: '2027-02-01' });
    const third = makeTask('3', { createdAt: 200 });
    const tasks = [first, second, third];

    it('filtra por estado y cuenta todas las tareas', () => {
        expect(filterTasks(tasks, 'pending')).toEqual([first, third]);
        expect(filterTasks(tasks, 'completed')).toEqual([second]);
        expect(countTasks(tasks)).toEqual({ total: 3, pending: 2, completed: 1 });
    });

    it('coloca las tareas nuevas antes del orden manual guardado e ignora ids eliminados', () => {
        expect(sortTasks(tasks, 'manual', ['2', 'eliminada', '1'])).toEqual([third, second, first]);
    });

    it('ordena por mayor prioridad y por vencimiento con las fechas vacías al final', () => {
        expect(sortTasks(tasks, 'priority', [])).toEqual([first, third, second]);
        expect(sortTasks(tasks, 'dueDate', [])).toEqual([second, first, third]);
    });
});