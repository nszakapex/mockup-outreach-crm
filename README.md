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

This repo includes local-only helpers for generating Gmail API refresh tokens. They support two sender profiles:

- `apex`
- `resinate`

These helpers print to the terminal only; they do not expose OAuth credentials in browser UI.

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

Put these in `C:\Users\nates\mockup-outreach-crm\.env.local` while generating an Apex refresh token:

```bash
APEX_GOOGLE_CLIENT_ID=your-apex-google-oauth-client-id.apps.googleusercontent.com
APEX_GOOGLE_CLIENT_SECRET=your-apex-google-oauth-client-secret
APEX_GMAIL_SENDER_EMAIL=you@example.com
OUTREACH_EMAIL_TEST_MODE=true
```

Apex can also fall back to the existing legacy variables:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GMAIL_SENDER_EMAIL=
GOOGLE_REFRESH_TOKEN=
```

Put these in `.env.local` while generating a Resinate refresh token:

```bash
RESINATE_GOOGLE_CLIENT_ID=your-resinate-google-oauth-client-id.apps.googleusercontent.com
RESINATE_GOOGLE_CLIENT_SECRET=your-resinate-google-oauth-client-secret
RESINATE_GMAIL_SENDER_EMAIL=resinate-sender@example.com
OUTREACH_EMAIL_TEST_MODE=true
```

After the token exchange, add the printed profile-specific refresh token too:

```bash
APEX_GOOGLE_REFRESH_TOKEN=the-apex-refresh-token-from-the-terminal
RESINATE_GOOGLE_REFRESH_TOKEN=the-resinate-refresh-token-from-the-terminal
```

Do not put Google OAuth secrets in any `NEXT_PUBLIC_` variable.

### Generate The Auth URL

```bash
npm run gmail:auth-url -- --profile=apex
npm run gmail:auth-url -- --profile=resinate
```

Open the printed URL, approve the Gmail send scope for the account matching the selected profile sender email, then copy the `code=` value from the redirected URL.

### Exchange The Code

```bash
npm run gmail:exchange-code -- --profile=apex "PASTE_CODE_HERE"
npm run gmail:exchange-code -- --profile=resinate "PASTE_CODE_HERE"
```

The script prints the refresh token in the terminal only. Store it as `APEX_GOOGLE_REFRESH_TOKEN` or `RESINATE_GOOGLE_REFRESH_TOKEN` based on the selected profile.

### Netlify Env Placement

In Netlify project `mockupcrm67`, add these under Site configuration -> Environment variables:

```bash
APEX_GOOGLE_CLIENT_ID=
APEX_GOOGLE_CLIENT_SECRET=
APEX_GOOGLE_REFRESH_TOKEN=
APEX_GMAIL_SENDER_EMAIL=
RESINATE_GOOGLE_CLIENT_ID=
RESINATE_GOOGLE_CLIENT_SECRET=
RESINATE_GOOGLE_REFRESH_TOKEN=
RESINATE_GMAIL_SENDER_EMAIL=
OUTREACH_EMAIL_TEST_MODE=true
OUTREACH_DAILY_SEND_CAP=30
```

For Apex only, the older `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and `GMAIL_SENDER_EMAIL` vars can still be used as a fallback. Resinate requires the `RESINATE_*` variables.

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
  "layout_signature": "luxury_service_page",
  "design_style_key": "premium_hospitality_editorial",
  "photo_strategy": "Use public website food/interior photos as the hero and proof cards. If no reliable public photos exist, use clearly conceptual hospitality visuals and do not imply they are actual menu items.",
  "visual_profile": {
    "brand_mood": "dark, warm, polished, reservation-led",
    "design_style_key": "premium_hospitality_editorial",
    "color_palette": {
      "primary": "oklch(18% 0.04 38)",
      "secondary": "oklch(32% 0.06 45)",
      "accent": "oklch(72% 0.16 55)",
      "background": "oklch(96% 0.028 78)",
      "text": "oklch(19% 0.04 40)"
    },
    "typography_mood": "editorial serif with confident service copy",
    "layout_signature": "luxury_service_page",
    "photo_strategy": "Hero image plus 3 to 6 proof/gallery cards from public business photos when available.",
    "ui_personality": "layered photo cards, quiet proof badges, reservation-focused hierarchy",
    "trust_style": "reviews, awards, private dining, and real atmosphere near the CTA",
    "cta_style": "single reservation or inquiry path repeated after proof"
  },
  "media_assets": [
    {
      "type": "hero",
      "image_url": "https://example.com/public-hero-photo.jpg",
      "source_url": "https://example.com/gallery",
      "source_type": "website",
      "alt": "Public dining room photo from the business website",
      "usage_note": "Use as hero atmosphere image",
      "confidence": "high"
    },
    {
      "type": "proof",
      "image_url": "https://example.com/public-private-dining-photo.jpg",
      "source_url": "https://example.com/private-dining",
      "source_type": "website",
      "alt": "Public private dining photo from the business website",
      "usage_note": "Use as proof card for private dining",
      "confidence": "high"
    }
  ],
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

