import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DEMO_SOURCE = 'demo_seed';
const envPath = join(process.cwd(), '.env.local');
const dryRun = process.argv.includes('--dry-run');

function parseEnvFile(path) {
  if (!existsSync(path)) return new Map();

  const entries = new Map();
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsAt = trimmed.indexOf('=');
    if (equalsAt === -1) continue;

    const name = trimmed.slice(0, equalsAt).trim();
    const value = trimmed.slice(equalsAt + 1).trim();
    entries.set(name, value);
  }

  return entries;
}

function requireEnv(env, name) {
  const value = env.get(name)?.trim();
  if (!value) throw new Error(`${name} is missing from .env.local`);
  return value;
}

function getSupabaseEnv() {
  const env = parseEnvFile(envPath);
  const url = requireEnv(env, 'NEXT_PUBLIC_SUPABASE_URL');
  const key =
    env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')?.trim() ||
    env.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')?.trim();

  if (!key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing from .env.local');
  }

  return { url, key };
}

const prospects = [
  {
    id: '91000000-0000-4000-8000-000000000001',
    business_name: 'Bluebird Taco & Cantina',
    niche: 'restaurant',
    website_url: 'https://bluebirdtaco.example',
    public_email: 'hello@bluebirdtaco.example',
    phone: '(970) 555-1101',
    city: 'Fort Collins',
    state: 'CO',
    instagram_url: 'https://instagram.com/bluebirdtaco',
    facebook_url: null,
    google_maps_url: 'https://maps.google.com/?cid=910000000001',
    lead_score: 88,
    status: 'email_ready',
    source: DEMO_SOURCE,
    notes: 'Busy patio restaurant with strong food photography but no online ordering flow above the fold.',
  },
  {
    id: '91000000-0000-4000-8000-000000000002',
    business_name: 'Juniper Table Bistro',
    niche: 'restaurant',
    website_url: 'https://junipertable.example',
    public_email: 'events@junipertable.example',
    phone: '(970) 555-1102',
    city: 'Loveland',
    state: 'CO',
    instagram_url: 'https://instagram.com/junipertable',
    facebook_url: null,
    google_maps_url: 'https://maps.google.com/?cid=910000000002',
    lead_score: 81,
    status: 'approved_to_send',
    source: DEMO_SOURCE,
    notes: 'High-ticket dinner service. Their current site hides reservations and private dining under separate pages.',
  },
  {
    id: '91000000-0000-4000-8000-000000000003',
    business_name: 'Canyon Creek BBQ',
    niche: 'restaurant',
    website_url: 'https://canyoncreekbbq.example',
    public_email: 'pitmaster@canyoncreekbbq.example',
    phone: '(970) 555-1103',
    city: 'Greeley',
    state: 'CO',
    instagram_url: null,
    facebook_url: 'https://facebook.com/canyoncreekbbq',
    google_maps_url: 'https://maps.google.com/?cid=910000000003',
    lead_score: 74,
    status: 'follow_up_1',
    source: DEMO_SOURCE,
    notes: 'Catering is the best offer angle. They replied once asking for examples, so this is ready for a follow-up.',
  },
  {
    id: '91000000-0000-4000-8000-000000000004',
    business_name: 'Front Range Roof Repair',
    niche: 'roofing',
    website_url: 'https://frontrangeroofrepair.example',
    public_email: 'quotes@frontrangeroofrepair.example',
    phone: '(970) 555-2101',
    city: 'Windsor',
    state: 'CO',
    instagram_url: null,
    facebook_url: 'https://facebook.com/frontrangeroofrepair',
    google_maps_url: 'https://maps.google.com/?cid=910000000004',
    lead_score: 79,
    status: 'mockup_ready',
    source: DEMO_SOURCE,
    notes: 'Storm-season emergency repair page could convert better than the generic contractor homepage.',
  },
  {
    id: '91000000-0000-4000-8000-000000000005',
    business_name: 'Clearwater Plumbing Co.',
    niche: 'plumbing',
    website_url: 'https://clearwaterplumbing.example',
    public_email: 'service@clearwaterplumbing.example',
    phone: '(970) 555-2102',
    city: 'Fort Collins',
    state: 'CO',
    instagram_url: null,
    facebook_url: 'https://facebook.com/clearwaterplumbingco',
    google_maps_url: 'https://maps.google.com/?cid=910000000005',
    lead_score: 67,
    status: 'qualified',
    source: DEMO_SOURCE,
    notes: 'Good reviews and fast response claims, but no instant emergency call path on mobile.',
  },
];

