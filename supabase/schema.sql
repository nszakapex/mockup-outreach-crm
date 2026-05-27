-- ═══════════════════════════════════════════════════════════
-- Mockup Outreach CRM — Supabase Schema
-- Apex Marketing & AI Solutions
-- ═══════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Prospects ──────────────────────────────────────────
create table if not exists prospects (
  id            uuid primary key default uuid_generate_v4(),
  business_name text not null,
  niche         text not null default 'restaurant',
  website_url   text,
  public_email  text,
  phone         text,
  city          text not null default '',
  state         text not null default '',
  instagram_url text,
  facebook_url  text,
  google_maps_url text,
  lead_score    integer not null default 0 check (lead_score >= 0 and lead_score <= 100),
  status        text not null default 'new' check (status in (
    'new', 'qualified', 'audited', 'mockup_ready', 'email_ready',
    'approved_to_send', 'sent', 'follow_up_1', 'follow_up_2',
    'replied', 'booked', 'not_interested', 'do_not_contact'
  )),
  source        text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger prospects_updated_at
  before update on prospects
  for each row execute function update_updated_at();

-- ─── Audits ─────────────────────────────────────────────
create table if not exists audits (
  id                     uuid primary key default uuid_generate_v4(),
  prospect_id            uuid not null references prospects(id) on delete cascade,
  website_score          integer check (website_score >= 0 and website_score <= 100),
  mobile_score           integer check (mobile_score >= 0 and mobile_score <= 100),
  seo_score              integer check (seo_score >= 0 and seo_score <= 100),
  social_score           integer check (social_score >= 0 and social_score <= 100),
  main_problem           text,
  conversion_opportunity text,
  recommended_offer      text,
  mockup_angle           text,
  audit_notes            text,
  created_at             timestamptz not null default now()
);

-- ─── Mockups ────────────────────────────────────────────
create table if not exists mockups (
  id                uuid primary key default uuid_generate_v4(),
  prospect_id       uuid not null references prospects(id) on delete cascade,
  slug              text not null unique,
  title             text not null,
  mockup_url        text,
  mockup_status     text not null default 'draft' check (mockup_status in ('draft', 'ready', 'published', 'archived')),
  hero_headline     text,
  hero_subheadline  text,
  primary_cta       text,
  features_included text,
  concept_notes     text,
  created_at        timestamptz not null default now()
);

-- ─── Email Drafts ───────────────────────────────────────
create table if not exists email_drafts (
  id            uuid primary key default uuid_generate_v4(),
  prospect_id   uuid not null references prospects(id) on delete cascade,
  subject       text not null,
  body          text not null,
  status        text not null default 'draft' check (status in ('draft', 'ready', 'approved', 'sent', 'rejected')),
  approved_at   timestamptz,
  sent_at       timestamptz,
  reply_status  text check (reply_status in (null, 'none', 'replied', 'positive', 'negative', 'booked')),
  created_at    timestamptz not null default now()
);

-- ─── Follow-up Tasks ────────────────────────────────────
create table if not exists follow_up_tasks (
  id          uuid primary key default uuid_generate_v4(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  task_type   text not null default 'follow_up' check (task_type in ('follow_up', 'call', 'email', 'review', 'other')),
  due_date    date not null,
  status      text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  notes       text,
  created_at  timestamptz not null default now()
);

-- ─── Opt-outs ───────────────────────────────────────────
-- --- Outreach Sends ---------------------------------------------------------
create table if not exists outreach_sends (
  id                  uuid primary key default uuid_generate_v4(),
  prospect_id         uuid not null references prospects(id) on delete cascade,
  email_draft_id      uuid references email_drafts(id) on delete set null,
  provider            text not null default 'gmail' check (provider in ('gmail', 'test')),
  to_email            text not null,
  from_email          text not null,
  subject             text not null,
  body                text not null,
  status              text not null default 'queued' check (status in ('queued', 'sent', 'test_sent', 'failed', 'skipped')),
  provider_message_id text,
  error_message       text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now()
);

create table if not exists opt_outs (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null unique,
  business_name text,
  reason        text,
  created_at    timestamptz not null default now()
);

-- ─── Indexes ────────────────────────────────────────────
create index if not exists idx_prospects_status on prospects(status);
create index if not exists idx_prospects_niche on prospects(niche);
create index if not exists idx_prospects_city on prospects(city);
create index if not exists idx_prospects_lead_score on prospects(lead_score desc);
create index if not exists idx_audits_prospect on audits(prospect_id);
create index if not exists idx_mockups_prospect on mockups(prospect_id);
create index if not exists idx_mockups_slug on mockups(slug);
create index if not exists idx_email_drafts_prospect on email_drafts(prospect_id);
create index if not exists idx_email_drafts_status on email_drafts(status);
create index if not exists idx_follow_up_tasks_prospect on follow_up_tasks(prospect_id);
create index if not exists idx_follow_up_tasks_due on follow_up_tasks(due_date);
create index if not exists idx_outreach_sends_prospect on outreach_sends(prospect_id);
create index if not exists idx_outreach_sends_email_draft on outreach_sends(email_draft_id);
create index if not exists idx_outreach_sends_status on outreach_sends(status);
create index if not exists idx_outreach_sends_sent_at on outreach_sends(sent_at);
drop index if exists idx_outreach_sends_unique_success;
create unique index if not exists idx_outreach_sends_unique_active_send
  on outreach_sends(prospect_id, email_draft_id)
  where status in ('queued', 'sent', 'test_sent');
create index if not exists idx_opt_outs_email on opt_outs(email);

-- ─── Row Level Security ─────────────────────────────────
-- Enable RLS (configure policies per your auth setup)
alter table prospects enable row level security;
alter table audits enable row level security;
alter table mockups enable row level security;
alter table email_drafts enable row level security;
alter table follow_up_tasks enable row level security;
alter table outreach_sends enable row level security;
alter table opt_outs enable row level security;

-- Permissive policies for development (tighten for production)
create policy "Allow all for prospects" on prospects for all using (true) with check (true);
create policy "Allow all for audits" on audits for all using (true) with check (true);
create policy "Allow all for mockups" on mockups for all using (true) with check (true);
create policy "Allow all for email_drafts" on email_drafts for all using (true) with check (true);
create policy "Allow all for follow_up_tasks" on follow_up_tasks for all using (true) with check (true);
drop policy if exists "Allow all for outreach_sends" on outreach_sends;
create policy "Allow all for outreach_sends" on outreach_sends for all using (true) with check (true);
create policy "Allow all for opt_outs" on opt_outs for all using (true) with check (true);

-- Public read access for mockups (for /mockups/[slug] public page)
create policy "Public read for published mockups" on mockups for select using (mockup_status = 'published');
