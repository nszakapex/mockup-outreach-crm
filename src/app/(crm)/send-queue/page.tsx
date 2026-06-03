'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle,
  Clock3,
  ExternalLink,
  Eye,
  History,
  Inbox,
  Mail,
  RefreshCw,
  Send,
  SkipForward,
} from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import StatusBadge from '@/components/StatusBadge';
import type { ProspectStatus } from '@/lib/types';

type SendQueueItem = {
  prospectId: string;
  emailDraftId: string;
  businessName: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  body: string;
  finalBody: string;
  mockupUrl: string;
  socialAuditUrl: string;
  flooringAuditUrl: string;
  inlineFlooringBrief: string;
  inlineApexBrief: string;
  campaignTypeDetected: string;
  campaignLabel: string;
  apexDeliveryMode: 'public_social_audit' | 'public_mockup' | 'link_plus_summary' | 'inline_apex_brief' | null;
  apexDeliveryModeLabel: string;
  resinateDeliveryMode: 'public_brief' | 'inline_brief' | 'link_plus_summary' | null;
  resinateDeliveryModeLabel: string;
  publicArtifactRequired: boolean;
  publicSocialAuditRequired: boolean;
  publicMockupRequired: boolean;
  publicSocialAuditIncluded: boolean;
  publicMockupIncluded: boolean;
  selectedPrimaryArtifactUrl: string;
  selectedPrimaryArtifactLabel: string;
  primaryArtifactType: string;
  hasMockupLink: boolean;
  hasSocialAuditLink: boolean;
  hasFlooringAuditLink: boolean;
  hasInlineFlooringBrief: boolean;
  hasInlineApexBrief: boolean;
  usesMockupLink: boolean;
  usesSocialAuditLink: boolean;
  usesFlooringAuditLink: boolean;
  usesInlineFlooringBrief: boolean;
  usesInlineApexBrief: boolean;
  publicBriefLinkIncluded: boolean;
  inlineBriefIncluded: boolean;
  inlineApexBriefIncluded: boolean;
  senderProfileKey: 'apex' | 'resinate';
  senderLabel: string;
  senderProviderName: string;
  senderConfigured: boolean;
  senderMissingFields: string[];
  linkReplacementApplied: boolean;
  fallbackLinkAppended: boolean;
  optOutIncluded: boolean;
  emailQualityWarnings: string[];
  status: ProspectStatus;
  sendable: boolean;
  blockedReasons: string[];
};

type SendQueueStats = {
  sentToday: number;
  remainingToday: number;
  dailyCap: number;
  testMode: boolean;
};

type RecentSendItem = {
  id: string;
  prospectId: string;
  emailDraftId: string | null;
  businessName: string;
  toEmail: string;
  subject: string;
  status: string;
  provider: string;
  sentAt: string | null;
  createdAt: string;
  errorMessage: string | null;
};

type SendQueueResponse = {
  ok: boolean;
  items?: SendQueueItem[];
  stats?: SendQueueStats;
  recentSends?: RecentSendItem[];
  errorMessage?: string;
};

const EMPTY_STATS: SendQueueStats = {
  sentToday: 0,
  remainingToday: 0,
  dailyCap: 30,
  testMode: true,
};

