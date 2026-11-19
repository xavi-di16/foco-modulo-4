import { useRef, useState } from 'react';
import { ArrowDownUp, LogOut, Plus } from 'lucide-react';
import type { User } from 'firebase/auth';
import { Brand } from '../components/Brand';
import { ContactFooter } from '../components/ContactFooter';
import { Dialog } from '../components/Dialog';
import { EmailSummary } from '../components/EmailSummary';
import { Notice } from '../components/Notice';
import { TaskSummary } from '../components/TaskSummary';
import { ThemeToggle } from '../components/ThemeToggle';
import { TodoForm } from '../components/TodoForm';
import { TodoList } from '../components/TodoList';
import { WorkspaceNavigation } from '../components/WorkspaceNavigation';
import { useAuth } from '../hooks/useAuth';
import { useTasks } from '../hooks/useTasks';
import { logout } from '../services/auth';
import { completeTask, createTask, deleteTask, editTask, saveTaskOrder, taskErrorMessage } from '../services/tasks';
import type { Task, TaskFilter, TaskInput, TaskSort } from '../types/task';
import { authErrorMessage } from '../utils/authValidation';
import { countTasks, filterTasks, sortTasks } from '../utils/tasks';

type TaskDialog = { mode: 'create' } | { mode: 'edit' | 'delete'; task: Task };

const listTitles: Record<TaskFilter, string> = {
    all: 'Todas las tareas',
    pending: 'Tareas pendientes',
    completed: 'Tareas completadas',
};

const dayFormatter = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
});

