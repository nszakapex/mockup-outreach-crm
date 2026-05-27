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
} from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import StatusBadge from '@/components/StatusBadge';
import LeadScoreBadge from '@/components/LeadScoreBadge';
import ScoreBar from '@/components/ScoreBar';
import ErrorBanner from '@/components/ErrorBanner';
import { useProspect } from '@/lib/hooks';
import { type ProspectStatus } from '@/lib/types';

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
  const { prospect, loading, error, updateStatus, refetch } = useProspect(id);
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

          <Card title="Mockup" action={mockup?.slug ? (
            <Link href={`/mockups/${mockup.slug}`} target="_blank" className="text-xs font-medium hover:underline flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
              View <ExternalLink size={10} />
            </Link>
          ) : undefined}>
            {mockup ? (
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>Title</span>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--color-ink)' }}>{mockup.title}</div>
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
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>No mockup created yet.</p>
            )}
          </Card>

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
