import { NextResponse } from 'next/server';
import { sendOutreachEmail, serializeOutreachError } from '@/lib/server/outreach';
import { getRequestOrigin } from '@/lib/server/request';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const prospectId = body?.prospect_id || body?.prospectId;

    if (typeof prospectId !== 'string' || prospectId.length === 0) {
      return NextResponse.json(
        { ok: false, errorMessage: 'prospect_id is required.' },
        { status: 400 }
      );
    }

    const result = await sendOutreachEmail(prospectId, getRequestOrigin(request));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(serializeOutreachError(error), { status: 400 });
  }
}
