import { type ReactNode } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onBack?: () => void;
}

export function PageHeader({ title, subtitle, actions, onBack }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-slide-up">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-all duration-200 hover:scale-105 shrink-0"
          >
            <ArrowRight size={20} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-800 tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-neutral-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  color?: string;
  trend?: string;
}

export function StatCard({ icon, label, value, color = 'primary', trend }: StatCardProps) {
  const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
    primary: { bg: 'bg-primary-50', text: 'text-primary-600', ring: 'hover:ring-primary-200' },
    success: { bg: 'bg-success-50', text: 'text-success-600', ring: 'hover:ring-success-200' },
    warning: { bg: 'bg-accent-50', text: 'text-accent-600', ring: 'hover:ring-accent-200' },
    error: { bg: 'bg-error-50', text: 'text-error-600', ring: 'hover:ring-error-200' },
    neutral: { bg: 'bg-neutral-100', text: 'text-neutral-600', ring: 'hover:ring-neutral-300' },
  };
  const c = colorMap[color] ?? colorMap.primary;
  return (
    <div className={`card p-5 hover:shadow-elevated hover:-translate-y-0.5 transition-all duration-300 ring-1 ring-transparent ${c.ring}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-neutral-800 mt-2 font-display tracking-tight">{value}</p>
          {trend && <p className="text-xs text-neutral-400 mt-1">{trend}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center transition-transform duration-300 hover:scale-110`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        className="btn-secondary px-3 py-2"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ArrowRight size={16} />
      </button>
      <span className="text-sm text-neutral-600 px-3">
        {currentPage} / {totalPages}
      </span>
      <button
        className="btn-secondary px-3 py-2"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ArrowLeft size={16} />
      </button>
    </div>
  );
}
