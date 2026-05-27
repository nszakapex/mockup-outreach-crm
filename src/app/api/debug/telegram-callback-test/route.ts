import { NextResponse } from 'next/server';
import {
  applyTelegramApprovalAction,
  isValidTelegramAction,
} from '@/lib/server/telegram-approval';

export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown Telegram callback test error';
}

function assertDevelopment() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('telegram-callback-test is only available in development.');
  }
}

export async function GET() {
  try {
    assertDevelopment();
    return NextResponse.json({
      ok: true,
      message: 'POST prospect_id and action to test Telegram status updates locally.',
      actions: ['approve', 'needs_edit', 'reject'],
      example: {
        prospect_id: '91000000-0000-4000-8000-000000000001',
        action: 'approve',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, errorMessage: getErrorMessage(error) },
      { status: 404 }
    );
  }
}

export async function POST(request: Request) {
  try {
    assertDevelopment();

    const body = await request.json().catch(() => null);
    const prospectId = body?.prospect_id || body?.prospectId;
    const action = body?.action;

    if (typeof prospectId !== 'string' || prospectId.length === 0) {
      return NextResponse.json(
        { ok: false, errorMessage: 'prospect_id is required.' },
        { status: 400 }
      );
    }

    if (!isValidTelegramAction(action)) {
      return NextResponse.json(
        { ok: false, errorMessage: 'action must be approve, needs_edit, or reject.' },
        { status: 400 }
      );
    }

    const result = await applyTelegramApprovalAction(prospectId, action);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, errorMessage: getErrorMessage(error) },
      { status: 400 }
    );
  }
}
