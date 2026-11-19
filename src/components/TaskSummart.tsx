import { CircleCheck, Clock3, TrendingUp } from 'lucide-react';

interface TaskSummaryProps {
    total: number;
    pending: number;
    completed: number;
}

export function TaskSummary({ total, pending, completed }: TaskSummaryProps) {
    const progress = total ? Math.round((completed / total) * 100) : 0;

    return (
        <section className="summary-grid" aria-label="Progreso de las tareas">
            <div className="summary-card progress-card">
                <span className="summary-icon"><TrendingUp size={18} aria-hidden="true" /></span>
                <div className="progress-title">
                    <p>Progreso</p>
                    <strong>{progress}%</strong>
                </div>
                <progress value={progress} max={100} aria-label="Porcentaje de tareas completadas" />
                <p className="progress-caption">{completed} de {total} tareas completadas</p>
            </div>
            <div className="summary-card">
                <span className="summary-icon summary-clock"><Clock3 size={19} aria-hidden="true" /></span>
                <p>Pendientes</p>
                <strong>{pending}</strong>
            </div>
            <div className="summary-card">
                <span className="summary-icon summary-check"><CircleCheck size={19} aria-hidden="true" /></span>
                <p>Completadas</p>
                <strong>{completed}</strong>
            </div>
        </section>
    );
}
