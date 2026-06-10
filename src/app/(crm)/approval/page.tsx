'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  X,
  Copy,
  Check,
  Send,
  ExternalLink,
  Inbox,
  AlertTriangle,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import { useApprovalQueue } from '@/lib/hooks';
import { getApexDeliveryMode, parseApexDeliveryConceptNotes } from '@/lib/apex-delivery-data';
import { parseMockupConceptNotes } from '@/lib/mockup-rich-data';
import { getMockupTemplateSelection } from '@/lib/mockup-templates';
import { getMockupV2Diagnostics } from '@/lib/mockup-v2';
import {
  getResinateDeliveryMode,
  getResinatePublicArtifactRequired,
  isResinateCampaign,
  parseResinateConceptNotes,
} from '@/lib/resinate-data';
import { parseSocialAuditConceptNotes } from '@/lib/social-audit-data';

export default function ApprovalPage() {
  const { prospects, loading, error, refetch, approve } = useApprovalQueue();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  const copyEmail = (subject: string, body: string, id: string) => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (id: string) => {
    setActing(`approve:${id}`);
    setActionError(null);
    setActionSuccess(null);
    const err = await approve(id);
    setActing(null);
    if (err) setActionError(err);
  };

  const handleSendToTelegram = async (id: string) => {
    setActing(`telegram:${id}`);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await fetch('/api/telegram/send-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId: id }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok || result?.ok !== true) {
        throw new Error(result?.errorMessage || `Telegram send failed with HTTP ${response.status}`);
      }

      setActionSuccess(`Sent ${result.prospectName || 'prospect'} to Telegram for review.`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Telegram send failed.');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Approval Queue</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
          {prospects.length} prospect{prospects.length !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {error && <div className="mb-6"><ErrorBanner message={error} onRetry={refetch} /></div>}
      {actionError && <div className="mb-6"><ErrorBanner message={actionError} /></div>}
      {actionSuccess && (
        <div
          className="mb-6 rounded-xl p-4 text-sm"
          style={{
            background: 'var(--color-emerald-subtle)',
            border: '1px solid var(--color-emerald-muted)',
            color: 'var(--color-emerald)',
          }}
        >
          {actionSuccess}
        </div>
      )}

      {error ? (
        <Card>
          <EmptyState
            icon={<AlertTriangle size={24} />}
            title="Approval queue did not load"
            description="Supabase is configured, so seed data was not used. Fix the Supabase error above, then retry."
          />
        </Card>
      ) : prospects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox size={24} />}
            title="Queue is empty"
            description="No prospects are awaiting approval. Prospects appear here when their status is set to email_ready or approved_to_send."
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {prospects.map((prospect) => {
            const email = prospect.email_drafts?.[0];
            const mockup = prospect.mockups?.[0];
            const resinateStrategy = mockup ? parseResinateConceptNotes(mockup.concept_notes) : {};
            const isResinate = isResinateCampaign(resinateStrategy);
            const apexDeliveryStrategy = !isResinate && mockup ? parseApexDeliveryConceptNotes(mockup.concept_notes) : {};
            const apexDeliveryMode = !isResinate ? getApexDeliveryMode(apexDeliveryStrategy, email?.body) : null;
            const mockupStrategy = mockup ? parseMockupConceptNotes(mockup.concept_notes) : null;
            const socialAuditStrategy = mockup ? parseSocialAuditConceptNotes(mockup.concept_notes) : {};
            const mockupTemplate = getMockupTemplateSelection({
              businessName: prospect.business_name,
              niche: prospect.niche,
              fields: mockupStrategy?.rich as Record<string, unknown> | undefined,
            });
            const mockupV2 = mockupStrategy
              ? getMockupV2Diagnostics({
                  rich: mockupStrategy.rich,
                  template: mockupTemplate,
                  social: socialAuditStrategy,
                  niche: prospect.niche,
                  businessName: prospect.business_name,
                  campaignType: resinateStrategy.campaign_type || apexDeliveryStrategy.campaign_type,
                  apexDeliveryMode,
                  emailBody: email?.body,
                  heroHeadline: mockup?.hero_headline,
                  heroSubheadline: mockup?.hero_subheadline,
                  primaryCta: mockup?.primary_cta,
                  publicEmail: prospect.public_email,
                  notes: prospect.notes,
                })
              : null;
            const publicMockupBlocked = Boolean(
              !isResinate &&
                mockupV2?.qualityGate.required &&
                !mockupV2.qualityGate.outreachReady
            );
            const resinateDeliveryMode = isResinate ? getResinateDeliveryMode(resinateStrategy, email?.body) : null;
            const publicArtifactRequired = isResinate
              ? getResinatePublicArtifactRequired(resinateStrategy, email?.body)
              : true;
            const isApproved = prospect.status === 'approved_to_send';
            const isBusy = acting?.endsWith(`:${prospect.id}`) ?? false;
            const isTelegramBusy = acting === `telegram:${prospect.id}`;
            const canSendToTelegram =
              (prospect.status === 'email_ready' || prospect.status === 'approved_to_send') &&
              Boolean(prospect.public_email) &&
              Boolean(email) &&
              Boolean(email?.subject) &&
              Boolean(email?.body) &&
              Boolean(mockup) &&
              (!publicArtifactRequired || Boolean(mockup?.slug)) &&
              !publicMockupBlocked;

            return (
              <Card key={prospect.id}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                  <div>
                    <div className="flex items-center gap-3">
                      <Link href={`/prospects/${prospect.id}`} className="text-lg font-semibold hover:underline" style={{ color: 'var(--color-ink)' }}>
                        {prospect.business_name}
                      </Link>
                      <StatusBadge status={prospect.status} />
                    </div>
                    <div className="text-sm mt-0.5" style={{ color: 'var(--color-ink-3)' }}>
                      {prospect.niche} &middot; {prospect.city}, {prospect.state}
                    </div>
                  </div>
                </div>

                {mockup?.slug && publicArtifactRequired && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: 'var(--color-accent-subtle)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>Mockup:</span>
                    <Link href={`/mockups/${mockup.slug}`} target="_blank" className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
                      {mockup.title} <ExternalLink size={12} />
                    </Link>
                  </div>
                )}

                {isResinate && resinateDeliveryMode === 'inline_brief' && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg" style={{ background: 'var(--color-accent-subtle)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-accent)' }}>Resinate:</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                      Inline commercial surface note. Public brief not required.
                    </span>
                  </div>
                )}

                {email && (
                  <div>
                    <div className="mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>Subject</span>
                      <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-ink)' }}>{email.subject}</div>
                    </div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed p-4 rounded-lg mb-4" style={{ background: 'var(--color-paper-3)', color: 'var(--color-ink-2)', border: '1px solid var(--color-divider)', maxHeight: '300px', overflowY: 'auto' }}>
                      {email.body}
                    </div>
                  </div>
                )}

                {!email && (
                  <div className="mb-4 rounded-lg p-3 text-xs" style={{ background: 'oklch(75% 0.16 85 / 0.08)', border: '1px solid oklch(75% 0.16 85 / 0.2)', color: 'var(--color-warning)' }}>
                    Missing email draft. Add a draft before sending this prospect to Telegram.
                  </div>
                )}

                {!prospect.public_email && (
                  <div className="mb-4 rounded-lg p-3 text-xs" style={{ background: 'oklch(75% 0.16 85 / 0.08)', border: '1px solid oklch(75% 0.16 85 / 0.2)', color: 'var(--color-warning)' }}>
                    Missing public email. Add a destination before sending this prospect to Telegram.
                  </div>
                )}

                {email && (!email.subject || !email.body) && (
                  <div className="mb-4 rounded-lg p-3 text-xs" style={{ background: 'oklch(75% 0.16 85 / 0.08)', border: '1px solid oklch(75% 0.16 85 / 0.2)', color: 'var(--color-warning)' }}>
                    Email subject and body are required before Telegram approval.
                  </div>
                )}

                {publicArtifactRequired && !mockup?.slug && (
                  <div className="mb-4 rounded-lg p-3 text-xs" style={{ background: 'oklch(75% 0.16 85 / 0.08)', border: '1px solid oklch(75% 0.16 85 / 0.2)', color: 'var(--color-warning)' }}>
                    Missing public artifact link. Add a slug before sending this prospect to Telegram.
                  </div>
                )}

                {publicMockupBlocked && mockupV2 && (
                  <div className="mb-4 rounded-lg p-3 text-xs" style={{ background: 'oklch(65% 0.22 25 / 0.08)', border: '1px solid oklch(65% 0.22 25 / 0.2)', color: 'var(--color-error)' }}>
                    <div className="font-semibold">Mockup not outreach-ready</div>
                    <div className="mt-1 leading-5">{mockupV2.qualityGate.failures.join(' ')}</div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-4" style={{ borderTop: '1px solid var(--color-divider)' }}>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSendToTelegram(prospect.id)}
                    disabled={isBusy || !canSendToTelegram}
                  >
                    <Send size={14} /> {isTelegramBusy ? 'Sending...' : 'Send to Telegram'}
                  </Button>
                  {!isApproved && (
                    <Button size="sm" onClick={() => handleApprove(prospect.id)} disabled={isBusy}>
                      <CheckCircle size={14} /> {isBusy ? 'Approving...' : 'Approve'}
                    </Button>
                  )}
                  {!isApproved && (
                    <Button size="sm" variant="danger" disabled={isBusy}>
                      <X size={14} /> Needs Edit
                    </Button>
                  )}
                  {email && (
                    <Button size="sm" variant="secondary" onClick={() => copyEmail(email.subject, email.body, prospect.id)}>
                      {copiedId === prospect.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedId === prospect.id ? 'Copied' : 'Copy Email'}
                    </Button>
                  )}
                  {isApproved && (
                    <Link
                      href="/send-queue"
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        isBusy ? 'pointer-events-none opacity-40' : ''
                      }`}
                      style={{
                        background: 'var(--color-accent)',
                        color: 'var(--color-paper)',
                      }}
                    >
                      <Send size={14} /> Open Send Queue
                    </Link>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
