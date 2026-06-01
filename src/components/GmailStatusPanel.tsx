'use client';

import { useEffect, useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import Card from './Card';
import Button from './Button';

type GmailDebug = {
  apexSenderConfigured: boolean;
  resinateSenderConfigured: boolean;
  profiles: {
    apex: SenderProfileDebug;
    resinate: SenderProfileDebug;
  };
  testMode: boolean;
  dailyCap: number;
  sendsToday: number;
  remainingToday: number;
  errorMessage: string | null;
};

type SenderProfileDebug = {
  key: 'apex' | 'resinate';
  providerName: string;
  senderLabel: string;
  configured: boolean;
  missingFields: string[];
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  refreshTokenConfigured: boolean;
  senderEmailConfigured: boolean;
};

export default function GmailStatusPanel() {
  const [data, setData] = useState<GmailDebug | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadStatus() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/debug/senders', { cache: 'no-store' });
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
      title="Sender Identity Status"
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

        <div className="grid grid-cols-1 gap-3">
          <SenderIdentityBlock label="Apex sender" profile={data?.profiles.apex} />
          <SenderIdentityBlock label="Resinate sender" profile={data?.profiles.resinate} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
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

function SenderIdentityBlock({ label, profile }: { label: string; profile?: SenderProfileDebug }) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'var(--color-paper-3)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
          {label}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium"
          style={{
            background: profile?.configured ? 'var(--color-emerald-muted)' : 'oklch(65% 0.22 25 / 0.1)',
            color: profile?.configured ? 'var(--color-success)' : 'var(--color-error)',
          }}
        >
          {typeof profile === 'undefined' ? 'Checking...' : profile.configured ? 'Configured' : 'Missing'}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-2 sm:gap-x-6">
        <StatusRow label="Client ID configured" value={profile?.clientIdConfigured} />
        <StatusRow label="Client secret configured" value={profile?.clientSecretConfigured} />
        <StatusRow label="Refresh token configured" value={profile?.refreshTokenConfigured} />
        <StatusRow label="Sender email configured" value={profile?.senderEmailConfigured} />
      </div>
      {profile && profile.missingFields.length > 0 && (
        <div className="mt-2 text-xs leading-5" style={{ color: 'var(--color-warning)' }}>
          Missing: {profile.missingFields.join(', ')}
        </div>
      )}
    </div>
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
