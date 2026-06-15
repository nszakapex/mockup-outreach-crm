import { Database, HardDrive } from 'lucide-react';

interface DataSourceBadgeProps {
  source: 'supabase' | 'seed';
}

export default function DataSourceBadge({ source }: DataSourceBadgeProps) {
  const isLive = source === 'supabase';

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        background: isLive ? 'var(--color-emerald-muted)' : 'var(--color-warning-subtle)',
        color: isLive ? 'var(--color-emerald)' : 'var(--color-warning)',
      }}
    >
      {isLive ? <Database size={10} /> : <HardDrive size={10} />}
      {isLive ? 'Supabase' : 'Seed fallback'}
    </span>
  );
}
