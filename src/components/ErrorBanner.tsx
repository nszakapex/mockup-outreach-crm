import { AlertTriangle } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl text-sm"
      style={{
        background: 'var(--color-error-subtle)',
        border: '1px solid var(--color-error-muted)',
        color: 'var(--color-error)',
      }}
    >
      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">Error loading data</div>
        <div className="mt-0.5 text-xs opacity-80 break-all">{message}</div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          style={{
            background: 'var(--color-error-muted)',
            color: 'var(--color-error)',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
