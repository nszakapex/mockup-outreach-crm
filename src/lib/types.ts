// ─── Prospect Statuses ──────────────────────────────────
export const PROSPECT_STATUSES = [
  'new',
  'qualified',
  'audited',
  'mockup_ready',
  'email_ready',
  'approved_to_send',
  'sent',
  'follow_up_1',
  'follow_up_2',
  'replied',
  'booked',
  'not_interested',
  'do_not_contact',
] as const;

export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

// ─── Status metadata ────────────────────────────────────
export const STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string; bg: string }> = {
  new:              { label: 'New',              color: 'oklch(75% 0.01 250)',  bg: 'oklch(75% 0.01 250 / 0.12)' },
  qualified:        { label: 'Qualified',        color: 'oklch(65% 0.20 250)',  bg: 'oklch(65% 0.20 250 / 0.12)' },
  audited:          { label: 'Audited',          color: 'oklch(70% 0.16 200)',  bg: 'oklch(70% 0.16 200 / 0.12)' },
  mockup_ready:     { label: 'Mockup Ready',     color: 'oklch(75% 0.16 300)',  bg: 'oklch(75% 0.16 300 / 0.12)' },
  email_ready:      { label: 'Email Ready',      color: 'oklch(75% 0.16 85)',   bg: 'oklch(75% 0.16 85 / 0.12)' },
  approved_to_send: { label: 'Approved',         color: 'oklch(65% 0.18 155)',  bg: 'oklch(65% 0.18 155 / 0.12)' },
  sent:             { label: 'Sent',             color: 'oklch(70% 0.18 150)',  bg: 'oklch(70% 0.18 150 / 0.12)' },
  follow_up_1:      { label: 'Follow-up 1',      color: 'oklch(70% 0.14 60)',   bg: 'oklch(70% 0.14 60 / 0.12)' },
  follow_up_2:      { label: 'Follow-up 2',      color: 'oklch(65% 0.14 40)',   bg: 'oklch(65% 0.14 40 / 0.12)' },
  replied:          { label: 'Replied',          color: 'oklch(70% 0.20 155)',  bg: 'oklch(70% 0.20 155 / 0.12)' },
  booked:           { label: 'Booked',           color: 'oklch(80% 0.18 150)',  bg: 'oklch(80% 0.18 150 / 0.15)' },
  not_interested:   { label: 'Not Interested',   color: 'oklch(55% 0.01 250)',  bg: 'oklch(55% 0.01 250 / 0.10)' },
  do_not_contact:   { label: 'Do Not Contact',   color: 'oklch(65% 0.22 25)',   bg: 'oklch(65% 0.22 25 / 0.12)' },
};

// ─── Database Types ─────────────────────────────────────
export interface Prospect {
  id: string;
  business_name: string;
  niche: string;
  website_url: string | null;
  public_email: string | null;
  phone: string | null;
  city: string;
  state: string;
  instagram_url: string | null;
  facebook_url: string | null;
  google_maps_url: string | null;
  lead_score: number;
  status: ProspectStatus;
  source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Audit {
  id: string;
  prospect_id: string;
  website_score: number | null;
  mobile_score: number | null;
  seo_score: number | null;
  social_score: number | null;
  main_problem: string | null;
  conversion_opportunity: string | null;
  recommended_offer: string | null;
  mockup_angle: string | null;
  audit_notes: string | null;
  created_at: string;
}

export interface Mockup {
  id: string;
  prospect_id: string;
  slug: string;
  title: string;
  mockup_url: string | null;
  mockup_status: string;
  hero_headline: string | null;
  hero_subheadline: string | null;
  primary_cta: string | null;
  features_included: string | null;
  concept_notes: string | null;
  created_at: string;
}

export interface EmailDraft {
  id: string;
  prospect_id: string;
  subject: string;
  body: string;
  status: string;
  approved_at: string | null;
  sent_at: string | null;
  reply_status: string | null;
  created_at: string;
}

export interface FollowUpTask {
  id: string;
  prospect_id: string;
  task_type: string;
  due_date: string;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface OptOut {
  id: string;
  email: string;
  business_name: string | null;
  reason: string | null;
  created_at: string;
}

// ─── Joined types ───────────────────────────────────────
export interface OutreachSend {
  id: string;
  prospect_id: string;
  email_draft_id: string | null;
  provider: 'gmail' | 'test';
  to_email: string;
  from_email: string;
  subject: string;
  body: string;
  status: 'queued' | 'sent' | 'test_sent' | 'failed' | 'skipped';
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface ProspectWithRelations extends Prospect {
  audits?: Audit[];
  mockups?: Mockup[];
  email_drafts?: EmailDraft[];
  follow_up_tasks?: FollowUpTask[];
}

// ─── Settings ───────────────────────────────────────────
export interface AppSettings {
  daily_send_goal: number;
  default_niche: string;
  default_city: string;
  sender_name: string;
  agency_name: string;
  default_cta: string;
  hermes_notes: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  daily_send_goal: 10,
  default_niche: 'restaurant',
  default_city: 'Fort Collins',
  sender_name: 'Nate',
  agency_name: 'Apex Marketing & AI Solutions',
  default_cta: 'Schedule a free walkthrough',
  hermes_notes: '',
};
