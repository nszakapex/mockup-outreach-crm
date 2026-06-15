interface LeadScoreBadgeProps {
  score: number;
}

export default function LeadScoreBadge({ score }: LeadScoreBadgeProps) {
  let color: string;
  let bg: string;

  if (score >= 80) {
    color = 'var(--color-success)';
    bg = 'var(--color-emerald-subtle)';
  } else if (score >= 60) {
    color = 'var(--color-accent)';
    bg = 'var(--color-accent-muted)';
  } else if (score >= 40) {
    color = 'var(--color-warning)';
    bg = 'var(--color-warning-subtle)';
  } else {
    color = 'var(--color-ink-3)';
    bg = 'var(--color-paper-3)';
  }

  return (
    <span
    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums"
      style={{ color, background: bg }}
    >
      {score}
    </span>
  );
}
