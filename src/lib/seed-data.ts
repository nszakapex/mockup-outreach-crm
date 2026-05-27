import type { Prospect, Audit, Mockup, EmailDraft, FollowUpTask } from './types';

// ─── 5 Sample Prospects ─────────────────────────────────
// These use deterministic UUIDs so relationships work in local dev

export const SEED_PROSPECTS: Prospect[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    business_name: 'Mountain Fire Pizza',
    niche: 'restaurant',
    website_url: 'https://mountainfirepizza.com',
    public_email: 'info@mountainfirepizza.com',
    phone: '(970) 555-0101',
    city: 'Fort Collins',
    state: 'CO',
    instagram_url: 'https://instagram.com/mountainfirepizza',
    facebook_url: 'https://facebook.com/mountainfirepizza',
    google_maps_url: 'https://maps.google.com/?cid=1234567890',
    lead_score: 85,
    status: 'email_ready',
    source: 'Google Maps',
    notes: 'High-traffic location on College Ave. No online ordering. Perfect candidate for conversion-focused redesign.',
    created_at: '2026-05-20T10:00:00Z',
    updated_at: '2026-05-24T14:30:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    business_name: 'Sunrise Dental Studio',
    niche: 'dental',
    website_url: 'https://sunrisedentalstudio.com',
    public_email: 'front@sunrisedentalstudio.com',
    phone: '(970) 555-0202',
    city: 'Loveland',
    state: 'CO',
    instagram_url: null,
    facebook_url: 'https://facebook.com/sunrisedental',
    google_maps_url: 'https://maps.google.com/?cid=2345678901',
    lead_score: 72,
    status: 'audited',
    source: 'Google Maps',
    notes: 'Website is from 2019. No online booking. Good reviews but weak web presence.',
    created_at: '2026-05-21T09:00:00Z',
    updated_at: '2026-05-23T11:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    business_name: 'Peak Plumbing & Heating',
    niche: 'plumbing',
    website_url: 'https://peakplumbingco.com',
    public_email: 'service@peakplumbingco.com',
    phone: '(970) 555-0303',
    city: 'Fort Collins',
    state: 'CO',
    instagram_url: null,
    facebook_url: 'https://facebook.com/peakplumbing',
    google_maps_url: 'https://maps.google.com/?cid=3456789012',
    lead_score: 68,
    status: 'approved_to_send',
    source: 'Google Maps',
    notes: 'Decent site but no emergency CTA above fold. Competitors dominate local SEO.',
    created_at: '2026-05-19T08:00:00Z',
    updated_at: '2026-05-25T16:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    business_name: 'The Rustic Tavern',
    niche: 'restaurant',
    website_url: 'https://therustictavern.com',
    public_email: 'hello@therustictavern.com',
    phone: '(970) 555-0404',
    city: 'Greeley',
    state: 'CO',
    instagram_url: 'https://instagram.com/therustictavern',
    facebook_url: 'https://facebook.com/therustictavern',
    google_maps_url: 'https://maps.google.com/?cid=4567890123',
    lead_score: 90,
    status: 'sent',
    source: 'Instagram DM',
    notes: 'Great food photography on IG but website is a single Wix page. Huge opportunity.',
    created_at: '2026-05-18T12:00:00Z',
    updated_at: '2026-05-26T09:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000005',
    business_name: 'Alpine HVAC Solutions',
    niche: 'hvac',
    website_url: 'https://alpinehvac.co',
    public_email: 'info@alpinehvac.co',
    phone: '(970) 555-0505',
    city: 'Fort Collins',
    state: 'CO',
    instagram_url: null,
    facebook_url: 'https://facebook.com/alpinehvac',
    google_maps_url: 'https://maps.google.com/?cid=5678901234',
    lead_score: 55,
    status: 'new',
    source: 'Google Maps',
    notes: 'New prospect. Site loads slow, no reviews widget. Worth auditing.',
    created_at: '2026-05-26T07:00:00Z',
    updated_at: '2026-05-26T07:00:00Z',
  },
];

