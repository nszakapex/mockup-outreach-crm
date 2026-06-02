'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  FileText,
  Palette,
  ClipboardCheck,
  AlertTriangle,
  Save,
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import LeadScoreBadge from '@/components/LeadScoreBadge';
import ScoreBar from '@/components/ScoreBar';
import ErrorBanner from '@/components/ErrorBanner';
import { upsertAudit, upsertEmailDraft, upsertMockup, useProspect } from '@/lib/hooks';
import { parseMockupConceptNotes, type RichMockupData } from '@/lib/mockup-rich-data';
import { buildPublicFlooringAuditUrl, buildPublicMockupUrl, buildPublicSocialAuditUrl, getMockupTemplateVariant, getMockupVariantLabel } from '@/lib/mockup-templates';
import { slugifyBusinessName } from '@/lib/prospect-intake';
import { isResinateCampaign, parseResinateConceptNotes, type ResinateFlooringData } from '@/lib/resinate-data';
import { parseSocialAuditConceptNotes, type SocialAuditData } from '@/lib/social-audit-data';
import { PROSPECT_STATUSES, type Audit, type EmailDraft, type Mockup, type Prospect, type ProspectStatus } from '@/lib/types';

const STATUS_ACTIONS: { status: ProspectStatus; label: string; variant: 'primary' | 'secondary' | 'danger' }[] = [
  { status: 'qualified', label: 'Mark Qualified', variant: 'secondary' },
  { status: 'audited', label: 'Mark Audited', variant: 'secondary' },
  { status: 'mockup_ready', label: 'Mark Mockup Ready', variant: 'secondary' },
  { status: 'email_ready', label: 'Mark Email Ready', variant: 'secondary' },
  { status: 'approved_to_send', label: 'Approve to Send', variant: 'primary' },
  { status: 'sent', label: 'Mark Sent', variant: 'primary' },
  { status: 'replied', label: 'Mark Replied', variant: 'primary' },
  { status: 'booked', label: 'Mark Booked', variant: 'primary' },
  { status: 'do_not_contact', label: 'Do Not Contact', variant: 'danger' },
];

