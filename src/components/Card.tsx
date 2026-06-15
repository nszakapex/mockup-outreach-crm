import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function Card({ children, title, description, action, className = '', noPadding }: CardProps) {
  return (
    <div
      className={`command-surface overflow-hidden rounded-xl ${className}`}
      style={{
        background: 'var(--color-paper-2)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {title && (
        <div
          className="flex items-start justify-between gap-4 px-5 py-4"
          style={{ borderBottom: '1px solid var(--color-divider)' }}
        >
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold"
              style={{ color: 'var(--color-ink)' }}
            >
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-xs leading-5" style={{ color: 'var(--color-ink-3)' }}>
                {description}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
