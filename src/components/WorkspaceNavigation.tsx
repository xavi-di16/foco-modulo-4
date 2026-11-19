import { CircleCheck, Clock3, Layers3 } from 'lucide-react';
import type { TaskFilter } from '../types/task';
import { Brand } from './Brand';

const taskFilters = [
    { id: 'all', label: 'Todas', icon: Layers3 },
    { id: 'pending', label: 'Pendientes', icon: Clock3 },
    { id: 'completed', label: 'Completadas', icon: CircleCheck },
] as const;

interface WorkspaceNavigationProps {
    filter: TaskFilter;
    counts: Record<TaskFilter, number> | null;
    onFilter: (filter: TaskFilter) => void;
}

export function WorkspaceNavigation({ filter, counts, onFilter }: WorkspaceNavigationProps) {
    return (
        <aside className="workspace-sidebar">
            <Brand />
            <nav aria-label="Filtros de tareas">
                <p className="sidebar-label">Tareas</p>
                {taskFilters.map(({ id, label, icon: Icon }) => (
                    <button
                        className="filter-button"
                        type="button"
                        key={id}
                        aria-pressed={filter === id}
                        onClick={() => onFilter(id)}
                    >
                        <Icon size={18} aria-hidden="true" />
                        <span>{label}</span>
                        {counts && <span className="filter-count" aria-hidden="true">{counts[id]}</span>}
                    </button>
                ))}
            </nav>
        </aside>
    );
}
