interface LeadScoreBadgeProps {
  score: number;
}

export default function LeadScoreBadge({ score }: LeadScoreBadgeProps) {
  let color: string;
  let bg: string;

  if (score >= 80) {
    color = 'var(--color-success)';
    bg = 'oklch(70% 0.18 150 / 0.12)';
  } else if (score >= 60) {
    color = 'var(--color-accent)';
    bg = 'var(--color-accent-muted)';
  } else if (score >= 40) {
    color = 'var(--color-warning)';
    bg = 'oklch(75% 0.16 85 / 0.12)';
  } else {
    color = 'var(--color-ink-3)';
    bg = 'var(--color-paper-3)';
  }

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold tabular-nums"
      style={{ color, background: bg }}
    >
      {score}
    </span>
  );
}
