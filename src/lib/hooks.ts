'use client';

import { useEffect, useState } from 'react';
import {
  getDataSource,
  getSupabase,
  SUPABASE_QUERY_TIMEOUT_MS,
  type DataSource,
  type SupabaseQueryStatus,
} from './supabase';
import {
  SEED_AUDITS,
  SEED_EMAIL_DRAFTS,
  SEED_FOLLOW_UP_TASKS,
  SEED_MOCKUPS,
  SEED_PROSPECTS,
} from './seed-data';
import type {
  AppSettings,
  Audit,
  EmailDraft,
  FollowUpTask,
  Mockup,
  Prospect,
  ProspectStatus,
  ProspectWithRelations,
} from './types';
import { DEFAULT_SETTINGS } from './types';

const db = () => {
  const client = getSupabase();
  if (!client) throw new Error('Supabase env vars are not configured.');
  return client;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown Supabase error';
}

async function withSupabaseTimeout<T>(query: PromiseLike<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(query),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`${label} timed out after ${SUPABASE_QUERY_TIMEOUT_MS / 1000}s`)),
          SUPABASE_QUERY_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function fetchProspectsList(): Promise<{
  data: Prospect[];
  error: string | null;
  source: DataSource;
  status: SupabaseQueryStatus;
}> {
  const source = getDataSource();

  if (source === 'supabase') {
    try {
      const { data, error } = await withSupabaseTimeout(
        db().from('prospects').select('*').order('created_at', { ascending: false }),
        'Prospects query'
      );
      if (error) return { data: [], error: error.message, source, status: 'error' };
      return { data: data || [], error: null, source, status: 'success' };
    } catch (error) {
      return { data: [], error: getErrorMessage(error), source, status: 'error' };
    }
  }

  return { data: SEED_PROSPECTS, error: null, source, status: 'not_configured' };
}

export function useProspects() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('seed');
  const [lastSupabaseQueryStatus, setLastSupabaseQueryStatus] =
    useState<SupabaseQueryStatus>(getDataSource() === 'supabase' ? 'loading' : 'not_configured');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setLastSupabaseQueryStatus(getDataSource() === 'supabase' ? 'loading' : 'not_configured');

      const result = await fetchProspectsList();
      if (cancelled) return;

      setProspects(result.data);
      setError(result.error);
      setDataSource(result.source);
      setLastSupabaseQueryStatus(result.status);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const refetch = () => setRefreshKey((key) => key + 1);

  return { prospects, loading, error, dataSource, lastSupabaseQueryStatus, refetch };
}