export default function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { prospect, loading, error, updateStatus, updateProspect, refetch } = useProspect(id);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<ProspectStatus | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStatusUpdate = async (status: ProspectStatus) => {
    setUpdatingStatus(status);
    setActionError(null);
    const err = await updateStatus(status);
    setUpdatingStatus(null);
    if (err) setActionError(err);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16">
        <ErrorBanner message={error} onRetry={refetch} />
        <div className="text-center mt-4">
          <Link href="/prospects" className="text-sm" style={{ color: 'var(--color-accent)' }}>Back to prospects</Link>
        </div>
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="text-center py-16">
        <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: 'var(--color-warning)' }} />
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Prospect not found</h2>
        <p className="text-sm mt-1 mb-4" style={{ color: 'var(--color-ink-3)' }}>
          This prospect may have been deleted or the ID is incorrect.
        </p>
        <Link href="/prospects" className="text-sm" style={{ color: 'var(--color-accent)' }}>Back to prospects</Link>
      </div>
    );
  }

  const audit = prospect.audits?.[0];
  const mockup = prospect.mockups?.[0];
  const emailDraft = prospect.email_drafts?.[0];
  const followUps = prospect.follow_up_tasks || [];
  const mockupPublicUrl = mockup?.slug ? buildPublicMockupUrl(mockup.slug) : mockup?.mockup_url || null;
  const socialAuditPublicUrl = mockup?.slug ? buildPublicSocialAuditUrl(mockup.slug) : null;
  const flooringAuditPublicUrl = mockup?.slug ? buildPublicFlooringAuditUrl(mockup.slug) : null;
  const mockupVariant = getMockupTemplateVariant(prospect.niche);
  const mockupStrategy = mockup ? parseMockupConceptNotes(mockup.concept_notes) : null;
  const socialAuditStrategy = mockup ? parseSocialAuditConceptNotes(mockup.concept_notes) : {};
  const resinateStrategy = mockup ? parseResinateConceptNotes(mockup.concept_notes) : {};
  const isResinate = isResinateCampaign(resinateStrategy);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link href="/prospects" className="inline-flex items-center gap-1.5 text-sm mb-4 hover:underline" style={{ color: 'var(--color-ink-3)' }}>
          <ArrowLeft size={14} /> Back to Prospects
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>{prospect.business_name}</h1>
              <LeadScoreBadge score={prospect.lead_score} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={prospect.status} size="md" />
              <span className="text-sm capitalize" style={{ color: 'var(--color-ink-3)' }}>{prospect.niche}</span>
            </div>
          </div>
        </div>
      </div>

      {actionError && <div className="mb-6"><ErrorBanner message={actionError} /></div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <ProspectEditCard prospect={prospect} onSave={updateProspect} onSaved={refetch} />
        <AuditEditCard prospectId={prospect.id} audit={audit} onSaved={refetch} />
        <MockupEditCard prospect={prospect} mockup={mockup} onSaved={refetch} />
        <EmailDraftEditCard prospectId={prospect.id} draft={emailDraft} onSaved={refetch} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Info */}
          <Card title="Business Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prospect.website_url && (
                <InfoRow icon={<Globe size={14} />} label="Website">
                  <a href={prospect.website_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
                    {(() => { try { return new URL(prospect.website_url).hostname; } catch { return prospect.website_url; } })()}
                    <ExternalLink size={12} />
                  </a>
                </InfoRow>
              )}
              {prospect.public_email && (
                <InfoRow icon={<Mail size={14} />} label="Email">
                  <button onClick={() => copyToClipboard(prospect.public_email!, 'email')} className="flex items-center gap-1 hover:underline cursor-pointer" style={{ color: 'var(--color-ink)' }}>
                    {prospect.public_email}
                    {copiedField === 'email' ? <Check size={12} style={{ color: 'var(--color-success)' }} /> : <Copy size={12} style={{ color: 'var(--color-ink-3)' }} />}
                  </button>
                </InfoRow>
              )}
              {prospect.phone && (
                <InfoRow icon={<Phone size={14} />} label="Phone"><span style={{ color: 'var(--color-ink)' }}>{prospect.phone}</span></InfoRow>
              )}
              <InfoRow icon={<MapPin size={14} />} label="Location"><span style={{ color: 'var(--color-ink)' }}>{prospect.city}, {prospect.state}</span></InfoRow>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--color-divider)' }}>
              {prospect.instagram_url && <SocialLink href={prospect.instagram_url} label="Instagram" />}
              {prospect.facebook_url && <SocialLink href={prospect.facebook_url} label="Facebook" />}
              {prospect.google_maps_url && <SocialLink href={prospect.google_maps_url} label="Google Maps" />}
            </div>
          </Card>

          {/* Audit Panel */}
          <Card title="Site Audit" action={!audit ? <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>No audit yet</span> : undefined}>
            {audit ? (
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <ScoreBar label="Website" score={audit.website_score} />
                  <ScoreBar label="Mobile" score={audit.mobile_score} />
                  <ScoreBar label="SEO" score={audit.seo_score} />
                  <ScoreBar label="Social" score={audit.social_score} />
                </div>
                {audit.main_problem && <FieldBlock label="Main Problem" value={audit.main_problem} />}
                {audit.conversion_opportunity && <FieldBlock label="Conversion Opportunity" value={audit.conversion_opportunity} />}
                {audit.recommended_offer && <FieldBlock label="Recommended Offer" value={audit.recommended_offer} />}
                {audit.mockup_angle && <FieldBlock label="Mockup Angle" value={audit.mockup_angle} />}
                {audit.audit_notes && <FieldBlock label="Notes" value={audit.audit_notes} />}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
                {/* TODO: [Hermes Integration] Wire AI audit generation here */}
                No audit has been performed yet.
              </p>
            )}
          </Card>

          {/* Email Draft Panel */}
          <Card
            title="Email Draft"
            action={emailDraft ? (
              <Button size="sm" variant="ghost" onClick={() => { copyToClipboard(`Subject: ${emailDraft.subject}\n\n${emailDraft.body}`, 'email-draft'); }}>
                {copiedField === 'email-draft' ? <Check size={14} /> : <Copy size={14} />}
                {copiedField === 'email-draft' ? 'Copied' : 'Copy'}
              </Button>
            ) : undefined}
          >
            {emailDraft ? (
              <div>
                <div className="mb-3">
                  <span className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>Subject</span>
                  <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--color-ink)' }}>{emailDraft.subject}</div>
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed p-4 rounded-lg" style={{ background: 'var(--color-paper-3)', color: 'var(--color-ink-2)', border: '1px solid var(--color-divider)' }}>
                  {emailDraft.body}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs" style={{ color: 'var(--color-ink-3)' }}>Status: {emailDraft.status}</span>
                  {emailDraft.sent_at && <span className="text-xs" style={{ color: 'var(--color-ink-muted)' }}>Sent: {new Date(emailDraft.sent_at).toLocaleDateString()}</span>}
                  {emailDraft.reply_status && emailDraft.reply_status !== 'none' && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: 'var(--color-emerald)', background: 'var(--color-emerald-muted)' }}>{emailDraft.reply_status}</span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
                {/* TODO: [Hermes Integration] Wire AI email draft generation here */}
                No email draft yet.
              </p>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <Card title="Actions">
            <div className="space-y-2">
              {STATUS_ACTIONS.map(({ status, label, variant }) => (
                <Button
                  key={status}
                  variant={variant}
                  size="sm"
                  className="w-full"
                  onClick={() => handleStatusUpdate(status)}
                  disabled={prospect.status === status || updatingStatus !== null}
                >
                  {updatingStatus === status ? 'Updating...' : label}
                </Button>
              ))}
            </div>
          </Card>

          <Card title="Mockup" action={mockupPublicUrl ? (
            <a href={mockupPublicUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
              Open Mockup <ExternalLink size={10} />
            </a>
          ) : undefined}>
            {mockup ? (
              <div className="space-y-3">
                {!mockup.slug && (
                  <div
                    className="rounded-lg p-3 text-xs"
                    style={{
                      background: 'oklch(75% 0.16 85 / 0.08)',
                      border: '1px solid oklch(75% 0.16 85 / 0.2)',
                      color: 'var(--color-warning)',
                    }}
                  >
                    Missing mockup slug. Add a slug before sending this concept link.
                  </div>
                )}
                <div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>Title</span>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--color-ink)' }}>{mockup.title}</div>
                </div>
                <div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>Template Variant</span>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--color-ink)' }}>{getMockupVariantLabel(mockupVariant)}</div>
                </div>
                {mockup.hero_headline && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>Headline</span>
                    <div className="text-sm mt-0.5 font-medium" style={{ color: 'var(--color-ink)' }}>{mockup.hero_headline}</div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Palette size={12} style={{ color: 'var(--color-ink-3)' }} />
                  <span className="text-xs capitalize" style={{ color: 'var(--color-ink-2)' }}>{mockup.mockup_status}</span>
                </div>
                {mockupPublicUrl && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>Final Public URL</span>
                    <div
                      className="mt-1.5 rounded-lg p-3 text-xs break-all"
                      style={{
                        background: 'var(--color-paper-3)',
                        border: '1px solid var(--color-divider)',
                        color: 'var(--color-ink-2)',
                      }}
                    >
                      {mockupPublicUrl}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => copyToClipboard(mockupPublicUrl, 'mockup-link')}>
                        {copiedField === 'mockup-link' ? <Check size={14} /> : <Copy size={14} />}
                        {copiedField === 'mockup-link' ? 'Copied' : 'Copy Link'}
                      </Button>
                      <a
                        href={mockupPublicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          background: 'var(--color-paper-3)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        <ExternalLink size={14} />
                        Open Mockup
                      </a>
                    </div>
                  </div>
                )}
                <MockupStrategyPanel rich={mockupStrategy?.rich || {}} />
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>No mockup created yet.</p>
            )}
          </Card>

          <Card title="Social Audit" action={socialAuditPublicUrl ? (
            <a href={socialAuditPublicUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
              Open Social Audit <ExternalLink size={10} />
            </a>
          ) : undefined}>
            {mockup ? (
              <div className="space-y-3">
                {!mockup.slug && (
                  <div
                    className="rounded-lg p-3 text-xs"
                    style={{
                      background: 'oklch(75% 0.16 85 / 0.08)',
                      border: '1px solid oklch(75% 0.16 85 / 0.2)',
                      color: 'var(--color-warning)',
                    }}
                  >
                    Missing mockup slug. Add a slug before sharing a social audit link.
                  </div>
                )}
                {socialAuditPublicUrl && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>Public Social Audit URL</span>
                    <div
                      className="mt-1.5 rounded-lg p-3 text-xs break-all"
                      style={{
                        background: 'var(--color-paper-3)',
                        border: '1px solid var(--color-divider)',
                        color: 'var(--color-ink-2)',
                      }}
                    >
                      {socialAuditPublicUrl}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => copyToClipboard(socialAuditPublicUrl, 'social-audit-link')}>
                        {copiedField === 'social-audit-link' ? <Check size={14} /> : <Copy size={14} />}
                        {copiedField === 'social-audit-link' ? 'Copied' : 'Copy Link'}
                      </Button>
                      <a
                        href={socialAuditPublicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          background: 'var(--color-paper-3)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        <ExternalLink size={14} />
                        Open Social Audit
                      </a>
                    </div>
                  </div>
                )}
                <SocialAuditStrategyPanel social={socialAuditStrategy} audit={audit} />
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
                Create a mockup slug before sharing a public social audit page.
              </p>
            )}
          </Card>

          {isResinate && (
            <Card title="Resinate Flooring Campaign" action={flooringAuditPublicUrl ? (
              <a href={flooringAuditPublicUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-medium hover:underline flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
                Open Commercial Surface Brief <ExternalLink size={10} />
              </a>
            ) : undefined}>
              <div className="space-y-3">
                {flooringAuditPublicUrl && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>Public Commercial Surface Brief URL</span>
                    <div
                      className="mt-1.5 rounded-lg p-3 text-xs break-all"
                      style={{
                        background: 'var(--color-paper-3)',
                        border: '1px solid var(--color-divider)',
                        color: 'var(--color-ink-2)',
                      }}
                    >
                      {flooringAuditPublicUrl}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => copyToClipboard(flooringAuditPublicUrl, 'flooring-brief-link')}>
                        {copiedField === 'flooring-brief-link' ? <Check size={14} /> : <Copy size={14} />}
                        {copiedField === 'flooring-brief-link' ? 'Copied' : 'Copy Surface Brief Link'}
                      </Button>
                      <a
                        href={flooringAuditPublicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{
                          background: 'var(--color-paper-3)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-ink)',
                        }}
                      >
                        <ExternalLink size={14} />
                        Open Commercial Surface Brief
                      </a>
                    </div>
                  </div>
                )}
                <ResinateStrategyPanel flooring={resinateStrategy} />
              </div>
            </Card>
          )}

          <Card title="Follow-up Tasks">
            {followUps.length > 0 ? (
              <div className="space-y-3">
                {followUps.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--color-paper-3)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{
                      background: task.status === 'completed' ? 'var(--color-emerald-subtle)' : 'var(--color-accent-subtle)',
                      color: task.status === 'completed' ? 'var(--color-emerald)' : 'var(--color-accent)',
                    }}>
                      {task.task_type === 'call' ? <Phone size={14} /> : task.task_type === 'email' ? <Mail size={14} /> : task.task_type === 'review' ? <ClipboardCheck size={14} /> : <Calendar size={14} />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium capitalize" style={{ color: 'var(--color-ink)' }}>{task.task_type.replace(/_/g, ' ')}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-ink-3)' }}>Due: {new Date(task.due_date).toLocaleDateString()}</div>
                      {task.notes && <div className="text-xs mt-1" style={{ color: 'var(--color-ink-2)' }}>{task.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>No follow-up tasks scheduled.</p>
            )}
          </Card>

          <Card title="Notes" action={<FileText size={14} style={{ color: 'var(--color-ink-muted)' }} />}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
              {prospect.notes || 'No notes yet.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MockupStrategyPanel({ rich }: { rich: RichMockupData }) {
  const hasStrategy = Boolean(
    rich.current_site_snapshot ||
      rich.online_presence_status?.length ||
      rich.visual_direction ||
      rich.proposed_site_nav?.length ||
      rich.homepage_sections?.length ||
      rich.menu_or_offer_items?.length ||
      rich.trust_signals?.length ||
      rich.website_issue_examples?.length ||
      rich.cta_strategy ||
      rich.local_seo_angle ||
      rich.content_strategy_angle ||
      rich.meta_ads_angle
  );

  return (
    <div className="pt-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
      <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-ink-3)' }}>
        Mockup Strategy
      </div>
      {hasStrategy ? (
        <div className="space-y-3">
          {rich.current_site_snapshot && <FieldBlock label="Current Site Snapshot" value={rich.current_site_snapshot} />}
          {rich.visual_direction && <FieldBlock label="Visual Direction" value={rich.visual_direction} />}
          {rich.cta_strategy && <FieldBlock label="CTA Strategy" value={rich.cta_strategy} />}
          {rich.local_seo_angle && <FieldBlock label="Local SEO Angle" value={rich.local_seo_angle} />}
          {rich.content_strategy_angle && <FieldBlock label="Content Strategy" value={rich.content_strategy_angle} />}
          {rich.meta_ads_angle && <FieldBlock label="Meta Ads Angle" value={rich.meta_ads_angle} />}
          <StrategyList label="Online Presence Status" items={rich.online_presence_status} />
          <StrategyList label="Proposed Site Nav" items={rich.proposed_site_nav} />
          <StrategyList label="Homepage Sections" items={rich.homepage_sections} />
          <StrategyList label="Menu / Offers" items={rich.menu_or_offer_items} />
          <StrategyList label="Trust Signals" items={rich.trust_signals} />
          <StrategyList label="Website Issues" items={rich.website_issue_examples} />
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
          No rich mockup strategy fields yet.
        </p>
      )}
    </div>
  );
}

function SocialAuditStrategyPanel({ social, audit }: { social: SocialAuditData; audit?: Audit }) {
  const scorecard = social.social_audit;
  const hasSocialData = Boolean(
    scorecard ||
      social.content_opportunity ||
      social.content_plan ||
      social.meta_ads_angle ||
      social.website_social_gap ||
      social.first_email_angle ||
      social.call_follow_up_angle ||
      audit?.social_score ||
      audit?.main_problem ||
      audit?.conversion_opportunity
  );

  return (
    <div className="pt-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
      <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-ink-3)' }}>
        Social Audit Preview
      </div>
      {hasSocialData ? (
        <div className="space-y-3">
          {typeof scorecard?.overall_social_score === 'number' ? (
            <FieldBlock label="Overall Social Score" value={String(scorecard.overall_social_score)} />
          ) : audit?.social_score ? (
            <FieldBlock label="Overall Social Score" value={String(audit.social_score)} />
          ) : null}
          {scorecard?.instagram_status && <FieldBlock label="Instagram Status" value={scorecard.instagram_status} />}
          {scorecard?.facebook_status && <FieldBlock label="Facebook Status" value={scorecard.facebook_status} />}
          {scorecard?.posting_consistency && <FieldBlock label="Posting Consistency" value={scorecard.posting_consistency} />}
          {scorecard?.content_quality && <FieldBlock label="Content Quality" value={scorecard.content_quality} />}
          {scorecard?.reels_video_usage && <FieldBlock label="Reels / Video Usage" value={scorecard.reels_video_usage} />}
          {scorecard?.cta_usage && <FieldBlock label="CTA Usage" value={scorecard.cta_usage} />}
          {scorecard?.visual_branding && <FieldBlock label="Visual Branding" value={scorecard.visual_branding} />}
          {social.content_opportunity && <FieldBlock label="Content Opportunity" value={social.content_opportunity} />}
          {social.website_social_gap && <FieldBlock label="Website + Social Gap" value={social.website_social_gap} />}
          {social.meta_ads_angle && <FieldBlock label="Meta Ads Angle" value={social.meta_ads_angle} />}
          {social.first_email_angle && <FieldBlock label="First Email Angle" value={social.first_email_angle} />}
          {audit?.main_problem && <FieldBlock label="Fallback Main Problem" value={audit.main_problem} />}
          {audit?.conversion_opportunity && <FieldBlock label="Fallback Conversion Opportunity" value={audit.conversion_opportunity} />}
          <StrategyList label="Why Underperforming" items={scorecard?.why_underperforming} />
          <StrategyList label="Priority Content Themes" items={social.content_plan?.priority_content_themes} />
          <SocialPlanPreview plan={social.content_plan} />
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
          No rich social audit fields yet. The public page will fall back to audit notes and generated content guidance.
        </p>
      )}
    </div>
  );
}

