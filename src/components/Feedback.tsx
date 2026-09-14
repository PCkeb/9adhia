import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-primary-500 ${className}`} />;
}

export function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={40} />
        <p className="text-sm text-neutral-500">جاري التحميل...</p>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <LoadingSpinner size={32} />
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: { icon?: ReactNode; title: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-neutral-300">{icon}</div>}
      <h3 className="text-base font-semibold text-neutral-700">{title}</h3>
      {message && <p className="mt-1.5 text-sm text-neutral-500 max-w-sm">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 w-12 h-12 rounded-full bg-error-50 flex items-center justify-center text-error-500">
        <span className="text-xl">!</span>
      </div>
      <h3 className="text-base font-semibold text-neutral-700">حدث خطأ</h3>
      <p className="mt-1.5 text-sm text-neutral-500 max-w-sm">{message}</p>
      {onRetry && <button className="btn-secondary mt-5" onClick={onRetry}>إعادة المحاولة</button>}
    </div>
  );
}
