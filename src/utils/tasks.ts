import type { Priority, Task, TaskFilter, TaskInput, TaskSort } from '../types/task';

export const TITLE_LIMIT = 100;
export const DESCRIPTION_LIMIT = 1000;

export const priorityLabels: Record<Priority, string> = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
};

export interface TaskFormValues extends Omit<TaskInput, 'dueDate'> {
    dueDate: string;
}

export type TaskFormErrors = Partial<Record<keyof TaskFormValues, string>>;

export function validateTask(values: TaskFormValues): TaskFormErrors {
    const errors: TaskFormErrors = {};
    const title = values.title.trim();
    const description = values.description.trim();

    if (!title) errors.title = 'Ingresá un título.';
    else if (title.length > TITLE_LIMIT) errors.title = `El título admite hasta ${TITLE_LIMIT} caracteres.`;

    if (!description) errors.description = 'Ingresá una descripción.';
    else if (description.length > DESCRIPTION_LIMIT) {
        errors.description = `La descripción admite hasta ${DESCRIPTION_LIMIT} caracteres.`;
    }

    if (values.dueDate && !isValidDate(values.dueDate)) errors.dueDate = 'Ingresá una fecha válida.';
    return errors;
}

function isValidDate(value: string) {
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) || value.startsWith('0000')) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function toTaskInput(values: TaskFormValues): TaskInput {
    return {
        title: values.title.trim(),
        description: values.description.trim(),
        priority: values.priority,
        dueDate: values.dueDate || null,
    };
}

export function countTasks(tasks: Task[]) {
    const completed = tasks.filter(task => task.completed).length;
    return { total: tasks.length, completed, pending: tasks.length - completed };
}

export function filterTasks(tasks: Task[], filter: TaskFilter) {
    if (filter === 'all') return tasks;
    return tasks.filter(task => task.completed === (filter === 'completed'));
}

const priorityRank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export function sortTasks(tasks: Task[], sort: TaskSort, savedOrder: string[]) {
    const positions = new Map(savedOrder.map((id, index) => [id, index]));

    function byManualOrder(a: Task, b: Task) {
        return (positions.get(a.id) ?? -1) - (positions.get(b.id) ?? -1)
            || b.createdAt - a.createdAt
            || a.id.localeCompare(b.id);
    }

    return [...tasks].sort((a, b) => {
        if (sort === 'priority') {
            return priorityRank[a.priority] - priorityRank[b.priority] || byManualOrder(a, b);
        }
        if (sort === 'dueDate') {
            return (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99') || byManualOrder(a, b);
        }
        return byManualOrder(a, b);
    });
}