const audits = [
  {
    id: '92000000-0000-4000-8000-000000000001',
    prospect_id: prospects[0].id,
    website_score: 42,
    mobile_score: 34,
    seo_score: 48,
    social_score: 83,
    main_problem: 'The menu is buried and the mobile homepage does not push online ordering or reservations.',
    conversion_opportunity: 'Turn Instagram food interest into online orders with a hero ordering CTA and menu cards.',
    recommended_offer: 'Restaurant homepage redesign with ordering flow and Google review proof.',
    mockup_angle: 'Show a mobile-first taco ordering homepage with a sticky order button.',
    audit_notes: 'Strong visual brand already exists on Instagram; the website just does not use it.',
  },
  {
    id: '92000000-0000-4000-8000-000000000002',
    prospect_id: prospects[1].id,
    website_score: 55,
    mobile_score: 46,
    seo_score: 51,
    social_score: 72,
    main_problem: 'Reservation and private dining CTAs compete with too many navigation links.',
    conversion_opportunity: 'Move reservations, private dining, and events into a concise conversion path.',
    recommended_offer: 'Premium restaurant refresh with reservation and private event funnels.',
    mockup_angle: 'Show a polished reservation-first bistro site with a private dining panel.',
    audit_notes: 'The brand feels premium offline but ordinary online.',
  },
  {
    id: '92000000-0000-4000-8000-000000000003',
    prospect_id: prospects[2].id,
    website_score: 38,
    mobile_score: 31,
    seo_score: 44,
    social_score: 58,
    main_problem: 'Catering information is hard to find, and the current homepage only highlights dine-in.',
    conversion_opportunity: 'Package catering trays and event menus as lead-generation offers.',
    recommended_offer: 'Catering landing page plus homepage CTA rewrite.',
    mockup_angle: 'Show a BBQ catering page with menu bundles and a quote form.',
    audit_notes: 'Facebook engagement suggests catering and events are already a meaningful revenue path.',
  },
  {
    id: '92000000-0000-4000-8000-000000000004',
    prospect_id: prospects[3].id,
    website_score: 49,
    mobile_score: 39,
    seo_score: 57,
    social_score: 34,
    main_problem: 'Emergency roof repair is not visible until far below the fold on mobile.',
    conversion_opportunity: 'Add storm-damage CTAs, click-to-call, service areas, and insurance claim trust signals.',
    recommended_offer: 'Emergency roof repair landing page with local SEO sections.',
    mockup_angle: 'Show an emergency-first roof repair page for hail and wind damage.',
    audit_notes: 'They have enough reviews to support a trust-led campaign but the site underuses them.',
  },
  {
    id: '92000000-0000-4000-8000-000000000005',
    prospect_id: prospects[4].id,
    website_score: 52,
    mobile_score: 43,
    seo_score: 46,
    social_score: 28,
    main_problem: 'The mobile site makes emergency callers read before they can act.',
    conversion_opportunity: 'Add tap-to-call, emergency service pages, and quote request shortcuts.',
    recommended_offer: 'Plumbing conversion tune-up with emergency CTA and service-area pages.',
    mockup_angle: 'Show a mobile emergency plumbing homepage with an instant call bar.',
    audit_notes: 'Good Google reviews, but competitors are clearer about 24/7 emergency service.',
  },
];

