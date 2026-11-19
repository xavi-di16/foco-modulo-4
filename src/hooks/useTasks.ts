import { useEffect, useState } from 'react';
import { taskErrorMessage, watchTasks } from '../services/tasks';
import type { TaskSnapshot } from '../services/tasks';

type TasksState =
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | ({ status: 'ready' } & TaskSnapshot);

export function useTasks(userId: string) {
    const [state, setState] = useState<TasksState>({ status: 'loading' });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const reportError = (error: unknown) => setState({ status: 'error', message: taskErrorMessage(error) });
        try {
            return watchTasks(userId, snapshot => setState({ status: 'ready', ...snapshot }), reportError);
        } catch (error) {
            reportError(error);
        }
    }, [userId, attempt]);

    function retry() {
        setState({ status: 'loading' });
        setAttempt(current => current + 1);
    }

    return { state, retry };
}