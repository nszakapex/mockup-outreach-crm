import { NextResponse } from 'next/server';
import {
  answerCallbackQuery,
  applyTelegramApprovalAction,
  assertWebhookSecret,
  buildConfirmationMessage,
  editTelegramMessage,
  parseCallbackData,
} from '@/lib/server/telegram-approval';

export const dynamic = 'force-dynamic';

interface TelegramWebhookUpdate {
  update_id?: number;
  callback_query?: {
    id?: string;
    data?: string;
    message?: {
      message_id?: number;
      chat?: {
        id?: number | string;
      };
    };
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown Telegram webhook error';
}

export async function POST(request: Request) {
  const secret = new URL(request.url).searchParams.get('secret');

  try {
    assertWebhookSecret(secret);
  } catch (error) {
    return NextResponse.json(
      { ok: false, errorMessage: getErrorMessage(error) },
      { status: 401 }
    );
  }

  const update = (await request.json().catch(() => null)) as TelegramWebhookUpdate | null;
  const callback = update?.callback_query;

  if (!callback) {
    return NextResponse.json({ ok: true, ignored: 'No callback_query in update.' });
  }

  const parsed = parseCallbackData(callback.data);
  if (!parsed.ok) {
    if (callback.id) {
      await answerCallbackQuery(callback.id, parsed.error, true).catch(() => null);
    }
    return NextResponse.json(
      { ok: false, errorMessage: parsed.error },
      { status: 400 }
    );
  }

  try {
    const result = await applyTelegramApprovalAction(parsed.prospectId, parsed.action);

    if (callback.id) {
      await answerCallbackQuery(callback.id, result.message);
    }

    const chatId = callback.message?.chat?.id;
    const messageId = callback.message?.message_id;
    if (chatId && messageId) {
      await editTelegramMessage(chatId, messageId, buildConfirmationMessage(result));
    }

    return NextResponse.json({
      ok: true,
      updateId: update?.update_id ?? null,
      ...result,
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    if (callback.id) {
      await answerCallbackQuery(callback.id, errorMessage, true).catch(() => null);
    }

    return NextResponse.json(
      { ok: false, errorMessage },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Telegram webhook endpoint is ready. Telegram sends callback_query updates with POST.',
  });
}
