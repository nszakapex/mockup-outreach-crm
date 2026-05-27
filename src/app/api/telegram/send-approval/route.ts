import { NextResponse } from 'next/server';
import { getRequestOrigin } from '@/lib/server/request';
import { sendApprovalCard } from '@/lib/server/telegram-approval';

export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown Telegram approval error';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const prospectId = body?.prospectId || body?.prospect_id;

    if (typeof prospectId !== 'string' || prospectId.length === 0) {
      return NextResponse.json(
        { ok: false, errorMessage: 'prospectId is required.' },
        { status: 400 }
      );
    }

    const result = await sendApprovalCard(prospectId, getRequestOrigin(request));

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        errorMessage: getErrorMessage(error),
      },
      { status: 400 }
    );
  }
}
