import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
    title: string;
    children: ReactNode;
    locked?: boolean;
    onClose: () => void;
}

export function Dialog({ title, children, locked, onClose }: DialogProps) {
    const heading = useId();
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = ref.current;
        dialog?.showModal();
        dialog?.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
        return () => dialog?.close();
    }, []);

    return (
        <dialog
            ref={ref}
            className="dialog"
            aria-labelledby={heading}
            onCancel={event => {
                event.preventDefault();
                if (!locked) onClose();
            }}
        >
            <div className="dialog-heading">
                <h2 id={heading}>{title}</h2>
                <button type="button" className="icon-button" aria-label="Cerrar" onClick={onClose} disabled={locked}>
                    <X size={21} aria-hidden="true" />
                </button>
            </div>
            {children}
        </dialog>
    );
}