function ResinateStrategyPanel({ flooring }: { flooring: ResinateFlooringData }) {
  const hasFlooringData = Boolean(
    flooring.buyer_type ||
      flooring.property_type ||
      flooring.likely_surface_problem ||
      flooring.traffic_needs ||
      flooring.moisture_needs ||
      flooring.slip_resistance_needs ||
      flooring.recommended_flooring_system ||
      flooring.system_reasoning ||
      flooring.best_resinate_offer ||
      flooring.likely_objection ||
      flooring.objection_response ||
      flooring.next_sales_action
  );

  return (
    <div className="pt-3" style={{ borderTop: '1px solid var(--color-divider)' }}>
      <div className="text-xs font-medium mb-2" style={{ color: 'var(--color-ink-3)' }}>
        Commercial Flooring Preview
      </div>
      {hasFlooringData ? (
        <div className="space-y-3">
          {flooring.buyer_type && <FieldBlock label="Buyer Type" value={flooring.buyer_type} />}
          {flooring.property_type && <FieldBlock label="Property Type" value={flooring.property_type} />}
          {flooring.likely_surface_problem && <FieldBlock label="Likely Surface Issue" value={flooring.likely_surface_problem} />}
          {flooring.traffic_needs && <FieldBlock label="Traffic Needs" value={flooring.traffic_needs} />}
          {flooring.moisture_needs && <FieldBlock label="Moisture Needs" value={flooring.moisture_needs} />}
          {flooring.slip_resistance_needs && <FieldBlock label="Slip-Resistance Needs" value={flooring.slip_resistance_needs} />}
          {flooring.recommended_flooring_system && <FieldBlock label="Recommended Flooring System" value={flooring.recommended_flooring_system} />}
          {flooring.system_reasoning && <FieldBlock label="System Reasoning" value={flooring.system_reasoning} />}
          {flooring.best_resinate_offer && <FieldBlock label="Best Resinate Offer" value={flooring.best_resinate_offer} />}
          {flooring.likely_objection && <FieldBlock label="Likely Objection" value={flooring.likely_objection} />}
          {flooring.objection_response && <FieldBlock label="Objection Response" value={flooring.objection_response} />}
          {flooring.next_sales_action && <FieldBlock label="Next Sales Action" value={flooring.next_sales_action} />}
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
          Campaign is marked as Resinate flooring, but the rich flooring fields are still sparse.
        </p>
      )}
    </div>
  );
}