const mockups = [
  {
    id: '93000000-0000-4000-8000-000000000001',
    prospect_id: prospects[0].id,
    slug: 'bluebird-taco-mobile-ordering',
    title: 'Bluebird Taco - Mobile Ordering Concept',
    mockup_url: null,
    mockup_status: 'published',
    hero_headline: 'Fresh Tacos, Fast Pickup, Zero Friction',
    hero_subheadline: 'A mobile-first ordering experience built around craveable photos, fast checkout, and local proof.',
    primary_cta: 'Order Tacos Now',
    features_included: 'Online ordering, Sticky mobile CTA, Menu cards, Google reviews, Instagram gallery',
    concept_notes: 'Uses warm food photography, punchy CTA language, and a simplified mobile ordering path.',
  },
  {
    id: '93000000-0000-4000-8000-000000000002',
    prospect_id: prospects[1].id,
    slug: 'juniper-table-reservation-refresh',
    title: 'Juniper Table - Reservation-First Refresh',
    mockup_url: null,
    mockup_status: 'published',
    hero_headline: 'Reserve a Table Worth Remembering',
    hero_subheadline: 'A refined bistro site that moves reservations, private dining, and events into one polished flow.',
    primary_cta: 'Reserve Tonight',
    features_included: 'Reservation CTA, Private dining section, Event inquiry form, Menu highlights, Reviews',
    concept_notes: 'Designed to feel quiet and premium while making high-value actions obvious.',
  },
  {
    id: '93000000-0000-4000-8000-000000000003',
    prospect_id: prospects[2].id,
    slug: 'canyon-creek-bbq-catering',
    title: 'Canyon Creek BBQ - Catering Funnel',
    mockup_url: null,
    mockup_status: 'ready',
    hero_headline: 'Bring Slow-Smoked BBQ to the Whole Crew',
    hero_subheadline: 'A catering-focused page for office lunches, weddings, game days, and local events.',
    primary_cta: 'Request Catering Quote',
    features_included: 'Catering packages, Quote form, Event gallery, Testimonials, Pickup options',
    concept_notes: 'Leads with trays, bundles, and event-size ordering instead of the normal dine-in story.',
  },
  {
    id: '93000000-0000-4000-8000-000000000004',
    prospect_id: prospects[3].id,
    slug: 'front-range-roof-storm-repair',
    title: 'Front Range Roof Repair - Storm Response Landing Page',
    mockup_url: null,
    mockup_status: 'ready',
    hero_headline: 'Storm Damage? Get a Roof Inspection Today',
    hero_subheadline: 'Fast inspections, insurance-ready documentation, and emergency repair for Northern Colorado homes.',
    primary_cta: 'Book Roof Inspection',
    features_included: 'Storm CTA, Click-to-call, Insurance claim steps, Service area map, Review proof',
    concept_notes: 'Emergency-first layout built for hail season and mobile search traffic.',
  },
  {
    id: '93000000-0000-4000-8000-000000000005',
    prospect_id: prospects[4].id,
    slug: 'clearwater-plumbing-emergency',
    title: 'Clearwater Plumbing - Emergency CTA Concept',
    mockup_url: null,
    mockup_status: 'draft',
    hero_headline: 'Need a Plumber Today?',
    hero_subheadline: 'A faster mobile homepage for urgent repairs, clear service areas, and instant quote requests.',
    primary_cta: 'Call for Service',
    features_included: 'Tap-to-call, Emergency services, Service area pages, Review highlights, Quote form',
    concept_notes: 'Built to reduce hesitation for mobile visitors who need immediate help.',
  },
];

const emailDrafts = [
  {
    id: '94000000-0000-4000-8000-000000000001',
    prospect_id: prospects[0].id,
    subject: 'I mocked up a faster ordering flow for Bluebird Taco',
    body: `Hi there,

I was looking at Bluebird Taco's site and noticed the food looks great, but the online ordering path takes too much work on mobile.

I put together a quick redesign concept that puts the menu, reviews, and order button right where hungry visitors expect them.

Mockup: http://localhost:3001/mockups/bluebird-taco-mobile-ordering

Would you be open to a 15-minute walkthrough this week?

Best,
Nate`,
    status: 'ready',
    approved_at: null,
    sent_at: null,
    reply_status: null,
  },
  {
    id: '94000000-0000-4000-8000-000000000002',
    prospect_id: prospects[1].id,
    subject: 'Reservation-first refresh concept for Juniper Table',
    body: `Hi there,

Juniper Table already feels premium in person, but the website makes reservations and private dining harder to find than they should be.

I built a small concept that brings reservations, events, and private dining into one polished flow.

Mockup: http://localhost:3001/mockups/juniper-table-reservation-refresh

If useful, I can walk you through the changes and where they would increase bookings.

Best,
Nate`,
    status: 'approved',
    approved_at: new Date().toISOString(),
    sent_at: null,
    reply_status: null,
  },
  {
    id: '94000000-0000-4000-8000-000000000003',
    prospect_id: prospects[2].id,
    subject: 'Following up with the BBQ catering concept',
    body: `Hi there,

Following up on the catering page idea I sent over. Canyon Creek already has a great local following, and the mockup shows how catering could become a clearer lead path.

Mockup: http://localhost:3001/mockups/canyon-creek-bbq-catering

Worth a quick look?

Best,
Nate`,
    status: 'sent',
    approved_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    sent_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    reply_status: 'none',
  },
  {
    id: '94000000-0000-4000-8000-000000000004',
    prospect_id: prospects[3].id,
    subject: 'Storm repair landing page concept',
    body: `Hi there,

I noticed Front Range Roof Repair could make emergency storm repair much more visible on mobile.

I put together a concept around inspections, insurance documentation, and fast click-to-call conversion.

Mockup: http://localhost:3001/mockups/front-range-roof-storm-repair

Happy to walk through it if you want to see the thinking behind it.

Best,
Nate`,
    status: 'draft',
    approved_at: null,
    sent_at: null,
    reply_status: null,
  },
  {
    id: '94000000-0000-4000-8000-000000000005',
    prospect_id: prospects[4].id,
    subject: 'Emergency plumbing homepage idea',
    body: `Hi there,

Clearwater has strong reviews, but the mobile site could make emergency service easier to act on.

I sketched a concept with a clearer call path, service areas, and quote request flow.

Mockup: http://localhost:3001/mockups/clearwater-plumbing-emergency

Would a quick walkthrough be helpful?

Best,
Nate`,
    status: 'draft',
    approved_at: null,
    sent_at: null,
    reply_status: null,
  },
];