### Apex V2 Public Mockup Requirements

For `campaign_type: "apex_social_content"` with `apex_delivery_mode: "public_mockup"` or `"link_plus_summary"`, future batches should include enough V2 data for the public concept to feel custom:

- `visual_profile`: brand mood, design style key, palette, typography mood, layout signature, photo strategy, UI personality, trust style, and CTA style.
- `template_variant`: explicit renderer category such as `pet_service`, `contractor`, `medical_aesthetics`, `auto_service`, `fitness_studio`, `professional_service`, or `restaurant`.
- `layout_signature`: one of `immersive_photo_hero`, `split_proof_hero`, `editorial_service_grid`, `dark_premium_transform`, `clean_clinic_trust`, `warm_local_story`, `contractor_project_board`, `auto_detail_showcase`, `pet_care_booking`, `fitness_energy_landing`, `professional_trust_page`, or `luxury_service_page`.
- `media_assets`: public website/social/profile images only when reliable, with `image_url`, `source_url`, `source_type`, `alt`, `usage_note`, and `confidence`.
- `proof_assets` and `gallery_assets`: optional additional image arrays using the same shape as `media_assets`.
- `design_style_key` and `photo_strategy`: short renderer hints that explain what makes this prospect visually different.

Rules for future Code X prospecting:

- Collect real public website photos first when available: homepage, gallery, service, project, provider/team, exterior, or process photos.
- Do not invent project photos, staff, awards, reviews, treatments, vehicles, pets, or before/after results.
- If using fallback imagery, set `source_type: "fallback"` and explain that it is category concept imagery in `usage_note`.
- Use precise niche values so the renderer picks the right template variant.
- Avoid generic nav like `Home, About, Services, Contact`; use the prospect's actual lead path.
- Non-food prospects must not use food labels such as Menu, Order, Reservations, Happy Hour, Catering, Gift Cards, or Best Time to Visit.
- Vary `layout_signature` across a batch; repeated section order is flagged in import preview.
- Public mockups now choose a layout renderer such as `PetCareBookingLayout`, `ContractorProjectBoardLayout`, `DarkPremiumTransformLayout`, `CleanClinicTrustLayout`, `FitnessEnergyLandingLayout`, `ProfessionalTrustPageLayout`, or `RestaurantExperienceLayout`. The DOM/header/hero/section plan should differ by renderer.

## Social Audit JSON Fields

Hermes can also create public social audit pages at:

```text
https://mockupcrm67.netlify.app/social-audits/[mockup_slug]
```

These fields are stored in `mockups.concept_notes` as JSON with the mockup data, so no schema migration is required.

Recommended fields:

