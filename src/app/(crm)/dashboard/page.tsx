'use client';

import {
  Users,
  Target,
  Palette,
  Mail,
  CheckCircle,
  Send,
  Clock,
  MessageSquare,
  Phone,
  Database,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import ConnectionPanel from '@/components/ConnectionPanel';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import LeadScoreBadge from '@/components/LeadScoreBadge';
import ErrorBanner from '@/components/ErrorBanner';
import DataSourceBadge from '@/components/DataSourceBadge';
import LatestSendCard from '@/components/LatestSendCard';
import { PageHeader, SafetyBanner, StatusPill } from '@/components/CommandPrimitives';
import { useDashboardStats } from '@/lib/hooks';
import Link from 'next/link';

export default function DashboardPage() {
  const {
    stats,
    recentProspects,
    loading,
    error,
    dataSource,
    lastSupabaseQueryStatus,
    prospectsLoaded,
  } = useDashboardStats();

  return (
    <div>
      <PageHeader
        eyebrow={
          <>
            <StatusPill tone="accent" icon={<Activity size={12} />}>Outreach OS</StatusPill>
            <DataSourceBadge source={dataSource} />
          </>
        }
        title="Dashboard"
        description="Executive command center for prospect review, mockup readiness, approval confidence, and controlled manual sending."
        actions={
          <Link
            href="/approval"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            style={{
              background: 'var(--color-ink)',
              color: 'var(--color-paper-2)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Review queue <ArrowRight size={15} />
          </Link>
        }
      />

      <SafetyBanner tone="warning" title="Manual-send safety is page-gated" className="mb-6" icon={<ShieldCheck size={17} />}>
        This dashboard reads pipeline status only. Approval, import, and send actions remain behind their dedicated review screens.
      </SafetyBanner>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <ConnectionPanel
          dataSource={dataSource}
          lastSupabaseQueryStatus={lastSupabaseQueryStatus}
          lastSupabaseErrorMessage={error}
          prospectsLoaded={prospectsLoaded}
        />
        <LatestSendCard />
      </div>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      {loading ? (
        <Card>
          <div className="flex items-center justify-center gap-3 py-12">
            <div
              className="w-6 h-6 border-2 rounded-full animate-spin"
              style={{
                borderColor: 'var(--color-border)',
                borderTopColor: 'var(--color-accent)',
              }}
            />
            <span className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
              Loading dashboard data...
            </span>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <EmptyState
            icon={<DatabaseIcon />}
            title="Dashboard data did not load"
            description="Supabase is configured, so seed data was not used. Check the error above and the diagnostics panel."
          />
        </Card>
      ) : !stats || stats.total === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={24} />}
            title="No prospects loaded"
            description="The active data source returned zero prospects."
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Prospects" value={stats.total} icon={<Users size={18} />} accent="default" />
            <StatCard label="Qualified" value={stats.qualified} icon={<Target size={18} />} accent="blue" />
            <StatCard label="Mockups Ready" value={stats.mockups_ready} icon={<Palette size={18} />} accent="blue" />
            <StatCard label="Emails Ready" value={stats.emails_ready} icon={<Mail size={18} />} accent="warning" />
            <StatCard label="Approved to Send" value={stats.approved} icon={<CheckCircle size={18} />} accent="emerald" />
            <StatCard label="Sent Today" value={stats.sent_today} icon={<Send size={18} />} accent="emerald" />
            <StatCard label="Follow-ups Due" value={stats.follow_ups_due} icon={<Clock size={18} />} accent="warning" />
            <StatCard label="Replies" value={stats.replies} icon={<MessageSquare size={18} />} accent="emerald" />
            <StatCard label="Booked Calls" value={stats.booked} icon={<Phone size={18} />} accent="emerald" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card
              title="Recent Prospects"
              description="Newest records entering the research and approval workflow."
              action={
                <Link href="/prospects" className="text-xs font-semibold hover:underline" style={{ color: 'var(--color-accent)' }}>
                  View all
                </Link>
              }
              noPadding
            >
              {recentProspects.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
                    No prospects yet. Add your first prospect to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--color-ink-3)' }}>Business</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] hidden sm:table-cell" style={{ color: 'var(--color-ink-3)' }}>Niche</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] hidden md:table-cell" style={{ color: 'var(--color-ink-3)' }}>City</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] hidden sm:table-cell" style={{ color: 'var(--color-ink-3)' }}>Score</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--color-ink-3)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentProspects.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                          <td className="px-5 py-4">
                            <Link href={`/prospects/${p.id}`} className="font-semibold hover:underline" style={{ color: 'var(--color-ink)' }}>
                              {p.business_name}
                            </Link>
                            <div className="mt-1 text-xs sm:hidden" style={{ color: 'var(--color-ink-3)' }}>
                              {p.niche} - {p.city}, {p.state}
                            </div>
                          </td>
                          <td className="px-5 py-4 capitalize hidden sm:table-cell" style={{ color: 'var(--color-ink-2)' }}>{p.niche}</td>
                          <td className="px-5 py-4 hidden md:table-cell" style={{ color: 'var(--color-ink-2)' }}>{p.city}, {p.state}</td>
                          <td className="px-5 py-4 text-center hidden sm:table-cell"><LeadScoreBadge score={p.lead_score} /></td>
                          <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Next Actions" description="Priority paths for a safe work session.">
              <div className="space-y-3">
                <NextAction href="/import" label="Preview imports" detail="Validate blocked records before creating CRM rows." />
                <NextAction href="/approval" label="Review approvals" detail="Inspect draft, sender, and public artifact confidence." />
                <NextAction href="/send-queue" label="Control sends" detail="Confirm exact recipient, sender, subject, and final body." />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function DatabaseIcon() {
  return <Database size={24} />;
}

function NextAction({ href, label, detail }: { href: string; label: string; detail: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border p-3 transition-colors"
      style={{
        background: 'var(--color-paper-3)',
        borderColor: 'var(--color-divider)',
        color: 'var(--color-ink)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-sm">{label}</div>
        <ArrowRight size={14} style={{ color: 'var(--color-ink-3)' }} />
      </div>
      <div className="mt-1 text-xs leading-5" style={{ color: 'var(--color-ink-3)' }}>
        {detail}
      </div>
    </Link>
  );
}