export function useProspect(id: string) {
  const [prospect, setProspect] = useState<ProspectWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (getDataSource() === 'supabase') {
          const { data, error: err } = await withSupabaseTimeout(
            db()
              .from('prospects')
              .select('*, audits(*), mockups(*), email_drafts(*), follow_up_tasks(*)')
              .eq('id', id)
              .single(),
            'Prospect detail query'
          );

          if (err) throw new Error(err.message);
          if (!cancelled) setProspect(data);
        } else {
          const p = SEED_PROSPECTS.find((prospect) => prospect.id === id);
          if (!cancelled) {
            setProspect(
              p
                ? {
                    ...p,
                    audits: SEED_AUDITS.filter((audit) => audit.prospect_id === id),
                    mockups: SEED_MOCKUPS.filter((mockup) => mockup.prospect_id === id),
                    email_drafts: SEED_EMAIL_DRAFTS.filter((draft) => draft.prospect_id === id),
                    follow_up_tasks: SEED_FOLLOW_UP_TASKS.filter((task) => task.prospect_id === id),
                  }
                : null
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setError(getErrorMessage(error));
          setProspect(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, refreshKey]);

  const updateStatus = async (status: ProspectStatus): Promise<string | null> => {
    try {
      if (getDataSource() === 'supabase') {
        const { error: err } = await withSupabaseTimeout(
          db().from('prospects').update({ status }).eq('id', id),
          'Prospect status update'
        );
        if (err) return err.message;
      }

      setProspect((current) => (current ? { ...current, status } : null));
      return null;
    } catch (error) {
      return getErrorMessage(error);
    }
  };

  const updateProspect = async (updates: Partial<Prospect>): Promise<string | null> => {
    try {
      if (getDataSource() === 'supabase') {
        const { error: err } = await withSupabaseTimeout(
          db().from('prospects').update(updates).eq('id', id),
          'Prospect update'
        );
        if (err) return err.message;
      }

      setProspect((current) => (current ? { ...current, ...updates } : null));
      return null;
    } catch (error) {
      return getErrorMessage(error);
    }
  };

  const refetch = () => setRefreshKey((key) => key + 1);

  return { prospect, loading, error, refetch, updateStatus, updateProspect };
}

export async function createProspect(
  data: Omit<Prospect, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Prospect | null; error: string | null }> {
  if (getDataSource() !== 'supabase') {
    return { data: null, error: 'Cannot create prospects in seed mode. Configure Supabase first.' };
  }

  try {
    const { data: row, error: err } = await withSupabaseTimeout(
      db().from('prospects').insert(data).select().single(),
      'Create prospect'
    );
    if (err) return { data: null, error: err.message };
    return { data: row, error: null };
  } catch (error) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function upsertAudit(
  audit: Omit<Audit, 'id' | 'created_at'> & { id?: string }
): Promise<{ error: string | null }> {
  if (getDataSource() !== 'supabase') return { error: 'Cannot save audits in seed mode.' };

  try {
    const { error: err } = await withSupabaseTimeout(
      db().from('audits').upsert(audit, { onConflict: 'id' }),
      'Upsert audit'
    );
    return { error: err?.message || null };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function upsertMockup(
  mockup: Omit<Mockup, 'id' | 'created_at'> & { id?: string }
): Promise<{ error: string | null }> {
  if (getDataSource() !== 'supabase') return { error: 'Cannot save mockups in seed mode.' };

  try {
    const { error: err } = await withSupabaseTimeout(
      db().from('mockups').upsert(mockup, { onConflict: 'id' }),
      'Upsert mockup'
    );
    return { error: err?.message || null };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function upsertEmailDraft(
  draft: Omit<EmailDraft, 'id' | 'created_at'> & { id?: string }
): Promise<{ error: string | null }> {
  if (getDataSource() !== 'supabase') return { error: 'Cannot save email drafts in seed mode.' };

  try {
    const { error: err } = await withSupabaseTimeout(
      db().from('email_drafts').upsert(draft, { onConflict: 'id' }),
      'Upsert email draft'
    );
    return { error: err?.message || null };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function createFollowUpTask(
  task: Omit<FollowUpTask, 'id' | 'created_at'>
): Promise<{ error: string | null }> {
  if (getDataSource() !== 'supabase') return { error: 'Cannot create tasks in seed mode.' };

  try {
    const { error: err } = await withSupabaseTimeout(
      db().from('follow_up_tasks').insert(task),
      'Create follow-up task'
    );
    return { error: err?.message || null };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function addOptOut(
  email: string,
  businessName?: string,
  reason?: string
): Promise<{ error: string | null }> {
  if (getDataSource() !== 'supabase') return { error: 'Cannot manage opt-outs in seed mode.' };

  try {
    const { error: err } = await withSupabaseTimeout(
      db()
        .from('opt_outs')
        .upsert({ email, business_name: businessName, reason }, { onConflict: 'email' }),
      'Upsert opt-out'
    );
    return { error: err?.message || null };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

export async function checkOptOut(email: string): Promise<boolean> {
  if (getDataSource() !== 'supabase') return false;

  try {
    const { data, error } = await withSupabaseTimeout(
      db().from('opt_outs').select('id').eq('email', email).maybeSingle(),
      'Opt-out check'
    );
    if (error) throw new Error(error.message);
    return data !== null;
  } catch {
    return false;
  }
}

export function useApprovalQueue() {
  const [prospects, setProspects] = useState<ProspectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('seed');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setDataSource(getDataSource());

      try {
        if (getDataSource() === 'supabase') {
          const { data, error: err } = await withSupabaseTimeout(
            db()
              .from('prospects')
              .select('*, mockups(*), email_drafts(*)')
              .in('status', ['email_ready', 'approved_to_send'])
              .order('updated_at', { ascending: false }),
            'Approval queue query'
          );

          if (err) throw new Error(err.message);
          if (!cancelled) setProspects(data || []);
        } else {
          const filtered = SEED_PROSPECTS.filter(
            (prospect) => prospect.status === 'email_ready' || prospect.status === 'approved_to_send'
          );

          if (!cancelled) {
            setProspects(
              filtered.map((prospect) => ({
                ...prospect,
                mockups: SEED_MOCKUPS.filter((mockup) => mockup.prospect_id === prospect.id),
                email_drafts: SEED_EMAIL_DRAFTS.filter((draft) => draft.prospect_id === prospect.id),
              }))
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          setError(getErrorMessage(error));
          setProspects([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const approve = async (prospectId: string): Promise<string | null> => {
    try {
      if (getDataSource() === 'supabase') {
        const prospect = prospects.find((item) => item.id === prospectId);

        if (prospect?.public_email) {
          const { data: optedOut, error: optOutError } = await withSupabaseTimeout(
            db().from('opt_outs').select('id').eq('email', prospect.public_email).maybeSingle(),
            'Opt-out check'
          );
          if (optOutError) return optOutError.message;
          if (optedOut) return 'This email is on the opt-out list. Cannot approve.';
        }

        const { error: prospectError } = await withSupabaseTimeout(
          db().from('prospects').update({ status: 'approved_to_send' }).eq('id', prospectId),
          'Approve prospect'
        );
        if (prospectError) return prospectError.message;

        const { error: draftError } = await withSupabaseTimeout(
          db()
            .from('email_drafts')
            .update({ status: 'approved', approved_at: new Date().toISOString() })
            .eq('prospect_id', prospectId)
            .eq('status', 'ready'),
          'Approve email draft'
        );
        if (draftError) return draftError.message;
      }

      setProspects((current) =>
        current.map((prospect) =>
          prospect.id === prospectId
            ? { ...prospect, status: 'approved_to_send' as ProspectStatus }
            : prospect
        )
      );
      return null;
    } catch (error) {
      return getErrorMessage(error);
    }
  };

  const markSent = async (prospectId: string): Promise<string | null> => {
    try {
      if (getDataSource() === 'supabase') {
        const { error: prospectError } = await withSupabaseTimeout(
          db().from('prospects').update({ status: 'sent' }).eq('id', prospectId),
          'Mark prospect sent'
        );
        if (prospectError) return prospectError.message;

        const { error: draftError } = await withSupabaseTimeout(
          db()
            .from('email_drafts')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('prospect_id', prospectId)
            .in('status', ['approved', 'ready']),
          'Mark email sent'
        );
        if (draftError) return draftError.message;

        const { error: taskError } = await withSupabaseTimeout(
          db().from('follow_up_tasks').insert({
            prospect_id: prospectId,
            task_type: 'follow_up',
            due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
            status: 'pending',
            notes: 'Auto-created: follow up if no reply within 3 days',
          }),
          'Create follow-up task'
        );
        if (taskError) return taskError.message;
      }

      setProspects((current) => current.filter((prospect) => prospect.id !== prospectId));
      return null;
    } catch (error) {
      return getErrorMessage(error);
    }
  };

  const refetch = () => setRefreshKey((key) => key + 1);

  return { prospects, loading, error, dataSource, refetch, approve, markSent };
}

export function useMockupBySlug(slug: string) {
  const [mockup, setMockup] = useState<Mockup | null>(null);
  const [prospect, setProspect] = useState<Pick<Prospect, 'business_name' | 'niche' | 'city' | 'state'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setMockup(null);
      setProspect(null);

      try {
        if (getDataSource() === 'supabase') {
          const { data: foundMockup, error: mockupError } = await withSupabaseTimeout(
            db()
              .from('mockups')
              .select('id, prospect_id, slug, title, mockup_url, mockup_status, hero_headline, hero_subheadline, primary_cta, features_included, created_at')
              .eq('slug', slug)
              .maybeSingle(),
            'Public mockup query'
          );

          if (mockupError) throw new Error(mockupError.message);
          if (!foundMockup) {
            if (!cancelled) setMockup(null);
            return;
          }

          if (!cancelled) setMockup({ ...foundMockup, concept_notes: null } as Mockup);

          const { data: foundProspect, error: prospectError } = await withSupabaseTimeout(
            db()
              .from('prospects')
              .select('business_name, niche, city, state')
              .eq('id', foundMockup.prospect_id)
              .single(),
            'Public mockup prospect query'
          );

          if (prospectError) throw new Error(prospectError.message);
          if (!cancelled) setProspect(foundProspect as typeof prospect);
        } else {
          const foundMockup = SEED_MOCKUPS.find((item) => item.slug === slug) || null;
          if (!cancelled) setMockup(foundMockup);

          if (foundMockup) {
            const foundProspect = SEED_PROSPECTS.find((item) => item.id === foundMockup.prospect_id);
            if (foundProspect && !cancelled) {
              setProspect({
                business_name: foundProspect.business_name,
                niche: foundProspect.niche,
                city: foundProspect.city,
                state: foundProspect.state,
              });
            }
          }
        }
      } catch (error) {
        if (!cancelled) setError(getErrorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { mockup, prospect, loading, error };
}

export interface DashboardStats {
  total: number;
  qualified: number;
  mockups_ready: number;
  emails_ready: number;
  approved: number;
  sent_today: number;
  follow_ups_due: number;
  replies: number;
  booked: number;
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProspects, setRecentProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<DataSource>('seed');
  const [lastSupabaseQueryStatus, setLastSupabaseQueryStatus] =
    useState<SupabaseQueryStatus>(getDataSource() === 'supabase' ? 'loading' : 'not_configured');
  const [prospectsLoaded, setProspectsLoaded] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const source = getDataSource();
      setDataSource(source);
      setLastSupabaseQueryStatus(source === 'supabase' ? 'loading' : 'not_configured');

      try {
        let allProspects: Prospect[];

        if (source === 'supabase') {
          const { data, error: err } = await withSupabaseTimeout(
            db().from('prospects').select('*').order('updated_at', { ascending: false }),
            'Dashboard prospects query'
          );
          if (err) throw new Error(err.message);
          allProspects = data || [];
        } else {
          allProspects = SEED_PROSPECTS;
        }

        const today = new Date().toISOString().split('T')[0];

        if (!cancelled) {
          setStats({
            total: allProspects.length,
            qualified: allProspects.filter((prospect) => prospect.status === 'qualified').length,
            mockups_ready: allProspects.filter((prospect) => prospect.status === 'mockup_ready').length,
            emails_ready: allProspects.filter((prospect) => prospect.status === 'email_ready').length,
            approved: allProspects.filter((prospect) => prospect.status === 'approved_to_send').length,
            sent_today: allProspects.filter(
              (prospect) => prospect.status === 'sent' && prospect.updated_at.startsWith(today)
            ).length,
            follow_ups_due: allProspects.filter(
              (prospect) => prospect.status === 'follow_up_1' || prospect.status === 'follow_up_2'
            ).length,
            replies: allProspects.filter((prospect) => prospect.status === 'replied').length,
            booked: allProspects.filter((prospect) => prospect.status === 'booked').length,
          });
          setRecentProspects(allProspects.slice(0, 8));
          setProspectsLoaded(allProspects.length);
          setLastSupabaseQueryStatus(source === 'supabase' ? 'success' : 'not_configured');
        }
      } catch (error) {
        if (!cancelled) {
          setError(getErrorMessage(error));
          setStats(null);
          setRecentProspects([]);
          setProspectsLoaded(0);
          setLastSupabaseQueryStatus(source === 'supabase' ? 'error' : 'not_configured');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    stats,
    recentProspects,
    loading,
    error,
    dataSource,
    lastSupabaseQueryStatus,
    prospectsLoaded,
  };
}

function getStoredSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem('mockup-crm-settings');
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSettings(getStoredSettings());
      setInitialized(true);
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  const updateSettings = (updates: Partial<AppSettings>) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    localStorage.setItem('mockup-crm-settings', JSON.stringify(next));
  };

  return { settings, updateSettings, initialized };
}
