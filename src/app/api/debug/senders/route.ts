import { NextResponse } from 'next/server';
import { getSenderProfilesDebug } from '@/lib/server/sender-identities';
import { getOutreachConfig, getOutreachStats } from '@/lib/server/outreach';
import { getErrorMessage } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = getOutreachConfig();
  const senderProfiles = getSenderProfilesDebug();

  try {
    const stats = await getOutreachStats();
    return NextResponse.json({
      defaultSenderConfigured: senderProfiles.apexSenderConfigured,
      apexSenderConfigured: senderProfiles.apexSenderConfigured,
      resinateSenderConfigured: senderProfiles.resinateSenderConfigured,
      testMode: config.testMode,
      dailyCap: stats.dailyCap,
      sendsToday: stats.sentToday,
      remainingToday: stats.remainingToday,
      profiles: {
        apex: senderProfiles.apex,
        resinate: senderProfiles.resinate,
      },
      missingFieldsBySender: {
        apex: senderProfiles.apex.missingFields,
        resinate: senderProfiles.resinate.missingFields,
      },
      errorMessage: null,
    });
  } catch (error) {
    return NextResponse.json({
      defaultSenderConfigured: senderProfiles.apexSenderConfigured,
      apexSenderConfigured: senderProfiles.apexSenderConfigured,
      resinateSenderConfigured: senderProfiles.resinateSenderConfigured,
      testMode: config.testMode,
      dailyCap: config.dailyCap,
      sendsToday: 0,
      remainingToday: config.dailyCap,
      profiles: {
        apex: senderProfiles.apex,
        resinate: senderProfiles.resinate,
      },
      missingFieldsBySender: {
        apex: senderProfiles.apex.missingFields,
        resinate: senderProfiles.resinate.missingFields,
      },
      errorMessage: getErrorMessage(error),
    });
  }
}