```json
{
  "social_audit": {
    "instagram_status": "Posts are inconsistent and rarely use reels.",
    "facebook_status": "Facebook has useful updates but weak calls to action.",
    "posting_consistency": "Long gaps between posts.",
    "content_quality": "Strong visual product, but posts do not show the customer experience.",
    "reels_video_usage": "Rare or absent.",
    "engagement_quality": "Some local interest, but few posts invite replies or clicks.",
    "cta_usage": "Few clear prompts to order, book, visit, donate, or request a quote.",
    "visual_branding": "No repeatable weekly content format.",
    "overall_social_score": 58,
    "why_underperforming": ["No weekly content system", "Short video is underused", "Offers are not promoted clearly"]
  },
  "content_opportunity": "Turn signature menu items and community moments into weekly reels.",
  "content_plan": {
    "week_1": "Film two signature items and one owner/staff story.",
    "week_2": "Post a reel series around the strongest offer.",
    "week_3": "Capture customer-use moments and a clear CTA.",
    "week_4": "Review saves, replies, and clicks, then repeat the strongest theme.",
    "recommended_posting_cadence": "2 reels plus 2 to 4 posts/stories per week",
    "recommended_reels_per_week": "2",
    "shoot_frequency": "One short content shoot per week",
    "priority_content_themes": ["featured items", "behind the scenes", "local proof", "clear CTA"]
  },
  "meta_ads_angle": "Local awareness and retargeting ads around the strongest weekly offer.",
  "website_social_gap": "Social posts do not lead to a simple website action.",
  "first_email_angle": "Mention one specific social/content observation and link the audit.",
  "call_follow_up_angle": {
    "opening_line": "I sent over a short social audit with a few content gaps I noticed.",
    "strongest_observation": "The business has a visual product, but no repeatable reels system.",
    "first_question": "Are you currently planning content week to week or just posting when you can?",
    "likely_objection": "We do not have time to film much.",
    "objection_response": "That is why I would start with one short shoot and two reusable weekly reels.",
    "goal_of_call": "Book a quick content walkthrough."
  }
}
```

Use `[Social Audit Link]` in an email draft to insert the public social audit URL. `[Mockup Link]` still inserts the public mockup URL. If the social audit placeholder is not present, the sender does not append that link automatically.

## Apex First Impression JSON Fields

Code X/Apex prospecting batches can use inline first-impression briefs without requiring a public mockup or social audit page:

```json
{
  "campaign_type": "apex_social_content",
  "apex_delivery_mode": "inline_apex_brief",
  "first_impression_audit": {
    "homepage_clarity": "The homepage shows services, but the first screen does not quickly prove why a stranger should trust the business.",
    "offer_clarity": "The main offer is useful but not packaged around a clear next step.",
    "primary_cta": "Request an estimate",
    "trust_signals": "Reviews and project proof exist but are not prominent before the CTA.",
    "video_or_photo_gap": "Recent proof clips or before-and-after visuals are underused.",
    "social_proof_gap": "Social posts do not consistently reinforce the website claim.",
    "mobile_first_impression": "Mobile visitors need a faster proof-to-contact path.",
    "lead_path_issue": "The quote path is not obvious after someone sees the proof.",
    "ad_readiness": "Retargeting should point to proof and a clear request path, not generic awareness.",
    "what_to_fix_first": "Test one proof asset tied directly to the quote CTA."
  },
  "trigger_reason": "Recent site/social review showed a visible proof gap.",
  "personalized_observation": "Project photos are useful, but the first screen does not make the estimate path obvious.",
  "business_implication": "Strangers may not trust the business fast enough to request a quote.",
  "proof_asset_type": "One before-and-after proof reel plus a short website proof section.",
  "what_to_test_first": "Run one proof clip to the local quote path.",
  "measurement_hypothesis": "More proof before the CTA should improve qualified estimate requests.",
  "follow_up_sequence": {
    "touch_1_observation_email": "Short observation plus inline first-impression direction.",
    "touch_2_custom_video_or_mockup": "Send a quick screen-recorded teardown or simple proof mockup.",
    "touch_3_social_touch": "Reference a recent project, offer, or service proof gap.",
    "touch_4_proof_followup": "Share one practical proof asset or ad angle.",
    "touch_5_permission_breakup": "Ask permission to close the loop.",
    "call_walkthrough_angle": "Walk through where the first impression leaks trust before the lead path.",
    "starter_package_recommendation": "First Impression Audit + first proof asset test."
  },
  "email_body": "Hi Example team,\n\nI noticed one specific first-impression gap and one proof opportunity.\n\n[Inline Apex Brief]\n\nWould you be open to a quick walkthrough?\n\nBest,\nNate\nApex Marketing Group"
}
```

The sender replaces `[Inline Apex Brief]` with:

```text
First impression direction:
• Trust leak: ...
• Lead path: ...
• Proof asset: ...
• Meta angle: ...
• What I would test first: ...
```

Keep first-touch emails short, specific, and problem-first: one real observation, one business implication, one useful proof asset, and one soft ask. Avoid generic phrases like "boost your online presence", "optimize engagement", or "I ran a full audit."

## Supabase Migration

The Gmail queue needs the `outreach_sends` table from `supabase/schema.sql`. Run the outreach-sends SQL in Supabase before using `/send-queue` or `/api/outreach/send`.
