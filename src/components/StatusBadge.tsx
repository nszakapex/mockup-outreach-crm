import { STATUS_CONFIG, type ProspectStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: ProspectStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const isSmall = size === 'sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full whitespace-nowrap ${
        isSmall ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}
      style={{
        color: config.color,
        background: config.bg,
      }}
    >
      {config.label}
    </span>
  );
}
