import { Disc3 } from 'lucide-react';

export function Brand() {
    return (
        <div className="brand" aria-label="Foco">
            <span className="brand-mark"><Disc3 size={21} aria-hidden="true" /></span>
            <span>Foco<span className="brand-dot">.</span></span>
        </div>
    );
}
