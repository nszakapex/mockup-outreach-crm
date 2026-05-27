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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
            Mockup outreach pipeline overview
          </p>
        </div>
        <DataSourceBadge source={dataSource} />
      </div>

      <ConnectionPanel
        className="mb-6"
        dataSource={dataSource}
        lastSupabaseQueryStatus={lastSupabaseQueryStatus}
        lastSupabaseErrorMessage={error}
        prospectsLoaded={prospectsLoaded}
      />

      <LatestSendCard className="mb-6" />

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
          {/* Stats grid */}
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

          {/* Recent prospects */}
          <Card
            title="Recent Prospects"
            action={
              <Link href="/prospects" className="text-xs font-medium hover:underline" style={{ color: 'var(--color-accent)' }}>
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
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Business</th>
                      <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--color-ink-3)' }}>Niche</th>
                      <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: 'var(--color-ink-3)' }}>City</th>
                      <th className="text-center px-5 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: 'var(--color-ink-3)' }}>Score</th>
                      <th className="text-left px-5 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProspects.map((p) => (
                      <tr
                        key={p.id}
                        className="transition-colors cursor-pointer"
                        style={{ borderBottom: '1px solid var(--color-divider)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-paper-hover)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <td className="px-5 py-3">
                          <Link href={`/prospects/${p.id}`} className="font-medium hover:underline" style={{ color: 'var(--color-ink)' }}>
                            {p.business_name}
                          </Link>
                        </td>
                        <td className="px-5 py-3 capitalize hidden sm:table-cell" style={{ color: 'var(--color-ink-2)' }}>{p.niche}</td>
                        <td className="px-5 py-3 hidden md:table-cell" style={{ color: 'var(--color-ink-2)' }}>{p.city}, {p.state}</td>
                        <td className="px-5 py-3 text-center hidden sm:table-cell"><LeadScoreBadge score={p.lead_score} /></td>
                        <td className="px-5 py-3"><StatusBadge status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function DatabaseIcon() {
  return <Database size={24} />;
}