export const SEED_AUDITS: Audit[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    prospect_id: '00000000-0000-0000-0000-000000000001',
    website_score: 35,
    mobile_score: 28,
    seo_score: 40,
    social_score: 65,
    main_problem: 'No online ordering, slow load time, no mobile optimization',
    conversion_opportunity: 'Add online ordering, redesign hero with clear CTA, add Google reviews widget',
    recommended_offer: 'Full website redesign + online ordering integration',
    mockup_angle: 'Show them what their site could look like with a modern ordering flow',
    audit_notes: 'Menu is a PDF. Page speed score is 28 on mobile. Great Instagram content not being leveraged on website.',
    created_at: '2026-05-22T10:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    prospect_id: '00000000-0000-0000-0000-000000000002',
    website_score: 45,
    mobile_score: 38,
    seo_score: 30,
    social_score: 20,
    main_problem: 'No online booking, outdated design, zero social media presence',
    conversion_opportunity: 'Online appointment booking, before/after gallery, patient testimonials',
    recommended_offer: 'Website redesign with integrated booking + review management',
    mockup_angle: 'Modern dental practice site with instant booking and trust signals',
    audit_notes: 'They have 4.8 stars on Google but none of that shows on site. Competitor down the street has online booking.',
    created_at: '2026-05-23T11:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    prospect_id: '00000000-0000-0000-0000-000000000003',
    website_score: 50,
    mobile_score: 45,
    seo_score: 35,
    social_score: 30,
    main_problem: 'No emergency CTA, weak local SEO, no service area pages',
    conversion_opportunity: 'Emergency service banner, click-to-call, service area landing pages',
    recommended_offer: 'Landing page package + local SEO optimization',
    mockup_angle: 'Emergency-first homepage with instant quote and service area coverage',
    audit_notes: 'Good domain authority but losing to competitors on "emergency plumber Fort Collins" searches.',
    created_at: '2026-05-21T15:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    prospect_id: '00000000-0000-0000-0000-000000000004',
    website_score: 20,
    mobile_score: 15,
    seo_score: 25,
    social_score: 80,
    main_problem: 'Single-page Wix site with no menu, no reservations, no events',
    conversion_opportunity: 'Full-featured restaurant site with reservations, events calendar, catering page',
    recommended_offer: 'Complete website build + meta ads setup',
    mockup_angle: 'Premium restaurant experience site that matches their Instagram aesthetic',
    audit_notes: 'Their Instagram is fantastic — 3.2k followers, great engagement. Website is embarrassing by comparison.',
    created_at: '2026-05-20T13:00:00Z',
  },
];

export const SEED_MOCKUPS: Mockup[] = [
  {
    id: '20000000-0000-0000-0000-000000000001',
    prospect_id: '00000000-0000-0000-0000-000000000001',
    slug: 'mountain-fire-pizza-redesign',
    title: 'Mountain Fire Pizza — Premium Redesign Concept',
    mockup_url: null,
    mockup_status: 'ready',
    hero_headline: 'Wood-Fired Perfection, Delivered to Your Door',
    hero_subheadline: 'Fort Collins\' favorite pizzeria — now with online ordering. Fresh ingredients, handcrafted dough, ready in 30 minutes.',
    primary_cta: 'Order Online Now',
    features_included: 'Online ordering, Menu showcase, Google reviews widget, Instagram feed, Catering page',
    concept_notes: 'Warm color palette to match their brand. Focus on food photography and the ordering flow.',
    created_at: '2026-05-23T10:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    prospect_id: '00000000-0000-0000-0000-000000000003',
    slug: 'peak-plumbing-redesign',
    title: 'Peak Plumbing — Emergency-First Redesign',
    mockup_url: null,
    mockup_status: 'published',
    hero_headline: 'Emergency Plumbing? We\'re There in 60 Minutes.',
    hero_subheadline: 'Licensed, insured, and trusted by Fort Collins homeowners since 2015. Available 24/7 for emergencies.',
    primary_cta: 'Call Now — (970) 555-0303',
    features_included: 'Emergency banner, Click-to-call, Service area map, Reviews showcase, Free estimate form',
    concept_notes: 'Trust-focused design. Blue and white palette. Emergency CTA above fold on every page.',
    created_at: '2026-05-22T14:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    prospect_id: '00000000-0000-0000-0000-000000000004',
    slug: 'rustic-tavern-redesign',
    title: 'The Rustic Tavern — Full Experience Site',
    mockup_url: null,
    mockup_status: 'published',
    hero_headline: 'Craft Beer. Comfort Food. Community.',
    hero_subheadline: 'Greeley\'s neighborhood gathering spot — locally sourced food, 24 taps, live music every weekend.',
    primary_cta: 'Make a Reservation',
    features_included: 'Reservations, Full menu, Events calendar, Private dining, Catering, Instagram gallery',
    concept_notes: 'Rustic/modern aesthetic. Dark backgrounds with warm accent colors. Leverage their incredible food photography.',
    created_at: '2026-05-19T16:00:00Z',
  },
];

