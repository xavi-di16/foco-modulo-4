export interface SummaryTask {
    title: string;
    completed: boolean;
}

export function formatSummary(tasks: SummaryTask[]) {
    const ordered = [...tasks].sort((a, b) => Number(a.completed) - Number(b.completed)
        || a.title.localeCompare(b.title, 'es-AR'));
    const completed = ordered.filter(task => task.completed).length;
    const pending = ordered.length - completed;
    const lines = [
        'Resumen de tus tareas en Foco',
        '',
        `Total: ${ordered.length}`,
        `Pendientes: ${pending}`,
        `Completadas: ${completed}`,
        '',
    ];

    if (ordered.length === 0) lines.push('Todavía no tenés tareas.');
    ordered.forEach(task => {
        const title = task.title.replace(/\s+/g, ' ').trim();
        lines.push(`- ${task.completed ? 'Completada' : 'Pendiente'}: ${title}`);
    });

    return lines.join('\n');
}
