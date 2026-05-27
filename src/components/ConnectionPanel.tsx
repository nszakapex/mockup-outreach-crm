'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, AlertTriangle, Bot, Database, HardDrive, RefreshCw } from 'lucide-react';
import Card from './Card';
import Button from './Button';
import {
  APP_NAME,
  EXPECTED_LOCAL_URL,
  getSupabaseInfo,
  type DataSource,
  type SupabaseQueryStatus,
} from '@/lib/supabase';

interface SupabaseDebugResponse {
  envConfigured: boolean;
  urlPresent: boolean;
  keyPresent: boolean;
  source: 'supabase' | 'seed fallback';
  prospectsQueryOk: boolean;
  prospectsCount: number;
  errorMessage: string | null;
}

interface TelegramDebugResponse {
  botTokenConfigured: boolean;
  chatIdConfigured: boolean;
  webhookSecretConfigured: boolean;
  botGetMeOk: boolean;
  botUsername: string | null;
  errorMessage: string | null;
}

interface ConnectionPanelProps {
  dataSource?: DataSource;
  lastSupabaseQueryStatus?: SupabaseQueryStatus;
  lastSupabaseErrorMessage?: string | null;
  prospectsLoaded?: number | null;
  className?: string;
}

export default function ConnectionPanel({
  dataSource,
  lastSupabaseQueryStatus,
  lastSupabaseErrorMessage,
  prospectsLoaded,
  className,
}: ConnectionPanelProps) {
  const clientSupabaseInfo = useMemo(() => getSupabaseInfo(), []);
  const [supabaseDebug, setSupabaseDebug] = useState<SupabaseDebugResponse | null>(null);
  const [telegramDebug, setTelegramDebug] = useState<TelegramDebugResponse | null>(null);
  const [diagnosticsError, setDiagnosticsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [timestamp, setTimestamp] = useState(() => new Date());

  const loadDiagnostics = async () => {
    setLoading(true);
    setDiagnosticsError(null);

    const [supabaseResult, telegramResult] = await Promise.allSettled([
      fetchJson<SupabaseDebugResponse>('/api/debug/supabase'),
      fetchJson<TelegramDebugResponse>('/api/debug/telegram'),
    ]);

    if (supabaseResult.status === 'fulfilled') {
      setSupabaseDebug(supabaseResult.value);
    } else {
      setDiagnosticsError(supabaseResult.reason.message);
    }

    if (telegramResult.status === 'fulfilled') {
      setTelegramDebug(telegramResult.value);
    } else {
      setDiagnosticsError((current) =>
        current ? `${current}; ${telegramResult.reason.message}` : telegramResult.reason.message
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDiagnostics();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => setTimestamp(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const activeSource: DataSource =
    dataSource ||
    (supabaseDebug?.source === 'supabase' || clientSupabaseInfo.source === 'supabase' ? 'supabase' : 'seed');

  const queryStatus: SupabaseQueryStatus =
    lastSupabaseQueryStatus ||
    (supabaseDebug
      ? supabaseDebug.envConfigured
        ? supabaseDebug.prospectsQueryOk
          ? 'success'
          : 'error'
        : 'not_configured'
      : 'loading');

  const supabaseErrorMessage =
    lastSupabaseErrorMessage ||
    supabaseDebug?.errorMessage ||
    diagnosticsError ||
    null;

  const count =
    typeof prospectsLoaded === 'number'
      ? prospectsLoaded
      : supabaseDebug?.prospectsCount ?? null;

  const urlPresent = supabaseDebug?.urlPresent ?? clientSupabaseInfo.urlPresent;
  const keyPresent = supabaseDebug?.keyPresent ?? clientSupabaseInfo.keyPresent;

  return (
    <Card
      title="Runtime Diagnostics"
      className={className}
      action={
        <Button variant="secondary" size="sm" onClick={loadDiagnostics} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-4">
        <div
          className="flex flex-col gap-2 rounded-lg p-3"
          style={{
            background: 'var(--color-paper-3)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill icon={<Activity size={12} />} tone="info" label={APP_NAME} />
            <StatusPill
              icon={activeSource === 'supabase' ? <Database size={12} /> : <HardDrive size={12} />}
              tone={activeSource === 'supabase' ? 'success' : 'warning'}
              label={activeSource === 'supabase' ? 'Supabase source' : 'Seed fallback'}
            />
          </div>
          <div className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
            Expected local URL: <span className="font-mono" style={{ color: 'var(--color-ink-2)' }}>{EXPECTED_LOCAL_URL}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
          <DiagnosticRow label="App name" value={APP_NAME} />
          <DiagnosticRow label="Expected local URL" value={EXPECTED_LOCAL_URL} mono />
          <DiagnosticRow label="Supabase URL configured" value={yesNo(urlPresent)} ok={urlPresent} />
          <DiagnosticRow label="Supabase key configured" value={yesNo(keyPresent)} ok={keyPresent} />
          <DiagnosticRow
            label="Telegram bot token configured"
            value={yesNo(telegramDebug?.botTokenConfigured)}
            ok={telegramDebug?.botTokenConfigured}
          />
          <DiagnosticRow
            label="Telegram chat ID configured"
            value={yesNo(telegramDebug?.chatIdConfigured)}
            ok={telegramDebug?.chatIdConfigured}
          />
          <DiagnosticRow
            label="Telegram webhook secret configured"
            value={yesNo(telegramDebug?.webhookSecretConfigured)}
            ok={telegramDebug?.webhookSecretConfigured}
          />
          <DiagnosticRow
            label="Active data source"
            value={activeSource === 'supabase' ? 'Supabase' : 'Seed fallback'}
            ok={activeSource === 'supabase'}
          />
          <DiagnosticRow label="Last Supabase query status" value={formatQueryStatus(queryStatus)} ok={queryStatus === 'success'} />
          <DiagnosticRow label="Number of prospects loaded" value={count === null ? 'Checking...' : String(count)} mono />
          <DiagnosticRow
            label="Current timestamp"
            value={timestamp.toLocaleString()}
            mono
          />
          {telegramDebug?.botUsername && (
            <DiagnosticRow label="Telegram bot username" value={`@${telegramDebug.botUsername}`} mono />
          )}
        </div>

        <div
          className="rounded-lg p-3 text-xs"
          style={{
            background: supabaseErrorMessage ? 'oklch(65% 0.22 25 / 0.08)' : 'var(--color-paper-3)',
            border: supabaseErrorMessage
              ? '1px solid oklch(65% 0.22 25 / 0.2)'
              : '1px solid var(--color-border)',
            color: supabaseErrorMessage ? 'var(--color-error)' : 'var(--color-ink-3)',
          }}
        >
          <div className="mb-1 flex items-center gap-1.5 font-medium" style={{ color: supabaseErrorMessage ? 'var(--color-error)' : 'var(--color-ink-2)' }}>
            {supabaseErrorMessage ? <AlertTriangle size={12} /> : <Database size={12} />}
            Last Supabase error message
          </div>
          <div className="break-all">{supabaseErrorMessage || 'None'}</div>
        </div>

        {telegramDebug?.errorMessage && (
          <div
            className="rounded-lg p-3 text-xs"
            style={{
              background: telegramDebug.botGetMeOk ? 'var(--color-paper-3)' : 'oklch(75% 0.16 85 / 0.08)',
              border: telegramDebug.botGetMeOk ? '1px solid var(--color-border)' : '1px solid oklch(75% 0.16 85 / 0.2)',
              color: telegramDebug.botGetMeOk ? 'var(--color-ink-3)' : 'var(--color-warning)',
            }}
          >
            <div className="mb-1 flex items-center gap-1.5 font-medium">
              <Bot size={12} />
              Telegram smoke test
            </div>
            <div className="break-all">{telegramDebug.errorMessage}</div>
          </div>
        )}
      </div>
    </Card>
  );
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

function yesNo(value: boolean | undefined): string {
  if (typeof value === 'undefined') return 'Checking...';
  return value ? 'Yes' : 'No';
}

function formatQueryStatus(status: SupabaseQueryStatus): string {
  if (status === 'not_configured') return 'Not configured';
  if (status === 'loading') return 'Loading';
  if (status === 'success') return 'Success';
  return 'Error';
}

function DiagnosticRow({
  label,
  value,
  ok,
  mono,
}: {
  label: string;
  value: string;
  ok?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span style={{ color: 'var(--color-ink-3)' }}>{label}</span>
      <span
        className={mono ? 'font-mono text-right' : 'font-medium text-right'}
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

function StatusPill({
  icon,
  tone,
  label,
}: {
  icon: ReactNode;
  tone: 'info' | 'success' | 'warning';
  label: string;
}) {
  const styles = {
    info: {
      background: 'var(--color-accent-muted)',
      color: 'var(--color-accent)',
    },
    success: {
      background: 'var(--color-emerald-muted)',
      color: 'var(--color-emerald)',
    },
    warning: {
      background: 'oklch(75% 0.16 85 / 0.12)',
      color: 'var(--color-warning)',
    },
  }[tone];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={styles}
    >
      {icon}
      {label}
    </span>
  );
}
