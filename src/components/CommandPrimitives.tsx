import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowLeft, CheckCircle, Info, ShieldAlert, TriangleAlert } from 'lucide-react';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

const TONE_STYLES: Record<Tone, CSSProperties> = {
  neutral: {
    background: 'var(--color-paper-3)',
    color: 'var(--color-ink-2)',
    borderColor: 'var(--color-divider)',
  },
  info: {
    background: 'var(--color-accent-subtle)',
    color: 'var(--color-info)',
    borderColor: 'var(--color-accent-muted)',
  },
  accent: {
    background: 'var(--color-accent-muted)',
    color: 'var(--color-accent)',
    borderColor: 'var(--color-accent-muted)',
  },
  success: {
    background: 'var(--color-emerald-subtle)',
    color: 'var(--color-success)',
    borderColor: 'var(--color-emerald-muted)',
  },
  warning: {
    background: 'var(--color-warning-subtle)',
    color: 'var(--color-warning)',
    borderColor: 'var(--color-warning-muted)',
  },
  danger: {
    background: 'var(--color-error-subtle)',
    color: 'var(--color-error)',
    borderColor: 'var(--color-error-muted)',
  },
};

export function StatusPill({
  tone = 'neutral',
  icon,
  children,
  className = '',
  title,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none whitespace-nowrap ${className}`}
      style={TONE_STYLES[tone]}
    >
      {icon}
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
  backHref,
  backLabel = 'Back',
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-6 space-y-4">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          style={{ color: 'var(--color-ink-3)' }}
        >
          <ArrowLeft size={14} />
          {backLabel}
        </Link>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {eyebrow}
            </div>
          )}
          <h1 className="text-3xl font-semibold tracking-normal" style={{ color: 'var(--color-ink)' }}>
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: 'var(--color-ink-3)' }}>
              {description}
            </p>
          )}
          {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
}) {
  const toneStyle = TONE_STYLES[tone];
  return (
    <div className="command-surface rounded-xl p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--color-ink-3)' }}>
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums" style={{ color: 'var(--color-ink)' }}>
            {value}
          </div>
        </div>
        {icon && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border"
            style={toneStyle}
          >
            {icon}
          </div>
        )}
      </div>
      {detail && (
        <div className="mt-3 text-xs leading-5" style={{ color: 'var(--color-ink-3)' }}>
          {detail}
        </div>
      )}
    </div>
  );
}

export function SafetyBanner({
  tone = 'info',
  title,
  children,
  icon,
  className = '',
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const fallbackIcon =
    tone === 'danger' ? <ShieldAlert size={17} /> : tone === 'warning' ? <TriangleAlert size={17} /> : tone === 'success' ? <CheckCircle size={17} /> : <Info size={17} />;

  return (
    <div
      className={`rounded-xl border p-4 ${className}`}
      style={TONE_STYLES[tone]}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{icon || fallbackIcon}</div>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          {children && <div className="mt-1 text-sm leading-6 opacity-90">{children}</div>}
        </div>
      </div>
    </div>
  );
}

export function ReadinessPanel({
  title,
  description,
  items,
}: {
  title: string;
  description?: ReactNode;
  items: Array<{ label: string; value: ReactNode; tone?: Tone; detail?: ReactNode }>;
}) {
  return (
    <div className="command-surface rounded-xl p-4">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
          {title}
        </div>
        {description && (
          <div className="text-xs leading-5" style={{ color: 'var(--color-ink-3)' }}>
            {description}
          </div>
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="subtle-surface rounded-lg p-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--color-ink-3)' }}>
              {item.label}
            </div>
            <div className="mt-2">
              <StatusPill tone={item.tone || 'neutral'}>{item.value}</StatusPill>
            </div>
            {item.detail && (
              <div className="mt-2 text-xs leading-5" style={{ color: 'var(--color-ink-3)' }}>
                {item.detail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FieldValue({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--color-ink-3)' }}>
        {label}
      </div>
      <div
        className={`mt-1 truncate text-sm font-medium ${mono ? 'font-mono' : ''}`}
        style={{ color: 'var(--color-ink)' }}
        title={typeof value === 'string' ? value : undefined}
      >
        {value}
      </div>
    </div>
  );
}
