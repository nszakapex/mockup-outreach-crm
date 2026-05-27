'use client';

import { useEffect, useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import Card from './Card';
import Button from './Button';

type GmailDebug = {
  googleClientIdConfigured: boolean;
  googleClientSecretConfigured: boolean;
  googleRefreshTokenConfigured: boolean;
  gmailSenderEmailConfigured: boolean;
  testMode: boolean;
  dailyCap: number;
  sendsToday: number;
  remainingToday: number;
  errorMessage: string | null;
};

export default function GmailStatusPanel() {
  const [data, setData] = useState<GmailDebug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/debug/gmail', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.errorMessage || `Gmail status failed with HTTP ${response.status}`);
      setData(payload);
      setError(payload.errorMessage);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Unable to load Gmail sender status.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadStatus();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <Card
      title="Gmail Sender Status"
      action={
        <Button variant="secondary" size="sm" onClick={loadStatus} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              background: data?.testMode === false ? 'var(--color-emerald-muted)' : 'oklch(75% 0.16 85 / 0.12)',
              color: data?.testMode === false ? 'var(--color-emerald)' : 'var(--color-warning)',
            }}
          >
            <Mail size={12} />
            {data?.testMode === false ? 'Live Gmail mode' : 'Test mode'}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
            {data ? `${data.sendsToday} sent today, ${data.remainingToday} remaining` : 'Checking sender status...'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <StatusRow label="Google client ID configured" value={data?.googleClientIdConfigured} />
          <StatusRow label="Google client secret configured" value={data?.googleClientSecretConfigured} />
          <StatusRow label="Google refresh token configured" value={data?.googleRefreshTokenConfigured} />
          <StatusRow label="Gmail sender email configured" value={data?.gmailSenderEmailConfigured} />
          <TextRow label="Test mode" value={data ? (data.testMode ? 'Yes' : 'No') : 'Checking...'} ok={data?.testMode === false ? true : undefined} />
          <TextRow label="Daily cap" value={data ? String(data.dailyCap) : 'Checking...'} />
          <TextRow label="Sends today" value={data ? String(data.sendsToday) : 'Checking...'} />
          <TextRow label="Remaining today" value={data ? String(data.remainingToday) : 'Checking...'} />
        </div>

        {error && (
          <div
            className="rounded-lg p-3 text-xs break-all"
            style={{
              background: 'oklch(75% 0.16 85 / 0.08)',
              border: '1px solid oklch(75% 0.16 85 / 0.2)',
              color: 'var(--color-warning)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </Card>
  );
}

function StatusRow({ label, value }: { label: string; value: boolean | undefined }) {
  return <TextRow label={label} value={typeof value === 'undefined' ? 'Checking...' : value ? 'Yes' : 'No'} ok={value} />;
}

function TextRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span style={{ color: 'var(--color-ink-3)' }}>{label}</span>
      <span
        className="font-medium text-right"
        style={{
          color:
            typeof ok === 'undefined'
              ? 'var(--color-ink-2)'
              : ok
                ? 'var(--color-success)'
                : 'var(--color-error)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
