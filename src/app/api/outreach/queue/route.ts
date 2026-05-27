import { NextResponse } from 'next/server';
import { getSendQueue } from '@/lib/server/outreach';
import { getRequestOrigin } from '@/lib/server/request';
import { getErrorMessage } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const data = await getSendQueue(getRequestOrigin(request));
    return NextResponse.json({ ok: true, ...data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, errorMessage: getErrorMessage(error) },
      { status: 400 }
    );
  }
}
