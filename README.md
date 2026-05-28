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
NEXT_PUBLIC_APP_URL=https://mockupcrm67.netlify.app
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

## Gmail OAuth Setup

This repo includes local-only helpers for generating the `GOOGLE_REFRESH_TOKEN` needed by the Gmail API sender. These helpers print to the terminal only; they do not expose OAuth credentials in browser UI.

Keep this setting in place while doing OAuth setup:

```bash
OUTREACH_EMAIL_TEST_MODE=true
```

### Google Cloud Setup

1. Open Google Cloud Console and create or select a project.
2. Enable the Gmail API for that project.
3. Configure the OAuth consent screen.
4. Add yourself as a test user if the app is in testing mode.
5. Create an OAuth Client ID.
6. For a web application client, add this authorized redirect URI:

```text
http://localhost:3001/oauth2callback
```

The local app does not need to implement that route. After Google redirects, copy the `code=` value from the browser address bar.

Use this Gmail scope:

```text
https://www.googleapis.com/auth/gmail.send
```

### Local Env Placement

Put these in `C:\Users\nates\mockup-outreach-crm\.env.local` while generating the refresh token:

```bash
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GMAIL_SENDER_EMAIL=you@example.com
OUTREACH_EMAIL_TEST_MODE=true
```

After the token exchange, add this to `.env.local` too:

```bash
GOOGLE_REFRESH_TOKEN=the-refresh-token-from-the-terminal
```

Do not put Google OAuth secrets in any `NEXT_PUBLIC_` variable.

### Generate The Auth URL

```bash
npm run gmail:auth-url
```

Open the printed URL, approve the Gmail send scope for the account matching `GMAIL_SENDER_EMAIL`, then copy the `code=` value from the redirected URL.

### Exchange The Code

```bash
npm run gmail:exchange-code -- "PASTE_CODE_HERE"
```

The script prints the refresh token in the terminal only. Store it as `GOOGLE_REFRESH_TOKEN`.

### Netlify Env Placement

In Netlify project `mockupcrm67`, add these under Site configuration -> Environment variables:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GMAIL_SENDER_EMAIL=
OUTREACH_EMAIL_TEST_MODE=true
OUTREACH_DAILY_SEND_CAP=30
```

Keep `OUTREACH_EMAIL_TEST_MODE=true` until you intentionally test one live Gmail message.

### One Live Gmail Test Later

When you are ready to test real Gmail delivery:

1. Keep the test on a single prospect whose `public_email` is your own email address.
2. Approve that prospect through Telegram so it appears in `/send-queue`.
3. Confirm `/settings` shows all Gmail credentials configured.
4. Temporarily set `OUTREACH_EMAIL_TEST_MODE=false` in the environment you are testing.
5. Redeploy or restart the local dev server so the env change is active.
6. Click `Send Now` one time.
7. Confirm the email arrived and `/send-queue` shows the recent send.
8. Set `OUTREACH_EMAIL_TEST_MODE=true` again immediately after the test.

## Safe Sender Workflow

1. Import or create prospects in Supabase.
2. Review each prospect and draft in `/approval`.
3. Approve through Telegram.
4. Open `/send-queue`.
5. Use `Send Now` while `OUTREACH_EMAIL_TEST_MODE=true` to record a test send without Gmail delivery.
6. Switch `OUTREACH_EMAIL_TEST_MODE=false` only after Google credentials are verified.

## Rich Mockup JSON Fields

Hermes can make public mockups feel prospect-specific by adding optional fields to each import record. These are stored safely in `mockups.concept_notes` as JSON, so no schema migration is required.

Recommended fields:

```json
{
  "current_site_snapshot": "Reservation, gift card, and private dining paths exist but feel disconnected on mobile.",
  "online_presence_status": [
    "Website UX: reservation CTA competes with menu links",
    "Social/content: strong photos need a better website destination"
  ],
  "visual_direction": "Dark premium steakhouse feel with reservation-first hierarchy.",
  "proposed_site_nav": ["Menu", "Reservations", "Private Dining", "Gift Cards", "Awards"],
  "homepage_sections": [
    "Reservation-first hero",
    "Signature dishes",
    "Private dining inquiry",
    "Gift card CTA"
  ],
  "menu_or_offer_items": ["Signature steaks", "Reservations", "Gift cards", "Private dining"],
  "website_issue_examples": ["Reservation CTA is hard to find", "Private dining is buried"],
  "trust_signals": ["Local steakhouse", "Gift cards available", "Private dining"],
  "cta_strategy": "Explore menu -> Choose occasion -> Reserve table",
  "local_seo_angle": "best steakhouse in Loveland",
  "content_strategy_angle": "weekly featured dish reels and date-night posts",
  "meta_ads_angle": "date-night and gift-card campaigns",
  "brand_style_notes": "Elegant, confident, warm but not rustic",
  "primary_colors": ["charcoal", "champagne"],
  "secondary_colors": ["deep red"],
  "original_site_notes": "Current site hides reservations below menu copy",
  "inspiration_notes": "Premium hospitality editorial feel"
}
```

Keep the data practical and business-specific: current site snapshot, online presence issues, proposed nav, homepage section ideas, actual menu/offers, trust signals, CTA path, local search angle, and content/ad strategy. Existing basic fields still work when these are missing.

## Supabase Migration

The Gmail queue needs the `outreach_sends` table from `supabase/schema.sql`. Run the outreach-sends SQL in Supabase before using `/send-queue` or `/api/outreach/send`.
