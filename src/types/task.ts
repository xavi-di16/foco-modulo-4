export type Priority = 'low' | 'medium' | 'high';
export type TaskFilter = 'all' | 'pending' | 'completed';
export type TaskSort = 'manual' | 'priority' | 'dueDate';

export interface TaskInput {
    title: string;
    description: string;
    priority: Priority;
    dueDate: string | null;
}

export interface TaskRecord<TDate> extends TaskInput {
    userId: string;
    completed: boolean;
    createdAt: TDate;
    updatedAt: TDate;
}

export interface Task extends TaskRecord<number> {
    id: string;
}
