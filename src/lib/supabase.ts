import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const APP_NAME = 'mockup-outreach-crm';
export const EXPECTED_LOCAL_URL = 'localhost:3001';
export const SUPABASE_QUERY_TIMEOUT_MS = 12000;

export type DataSource = 'supabase' | 'seed';
export type SupabaseQueryStatus = 'not_configured' | 'loading' | 'success' | 'error';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  '';

export const isSupabaseUrlConfigured =
  supabaseUrl.length > 0 &&
  !supabaseUrl.includes('your-project');

export const isSupabaseKeyConfigured =
  supabaseAnonKey.length > 0 &&
  !supabaseAnonKey.includes('your-anon-key') &&
  !supabaseAnonKey.includes('your-publishable-key');

export const isConfigured =
  isSupabaseUrlConfigured &&
  isSupabaseKeyConfigured;

export function getDataSource(): DataSource {
  return isConfigured ? 'supabase' : 'seed';
}

// Lazy-initialized singleton
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isConfigured) return null;
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Connection test — verifies Supabase is reachable and tables exist
export async function testConnection(): Promise<{
  connected: boolean;
  tables: Record<string, boolean>;
  error: string | null;
}> {
  const client = getSupabase();
  if (!client) {
    return { connected: false, tables: {}, error: 'Supabase env vars not configured' };
  }

  const tableNames = ['prospects', 'audits', 'mockups', 'email_drafts', 'follow_up_tasks', 'opt_outs'] as const;
  const tables: Record<string, boolean> = {};
  let lastError: string | null = null;

  for (const table of tableNames) {
    const { error } = await client.from(table).select('id').limit(1);
    if (error) {
      tables[table] = false;
      lastError = `${table}: ${error.message}`;
    } else {
      tables[table] = true;
    }
  }

  const allOk = Object.values(tables).every(Boolean);
  return {
    connected: allOk,
    tables,
    error: allOk ? null : lastError,
  };
}

export function getSupabaseInfo() {
  return {
    configured: isConfigured,
    urlPresent: isSupabaseUrlConfigured,
    keyPresent: isSupabaseKeyConfigured,
    url: isSupabaseUrlConfigured ? supabaseUrl : null,
    source: getDataSource(),
  };
}

// TODO: [Hermes Integration] Add service-role client for server-side AI operations
// export const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || '');