function SocialPlanPreview({ plan }: { plan?: SocialAuditData['content_plan'] }) {
  if (!plan) return null;

  const weeks = [
    ['Week 1', plan.week_1],
    ['Week 2', plan.week_2],
    ['Week 3', plan.week_3],
    ['Week 4', plan.week_4],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  if (
    weeks.length === 0 &&
    !plan.recommended_posting_cadence &&
    !plan.recommended_reels_per_week &&
    !plan.shoot_frequency
  ) {
    return null;
  }

  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>
        4-Week Content Plan
      </span>
      <div className="mt-2 space-y-2">
        {weeks.map(([label, value]) => (
          <div key={label} className="rounded-lg p-2 text-xs" style={{ background: 'var(--color-paper-3)', color: 'var(--color-ink-2)' }}>
            <strong style={{ color: 'var(--color-ink)' }}>{label}:</strong> {value}
          </div>
        ))}
        {plan.recommended_posting_cadence && <FieldBlock label="Cadence" value={plan.recommended_posting_cadence} />}
        {plan.recommended_reels_per_week && <FieldBlock label="Reels Per Week" value={plan.recommended_reels_per_week} />}
        {plan.shoot_frequency && <FieldBlock label="Shoot Frequency" value={plan.shoot_frequency} />}
      </div>
    </div>
  );
}

