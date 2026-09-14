import { type ReactNode } from 'react';
import { STATUS_COLORS } from '@/lib/constants';

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] ?? { bg: 'bg-neutral-100', text: 'text-neutral-600', dot: 'bg-neutral-400' };
  return (
    <span className={`badge ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {status}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = { manager: 'مدير', employee: 'موظف', reader: 'قارئ فقط' };
  const colors: Record<string, string> = {
    manager: 'bg-primary-50 text-primary-700',
    employee: 'bg-success-50 text-success-700',
    reader: 'bg-neutral-100 text-neutral-600',
  };
  return <span className={`badge ${colors[role] ?? 'bg-neutral-100 text-neutral-600'}`}>{labels[role] ?? role}</span>;
}

export function GenericBadge({ children, color = 'neutral' }: { children: ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    neutral: 'bg-neutral-100 text-neutral-600',
    primary: 'bg-primary-50 text-primary-700',
    success: 'bg-success-50 text-success-700',
    warning: 'bg-accent-50 text-accent-700',
    error: 'bg-error-50 text-error-700',
  };
  return <span className={`badge ${colors[color] ?? colors.neutral}`}>{children}</span>;
}
