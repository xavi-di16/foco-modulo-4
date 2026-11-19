import { expect, it } from 'vitest';
import { formatSummary } from '../../server/summary';

it('enumera todas las tareas y diferencia los estados', () => {
    const summary = formatSummary([
        { title: 'Llamar al equipo', completed: true },
        { title: 'Enviar\n factura', completed: false },
    ]);

    expect(summary).toContain('Total: 2\nPendientes: 1\nCompletadas: 1');
    expect(summary).toContain('- Pendiente: Enviar factura\n- Completada: Llamar al equipo');
});

it('puede resumir una cuenta sin tareas', () => {
    expect(formatSummary([])).toContain('Todavía no tenés tareas.');
});
