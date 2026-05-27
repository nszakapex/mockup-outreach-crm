import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const TELEGRAM_TIMEOUT_MS = 10000;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown Telegram error';
}

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() || '';
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || '';

  let botGetMeOk = false;
  let botUsername: string | null = null;
  let errorMessage: string | null = null;

  if (botToken) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.description || `Telegram getMe failed with HTTP ${response.status}`);
      }

      botGetMeOk = true;
      botUsername = payload.result?.username || null;
    } catch (error) {
      errorMessage = getErrorMessage(error);
    } finally {
      clearTimeout(timeoutId);
    }
  } else {
    errorMessage = 'TELEGRAM_BOT_TOKEN is not configured.';
  }

  return NextResponse.json({
    botTokenConfigured: botToken.length > 0,
    chatIdConfigured: chatId.length > 0,
    webhookSecretConfigured: webhookSecret.length > 0,
    botGetMeOk,
    botUsername,
    errorMessage,
  });
}