const followUpTasks = [
  {
    id: '95000000-0000-4000-8000-000000000001',
    prospect_id: prospects[2].id,
    task_type: 'follow_up',
    due_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    notes: 'Demo seed task: follow up on the catering mockup after the first sent email.',
  },
];

async function requireOk(operation, label) {
  const { data, error, count } = await operation;
  if (error) throw new Error(`${label}: ${error.message}`);
  return { data, count };
}

async function deleteRowsForProspects(supabase, table, prospectIds) {
  if (prospectIds.length === 0) return 0;
  await requireOk(
    supabase.from(table).delete().in('prospect_id', prospectIds),
    `Delete existing ${table}`
  );
  return prospectIds.length;
}

async function insertRows(supabase, table, rows) {
  if (rows.length === 0) return 0;
  await requireOk(supabase.from(table).insert(rows), `Insert ${table}`);
  return rows.length;
}

async function seed() {
  const { url, key } = getSupabaseEnv();
  const supabase = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  if (dryRun) {
    printSummary({
      deletedProspects: 0,
      prospects: prospects.length,
      audits: audits.length,
      mockups: mockups.length,
      emailDrafts: emailDrafts.length,
      followUpTasks: followUpTasks.length,
      dryRun: true,
    });
    return;
  }

  const { data: existingProspects } = await requireOk(
    supabase.from('prospects').select('id').eq('source', DEMO_SOURCE),
    'Fetch existing demo prospects'
  );
  const existingIds = (existingProspects || []).map((row) => row.id);

  await deleteRowsForProspects(supabase, 'follow_up_tasks', existingIds);
  await deleteRowsForProspects(supabase, 'email_drafts', existingIds);
  await deleteRowsForProspects(supabase, 'mockups', existingIds);
  await deleteRowsForProspects(supabase, 'audits', existingIds);

  if (existingIds.length > 0) {
    await requireOk(
      supabase.from('prospects').delete().eq('source', DEMO_SOURCE),
      'Delete existing demo prospects'
    );
  }

  const insertedProspects = await insertRows(supabase, 'prospects', prospects);
  const insertedAudits = await insertRows(supabase, 'audits', audits);
  const insertedMockups = await insertRows(supabase, 'mockups', mockups);
  const insertedEmailDrafts = await insertRows(supabase, 'email_drafts', emailDrafts);
  const insertedFollowUpTasks = await insertRows(supabase, 'follow_up_tasks', followUpTasks);

  printSummary({
    deletedProspects: existingIds.length,
    prospects: insertedProspects,
    audits: insertedAudits,
    mockups: insertedMockups,
    emailDrafts: insertedEmailDrafts,
    followUpTasks: insertedFollowUpTasks,
    dryRun: false,
  });
}

function printSummary(summary) {
  const prefix = summary.dryRun ? '[dry run] ' : '';

  console.log(`${prefix}Supabase demo seed complete for mockup-outreach-crm`);
  console.log(`Demo source tag: ${DEMO_SOURCE}`);
  console.log(`Existing demo prospects removed: ${summary.deletedProspects}`);
  console.log(`Prospects inserted/upserted: ${summary.prospects}`);
  console.log(`Audits inserted/upserted: ${summary.audits}`);
  console.log(`Mockups inserted/upserted: ${summary.mockups}`);
  console.log(`Email drafts inserted/upserted: ${summary.emailDrafts}`);
  console.log(`Follow-up tasks inserted/upserted: ${summary.followUpTasks}`);
  console.log('');
  console.log('URLs to test:');
  console.log('  http://localhost:3001/dashboard');
  console.log('  http://localhost:3001/prospects');
  console.log('  http://localhost:3001/approval');
  console.log('  http://localhost:3001/api/debug/supabase');
  console.log('  http://localhost:3001/mockups/bluebird-taco-mobile-ordering');
  console.log('  http://localhost:3001/mockups/juniper-table-reservation-refresh');
  console.log('');
  console.log('Expected dashboard counts after seeding:');
  console.log('  Total Prospects: 5');
  console.log('  Qualified: 1');
  console.log('  Mockups Ready: 1');
  console.log('  Emails Ready: 1');
  console.log('  Approved to Send: 1');
  console.log('  Sent Today: 0');
  console.log('  Follow-ups Due: 1');
  console.log('  Replies: 0');
  console.log('  Booked Calls: 0');
}

seed().catch((error) => {
  console.error('Supabase seed failed.');
  console.error(error.message);
  process.exit(1);
});
