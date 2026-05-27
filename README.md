# mockup-outreach-crm

Controlled outreach CRM for Supabase-backed prospects, Telegram approval, and Gmail API sending.

## Local Development

```bash
npm install
npm run dev:3001
```

Open `http://localhost:3001`.

## Required Env Vars

Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# or
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Telegram approval:

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=
```

Gmail sender queue:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GMAIL_SENDER_EMAIL=
OUTREACH_EMAIL_TEST_MODE=true
OUTREACH_DAILY_SEND_CAP=30
```

Keep `OUTREACH_EMAIL_TEST_MODE=true` until Gmail OAuth is verified end to end.

## Gmail OAuth Notes

Use a Google Cloud OAuth client with Gmail API enabled and request the scope:

```text
https://www.googleapis.com/auth/gmail.send
```

Generate a refresh token for the Google account matching `GMAIL_SENDER_EMAIL`. Store the client ID, client secret, refresh token, sender email, test mode, and daily cap as server-only Netlify environment variables. Do not put Google secrets in client code.

## Safe Sender Workflow

1. Import or create prospects in Supabase.
2. Review each prospect and draft in `/approval`.
3. Approve through Telegram.
4. Open `/send-queue`.
5. Use `Send Now` while `OUTREACH_EMAIL_TEST_MODE=true` to record a test send without Gmail delivery.
6. Switch `OUTREACH_EMAIL_TEST_MODE=false` only after Google credentials are verified.

## Supabase Migration

The Gmail queue needs the `outreach_sends` table from `supabase/schema.sql`. Run the outreach-sends SQL in Supabase before using `/send-queue` or `/api/outreach/send`.