export default function SendQueuePage() {
  const [items, setItems] = useState<SendQueueItem[]>([]);
  const [recentSends, setRecentSends] = useState<RecentSendItem[]>([]);
  const [stats, setStats] = useState<SendQueueStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/outreach/queue', { cache: 'no-store' });
      const payload = (await response.json().catch(() => null)) as SendQueueResponse | null;

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.errorMessage || `Send queue failed with HTTP ${response.status}`);
      }

      setItems(payload.items || []);
      setStats(payload.stats || EMPTY_STATS);
      setRecentSends(payload.recentSends || []);
    } catch (queueError) {
      setItems([]);
      setRecentSends([]);
      setError(queueError instanceof Error ? queueError.message : 'Unable to load send queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadQueue();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadQueue]);

  const runAction = async (item: SendQueueItem, action: 'send' | 'skip') => {
    setActing(`${action}:${item.prospectId}`);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/outreach/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: item.prospectId }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.errorMessage || `${action === 'send' ? 'Send' : 'Skip'} failed with HTTP ${response.status}`);
      }

      setNotice(payload.message || `${item.businessName} updated.`);
      await loadQueue();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Queue action failed.');
    } finally {
      setActing(null);
    }
  };

  const sendDisabled = stats.remainingToday <= 0;
  const sendableCount = items.filter((item) => item.sendable).length;

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
              Send Queue
            </h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              style={{
                background: stats.testMode ? 'oklch(75% 0.16 85 / 0.12)' : 'var(--color-emerald-muted)',
                color: stats.testMode ? 'var(--color-warning)' : 'var(--color-emerald)',
              }}
            >
              <Mail size={12} />
              {stats.testMode ? 'Test mode' : 'Live Gmail'}
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
            {sendableCount} approved prospect{sendableCount !== 1 ? 's' : ''} ready for controlled Gmail sending
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadQueue} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-4">
        <QueueMetric icon={<Send size={16} />} label="Sent today" value={String(stats.sentToday)} />
        <QueueMetric icon={<Clock3 size={16} />} label="Remaining today" value={String(stats.remainingToday)} />
        <QueueMetric icon={<CheckCircle size={16} />} label="Daily cap" value={String(stats.dailyCap)} />
        <QueueMetric icon={<Mail size={16} />} label="Delivery mode" value={stats.testMode ? 'Test' : 'Live'} />
      </div>

      {stats.testMode && (
        <div
          className="mb-6 rounded-xl p-4 text-sm"
          style={{
            background: 'oklch(75% 0.16 85 / 0.08)',
            border: '1px solid oklch(75% 0.16 85 / 0.2)',
            color: 'var(--color-warning)',
          }}
        >
          Test mode is enabled. Send Now validates eligibility and records a test send, but no Gmail message is delivered.
        </div>
      )}

      {sendDisabled && !loading && !error && (
        <div
          className="mb-6 rounded-xl p-4 text-sm"
          style={{
            background: 'oklch(65% 0.22 25 / 0.08)',
            border: '1px solid oklch(65% 0.22 25 / 0.2)',
            color: 'var(--color-error)',
          }}
        >
          Daily send cap reached. Increase OUTREACH_DAILY_SEND_CAP or wait until tomorrow.
        </div>
      )}

      {notice && (
        <div
          className="mb-6 rounded-xl p-4 text-sm"
          style={{
            background: 'var(--color-emerald-subtle)',
            border: '1px solid var(--color-emerald-muted)',
            color: 'var(--color-emerald)',
          }}
        >
          {notice}
        </div>
      )}

      {error && <div className="mb-6"><ErrorBanner message={error} onRetry={loadQueue} /></div>}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }}
          />
        </div>
      ) : error ? (
        <Card>
          <EmptyState
            icon={<AlertTriangle size={24} />}
            title="Send queue did not load"
            description="The queue uses Supabase and the outreach_sends table. Apply the SQL migration, then retry."
          />
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox size={24} />}
            title="No sends ready"
            description="Approved prospects appear here after they have an approved email draft, a sendable artifact, and no previous successful send."
            action={
              <Link
                href="/approval"
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: 'var(--color-paper-3)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              >
                <Eye size={16} /> Review Approval Queue
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const sendBusy = acting === `send:${item.prospectId}`;
            const skipBusy = acting === `skip:${item.prospectId}`;

            return (
              <Card key={`${item.prospectId}:${item.emailDraftId}`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/prospects/${item.prospectId}`}
                        className="text-lg font-semibold hover:underline"
                        style={{ color: 'var(--color-ink)' }}
                      >
                        {item.businessName}
                      </Link>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="mt-1 text-sm" style={{ color: 'var(--color-ink-3)' }}>
                      To: {item.toEmail}
                    </div>
                    <div className="mt-1 text-sm" style={{ color: 'var(--color-ink-3)' }}>
                      Campaign: {item.campaignLabel}
                    </div>
                    {item.senderProfileKey === 'resinate' && (
                      <div className="mt-1 text-sm" style={{ color: 'var(--color-ink-3)' }}>
                        Delivery mode: {item.resinateDeliveryModeLabel}
                      </div>
                    )}
                    {item.senderProfileKey === 'apex' && item.apexDeliveryMode && (
                      <div className="mt-1 text-sm" style={{ color: 'var(--color-ink-3)' }}>
                        Delivery mode: {item.apexDeliveryModeLabel}
                      </div>
                    )}
                    <div className="mt-1 text-sm" style={{ color: item.senderConfigured ? 'var(--color-ink-3)' : 'var(--color-warning)' }}>
                      Sender: {item.senderLabel} - {item.fromEmail}
                      {!item.senderConfigured && item.senderProfileKey === 'resinate' ? ' - Resinate sender not configured' : ''}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => runAction(item, 'send')}
                      disabled={sendBusy || skipBusy || sendDisabled || !item.sendable}
                    >
                      <Send size={14} />
                      {sendBusy ? 'Sending...' : 'Send Now'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => runAction(item, 'skip')}
                      disabled={sendBusy || skipBusy}
                    >
                      <SkipForward size={14} />
                      {skipBusy ? 'Skipping...' : 'Mark skipped'}
                    </Button>
                    <Link
                      href={`/prospects/${item.prospectId}`}
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        sendBusy || skipBusy ? 'pointer-events-none opacity-40' : ''
                      }`}
                      style={{
                        background: 'var(--color-paper-3)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-ink)',
                      }}
                    >
                      <Eye size={14} />
                      View prospect
                    </Link>
                  </div>
                </div>

                <div
                  className="mt-4 grid grid-cols-1 gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]"
                  style={{ borderTop: '1px solid var(--color-divider)' }}
                >
                  <div className="min-w-0">
                    <div
                      className="grid grid-cols-1 gap-2 rounded-lg p-3 text-xs sm:grid-cols-2"
                      style={{
                        background: 'var(--color-paper-3)',
                        border: '1px solid var(--color-divider)',
                        color: 'var(--color-ink-2)',
                      }}
                    >
                      <PreviewField label="Sanitized To" value={item.toEmail} />
                      <PreviewField label="Sanitized From" value={item.fromEmail} />
                      <PreviewField label="Sanitized Subject" value={item.subject} className="sm:col-span-2" />
                      <PreviewField label="Campaign" value={item.campaignLabel} />
                      <PreviewField label="Campaign type detected" value={item.campaignTypeDetected} />
                      {item.senderProfileKey === 'resinate' && (
                        <PreviewField label="Delivery mode" value={item.resinateDeliveryModeLabel} />
                      )}
                      {item.senderProfileKey === 'apex' && item.apexDeliveryMode && (
                        <PreviewField label="Delivery mode" value={item.apexDeliveryModeLabel} />
                      )}
                      <PreviewField label="Sender" value={item.senderLabel} />
                      <PreviewField label="Sender configured" value={yesNo(item.senderConfigured)} />
                      <PreviewField label="Primary artifact" value={item.selectedPrimaryArtifactLabel} />
                      <PreviewField label="Primary artifact type" value={item.primaryArtifactType} />
                      <PreviewField label="Has Mockup Link" value={yesNo(item.hasMockupLink)} />
                      <PreviewField label="Has Social Audit Link" value={yesNo(item.hasSocialAuditLink)} />
                      <PreviewField label="Has Surface Brief Link" value={yesNo(item.hasFlooringAuditLink)} />
                      {item.senderProfileKey === 'apex' && (
                        <>
                          <PreviewField label="Has Inline Apex Brief" value={yesNo(item.hasInlineApexBrief)} />
                          <PreviewField label="Public social audit required" value={yesNo(item.publicSocialAuditRequired)} />
                          <PreviewField label="Public mockup required" value={yesNo(item.publicMockupRequired)} />
                          <PreviewField label="Public social audit included" value={yesNo(item.publicSocialAuditIncluded)} />
                          <PreviewField label="Public mockup included" value={yesNo(item.publicMockupIncluded)} />
                          <PreviewField label="First impression direction included" value={yesNo(item.inlineApexBriefIncluded)} />
                        </>
                      )}
                      {item.senderProfileKey === 'resinate' && (
                        <>
                          <PreviewField label="Has Inline Brief" value={yesNo(item.hasInlineFlooringBrief)} />
                          <PreviewField label="Public artifact required" value={yesNo(item.publicArtifactRequired)} />
                          <PreviewField label="Public brief link included" value={yesNo(item.publicBriefLinkIncluded)} />
                          <PreviewField label="Inline brief included" value={yesNo(item.inlineBriefIncluded)} />
                        </>
                      )}
                      <PreviewField label="Link replacement applied" value={yesNo(item.linkReplacementApplied)} />
                      <PreviewField label="Fallback link appended" value={yesNo(item.fallbackLinkAppended)} />
                      <PreviewField label="Opt-out included" value={yesNo(item.optOutIncluded)} />
                      <PreviewField
                        label={item.selectedPrimaryArtifactLabel}
                        value={item.selectedPrimaryArtifactUrl || 'No public URL required'}
                        className="sm:col-span-2"
                      />
                      {item.usesMockupLink && (
                        <PreviewField label="Final Mockup URL" value={item.mockupUrl} className="sm:col-span-2" />
                      )}
                      {item.usesSocialAuditLink && (
                        <PreviewField label="Final Social Audit URL" value={item.socialAuditUrl} className="sm:col-span-2" />
                      )}
                      {item.usesFlooringAuditLink && (
                        <PreviewField label="Final Commercial Surface Brief URL" value={item.flooringAuditUrl} className="sm:col-span-2" />
                      )}
                    </div>
                    {item.emailQualityWarnings.length > 0 && (
                      <div
                        className="mt-3 rounded-lg p-3 text-xs"
                        style={{
                          background: 'oklch(75% 0.16 85 / 0.08)',
                          border: '1px solid oklch(75% 0.16 85 / 0.22)',
                          color: 'var(--color-warning)',
                        }}
                      >
                        <div className="font-medium mb-1">Email quality warnings</div>
                        <ul className="space-y-1">
                          {item.emailQualityWarnings.map((warning) => (
                            <li key={warning} className="flex items-start gap-1.5">
                              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.senderMissingFields.length > 0 && (
                      <div
                        className="mt-3 rounded-lg p-3 text-xs"
                        style={{
                          background: 'oklch(75% 0.16 85 / 0.08)',
                          border: '1px solid oklch(75% 0.16 85 / 0.22)',
                          color: 'var(--color-warning)',
                        }}
                      >
                        <div className="font-medium mb-1">{item.senderLabel} sender missing fields</div>
                        <div>{item.senderMissingFields.join(', ')}</div>
                      </div>
                    )}
                    <div className="mt-3 text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>
                      Final body
                    </div>
                    <div
                      className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg p-3 text-xs leading-relaxed"
                      style={{
                        background: 'var(--color-paper-3)',
                        border: '1px solid var(--color-divider)',
                        color: 'var(--color-ink-2)',
                      }}
                    >
                      {item.finalBody}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-3)' }}>
                      {item.selectedPrimaryArtifactLabel}
                    </div>
                    {item.selectedPrimaryArtifactUrl ? (
                      <a
                        href={item.selectedPrimaryArtifactUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex max-w-full items-center gap-1.5 truncate text-sm font-medium hover:underline"
                        style={{ color: 'var(--color-accent)' }}
                      >
                        <span className="truncate">{item.selectedPrimaryArtifactUrl}</span>
                        <ExternalLink size={13} className="shrink-0" />
                      </a>
                    ) : (
                      <div className="text-sm" style={{ color: 'var(--color-ink-2)' }}>
                        No public URL required for inline brief delivery.
                      </div>
                    )}
                    {item.usesSocialAuditLink && (
                      <>
                        <div className="text-xs font-medium mb-1.5 mt-4" style={{ color: 'var(--color-ink-3)' }}>
                          Final Social Audit URL
                        </div>
                        <a
                          href={item.socialAuditUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1.5 truncate text-sm font-medium hover:underline"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          <span className="truncate">{item.socialAuditUrl}</span>
                          <ExternalLink size={13} className="shrink-0" />
                        </a>
                      </>
                    )}
                    {item.usesFlooringAuditLink && (
                      <>
                        <div className="text-xs font-medium mb-1.5 mt-4" style={{ color: 'var(--color-ink-3)' }}>
                          Final Commercial Surface Brief URL
                        </div>
                        <a
                          href={item.flooringAuditUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1.5 truncate text-sm font-medium hover:underline"
                          style={{ color: 'var(--color-accent)' }}
                        >
                          <span className="truncate">{item.flooringAuditUrl}</span>
                          <ExternalLink size={13} className="shrink-0" />
                        </a>
                      </>
                    )}
                    {item.usesInlineFlooringBrief && (
                      <div
                        className="mt-4 rounded-lg p-3 text-xs whitespace-pre-wrap"
                        style={{
                          background: 'var(--color-paper-3)',
                          border: '1px solid var(--color-divider)',
                          color: 'var(--color-ink-2)',
                        }}
                      >
                        <div className="font-medium mb-2" style={{ color: 'var(--color-ink)' }}>
                          Inline brief included
                        </div>
                        {item.inlineFlooringBrief}
                      </div>
                    )}
                    {item.usesInlineApexBrief && (
                      <div
                        className="mt-4 rounded-lg p-3 text-xs whitespace-pre-wrap"
                        style={{
                          background: 'var(--color-paper-3)',
                          border: '1px solid var(--color-divider)',
                          color: 'var(--color-ink-2)',
                        }}
                      >
                        <div className="font-medium mb-2" style={{ color: 'var(--color-ink)' }}>
                          First impression direction included
                        </div>
                        {item.inlineApexBrief}
                      </div>
                    )}
                    {item.blockedReasons.length > 0 && (
                      <div
                        className="mt-3 rounded-lg p-3 text-xs"
                        style={{
                          background: 'oklch(65% 0.22 25 / 0.08)',
                          border: '1px solid oklch(65% 0.22 25 / 0.2)',
                          color: 'var(--color-error)',
                        }}
                      >
                        {item.blockedReasons.join(' ')}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !error && <RecentSendsSection recentSends={recentSends} />}
    </div>
  );
}

function PreviewField({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="font-medium uppercase" style={{ color: 'var(--color-ink-3)' }}>
        {label}
      </div>
      <div className="mt-1 truncate font-medium" style={{ color: 'var(--color-ink)' }} title={value}>
        {value}
      </div>
    </div>
  );
}

function yesNo(value: boolean) {
  return value ? 'yes' : 'no';
}

function QueueMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: 'var(--color-paper-2)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-ink-3)' }}>
        {icon}
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold" style={{ color: 'var(--color-ink)' }}>
        {value}
      </div>
    </div>
  );
}

function RecentSendsSection({ recentSends }: { recentSends: RecentSendItem[] }) {
  return (
    <div className="mt-8">
      <Card
        title="Recent Sends"
        action={
          <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-ink-3)' }}>
            <History size={13} />
            Last {Math.min(recentSends.length, 10)}
          </span>
        }
        noPadding
      >
        {recentSends.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div
              className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--color-paper-3)', color: 'var(--color-ink-3)' }}
            >
              <History size={18} />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
              No sends recorded yet
            </div>
            <div className="mt-1 text-xs" style={{ color: 'var(--color-ink-3)' }}>
              Test sends and live Gmail sends will appear here immediately after Send Now completes.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Business</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-medium uppercase tracking-wider md:table-cell" style={{ color: 'var(--color-ink-3)' }}>Subject</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Status</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-medium uppercase tracking-wider lg:table-cell" style={{ color: 'var(--color-ink-3)' }}>Sent</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentSends.map((send) => (
                  <tr key={send.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <td className="px-5 py-3.5">
                      <div className="font-medium" style={{ color: 'var(--color-ink)' }}>
                        {send.businessName}
                      </div>
                      <div className="mt-0.5 text-xs" style={{ color: 'var(--color-ink-3)' }}>
                        {send.toEmail}
                      </div>
                      {send.errorMessage && (
                        <div className="mt-2 max-w-sm text-xs break-words" style={{ color: 'var(--color-error)' }}>
                          {send.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="hidden max-w-md px-5 py-3.5 md:table-cell">
                      <div className="truncate" style={{ color: 'var(--color-ink-2)' }}>
                        {send.subject}
                      </div>
                      <div className="mt-1 text-xs uppercase" style={{ color: 'var(--color-ink-muted)' }}>
                        {send.provider}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <SendStatusBadge status={send.status} provider={send.provider} />
                      <div className="mt-1 text-xs uppercase" style={{ color: 'var(--color-ink-muted)' }}>
                        {send.provider}
                      </div>
                    </td>
                    <td className="hidden px-5 py-3.5 text-xs lg:table-cell" style={{ color: 'var(--color-ink-3)' }}>
                      {formatSendDate(send.sentAt || send.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/prospects/${send.prospectId}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                        style={{
                          background: 'var(--color-paper-3)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        <Eye size={13} />
                        View Prospect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function SendStatusBadge({ status, provider }: { status: string; provider?: string }) {
  const config = getSendStatusStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap"
      style={{ background: config.bg, color: config.color }}
      title={provider ? `Provider: ${provider}` : undefined}
    >
      {config.label}
    </span>
  );
}

function getSendStatusStyle(status: string) {
  switch (status) {
    case 'sent':
      return { label: 'Sent', color: 'var(--color-emerald)', bg: 'var(--color-emerald-muted)' };
    case 'test_sent':
      return { label: 'Test Sent', color: 'var(--color-warning)', bg: 'oklch(75% 0.16 85 / 0.12)' };
    case 'failed':
      return { label: 'Failed', color: 'var(--color-error)', bg: 'oklch(65% 0.22 25 / 0.12)' };
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
