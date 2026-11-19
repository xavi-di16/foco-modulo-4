import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, ClipboardList, GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { Task, TaskFilter } from '../types/task';
import { formatDueDate, localDateKey } from '../utils/dates';
import { priorityLabels } from '../utils/tasks';

interface TaskActions {
    onToggle: (task: Task) => void;
    onEdit: (task: Task) => void;
    onDelete: (task: Task) => void;
}

interface TodoListProps extends TaskActions {
    tasks: Task[];
    filter: TaskFilter;
    busy?: boolean;
    onReorder?: (ids: string[]) => void;
}

function TaskItem({
    task, busy, sortable, onToggle, onEdit, onDelete,
}: TaskActions & { task: Task; busy?: boolean; sortable: boolean }) {
    const drag = useSortable({ id: task.id, disabled: !sortable || busy });
    const overdue = !task.completed && task.dueDate && task.dueDate < localDateKey();

    return (
        <li
            ref={drag.setNodeRef}
            className={`task-row${task.completed ? ' task-completed' : ''}${drag.isDragging ? ' task-dragging' : ''}`}
            style={{ transform: CSS.Transform.toString(drag.transform), transition: drag.transition }}
        >
            {sortable && (
                <button
                    className="icon-button task-grip"
                    type="button"
                    ref={drag.setActivatorNodeRef}
                    {...drag.attributes}
                    {...drag.listeners}
                    aria-label={`Mover ${task.title}`}
                    title="Arrastrá para reordenar"
                    disabled={busy}
                >
                    <GripVertical size={18} aria-hidden="true" />
                </button>
            )}
            <input
                className="task-checkbox"
                type="checkbox"
                checked={task.completed}
                aria-label={task.completed ? `Marcar pendiente: ${task.title}` : `Completar: ${task.title}`}
                onChange={() => onToggle(task)}
                disabled={busy}
            />
            <div className="task-copy">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <div className="task-meta">
                    <span className={`priority priority-${task.priority}`}>
                        <span className="priority-dot" />
                        <span className="sr-only">Prioridad </span>
                        {priorityLabels[task.priority]}
                    </span>
                    {task.dueDate && (
                        <span className={`due-date${overdue ? ' overdue' : ''}`}>
                            <CalendarDays size={14} aria-hidden="true" />
                            <span className="sr-only">{overdue ? 'Vencida el ' : 'Vence el '}</span>
                            <time dateTime={task.dueDate}>{formatDueDate(task.dueDate)}</time>
                        </span>
                    )}
                </div>
            </div>
            <div className="task-actions">
                <button
                    className="icon-button"
                    type="button"
                    aria-label={`Editar ${task.title}`}
                    title="Editar"
                    onClick={() => onEdit(task)}
                    disabled={busy}
                >
                    <Pencil size={17} aria-hidden="true" />
                </button>
                <button
                    className="icon-button delete-action"
                    type="button"
                    aria-label={`Eliminar ${task.title}`}
                    title="Eliminar"
                    onClick={() => onDelete(task)}
                    disabled={busy}
                >
                    <Trash2 size={17} aria-hidden="true" />
                </button>
            </div>
        </li>
    );
}

const emptyMessages: Record<TaskFilter, string> = {
    all: 'Todavía no tenés tareas',
    pending: 'No tenés tareas pendientes',
    completed: 'Todavía no completaste tareas',
};

export function TodoList({ tasks, filter, busy, onReorder, ...actions }: TodoListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );
    const ids = tasks.map(task => task.id);
    const sortable = Boolean(onReorder) && tasks.length > 1;

    function dragEnded({ active, over }: DragEndEvent) {
        if (!onReorder || busy || !over || active.id === over.id) return;
        const from = ids.findIndex(id => id === active.id);
        const to = ids.findIndex(id => id === over.id);
        if (from >= 0 && to >= 0) onReorder(arrayMove(ids, from, to));
    }

    if (tasks.length === 0) {
        return (
            <div className="empty-state">
                <span className="empty-icon"><ClipboardList size={27} aria-hidden="true" /></span>
                <h3>{emptyMessages[filter]}</h3>
                {filter === 'all' && <p>Usá Nueva tarea para agregar la primera.</p>}
            </div>
        );
    }

    const list = (
        <ul className="task-list" aria-label="Lista de tareas">
            {tasks.map(task => <TaskItem key={task.id} task={task} busy={busy} sortable={sortable} {...actions} />)}
        </ul>
    );
    if (!sortable) return list;

    function titleFor(id: string | number) {
        return tasks.find(task => task.id === id)?.title ?? 'la tarea';
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={dragEnded}
            accessibility={{
                screenReaderInstructions: {
                    draggable: 'Presioná espacio para levantar la tarea. Usá las flechas para moverla, espacio para soltarla y Escape para cancelar.',
                },
                announcements: {
                    onDragStart: ({ active }) => `Levantaste ${titleFor(active.id)}.`,
                    onDragOver: ({ over }) => over ? `Sobre ${titleFor(over.id)}.` : 'Fuera de la lista.',
                    onDragEnd: ({ over }) => over ? 'Tarea movida.' : 'Movimiento cancelado.',
                    onDragCancel: () => 'Movimiento cancelado.',
                },
            }}
        >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>{list}</SortableContext>
        </DndContext>
    );
}
