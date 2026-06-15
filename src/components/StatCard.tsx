import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  accent?: 'blue' | 'emerald' | 'warning' | 'default';
}

const ACCENT_STYLES = {
  blue: {
    iconBg: 'var(--color-accent-muted)',
    iconColor: 'var(--color-accent)',
  },
  emerald: {
    iconBg: 'var(--color-emerald-muted)',
    iconColor: 'var(--color-emerald)',
  },
  warning: {
    iconBg: 'var(--color-warning-subtle)',
    iconColor: 'var(--color-warning)',
  },
  default: {
    iconBg: 'var(--color-paper-3)',
    iconColor: 'var(--color-ink-2)',
  },
};

export default function StatCard({ label, value, icon, accent = 'default' }: StatCardProps) {
  const style = ACCENT_STYLES[accent];

  return (
    <div
      className="command-surface rounded-xl p-4 flex items-start gap-4 transition-colors"
      style={{
        background: 'var(--color-paper-2)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: style.iconBg, color: style.iconColor }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div
          className="text-xs font-semibold uppercase tracking-[0.08em]"
          style={{ color: 'var(--color-ink-3)' }}
        >
          {label}
        </div>
        <div
          className="text-2xl font-semibold mt-1 tabular-nums"
          style={{ color: 'var(--color-ink)' }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
