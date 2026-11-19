import type { Task } from '../src/types/task';

export function makeTask(id: string, fields: Partial<Task> = {}): Task {
    return {
        id,
        userId: 'user-a',
        title: 'Preparar informe',
        description: 'Revisar las cifras del mes.',
        priority: 'medium',
        dueDate: null,
        completed: false,
        createdAt: 100,
        updatedAt: 100,
        ...fields,
    };
}
