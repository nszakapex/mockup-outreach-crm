'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Mail, RefreshCw } from 'lucide-react';
import Card from './Card';

type RecentSendItem = {
  id: string;
  prospectId: string;
  businessName: string;
  toEmail: string;
  subject: string;
  status: string;
  provider: string;
  sentAt: string | null;
  createdAt: string;
  errorMessage: string | null;
};

type RecentResponse = {
  ok: boolean;
  recentSends?: RecentSendItem[];
  errorMessage?: string;
};

export default function LatestSendCard({ className = '' }: { className?: string }) {
  const [latestSend, setLatestSend] = useState<RecentSendItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch('/api/outreach/recent?limit=1', { cache: 'no-store' });
        const payload = (await response.json().catch(() => null)) as RecentResponse | null;
        if (!response.ok || payload?.ok !== true) {
          throw new Error(payload?.errorMessage || `Latest send failed with HTTP ${response.status}`);
        }
        setLatestSend(payload.recentSends?.[0] || null);
        setError(null);
      } catch (latestError) {
        setError(latestError instanceof Error ? latestError.message : 'Unable to load latest send.');
      } finally {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <Card title="Latest Send" className={className}>
      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-ink-3)' }}>
          <RefreshCw size={14} className="animate-spin" />
          Checking latest send...
        </div>
      ) : error ? (
        <div className="text-xs break-all" style={{ color: 'var(--color-warning)' }}>
          {error}
        </div>
      ) : !latestSend ? (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'var(--color-paper-3)', color: 'var(--color-ink-3)' }}
          >
            <Mail size={16} />
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              No sends yet
            </div>
            <div className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
              Completed test or Gmail sends will appear here.
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                {latestSend.businessName}
              </span>
              <SendStatusPill status={latestSend.status} />
              <span className="text-xs uppercase" style={{ color: 'var(--color-ink-muted)' }}>
                {latestSend.provider}
              </span>
            </div>
            <div className="mt-1 text-xs" style={{ color: 'var(--color-ink-3)' }}>
              {latestSend.toEmail} - {formatSendDate(latestSend.sentAt || latestSend.createdAt)}
            </div>
            <div className="mt-2 truncate text-sm" style={{ color: 'var(--color-ink-2)' }}>
              {latestSend.subject}
            </div>
            {latestSend.errorMessage && (
              <div className="mt-2 text-xs break-all" style={{ color: 'var(--color-error)' }}>
                {latestSend.errorMessage}
              </div>
            )}
          </div>
          <Link
            href={`/prospects/${latestSend.prospectId}`}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            style={{
              background: 'var(--color-paper-3)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-ink)',
            }}
          >
            <Eye size={13} />
            View Prospect
          </Link>
        </div>
      )}
    </Card>
  );
}

function SendStatusPill({ status }: { status: string }) {
  const config = getStatusStyle(status);
  return (
    <span
      className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'sent':
      return { label: 'Sent', color: 'var(--color-emerald)', bg: 'var(--color-emerald-muted)' };
    case 'test_sent':
      return { label: 'Test Sent', color: 'var(--color-warning)', bg: 'var(--color-warning-subtle)' };
    case 'failed':
      return { label: 'Failed', color: 'var(--color-error)', bg: 'var(--color-error-subtle)' };
    case 'skipped':
      return { label: 'Skipped', color: 'var(--color-ink-3)', bg: 'var(--color-paper-3)' };
    case 'queued':
      return { label: 'Queued', color: 'var(--color-accent)', bg: 'var(--color-accent-muted)' };
    default:
      return { label: status.replace(/_/g, ' '), color: 'var(--color-ink-2)', bg: 'var(--color-paper-3)' };
  }
}

function formatSendDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