export const SEED_EMAIL_DRAFTS: EmailDraft[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    prospect_id: '00000000-0000-0000-0000-000000000001',
    subject: 'I redesigned Mountain Fire Pizza\'s website — take a look',
    body: `Hi there,

I'm Nate from Apex Marketing & AI Solutions. I was checking out Mountain Fire Pizza's website and noticed a few things that could help you get more online orders and foot traffic.

I went ahead and built a quick mockup of what your site could look like with modern online ordering, a mobile-first design, and your Google reviews front and center.

Here's the concept: [mockup link]

No strings attached — I just thought you'd want to see what's possible. If you're interested in a quick walkthrough, I'd love to show you how we could make this happen.

Best,
Nate
Apex Marketing & AI Solutions`,
    status: 'ready',
    approved_at: null,
    sent_at: null,
    reply_status: null,
    created_at: '2026-05-24T10:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    prospect_id: '00000000-0000-0000-0000-000000000003',
    subject: 'Your competitors are outranking you for "emergency plumber Fort Collins"',
    body: `Hi there,

I'm Nate from Apex Marketing & AI Solutions. I ran a quick audit on Peak Plumbing's website and found some easy wins that could help you show up first when Fort Collins homeowners search for emergency plumbing.

I put together a redesign concept focused on emergency calls and local SEO — you can see it here: [mockup link]

The biggest opportunity: getting a click-to-call emergency banner above the fold and building out service area pages. Your competitors are already doing this.

Want me to walk you through it? Takes about 15 minutes.

Best,
Nate
Apex Marketing & AI Solutions`,
    status: 'approved',
    approved_at: '2026-05-25T09:00:00Z',
    sent_at: null,
    reply_status: null,
    created_at: '2026-05-23T14:00:00Z',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    prospect_id: '00000000-0000-0000-0000-000000000004',
    subject: 'Your Instagram is incredible — your website should match',
    body: `Hi there,

I'm Nate from Apex Marketing & AI Solutions. I've been following The Rustic Tavern on Instagram and your content is seriously impressive — the food photography, the vibe, the community engagement.

But your website doesn't tell that story. Right now it's a single page that doesn't show your menu, take reservations, or feature any of that great content.

I built a concept of what a full-featured site could look like: [mockup link]

Think reservations, events calendar, catering page, and your Instagram feed integrated right in. Want to take a look together?

Best,
Nate
Apex Marketing & AI Solutions`,
    status: 'sent',
    approved_at: '2026-05-20T10:00:00Z',
    sent_at: '2026-05-20T11:00:00Z',
    reply_status: 'positive',
    created_at: '2026-05-19T17:00:00Z',
  },
];

export const SEED_FOLLOW_UP_TASKS: FollowUpTask[] = [
  {
    id: '40000000-0000-0000-0000-000000000001',
    prospect_id: '00000000-0000-0000-0000-000000000004',
    task_type: 'call',
    due_date: '2026-05-27',
    status: 'pending',
    notes: 'They replied positively — schedule the walkthrough call',
    created_at: '2026-05-26T09:00:00Z',
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    prospect_id: '00000000-0000-0000-0000-000000000003',
    task_type: 'follow_up',
    due_date: '2026-05-28',
    status: 'pending',
    notes: 'Send follow-up if no reply by Wednesday',
    created_at: '2026-05-25T16:00:00Z',
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    prospect_id: '00000000-0000-0000-0000-000000000001',
    task_type: 'review',
    due_date: '2026-05-26',
    status: 'pending',
    notes: 'Review email draft before sending',
    created_at: '2026-05-24T14:00:00Z',
  },
];
