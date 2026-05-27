import { NextResponse } from 'next/server';
import {
  getSupabase,
  getSupabaseInfo,
  SUPABASE_QUERY_TIMEOUT_MS,
} from '@/lib/supabase';
import { SEED_PROSPECTS } from '@/lib/seed-data';

export const dynamic = 'force-dynamic';

async function withTimeout<T>(promise: PromiseLike<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(promise),
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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown Supabase error';
}

export async function GET() {
  const info = getSupabaseInfo();
  const envConfigured = info.configured;
  let prospectsQueryOk = false;
  let prospectsCount = envConfigured ? 0 : SEED_PROSPECTS.length;
  let errorMessage: string | null = null;

  if (envConfigured) {
    try {
      const client = getSupabase();
      if (!client) throw new Error('Supabase env vars are not configured.');

      const { count, error } = await withTimeout(
        client.from('prospects').select('id', { count: 'exact', head: true }),
        'Prospects smoke query'
      );

      if (error) throw new Error(error.message);
      prospectsQueryOk = true;
      prospectsCount = count || 0;
    } catch (error) {
      errorMessage = getErrorMessage(error);
    }
  }

  return NextResponse.json({
    envConfigured,
    urlPresent: info.urlPresent,
    keyPresent: info.keyPresent,
    source: envConfigured ? 'supabase' : 'seed fallback',
    prospectsQueryOk,
    prospectsCount,
    errorMessage,
  });
}
