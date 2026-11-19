import type { Priority } from '../src/types/task.js';
import { formatDueDate } from '../src/utils/dates.js';
import { priorityLabels } from '../src/utils/tasks.js';

export interface SummaryTask {
    title: string;
    completed: boolean;
    priority?: Priority;
    dueDate?: string;
}

export interface SummaryEmail {
    html: string;
    text: string;
}

const palette = {
    canvas: '#f5f6ef',
    paper: '#ffffff',
    ink: '#24281c',
    muted: '#5e6457',
    line: '#e2e5d9',
    olive: '#292f1b',
    lime: '#dce995',
    pending: '#f7edd8',
    completed: '#edf2e2',
};

const priorityColors = {
    high: { background: '#faebe4', ink: '#8b382a' },
    medium: { background: '#fbf0d8', ink: '#795316' },
    low: { background: '#eef3e2', ink: '#45602e' },
};

const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, character => entities[character]);
}

function formatDeadline(date?: string) {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`))) return;
    return formatDueDate(date);
}

function renderTaskList(label: string, tasks: SummaryTask[], emptyMessage: string) {
    const rows = tasks.map(task => {
        const priority = task.priority ? priorityColors[task.priority] : null;
        const priorityBadge = task.priority && priority
            ? `<span style="display:inline-block;background:${priority.background};color:${priority.ink};border-radius:12px;padding:3px 8px;margin-right:8px;font-weight:700;">${priorityLabels[task.priority]}</span>`
            : '';
        const deadline = task.dueDate ? `Vence ${escapeHtml(task.dueDate)}` : '';
        const meta = priorityBadge || deadline
            ? `<p style="margin:6px 0 0;color:${palette.muted};font-size:13px;line-height:20px;">${priorityBadge}${deadline}</p>`
            : '';
        return `<tr><td style="padding:12px 18px;border-top:1px solid ${palette.line};">
            <p style="margin:0;font-size:15px;line-height:21px;font-weight:700;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(task.title)}</p>
            ${meta}
        </td></tr>`;
    }).join('');

    return `<tr><td style="padding-top:14px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${palette.paper}" style="border:1px solid ${palette.line};border-radius:14px;">
            <tr><td style="padding:14px 18px;"><h2 style="margin:0;font-size:16px;line-height:22px;">${label}</h2></td></tr>
            ${rows || `<tr><td style="padding:12px 18px;border-top:1px solid ${palette.line};font-size:14px;color:${palette.muted};">${emptyMessage}</td></tr>`}
        </table>
    </td></tr>`;
}

export function formatSummary(tasks: SummaryTask[], productionHost?: string): SummaryEmail {
    const ordered = tasks.map(task => ({
        ...task,
        title: task.title.replace(/\s+/g, ' ').trim(),
        dueDate: formatDeadline(task.dueDate),
    })).sort((a, b) => Number(a.completed) - Number(b.completed) || a.title.localeCompare(b.title, 'es-AR'));
    const pending = ordered.filter(task => !task.completed);
    const completed = ordered.filter(task => task.completed);
    const percentage = tasks.length ? Math.round(completed.length / tasks.length * 100) : 0;
    const tasksUrl = productionHost && /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(productionHost)
        ? `https://${productionHost}/tareas`
        : null;

    const lines = [
        'Resumen de tus tareas en Foco',
        '',
        `Total: ${ordered.length}`,
        `Pendientes: ${pending.length}`,
        `Completadas: ${completed.length}`,
        '',
    ];

    if (ordered.length === 0) lines.push('Todavía no tenés tareas.');
    for (const task of ordered) {
        const details = [
            task.priority ? `Prioridad ${priorityLabels[task.priority]}` : '',
            task.dueDate ? `vence ${task.dueDate}` : '',
        ].filter(Boolean).join(' · ');
        lines.push(`- ${task.completed ? 'Completada' : 'Pendiente'}: ${task.title}${details ? ` (${details})` : ''}`);
    }
    if (tasksUrl) lines.push('', `Abrir mis tareas: ${tasksUrl}`);

    const progressBar = percentage > 0
        ? `<table role="presentation" width="${percentage}%" cellspacing="0" cellpadding="0" bgcolor="${palette.lime}" style="border-radius:8px;"><tr><td height="7" style="height:7px;font-size:0;line-height:0;">&nbsp;</td></tr></table>`
        : '';
    const button = tasksUrl
        ? `<tr><td align="center" style="padding-top:22px;">
            <a href="${tasksUrl}" style="display:inline-block;background:${palette.lime};color:${palette.olive};border:1px solid #cdd97e;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:700;text-decoration:none;">Abrir mis tareas</a>
        </td></tr>`
        : '';

    const html = `<!doctype html>
<html lang="es-AR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resumen de tus tareas · Foco</title></head>
<body style="margin:0;padding:0;background:${palette.canvas};color:${palette.ink};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="${palette.canvas}" style="font-family:Arial,sans-serif;color:${palette.ink};">
<tr><td align="center" style="padding:26px 12px 32px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:600px;text-align:left;">
        <tr><td style="padding:0 2px 14px;font-size:27px;line-height:32px;letter-spacing:-1px;font-weight:800;">Foco<span style="color:#748648;">.</span></td></tr>
        <tr><td bgcolor="${palette.olive}" style="padding:23px 20px;border-radius:16px;color:#f7faed;">
            <h1 style="margin:0 0 20px;color:#f7faed;font-size:28px;line-height:33px;letter-spacing:-.7px;">Resumen de tus tareas</h1>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="color:#e6eadb;">
                <tr><td style="font-size:15px;font-weight:700;">Progreso</td><td align="right" style="font-size:29px;line-height:33px;font-weight:800;color:${palette.lime};">${percentage}%</td></tr>
            </table>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#525c3c" style="margin-top:10px;border-radius:8px;">
                <tr><td height="7" style="height:7px;font-size:0;line-height:0;">${progressBar || '&nbsp;'}</td></tr>
            </table>
            <p style="margin:9px 0 0;color:#d7deca;font-size:13px;line-height:18px;">${completed.length} de ${tasks.length} tareas completadas</p>
        </td></tr>
        <tr><td style="padding-top:13px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    <td width="50%" style="padding-right:6px;"><div style="padding:14px;background:${palette.pending};border:1px solid ${palette.line};border-radius:12px;">
                        <p style="margin:0 0 5px;color:#795316;font-size:14px;font-weight:700;">Pendientes</p>
                        <p style="margin:0;color:${palette.ink};font-size:27px;font-weight:800;">${pending.length}</p>
                    </div></td>
                    <td width="50%" style="padding-left:6px;"><div style="padding:14px;background:${palette.completed};border:1px solid ${palette.line};border-radius:12px;">
                        <p style="margin:0 0 5px;color:#45602e;font-size:14px;font-weight:700;">Completadas</p>
                        <p style="margin:0;color:${palette.ink};font-size:27px;font-weight:800;">${completed.length}</p>
                    </div></td>
                </tr>
            </table>
        </td></tr>
        ${renderTaskList('Tareas pendientes', pending, 'No tenés tareas pendientes.')}
        ${renderTaskList('Tareas completadas', completed, 'Todavía no completaste tareas.')}
        ${button}
    </table>
</td></tr>
</table>
</body>
</html>`;

    return { html, text: lines.join('\n') };
}