function Workspace({ user }: { user: User }) {
    const { state, retry } = useTasks(user.uid);
    const [filter, setFilter] = useState<TaskFilter>('all');
    const [sort, setSort] = useState<TaskSort>('manual');
    const [dialog, setDialog] = useState<TaskDialog | null>(null);
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [dialogError, setDialogError] = useState<string | null>(null);
    const [signingOut, setSigningOut] = useState(false);
    const writing = useRef(false);
    const counts = state.status === 'ready' ? countTasks(state.tasks) : null;
    const email = user.email ?? '';

    function openDialog(next: TaskDialog) {
        setDialogError(null);
        setDialog(next);
    }

    async function runTaskAction(action: () => Promise<unknown>, inDialog = false) {
        if (writing.current) return;
        writing.current = true;
        setBusy(true);
        const reportError = inDialog ? setDialogError : setActionError;
        reportError(null);

        try {
            await action();
            if (inDialog) setDialog(null);
        } catch (error) {
            reportError(taskErrorMessage(error));
        } finally {
            writing.current = false;
            setBusy(false);
        }
    }

    function submitTask(input: TaskInput) {
        if (dialog?.mode === 'edit') {
            void runTaskAction(() => editTask(dialog.task.id, input), true);
        } else {
            void runTaskAction(() => createTask(user.uid, input), true);
        }
    }

    async function signOut() {
        setSigningOut(true);
        setActionError(null);
        try {
            await logout();
        } catch (error) {
            setActionError(authErrorMessage(error, 'No se pudo cerrar sesión. Volvé a intentar.'));
        } finally {
            setSigningOut(false);
        }
    }

    return (
        <div className="workspace-shell">
            <header className="workspace-topbar">
                <div className="mobile-brand"><Brand /></div>
                <span className="topbar-date">{dayFormatter.format(new Date())}</span>
                <div className="account">
                    <ThemeToggle />
                    <span className="avatar" aria-hidden="true">{email.charAt(0).toUpperCase()}</span>
                    <span className="account-email" title={email}>{email}</span>
                    <button
                        type="button"
                        className="icon-button logout-button"
                        aria-label="Cerrar sesión"
                        title="Cerrar sesión"
                        onClick={signOut}
                        disabled={signingOut}
                    >
                        <LogOut size={19} aria-hidden="true" />
                    </button>
                </div>
            </header>

            <WorkspaceNavigation
                filter={filter}
                counts={counts && { all: counts.total, pending: counts.pending, completed: counts.completed }}
                onFilter={setFilter}
            />

            <main className="workspace-main">
                <div className="workspace-content">
                    <header className="workspace-heading">
                        <h1>Mis tareas</h1>
                        <div className="workspace-actions">
                            <EmailSummary user={user} disabled={busy || state.status !== 'ready'} />
                            <button
                                type="button"
                                className="button button-primary"
                                disabled={busy || state.status !== 'ready'}
                                onClick={() => openDialog({ mode: 'create' })}
                            >
                                <Plus size={19} aria-hidden="true" /> Nueva tarea
                            </button>
                        </div>
                    </header>

                    {actionError && <Notice>{actionError}</Notice>}
                    {state.status === 'loading' && <Notice tone="info">Cargando tus tareas…</Notice>}
                    {state.status === 'error' && (
                        <Notice>
                            <p>{state.message}</p>
                            <button type="button" className="text-button" onClick={retry}>Reintentar</button>
                        </Notice>
                    )}

                    {state.status === 'ready' && counts && (
                        <>
                            <TaskSummary {...counts} />
                            <section className="task-panel" aria-labelledby="task-list-heading" aria-busy={busy}>
                                <div className="task-panel-header">
                                    <h2 id="task-list-heading">{listTitles[filter]}</h2>
                                    <label className="sort-control">
                                        <ArrowDownUp size={16} aria-hidden="true" />
                                        <span className="sr-only">Orden de las tareas</span>
                                        <select value={sort} onChange={event => setSort(event.target.value as TaskSort)}>
                                            <option value="manual">Orden manual</option>
                                            <option value="priority">Prioridad</option>
                                            <option value="dueDate">Vencimiento</option>
                                        </select>
                                    </label>
                                </div>
                                <TodoList
                                    tasks={filterTasks(sortTasks(state.tasks, sort, state.order), filter)}
                                    filter={filter}
                                    busy={busy}
                                    onEdit={task => openDialog({ mode: 'edit', task })}
                                    onDelete={task => openDialog({ mode: 'delete', task })}
                                    onToggle={task => void runTaskAction(() => completeTask(task.id, !task.completed))}
                                    onReorder={filter === 'all' && sort === 'manual'
                                        ? ids => void runTaskAction(() => saveTaskOrder(user.uid, ids))
                                        : undefined}
                                />
                            </section>
                        </>
                    )}

                    <ContactFooter />
                </div>
            </main>

            {dialog?.mode === 'delete' && (
                <Dialog title="Eliminar tarea" locked={busy} onClose={() => setDialog(null)}>
                    <p className="delete-copy">¿Querés eliminar «{dialog.task.title}»? Esta acción es permanente.</p>
                    {dialogError && <Notice>{dialogError}</Notice>}
                    <div className="dialog-actions">
                        <button type="button" className="button button-secondary" onClick={() => setDialog(null)} disabled={busy} data-initial-focus>
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="button button-danger"
                            disabled={busy}
                            onClick={() => void runTaskAction(() => deleteTask(dialog.task.id), true)}
                        >
                            {busy ? 'Eliminando…' : 'Eliminar tarea'}
                        </button>
                    </div>
                </Dialog>
            )}

            {(dialog?.mode === 'create' || dialog?.mode === 'edit') && (
                <Dialog title={dialog.mode === 'edit' ? 'Editar tarea' : 'Nueva tarea'} locked={busy} onClose={() => setDialog(null)}>
                    <TodoForm
                        key={dialog.mode === 'edit' ? dialog.task.id : 'new'}
                        initial={dialog.mode === 'edit' ? dialog.task : undefined}
                        busy={busy}
                        error={dialogError}
                        onSubmit={submitTask}
                        onCancel={() => setDialog(null)}
                    />
                </Dialog>
            )}
        </div>
    );
}

export default function TasksPage() {
    const { user } = useAuth();
    return user ? <Workspace key={user.uid} user={user} /> : null;
}
