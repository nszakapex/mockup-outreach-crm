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
  "current_site_snapshot": "Menu highlights, atmosphere, and visit details exist but feel disconnected on mobile.",
  "online_presence_status": [
    "Website UX: menu and visit CTAs compete with generic footer links",
    "Social/content: strong photos need a better website destination"
  ],
  "visual_direction": "UI UX Pro Max restaurant-food baseline with boxed hospitality header, warm cream background, editorial serif hero, staggered food and atmosphere collage, menu cards, visit panel, and guest proof.",
  "brand_tone": "editorial, hospitality-driven, food-forward, atmospheric",
  "design_family": "hospitality_experience",
  "layout_signature": "immersive_photo_hero",
  "hero_mode": "editorial_food_collage",
  "design_style_key": "ui_ux_pro_max_restaurant_food_baseline",
  "image_treatment": "boxed editorial food and atmosphere collage",
  "cta_style": "restaurant-appropriate CTA such as Plan a Visit, View Menu, Reserve, Order, or Call only when public",
  "proof_style": "reviews, food photography, atmosphere, and visit details near the CTA",
  "palette_direction": "warm cream paper, dark ink, orange accent, block shadows",
  "typography_direction": "large editorial hospitality serif with compact sans navigation",
  "section_priority": ["editorial food hero", "local dining story", "interactive night planner", "filtered menu highlights", "visit planning", "guest proof", "plan-a-visit CTA"],
  "photo_strategy": "Use public food, dish, dining room, and atmosphere photos where available. If public media is thin, keep fallback visuals clearly conceptual and do not imply fake dishes.",
  "visual_profile": {
    "brand_mood": "warm, polished, food-forward hospitality",
    "brand_tone": "editorial, hospitality-driven, food-forward, atmospheric",
    "design_family": "hospitality_experience",
    "design_style_key": "ui_ux_pro_max_restaurant_food_baseline",
    "color_palette": {
      "primary": "oklch(18% 0.05 42)",
      "secondary": "oklch(48% 0.14 36)",
      "accent": "oklch(68% 0.2 43)",
      "background": "oklch(97% 0.035 84)",
      "text": "oklch(18% 0.05 42)"
    },
    "typography_mood": "editorial hospitality serif",
    "layout_signature": "immersive_photo_hero",
    "hero_mode": "editorial_food_collage",
    "image_treatment": "boxed editorial food and atmosphere collage",
    "proof_style": "reviews, food photography, atmosphere, and visit details near the CTA",
    "palette_direction": "warm cream paper, dark ink, orange accent, block shadows",
    "typography_direction": "large editorial hospitality serif with compact sans navigation",
    "photo_strategy": "Hero collage plus 3 to 6 proof/gallery cards from public food, dining room, staff, or atmosphere photos when available.",
    "ui_personality": "boxed restaurant header, editorial food collage hero, interactive planner, filtered menu cards, visit panel, final plan-a-visit CTA",
    "trust_style": "reviews, food photography, atmosphere, and practical visit details near the CTA",
    "cta_style": "Plan a Visit plus View Menu unless public ordering or reservations are verified"
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
      "image_url": "https://example.com/public-dining-room-photo.jpg",
      "source_url": "https://example.com/gallery",
      "source_type": "website",
      "alt": "Public dining room photo from the business website",
      "usage_note": "Use as proof card for food, room, or guest experience",
      "confidence": "high"
    }
  ],
  "proposed_site_nav": ["Planner", "Menu", "Story", "Visit", "Reviews", "Plan a Visit"],
  "homepage_sections": [
    "Boxed restaurant header",
    "Editorial food and atmosphere hero",
    "Local dining story",
    "Interactive Night Planner",
    "Filtered menu highlight cards",
    "Visit planning panel",
    "Guest proof",
    "Final Plan a Visit CTA"
  ],
  "menu_or_offer_items": ["Seasonal dinner plates", "Shareable starters", "Weekend brunch", "Dessert and coffee"],
  "restaurant_experience": {
    "night_planner_enabled": true,
    "planner_prompts": [
      "Help first-time guests choose a visit path from food, atmosphere, and timing instead of making them hunt through separate pages.",
      "What kind of visit are they planning?",
      "What should the visit feel like?"
    ],
    "visit_types": ["First visit", "Casual dinner", "Weekend brunch", "Group meal"],
    "occasion_tags": ["Something easy", "A table with atmosphere", "A shareable order", "Dessert and coffee"],
    "menu_filters": ["Dinner", "Shareable", "Brunch", "Dessert", "Coffee"],
    "featured_menu_items": [
      {
        "title": "Seasonal dinner plates",
        "description": "Category-level dinner cards that can be replaced with verified public menu items.",
        "category": "Dinner",
        "tags": ["Food", "Seasonal"],
        "meal_periods": ["Dinner"],
        "experience_tags": ["Occasion"]
      }
    ],
    "reservation_or_visit_cta": "Plan a Visit",
    "ordering_supported": false,
    "reservation_supported": false,
    "private_events_supported": false,
    "catering_supported": false
  },
  "website_issue_examples": ["Food photography should appear before generic location links", "Menu highlights should support visit intent instead of sitting on a separate page", "The primary CTA should fit restaurant behavior with a Plan a Visit path"],
  "trust_signals": ["Visible food photography", "Atmosphere before visit details", "Guest proof near the CTA"],
  "cta_strategy": "Show food and atmosphere first -> Review menu highlights -> Check visit details -> Plan a visit",
  "local_seo_angle": "best steakhouse in Loveland",
  "content_strategy_angle": "weekly food, atmosphere, and visit-planning posts that connect social proof to the homepage CTA",
  "meta_ads_angle": "promote the strongest food or atmosphere proof reel locally, then retarget people who viewed menu or visit content with a Plan a Visit CTA",
  "brand_style_notes": "Warm, editorial, food-forward, polished without pretending unverified awards or menu items are confirmed",
  "primary_colors": ["warm cream", "dark ink"],
  "secondary_colors": ["warm orange"],
  "original_site_notes": "Current site hides visit details below menu copy",
  "inspiration_notes": "UI UX Pro Max restaurant-food demo baseline"
}
```

Keep the data practical and business-specific: current site snapshot, online presence issues, proposed nav, homepage section ideas, actual menu/offers, trust signals, CTA path, local search angle, and content/ad strategy. Existing basic fields still work when these are missing.

### Apex V2 Public Mockup Requirements

For `campaign_type: "apex_social_content"` with `apex_delivery_mode: "public_mockup"` or `"link_plus_summary"`, future batches should include enough V2 data for the public concept to feel custom:

- `approved_archetype`: one of the approved public mockup archetypes listed below.
- `personalization_score`: numeric quality score. Public mockups require `>= 85`; records below `90` should be manually spot-checked.
- `visual_profile`: brand mood, design style key, palette, typography mood, layout signature, photo strategy, UI personality, trust style, and CTA style.
- `template_variant`: explicit renderer category such as `pet_service`, `contractor`, `medical_aesthetics`, `auto_service`, `fitness_studio`, `professional_service`, or `restaurant`.
- `design_family`: explicit art direction such as `editorial_photo_story`, `modern_service_stack`, `premium_dark_showcase`, `clean_conversion_clinic`, `project_board_contractor`, `cozy_local_brand`, `transformation_gallery`, `hospitality_experience`, `minimalist_luxury_service`, or `bold_action_local_service`.
- Art-direction fields: `brand_tone`, `hero_mode`, `section_priority`, `image_treatment`, `cta_style`, `proof_style`, `palette_direction`, and `typography_direction`.
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
- Vary `design_family` across a batch; import preview warns when one family dominates a public mockup paste.
- Public mockups now choose a layout renderer such as `PetCareBookingLayout`, `ContractorProjectBoardLayout`, `DarkPremiumTransformLayout`, `CleanClinicTrustLayout`, `FitnessEnergyLandingLayout`, `ProfessionalTrustPageLayout`, or `RestaurantExperienceLayout`. The DOM/header/hero/section plan should differ by renderer.
- Restaurant, cafe, bar/grill, premium dining, food truck, and hospitality records resolve to `approved_archetype: "hospitality_experience"`, `design_family: "hospitality_experience"`, `design_style_key: "ui_ux_pro_max_restaurant_food_baseline"`, and `RestaurantExperienceLayout`.
- The restaurant baseline includes boxed nav, editorial serif hero, food/atmosphere collage, an interactive Night Planner, filtered menu cards, visit path, proof/social section, and final CTA.
- Use the optional `restaurant_experience` object for planner prompts, visit types, occasion tags, menu filters, featured menu items, and explicit support flags for ordering, reservations, private events, and catering.
- Use `Plan a Visit` when reservation, ordering, delivery, catering, gift cards, or private dining are not publicly verified. Do not invent dishes, awards, reservation systems, catering, delivery, gift cards, or private dining.

### Apex Public Mockup Quality Gate

Apex public mockups are for high-quality prospects, not blind volume. Any Apex record using `apex_delivery_mode: "public_mockup"` or `"link_plus_summary"` must pass the public mockup quality gate before outreach. If it fails, the app marks it as `Mockup not outreach-ready` in import preview, prospect detail, approval, Telegram approval validation, and send queue eligibility.

Approved `approved_archetype` values:

- `premium_service_landing`: home services, local services, HVAC, plumbing, electrical, cleaning, pressure washing, garage doors, windows/doors.
- `proof_first_contractor`: contractors, remodelers, roofing, siding, concrete, landscaping, hardscaping, deck builders, fencing, flooring contractors.
- `transformation_showcase`: auto detail, ceramic coating, tint, transformation-led salons, and fitness transformations when appropriate.
- `clean_clinic_conversion`: med spas, aesthetics, dental, orthodontics, and wellness clinics.
- `warm_local_booking`: pet grooming, local appointment services, family-friendly service businesses, and warmth-led salons/barbershops.
- `hospitality_experience`: restaurants, cafes, event spaces, and hospitality businesses only.
- `professional_trust_page`: professional services, studios, consultants, photographers, and local B2B services.
- `fitness_energy_page`: gyms, fitness studios, pilates/yoga, and personal training.

Hard gate requirements:

- `approved_archetype` must be present and compatible with the prospect niche.
- `personalization_score` must be `>= 85`; scores from `85` to `89` are importable only with a warning.
- Public mockups need at least three specific `website_issue_examples`, non-generic nav/sections/offers/trust signals, a real CTA strategy, useful visual direction, media assets or a clearly explained fallback, specific social audit data, and a specific four-week content plan.
- Non-food businesses cannot use food labels such as Menu, Order, Reservations, Happy Hour, Catering, Gift Cards, or Best Time to Visit.
- Food and hospitality public mockups must use `approved_archetype: "hospitality_experience"` and restaurant-appropriate nav, homepage sections, offer/menu items, CTA language, and food/atmosphere/menu/visit media strategy.
- Food and hospitality public mockups use the permanent UI UX Pro restaurant baseline and must have renderable Night Planner and menu filtering data, either through `restaurant_experience` or safe menu/category fallback.
- Food and hospitality records must not claim ordering, reservations, private events, catering, dietary filters, awards, hours, or menu items unless the claim is public/imported and specific.
- Food and hospitality public mockups fail the gate if they use service-business labels such as Services, Request Quote, Free Estimate, Project Proof, Treatment Cards, Grooming Services, Service Area, or contractor-style lead paths.
- Banned generic phrases such as "Make the result easier to trust", "Your trusted local experts", "Modern solutions", and "Experience the difference" fail the gate.
- Public emails that appear guessed instead of publicly sourced are blocked.

Batch variety is also checked. For 10 public mockups, no more than 3 should share the same `approved_archetype`, `design_family`, or `layout_signature` unless justified. For 20 public mockups, the limit is 4.

When the business is a fit but public mockup quality is thin, use Apex inline brief delivery instead of forcing a public mockup.

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
â€¢ Trust leak: ...
â€¢ Lead path: ...
â€¢ Proof asset: ...
â€¢ Meta angle: ...
â€¢ What I would test first: ...
```

Keep first-touch emails short, specific, and problem-first: one real observation, one business implication, one useful proof asset, and one soft ask. Avoid generic phrases like "boost your online presence", "optimize engagement", or "I ran a full audit."

## Supabase Migration

The Gmail queue needs the `outreach_sends` table from `supabase/schema.sql`. Run the outreach-sends SQL in Supabase before using `/send-queue` or `/api/outreach/send`.