function StrategyList({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>
        {label}
      </span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.slice(0, 6).map((item) => (
          <span
            key={item}
            className="rounded-full px-2 py-1 text-xs"
            style={{
              background: 'var(--color-paper-3)',
              border: '1px solid var(--color-divider)',
              color: 'var(--color-ink-2)',
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5" style={{ color: 'var(--color-ink-3)' }}>{icon}</span>
      <div>
        <div className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>{label}</div>
        <div className="text-sm mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ background: 'var(--color-paper-3)', color: 'var(--color-ink-2)', border: '1px solid var(--color-border)' }}>
      {label} <ExternalLink size={10} />
    </a>
  );
}

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>{label}</span>
      <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>{value}</p>
    </div>
  );
}

function ProspectEditCard({
  prospect,
  onSave,
  onSaved,
}: {
  prospect: Prospect;
  onSave: (updates: Partial<Prospect>) => Promise<string | null>;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    business_name: prospect.business_name,
    niche: prospect.niche,
    website_url: prospect.website_url ?? '',
    public_email: prospect.public_email ?? '',
    phone: prospect.phone ?? '',
    city: prospect.city,
    state: prospect.state,
    instagram_url: prospect.instagram_url ?? '',
    facebook_url: prospect.facebook_url ?? '',
    google_maps_url: prospect.google_maps_url ?? '',
    lead_score: String(prospect.lead_score),
    status: prospect.status,
    source: prospect.source ?? '',
    notes: prospect.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const err = await onSave({
      business_name: form.business_name,
      niche: form.niche,
      website_url: textOrNull(form.website_url),
      public_email: textOrNull(form.public_email),
      phone: textOrNull(form.phone),
      city: form.city,
      state: form.state,
      instagram_url: textOrNull(form.instagram_url),
      facebook_url: textOrNull(form.facebook_url),
      google_maps_url: textOrNull(form.google_maps_url),
      lead_score: numberOrZero(form.lead_score),
      status: form.status,
      source: textOrNull(form.source),
      notes: textOrNull(form.notes),
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onSaved();
  }

  return (
    <Card title="Edit Prospect">
      <EditGrid>
        <EditField label="Business" value={form.business_name} onChange={(value) => setForm({ ...form, business_name: value })} />
        <EditField label="Niche" value={form.niche} onChange={(value) => setForm({ ...form, niche: value })} />
        <EditField label="Website" value={form.website_url} onChange={(value) => setForm({ ...form, website_url: value })} />
        <EditField label="Public email" value={form.public_email} onChange={(value) => setForm({ ...form, public_email: value })} />
        <EditField label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
        <EditField label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
        <EditField label="State" value={form.state} onChange={(value) => setForm({ ...form, state: value })} />
        <EditField label="Lead score" type="number" value={form.lead_score} onChange={(value) => setForm({ ...form, lead_score: value })} />
        <EditSelect label="Status" value={form.status} options={PROSPECT_STATUSES} onChange={(value) => setForm({ ...form, status: value as ProspectStatus })} />
        <EditField label="Source" value={form.source} onChange={(value) => setForm({ ...form, source: value })} />
        <EditField label="Instagram" value={form.instagram_url} onChange={(value) => setForm({ ...form, instagram_url: value })} />
        <EditField label="Facebook" value={form.facebook_url} onChange={(value) => setForm({ ...form, facebook_url: value })} />
        <EditField label="Google Maps" value={form.google_maps_url} onChange={(value) => setForm({ ...form, google_maps_url: value })} />
      </EditGrid>
      <EditTextArea label="Notes" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
      <SaveFooter error={error} saving={saving} label="Save prospect" onSave={handleSave} />
    </Card>
  );
}

function AuditEditCard({ prospectId, audit, onSaved }: { prospectId: string; audit?: Audit; onSaved: () => void }) {
  const [form, setForm] = useState({
    website_score: audit?.website_score?.toString() ?? '',
    mobile_score: audit?.mobile_score?.toString() ?? '',
    seo_score: audit?.seo_score?.toString() ?? '',
    social_score: audit?.social_score?.toString() ?? '',
    main_problem: audit?.main_problem ?? '',
    conversion_opportunity: audit?.conversion_opportunity ?? '',
    recommended_offer: audit?.recommended_offer ?? '',
    mockup_angle: audit?.mockup_angle ?? '',
    audit_notes: audit?.audit_notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: err } = await upsertAudit({
      id: audit?.id,
      prospect_id: prospectId,
      website_score: nullableNumber(form.website_score),
      mobile_score: nullableNumber(form.mobile_score),
      seo_score: nullableNumber(form.seo_score),
      social_score: nullableNumber(form.social_score),
      main_problem: textOrNull(form.main_problem),
      conversion_opportunity: textOrNull(form.conversion_opportunity),
      recommended_offer: textOrNull(form.recommended_offer),
      mockup_angle: textOrNull(form.mockup_angle),
      audit_notes: textOrNull(form.audit_notes),
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onSaved();
  }

  return (
    <Card title="Edit Audit">
      <EditGrid>
        <EditField label="Website score" type="number" value={form.website_score} onChange={(value) => setForm({ ...form, website_score: value })} />
        <EditField label="Mobile score" type="number" value={form.mobile_score} onChange={(value) => setForm({ ...form, mobile_score: value })} />
        <EditField label="SEO score" type="number" value={form.seo_score} onChange={(value) => setForm({ ...form, seo_score: value })} />
        <EditField label="Social score" type="number" value={form.social_score} onChange={(value) => setForm({ ...form, social_score: value })} />
      </EditGrid>
      <EditTextArea label="Main problem" value={form.main_problem} onChange={(value) => setForm({ ...form, main_problem: value })} />
      <EditTextArea label="Conversion opportunity" value={form.conversion_opportunity} onChange={(value) => setForm({ ...form, conversion_opportunity: value })} />
      <EditTextArea label="Recommended offer" value={form.recommended_offer} onChange={(value) => setForm({ ...form, recommended_offer: value })} />
      <EditTextArea label="Mockup angle" value={form.mockup_angle} onChange={(value) => setForm({ ...form, mockup_angle: value })} />
      <EditTextArea label="Audit notes" value={form.audit_notes} onChange={(value) => setForm({ ...form, audit_notes: value })} />
      <SaveFooter error={error} saving={saving} label="Save audit" onSave={handleSave} />
    </Card>
  );
}

function MockupEditCard({ prospect, mockup, onSaved }: { prospect: Prospect; mockup?: Mockup; onSaved: () => void }) {
  const [form, setForm] = useState({
    slug: mockup?.slug ?? slugifyBusinessName(`${prospect.business_name} mockup`),
    title: mockup?.title ?? `${prospect.business_name} Mockup`,
    mockup_url: mockup?.mockup_url ?? '',
    mockup_status: mockup?.mockup_status ?? 'draft',
    hero_headline: mockup?.hero_headline ?? '',
    hero_subheadline: mockup?.hero_subheadline ?? '',
    primary_cta: mockup?.primary_cta ?? '',
    features_included: mockup?.features_included ?? '',
    concept_notes: mockup?.concept_notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: err } = await upsertMockup({
      id: mockup?.id,
      prospect_id: prospect.id,
      slug: form.slug,
      title: form.title,
      mockup_url: textOrNull(form.mockup_url),
      mockup_status: form.mockup_status,
      hero_headline: textOrNull(form.hero_headline),
      hero_subheadline: textOrNull(form.hero_subheadline),
      primary_cta: textOrNull(form.primary_cta),
      features_included: textOrNull(form.features_included),
      concept_notes: textOrNull(form.concept_notes),
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onSaved();
  }

  return (
    <Card title="Edit Mockup">
      <EditGrid>
        <EditField label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: slugifyBusinessName(value) })} />
        <EditField label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
        <EditField label="Mockup URL" value={form.mockup_url} onChange={(value) => setForm({ ...form, mockup_url: value })} />
        <EditSelect label="Mockup status" value={form.mockup_status} options={['draft', 'ready', 'published', 'archived']} onChange={(value) => setForm({ ...form, mockup_status: value })} />
        <EditField label="Hero headline" value={form.hero_headline} onChange={(value) => setForm({ ...form, hero_headline: value })} />
        <EditField label="Primary CTA" value={form.primary_cta} onChange={(value) => setForm({ ...form, primary_cta: value })} />
      </EditGrid>
      <EditTextArea label="Hero subheadline" value={form.hero_subheadline} onChange={(value) => setForm({ ...form, hero_subheadline: value })} />
      <EditTextArea label="Features included" value={form.features_included} onChange={(value) => setForm({ ...form, features_included: value })} />
      <EditTextArea label="Concept notes" value={form.concept_notes} onChange={(value) => setForm({ ...form, concept_notes: value })} />
      <SaveFooter error={error} saving={saving} label="Save mockup" onSave={handleSave} />
    </Card>
  );
}

function EmailDraftEditCard({ prospectId, draft, onSaved }: { prospectId: string; draft?: EmailDraft; onSaved: () => void }) {
  const [form, setForm] = useState({
    subject: draft?.subject ?? '',
    body: draft?.body ?? '',
    status: draft?.status ?? 'draft',
    reply_status: draft?.reply_status ?? 'none',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error: err } = await upsertEmailDraft({
      id: draft?.id,
      prospect_id: prospectId,
      subject: form.subject,
      body: form.body,
      status: form.status,
      approved_at: draft?.approved_at ?? null,
      sent_at: draft?.sent_at ?? null,
      reply_status: form.reply_status === 'none' ? 'none' : form.reply_status,
    });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onSaved();
  }

  return (
    <Card title="Edit Email Draft">
      <EditField label="Subject" value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} />
      <EditTextArea label="Body" value={form.body} rows={8} onChange={(value) => setForm({ ...form, body: value })} />
      <EditGrid>
        <EditSelect label="Draft status" value={form.status} options={['draft', 'ready', 'approved', 'sent', 'rejected']} onChange={(value) => setForm({ ...form, status: value })} />
        <EditSelect label="Reply status" value={form.reply_status} options={['none', 'replied', 'positive', 'negative', 'booked']} onChange={(value) => setForm({ ...form, reply_status: value })} />
      </EditGrid>
      <SaveFooter error={error} saving={saving} label="Save email draft" onSave={handleSave} />
    </Card>
  );
}

function EditGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function EditField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
}) {
  return (
    <label className="block text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-sm outline-none"
        style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
      />
    </label>
  );
}

function EditSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-sm outline-none"
        style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditTextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="mt-3 block text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="mt-1.5 w-full resize-y rounded-lg px-3 py-2.5 text-sm leading-6 outline-none"
        style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
      />
    </label>
  );
}

function SaveFooter({
  error,
  saving,
  label,
  onSave,
}: {
  error: string | null;
  saving: boolean;
  label: string;
  onSave: () => void;
}) {
  return (
    <div className="mt-4 space-y-3">
      {error && <ErrorBanner message={error} />}
      <Button size="sm" onClick={onSave} disabled={saving}>
        <Save size={14} />
        {saving ? 'Saving...' : label}
      </Button>
    </div>
  );
}

function textOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function numberOrZero(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function nullableNumber(value: string) {
  if (!value.trim()) return null;
  return numberOrZero(value);
}
