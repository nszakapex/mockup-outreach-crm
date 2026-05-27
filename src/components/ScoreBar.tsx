interface ScoreBarProps {
  label: string;
  score: number | null;
}

export default function ScoreBar({ label, score }: ScoreBarProps) {
  if (score === null) return null;

  let color: string;
  if (score >= 70) color = 'var(--color-success)';
  else if (score >= 50) color = 'var(--color-warning)';
  else color = 'var(--color-error)';

  return (
    <div className="flex items-center gap-3">
      <span
        className="text-xs font-medium w-16 shrink-0"
        style={{ color: 'var(--color-ink-2)' }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--color-paper-3)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span
        className="text-xs font-bold tabular-nums w-8 text-right"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}
