import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function Card({ children, title, action, className = '', noPadding }: CardProps) {
  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{
        background: 'var(--color-paper-2)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {title && (
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-ink)' }}
          >
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
