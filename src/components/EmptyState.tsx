import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: 'var(--color-paper-3)',
          color: 'var(--color-ink-3)',
          border: '1px solid var(--color-divider)',
        }}
      >
        {icon}
      </div>
      <h3
        className="text-lg font-semibold mb-1"
        style={{ color: 'var(--color-ink)' }}
      >
        {title}
      </h3>
      <p
        className="text-sm max-w-sm mb-6"
        style={{ color: 'var(--color-ink-3)' }}
      >
        {description}
      </p>
      {action}
    </div>
  );
}
