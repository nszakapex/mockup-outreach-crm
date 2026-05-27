import { NextResponse } from 'next/server';
import { getOutreachConfig, getOutreachStats } from '@/lib/server/outreach';
import { getErrorMessage, getServerSupabase } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getOutreachConfig();

  try {
    const stats = await getOutreachStats();
    const { error: tableError } = await getServerSupabase()
      .from('outreach_sends')
      .select('id, prospect_id', { count: 'exact' })
      .limit(0);
    if (tableError) throw new Error(`Check outreach_sends table: ${tableError.message}`);

    return NextResponse.json({
      googleClientIdConfigured: config.googleClientIdConfigured,
      googleClientSecretConfigured: config.googleClientSecretConfigured,
      googleRefreshTokenConfigured: config.googleRefreshTokenConfigured,
      gmailSenderEmailConfigured: config.gmailSenderEmailConfigured,
      testMode: config.testMode,
      dailyCap: stats.dailyCap,
      sendsToday: stats.sentToday,
      remainingToday: stats.remainingToday,
      errorMessage: null,
    });
  } catch (error) {
    return NextResponse.json({
      googleClientIdConfigured: config.googleClientIdConfigured,
      googleClientSecretConfigured: config.googleClientSecretConfigured,
      googleRefreshTokenConfigured: config.googleRefreshTokenConfigured,
      gmailSenderEmailConfigured: config.gmailSenderEmailConfigured,
      testMode: config.testMode,
      dailyCap: config.dailyCap,
      sendsToday: 0,
      remainingToday: config.dailyCap,
      errorMessage: getErrorMessage(error),
    });
  }
}
