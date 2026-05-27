import { NextResponse } from 'next/server';
import { getRecentSends } from '@/lib/server/outreach';
import { getErrorMessage } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') || 10);
    const recentSends = await getRecentSends(limit);
    return NextResponse.json({ ok: true, recentSends });
  } catch (error) {
    return NextResponse.json(
      { ok: false, errorMessage: getErrorMessage(error) },
      { status: 400 }
    );
  }
}
