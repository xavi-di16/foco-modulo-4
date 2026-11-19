import { expect, it } from 'vitest';
import { formatSummary } from '../../server/summary';

it('enumera todas las tareas y diferencia los estados', () => {
    const summary = formatSummary([
        { title: 'Llamar al equipo', completed: true },
        { title: 'Enviar\n factura', completed: false },
    ]);

    expect(summary.text).toContain('Total: 2\nPendientes: 1\nCompletadas: 1');
    expect(summary.text).toContain('- Pendiente: Enviar factura\n- Completada: Llamar al equipo');
    expect(summary.html).toContain('50%');
});

it('puede resumir una cuenta sin tareas', () => {
    const summary = formatSummary([]);
    expect(summary.text).toContain('Todavía no tenés tareas.');
    expect(summary.html).toContain('0%');
});

it('muestra los detalles de la tarea y escapa su título en el correo HTML', () => {
    const summary = formatSummary([
        { title: 'Revisar <factura> & enviar', completed: false, priority: 'high', dueDate: '2027-01-15' },
    ], 'foco-modulo-4.vercel.app');

    expect(summary.html).toContain('Revisar &lt;factura&gt; &amp; enviar');
    expect(summary.html).not.toContain('<factura>');
    expect(summary.html).toContain('href="https://foco-modulo-4.vercel.app/tareas"');
    expect(summary.text).toContain('Prioridad Alta');
    expect(summary.text).toContain('15 de ene de 2027');
});
