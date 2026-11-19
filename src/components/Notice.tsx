import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import type { ReactNode } from 'react';

interface NoticeProps {
    tone?: 'error' | 'success' | 'info';
    children: ReactNode;
}

export function Notice({ tone = 'error', children }: NoticeProps) {
    const Icon = { error: CircleAlert, success: CircleCheck, info: Info }[tone];

    return (
        <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
            <Icon size={17} aria-hidden="true" />
            <div>{children}</div>
        </div>
    );
}
