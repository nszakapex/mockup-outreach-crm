'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  ExternalLink,
  Globe,
  Plus,
  X,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import LeadScoreBadge from '@/components/LeadScoreBadge';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import ErrorBanner from '@/components/ErrorBanner';
import DataSourceBadge from '@/components/DataSourceBadge';
import { PageHeader, SafetyBanner, StatusPill } from '@/components/CommandPrimitives';
import { useProspects } from '@/lib/hooks';
import { createProspectBundle } from '@/lib/prospect-intake';
import { PROSPECT_STATUSES, type ProspectStatus } from '@/lib/types';

const EMPTY_FORM = {
  business_name: '',
  niche: 'restaurant',
  website_url: '',
  public_email: '',
  phone: '',
  city: 'Fort Collins',
  state: 'CO',
  instagram_url: '',
  facebook_url: '',
  google_maps_url: '',
  lead_score: 70,
  status: 'qualified' as ProspectStatus,
  source: 'manual',
  notes: '',
};

export default function ProspectsPage() {
  const router = useRouter();
  const { prospects, loading, error, dataSource, refetch } = useProspects();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | ''>('');
  const [nicheFilter, setNicheFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const niches = useMemo(() => [...new Set(prospects.map((p) => p.niche))].sort(), [prospects]);
  const cities = useMemo(() => [...new Set(prospects.map((p) => p.city))].sort(), [prospects]);

  const filtered = useMemo(() => {
    return prospects.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          p.business_name.toLowerCase().includes(q) ||
          p.niche.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          (p.public_email || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter && p.status !== statusFilter) return false;
      if (nicheFilter && p.niche !== nicheFilter) return false;
      if (cityFilter && p.city !== cityFilter) return false;
      return true;
    });
  }, [prospects, search, statusFilter, nicheFilter, cityFilter]);

  const handleCreate = async () => {
    if (!form.business_name.trim()) {
      setCreateError('Business name is required.');
      return;
    }
    if (!form.niche.trim()) {
      setCreateError('Niche is required.');
      return;
    }
    if (!form.website_url.trim()) {
      setCreateError('Website URL is required.');
      return;
    }
    if (!form.public_email.trim()) {
      setCreateError('Public email is required.');
      return;
    }
    if (!form.city.trim() || !form.state.trim()) {
      setCreateError('City and state are required.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    const { data, error: err } = await createProspectBundle({
      ...form,
      website_url: form.website_url || null,
      public_email: form.public_email || null,
      phone: form.phone || null,
      instagram_url: form.instagram_url || null,
      facebook_url: form.facebook_url || null,
      google_maps_url: form.google_maps_url || null,
      source: form.source || null,
      notes: form.notes || null,
    }, {
      source: 'manual',
      requireDestinationIdentity: true,
      statusMode: 'manual',
    });
    setCreating(false);
    if (err) {
      setCreateError(err);
    } else {
      setShowCreate(false);
      setForm(EMPTY_FORM);
      refetch();
      if (data?.prospect.id) router.push(`/prospects/${data.prospect.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={
          <>
            <DataSourceBadge source={dataSource} />
            <StatusPill tone="neutral">{filtered.length} shown</StatusPill>
            <StatusPill tone="accent">{prospects.length} total</StatusPill>
          </>
        }
        title="Prospects"
        description="Research workspace for scanning business identity, campaign lane, readiness, and next review status."
        actions={
          <Button size="md" onClick={() => setShowCreate(true)} disabled={dataSource === 'seed'}>
            <Plus size={16} />
            Add Prospect
          </Button>
        }
      />

      {dataSource === 'seed' && (
        <SafetyBanner tone="warning" title="Seed fallback is read-only for manual adds" className="mb-6" icon={<ShieldCheck size={17} />}>
          Manual prospect creation is disabled while the app is using fallback seed data.
        </SafetyBanner>
      )}

      {error && <div className="mb-6"><ErrorBanner message={error} onRetry={refetch} /></div>}

      {/* Create Prospect Modal */}
      {showCreate && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setShowCreate(false)} />
          <div
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-lg)' }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>Add Prospect</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded cursor-pointer" style={{ color: 'var(--color-ink-3)' }}><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {createError && <ErrorBanner message={createError} />}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField id="prospect-business-name" name="business_name" label="Business Name *" value={form.business_name} onChange={(v) => setForm({ ...form, business_name: v })} />
                <FormField id="prospect-niche" name="niche" label="Niche" value={form.niche} onChange={(v) => setForm({ ...form, niche: v })} />
                <FormField id="prospect-website-url" name="website_url" label="Website URL" value={form.website_url} onChange={(v) => setForm({ ...form, website_url: v })} placeholder="https://..." />
                <FormField id="prospect-public-email" name="public_email" label="Email" value={form.public_email} onChange={(v) => setForm({ ...form, public_email: v })} />
                <FormField id="prospect-phone" name="phone" label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                <FormField id="prospect-city" name="city" label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
                <FormField id="prospect-state" name="state" label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} />
                <FormField id="prospect-source" name="source" label="Source" value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
                <FormField id="prospect-instagram-url" name="instagram_url" label="Instagram URL" value={form.instagram_url} onChange={(v) => setForm({ ...form, instagram_url: v })} />
                <FormField id="prospect-facebook-url" name="facebook_url" label="Facebook URL" value={form.facebook_url} onChange={(v) => setForm({ ...form, facebook_url: v })} />
                <FormField id="prospect-google-maps-url" name="google_maps_url" label="Google Maps URL" value={form.google_maps_url} onChange={(v) => setForm({ ...form, google_maps_url: v })} />
                <div>
                  <label htmlFor="prospect-status" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-3)' }}>Status</label>
                  <select
                    id="prospect-status"
                    name="status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ProspectStatus })}
                    className="control-input px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                  >
                    {PROSPECT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="prospect-lead-score" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-3)' }}>Lead Score (0-100)</label>
                  <input
                    id="prospect-lead-score"
                    name="lead_score"
                    type="number"
                    min={0}
                    max={100}
                    value={form.lead_score}
                    onChange={(e) => setForm({ ...form, lead_score: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                    className="control-input px-3 py-2.5 text-sm outline-none"
                    style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="prospect-notes" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-3)' }}>Notes</label>
                <textarea
                  id="prospect-notes"
                  name="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="control-input w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                  style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Prospect'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-ink-3)' }} />
          <input
            id="prospects-search"
            name="prospects_search"
            type="text"
            placeholder="Search by name, niche, city, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="control-input w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
            style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
          />
        </div>
        <Button variant="secondary" size="md" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} />
          Filters
        </Button>
      </div>

      {/* Filter row */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-xl" style={{ background: 'var(--color-paper-2)', border: '1px solid var(--color-border)' }}>
          <div>
            <label htmlFor="prospects-status-filter" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-3)' }}>Status</label>
            <select id="prospects-status-filter" name="status_filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProspectStatus | '')} className="control-input w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}>
              <option value="">All Statuses</option>
              {PROSPECT_STATUSES.map((s) => (<option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="prospects-niche-filter" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-3)' }}>Niche</label>
            <select id="prospects-niche-filter" name="niche_filter" value={nicheFilter} onChange={(e) => setNicheFilter(e.target.value)} className="control-input w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}>
              <option value="">All Niches</option>
              {niches.map((n) => (<option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="prospects-city-filter" className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-3)' }}>City</label>
            <select id="prospects-city-filter" name="city_filter" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="control-input w-full px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}>
              <option value="">All Cities</option>
              {cities.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
        </div>
      )}

      {/* Table */}
      {error ? (
        <Card>
          <EmptyState
            icon={<AlertTriangle size={24} />}
            title="Prospects did not load"
            description="Supabase is configured, so seed data was not used. Fix the Supabase error above, then retry."
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Globe size={24} />}
            title={prospects.length === 0 ? 'No prospects yet' : 'No prospects found'}
            description={prospects.length === 0 ? 'Add your first prospect to get started.' : 'Try adjusting your search or filters.'}
            action={prospects.length === 0 && dataSource === 'supabase' ? <Button onClick={() => setShowCreate(true)}><Plus size={16} /> Add Prospect</Button> : undefined}
          />
        </Card>
      ) : (
        <Card noPadding>
          <div className="divide-y md:hidden" style={{ borderColor: 'var(--color-divider)' }}>
            {filtered.map((p) => (
              <Link key={p.id} href={`/prospects/${p.id}`} className="block p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold" style={{ color: 'var(--color-ink)' }}>{p.business_name}</div>
                    {p.public_email && <div className="mt-1 truncate text-xs" style={{ color: 'var(--color-ink-3)' }}>{p.public_email}</div>}
                    <div className="mt-2 text-xs capitalize" style={{ color: 'var(--color-ink-2)' }}>{p.niche} - {p.city}, {p.state}</div>
                  </div>
                  <LeadScoreBadge score={p.lead_score} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <StatusBadge status={p.status} />
                  {p.website_url && <ExternalLink size={14} style={{ color: 'var(--color-ink-3)' }} />}
                </div>
              </Link>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="data-table w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--color-ink-3)' }}>Business</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] hidden sm:table-cell" style={{ color: 'var(--color-ink-3)' }}>Niche</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] hidden md:table-cell" style={{ color: 'var(--color-ink-3)' }}>City</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] hidden sm:table-cell" style={{ color: 'var(--color-ink-3)' }}>Score</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--color-ink-3)' }}>Status</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold uppercase tracking-[0.08em] hidden lg:table-cell" style={{ color: 'var(--color-ink-3)' }}>Links</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="transition-colors" style={{ borderBottom: '1px solid var(--color-divider)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-paper-hover)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                    <td className="px-5 py-3.5">
                      <Link href={`/prospects/${p.id}`} className="font-medium hover:underline" style={{ color: 'var(--color-ink)' }}>{p.business_name}</Link>
                      {p.public_email && <div className="text-xs mt-0.5" style={{ color: 'var(--color-ink-3)' }}>{p.public_email}</div>}
                    </td>
                    <td className="px-5 py-3.5 capitalize hidden sm:table-cell" style={{ color: 'var(--color-ink-2)' }}>{p.niche}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell" style={{ color: 'var(--color-ink-2)' }}>{p.city}, {p.state}</td>
                    <td className="px-5 py-3.5 text-center hidden sm:table-cell"><LeadScoreBadge score={p.lead_score} /></td>
                    <td className="px-5 py-3.5"><StatusBadge status={p.status} /></td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center justify-center gap-2">
                        {p.website_url && (
                          <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-ink-3)' }} title="Website">
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function FormField({ id, name, label, value, onChange, placeholder }: { id: string; name: string; label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-3)' }}>{label}</label>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="control-input w-full px-3 py-2.5 rounded-lg text-sm outline-none"
        style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
      />
    </div>
  );
}
