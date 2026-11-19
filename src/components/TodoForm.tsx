import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import type { Priority, TaskInput } from '../types/task';
import { DESCRIPTION_LIMIT, priorityLabels, TITLE_LIMIT, toTaskInput, validateTask } from '../utils/tasks';
import type { TaskFormErrors, TaskFormValues } from '../utils/tasks';
import { Notice } from './Notice';

interface TodoFormProps {
    initial?: TaskInput;
    busy?: boolean;
    error?: string | null;
    onSubmit: (input: TaskInput) => void;
    onCancel: () => void;
}

export function TodoForm({ initial, busy, error, onSubmit, onCancel }: TodoFormProps) {
    const formId = useId();
    const [values, setValues] = useState<TaskFormValues>({
        title: initial?.title ?? '',
        description: initial?.description ?? '',
        priority: initial?.priority ?? 'medium',
        dueDate: initial?.dueDate ?? '',
    });
    const [errors, setErrors] = useState<TaskFormErrors>({});

    function change<Field extends keyof TaskFormValues>(field: Field, value: TaskFormValues[Field]) {
        setValues(current => ({ ...current, [field]: value }));
        setErrors(current => ({ ...current, [field]: undefined }));
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        const nextErrors = validateTask(values);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length === 0) onSubmit(toTaskInput(values));
    }

    return (
        <form className="task-form" onSubmit={submit} noValidate aria-busy={busy}>
            <div className="field">
                <label htmlFor={`${formId}-title`}>Título</label>
                <input
                    id={`${formId}-title`}
                    placeholder="Ej. Preparar la reunión del lunes"
                    value={values.title}
                    onChange={event => change('title', event.target.value)}
                    maxLength={TITLE_LIMIT}
                    aria-invalid={Boolean(errors.title)}
                    aria-describedby={errors.title ? `${formId}-title-error` : undefined}
                    data-initial-focus
                    required
                />
                {errors.title && <p id={`${formId}-title-error`} className="field-error">{errors.title}</p>}
            </div>
            <div className="field">
                <label htmlFor={`${formId}-description`}>Descripción</label>
                <textarea
                    id={`${formId}-description`}
                    placeholder="¿Qué necesitás hacer?"
                    rows={4}
                    value={values.description}
                    onChange={event => change('description', event.target.value)}
                    maxLength={DESCRIPTION_LIMIT}
                    aria-invalid={Boolean(errors.description)}
                    aria-describedby={errors.description ? `${formId}-description-error` : undefined}
                    required
                />
                {errors.description && <p id={`${formId}-description-error`} className="field-error">{errors.description}</p>}
            </div>
            <div className="form-columns">
                <div className="field">
                    <label htmlFor={`${formId}-priority`}>Prioridad</label>
                    <select id={`${formId}-priority`} value={values.priority} onChange={event => change('priority', event.target.value as Priority)}>
                        {Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </div>
                <div className="field">
                    <label htmlFor={`${formId}-due`}>Vencimiento <span className="optional">(opcional)</span></label>
                    <input
                        id={`${formId}-due`}
                        type="date"
                        value={values.dueDate}
                        onChange={event => change('dueDate', event.target.value)}
                        aria-invalid={Boolean(errors.dueDate)}
                        aria-describedby={errors.dueDate ? `${formId}-due-error` : undefined}
                    />
                    {errors.dueDate && <p id={`${formId}-due-error`} className="field-error">{errors.dueDate}</p>}
                </div>
            </div>
            {error && <Notice>{error}</Notice>}
            <div className="dialog-actions">
                <button type="button" className="button button-secondary" onClick={onCancel} disabled={busy}>Cancelar</button>
                <button type="submit" className="button button-primary" disabled={busy}>
                    {busy ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear tarea'}
                </button>
            </div>
        </form>
    );
}
