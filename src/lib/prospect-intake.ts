import { getDataSource, getSupabase, SUPABASE_QUERY_TIMEOUT_MS } from './supabase';
import {
  encodeMockupConceptNotes,
  getMockupRichness,
  hasRichMockupData,
  normalizeRichMockupData,
  type MockupMediaAsset,
  type MockupVisualProfile,
  type MockupRichness,
} from './mockup-rich-data';
import {
  getApexImportSummary,
  normalizeApexDeliveryData,
  type ApexFollowUpSequence,
  type ApexDeliveryMode,
  type ApexImportSummary,
  type FirstImpressionAudit,
  type WebsiteAuditSnapshot,
} from './apex-delivery-data';
import {
  getSocialAuditRichness,
  normalizeSocialAuditData,
  type CallFollowUpAngle,
  type SocialAuditRichness,
  type SocialAuditScorecard,
  type SocialContentPlan,
} from './social-audit-data';
import {
  getMockupTemplateSelection,
  type MockupTemplateSelection,
} from './mockup-templates';
import { getMockupV2Diagnostics, type MockupV2Diagnostics } from './mockup-v2';
import {
  getResinateImportSummary,
  hasResinateFlooringData,
  normalizeResinateFlooringData,
  type ResinateCampaignType,
  type ResinateDeliveryMode,
  type ResinateImportSummary,
} from './resinate-data';
import { sanitizeEmailAddress } from './email-sanitization';
import { PROSPECT_STATUSES, type Prospect, type ProspectStatus } from './types';

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type ProspectIntakeInput = {
  business_name: string;
  niche: string;
  website_url?: string | null;
  public_email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  google_maps_url?: string | null;
  lead_score?: number | string | null;
  status?: string | null;
  source?: string | null;
  notes?: string | null;
  main_problem?: string | null;
  conversion_opportunity?: string | null;
  recommended_offer?: string | null;
  mockup_angle?: string | null;
  audit_notes?: string | null;
  mockup_slug?: string | null;
  mockup_url?: string | null;
  hero_headline?: string | null;
  hero_subheadline?: string | null;
  primary_cta?: string | null;
  features_included?: string | string[] | null;
  concept_notes?: string | null;
  template_variant?: string | null;
  design_family?: string | null;
  brand_style_notes?: string | null;
  visual_direction?: string | null;
  brand_tone?: string | null;
  layout_signature?: string | null;
  hero_mode?: string | null;
  design_style_key?: string | null;
  image_treatment?: string | null;
  cta_style?: string | null;
  proof_style?: string | null;
  palette_direction?: string | null;
  typography_direction?: string | null;
  photo_strategy?: string | null;
  visual_profile?: MockupVisualProfile | null;
  media_assets?: MockupMediaAsset[] | null;
  proof_assets?: MockupMediaAsset[] | null;
  gallery_assets?: MockupMediaAsset[] | null;
  primary_colors?: string | string[] | null;
  secondary_colors?: string | string[] | null;
  menu_or_offer_items?: string | string[] | null;
  trust_signals?: string | string[] | null;
  website_issue_examples?: string | string[] | null;
  cta_strategy?: string | null;
  local_seo_angle?: string | null;
  content_strategy_angle?: string | null;
  meta_ads_angle?: string | null;
  original_site_notes?: string | null;
  original_site_url?: string | null;
  inspiration_notes?: string | null;
  current_site_snapshot?: string | null;
  online_presence_status?: string | string[] | null;
  section_priority?: string | string[] | null;
  proposed_site_nav?: string | string[] | null;
  homepage_sections?: string | string[] | null;
  social_audit?: SocialAuditScorecard | null;
  content_opportunity?: string | null;
  content_plan?: SocialContentPlan | null;
  website_social_gap?: string | null;
  first_email_angle?: string | null;
  call_follow_up_angle?: CallFollowUpAngle | null;
  apex_delivery_mode?: ApexDeliveryMode | string | null;
  first_impression_audit?: FirstImpressionAudit | null;
  website_audit?: WebsiteAuditSnapshot | null;
  trigger_reason?: string | null;
  personalized_observation?: string | null;
  business_implication?: string | null;
  proof_asset_type?: string | null;
  what_to_test_first?: string | null;
  follow_up_sequence?: ApexFollowUpSequence | null;
  measurement_hypothesis?: string | null;
  campaign_type?: ResinateCampaignType | string | null;
  resinate_delivery_mode?: ResinateDeliveryMode | string | null;
  buyer_type?: string | null;
  property_type?: string | null;
  portfolio_or_property_context?: string | null;
  likely_surface_problem?: string | null;
  likely_surface_areas?: string | null;
  traffic_needs?: string | null;
  cleaning_needs?: string | null;
  downtime_needs?: string | null;
  moisture_needs?: string | null;
  slip_resistance_needs?: string | null;
  recommended_flooring_system?: string | null;
  system_reasoning?: string | null;
  best_resinate_offer?: string | null;
  facility_use_case?: string | null;
  decision_maker_path?: string | null;
  procurement_path?: string | null;
  likely_objection?: string | null;
  objection_response?: string | null;
  next_sales_action?: string | null;
  walkthrough_offer?: string | null;
  vendor_packet_angle?: string | null;
  prep_considerations?: string | null;
  moisture_considerations?: string | null;
  polyaspartic_value?: string | null;
  surface_system_summary?: string | null;
  email_subject?: string | null;
  email_body?: string | null;
};

export type ProspectBundleResult = {
  data: {
    prospect: Prospect;
    auditId: string | null;
    mockupId: string | null;
    emailDraftId: string | null;
  } | null;
  error: string | null;
};

export type HermesImportPreview = {
  index: number;
  input: ProspectIntakeInput;
  businessName: string;
  websiteUrl: string | null;
  publicEmail: string | null;
  status: ProspectStatus;
  slug: string;
  valid: boolean;
  duplicate: boolean;
  errors: string[];
  warnings: string[];
  mockupRichness: MockupRichness;
  mockupTemplate: MockupTemplateSelection;
  mockupV2: MockupV2Diagnostics;
  socialAuditRichness: SocialAuditRichness;
  apexDelivery: ApexImportSummary | null;
  resinateFlooring: ResinateImportSummary | null;
};

const STATUS_ALIASES: Record<string, ProspectStatus> = {
  new_prospect: 'new',
  email_sent: 'sent',
  follow_up_due: 'follow_up_1',
};

function db() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase env vars are not configured.');
  return client;
}

async function withSupabaseTimeout<T>(query: PromiseLike<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(query),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`${label} timed out after ${SUPABASE_QUERY_TIMEOUT_MS / 1000}s`)),
          SUPABASE_QUERY_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function clean(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanRequired(value: unknown) {
  return clean(value) ?? '';
}

function clampLeadScore(value: unknown, fallback: number) {
  const score = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function stringifyFeatureList(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(', ');
  return clean(value);
}

function cleanRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function normalizeWebsite(value: string | null | undefined) {
  const trimmed = clean(value);
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '').toLowerCase();
}

function normalizeEmail(value: string | null | undefined) {
  const sanitized = sanitizeEmailAddress(value);
  return sanitized.ok ? sanitized.value : null;
}

function normalizeEmailForInput(value: unknown) {
  const sanitized = sanitizeEmailAddress(value);
  return sanitized.ok ? sanitized.value : clean(value);
}

function inferResinateDeliveryMode(record: Record<string, unknown>, resinateRecord: Record<string, unknown>) {
  const explicit = clean(resinateRecord.resinate_delivery_mode);
  if (explicit) return explicit;
  const body = clean(record.email_body) || '';
  const hasInlineBrief = /\[inline flooring brief\]/i.test(body);
  const hasPublicBrief = /\[(flooring audit link|flooring brief link|commercial surface brief link)\]/i.test(body);
  if (hasInlineBrief && hasPublicBrief) return 'link_plus_summary';
  if (hasInlineBrief) return 'inline_brief';
  if (hasPublicBrief) return 'public_brief';
  return null;
}

function inferApexDeliveryMode(record: Record<string, unknown>) {
  const explicit = clean(record.apex_delivery_mode);
  if (explicit) return explicit;
  const body = clean(record.email_body) || '';
  const hasInlineBrief = /\[inline apex brief\]/i.test(body);
  const hasSocialAudit = /\[social audit link\]/i.test(body);
  const hasMockup = /\[mockup link\]/i.test(body);
  if (hasInlineBrief && (hasSocialAudit || hasMockup)) return 'link_plus_summary';
  if (hasSocialAudit && hasMockup) return 'link_plus_summary';
  if (hasInlineBrief) return 'inline_apex_brief';
  if (hasSocialAudit) return 'public_social_audit';
  if (hasMockup) return 'public_mockup';
  return null;
}

export function formatSupabaseError(action: string, error: SupabaseErrorLike) {
  const details = [
    error.message,
    error.code ? `code: ${error.code}` : null,
    error.details ? `details: ${error.details}` : null,
    error.hint ? `hint: ${error.hint}` : null,
  ].filter(Boolean);

  return `${action}: ${details.join(' | ') || 'Unknown Supabase error'}`;
}

export function slugifyBusinessName(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);

  return slug || 'prospect';
}

function coerceProspectStatus(value: string | null | undefined, fallback: ProspectStatus) {
  const normalized = clean(value)?.toLowerCase().replace(/\s+/g, '_');
  if (!normalized) return fallback;
  const alias = STATUS_ALIASES[normalized];
  if (alias) return alias;
  if ((PROSPECT_STATUSES as readonly string[]).includes(normalized)) return normalized as ProspectStatus;
  return fallback;
}

function hasAuditData(input: ProspectIntakeInput) {
  return Boolean(
    clean(input.main_problem) ||
      clean(input.conversion_opportunity) ||
      clean(input.recommended_offer) ||
      clean(input.mockup_angle) ||
      clean(input.audit_notes)
  );
}

function hasMockupData(input: ProspectIntakeInput) {
  return Boolean(
    clean(input.mockup_slug) ||
      clean(input.mockup_url) ||
      clean(input.hero_headline) ||
      clean(input.hero_subheadline) ||
      clean(input.primary_cta) ||
      stringifyFeatureList(input.features_included) ||
      clean(input.concept_notes) ||
      hasRichMockupData(input as Record<string, unknown>) ||
      Boolean(input.visual_profile) ||
      Boolean(input.media_assets?.length) ||
      Boolean(input.proof_assets?.length) ||
      Boolean(input.gallery_assets?.length) ||
      hasResinateFlooringData(input as Record<string, unknown>)
  );
}

function hasEmailData(input: ProspectIntakeInput) {
  return Boolean(clean(input.email_subject) && clean(input.email_body));
}

export function deriveHermesStatus(input: ProspectIntakeInput): ProspectStatus {
  if (normalizeEmail(input.public_email) && hasEmailData(input)) return 'email_ready';
  if (hasMockupData(input)) return 'mockup_ready';
  if (hasAuditData(input)) return 'audited';
  return 'qualified';
}

function validateBaseInput(input: ProspectIntakeInput, requireDestinationIdentity: boolean) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!clean(input.business_name)) errors.push('business_name is required.');
  if (!clean(input.niche)) errors.push('niche is required.');
  if (input.lead_score !== undefined && input.lead_score !== null) {
    const score = Number(input.lead_score);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      errors.push('lead_score must be a number between 0 and 100.');
    }
  }
  if (requireDestinationIdentity && !clean(input.website_url) && !clean(input.public_email)) {
    errors.push('website_url or public_email is required for duplicate detection.');
  }
  const publicEmail = clean(input.public_email);
  if (!publicEmail) {
    warnings.push('No public_email; this prospect will not be eligible for Telegram approval yet.');
  } else {
    const emailValidation = sanitizeEmailAddress(publicEmail);
    if (!emailValidation.ok) errors.push(`public_email is invalid: ${emailValidation.errorMessage}`);
  }

  return { errors, warnings };
}

async function getUniqueMockupSlug(baseSlug: string) {
  let candidate = baseSlug;
  let suffix = 2;

  while (suffix < 200) {
    const { data, error } = await withSupabaseTimeout(
      db().from('mockups').select('id').eq('slug', candidate).maybeSingle(),
      'Mockup slug uniqueness check'
    );

    if (error) throw new Error(formatSupabaseError('Check mockup slug', error));
    if (!data) return candidate;

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  throw new Error('Unable to generate a unique mockup slug.');
}

async function rollbackProspect(prospectId: string) {
  await db().from('prospects').delete().eq('id', prospectId);
}

export async function createProspectBundle(
  input: ProspectIntakeInput,
  options: {
    source: 'manual' | 'hermes_import';
    requireDestinationIdentity?: boolean;
    statusMode?: 'manual' | 'derive';
  }
): Promise<ProspectBundleResult> {
  if (getDataSource() !== 'supabase') {
    return { data: null, error: 'Cannot create prospects in seed mode. Configure Supabase first.' };
  }

  const baseValidation = validateBaseInput(input, options.requireDestinationIdentity ?? false);
  if (baseValidation.errors.length > 0) {
    return { data: null, error: baseValidation.errors.join(' ') };
  }

  const normalizedPublicEmail = normalizeEmail(input.public_email);
  const status =
    options.statusMode === 'derive'
      ? deriveHermesStatus(input)
      : coerceProspectStatus(input.status, 'qualified');
  const baseSlug = slugifyBusinessName(clean(input.mockup_slug) ?? `${cleanRequired(input.business_name)} mockup`);

  try {
    const slug = await getUniqueMockupSlug(baseSlug);
    const prospectInsert = {
      business_name: cleanRequired(input.business_name),
      niche: cleanRequired(input.niche),
      website_url: clean(input.website_url),
      public_email: normalizedPublicEmail,
      phone: clean(input.phone),
      city: clean(input.city) ?? '',
      state: clean(input.state) ?? 'CO',
      instagram_url: clean(input.instagram_url),
      facebook_url: clean(input.facebook_url),
      google_maps_url: clean(input.google_maps_url),
      lead_score: clampLeadScore(input.lead_score, options.source === 'manual' ? 70 : 0),
      status,
      source: options.source === 'manual' ? clean(input.source) ?? 'manual' : 'hermes_import',
      notes: clean(input.notes),
    };

    const { data: prospect, error: prospectError } = await withSupabaseTimeout(
      db().from('prospects').insert(prospectInsert).select().single(),
      'Create prospect'
    );

    if (prospectError || !prospect) {
      return {
        data: null,
        error: formatSupabaseError('Create prospect', prospectError ?? { message: 'No prospect row returned.' }),
      };
    }

    const auditInsert = {
      prospect_id: prospect.id,
      main_problem: clean(input.main_problem),
      conversion_opportunity: clean(input.conversion_opportunity),
      recommended_offer: clean(input.recommended_offer),
      mockup_angle: clean(input.mockup_angle),
      audit_notes: clean(input.audit_notes),
    };

    const { data: audit, error: auditError } = await withSupabaseTimeout(
      db().from('audits').insert(auditInsert).select('id').single(),
      'Create audit'
    );
    if (auditError || !audit) {
      await rollbackProspect(prospect.id);
      return {
        data: null,
        error: formatSupabaseError('Create audit', auditError ?? { message: 'No audit row returned.' }),
      };
    }

    const mockupInsert = {
      prospect_id: prospect.id,
      slug,
      title: `${prospect.business_name} Mockup`,
      mockup_url: clean(input.mockup_url),
      mockup_status: hasMockupData(input) ? 'ready' : 'draft',
      hero_headline: clean(input.hero_headline),
      hero_subheadline: clean(input.hero_subheadline),
      primary_cta: clean(input.primary_cta),
      features_included: stringifyFeatureList(input.features_included),
      concept_notes: encodeMockupConceptNotes(
        clean(input.concept_notes),
        normalizeRichMockupData(input as Record<string, unknown>),
        normalizeSocialAuditData(input as Record<string, unknown>),
        normalizeResinateFlooringData(input as Record<string, unknown>),
        normalizeApexDeliveryData(input as Record<string, unknown>, input.email_body)
      ),
    };

    const { data: mockup, error: mockupError } = await withSupabaseTimeout(
      db().from('mockups').insert(mockupInsert).select('id').single(),
      'Create mockup'
    );
    if (mockupError || !mockup) {
      await rollbackProspect(prospect.id);
      return {
        data: null,
        error: formatSupabaseError('Create mockup', mockupError ?? { message: 'No mockup row returned.' }),
      };
    }

    const emailInsert = {
      prospect_id: prospect.id,
      subject: clean(input.email_subject) ?? '',
      body: clean(input.email_body) ?? '',
      status: hasEmailData(input) ? 'ready' : 'draft',
    };

    const { data: emailDraft, error: emailError } = await withSupabaseTimeout(
      db().from('email_drafts').insert(emailInsert).select('id').single(),
      'Create email draft'
    );
    if (emailError || !emailDraft) {
      await rollbackProspect(prospect.id);
      return {
        data: null,
        error: formatSupabaseError('Create email draft', emailError ?? { message: 'No email draft row returned.' }),
      };
    }

    return {
      data: {
        prospect,
        auditId: audit.id,
        mockupId: mockup.id,
        emailDraftId: emailDraft.id,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown intake error',
    };
  }
}

export function normalizeHermesJsonRecord(value: unknown): ProspectIntakeInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const nestedResinate =
    cleanRecord(record.resinate_flooring_data) ||
    cleanRecord(record.resinateFlooringData) ||
    cleanRecord(record.resinate);
  const resinateRecord = nestedResinate ? { ...record, ...nestedResinate } : record;

  return {
    business_name: cleanRequired(record.business_name),
    niche: cleanRequired(record.niche),
    website_url: clean(record.website_url),
    public_email: normalizeEmailForInput(record.public_email),
    phone: clean(record.phone),
    city: clean(record.city),
    state: clean(record.state),
    instagram_url: clean(record.instagram_url),
    facebook_url: clean(record.facebook_url),
    google_maps_url: clean(record.google_maps_url),
    lead_score: typeof record.lead_score === 'number' || typeof record.lead_score === 'string' ? record.lead_score : null,
    main_problem: clean(record.main_problem),
    conversion_opportunity: clean(record.conversion_opportunity),
    recommended_offer: clean(record.recommended_offer),
    mockup_angle: clean(record.mockup_angle),
    audit_notes: clean(record.audit_notes),
    mockup_slug: clean(record.mockup_slug),
    mockup_url: clean(record.mockup_url),
    hero_headline: clean(record.hero_headline),
    hero_subheadline: clean(record.hero_subheadline),
    primary_cta: clean(record.primary_cta),
    features_included: Array.isArray(record.features_included)
      ? record.features_included.map((item) => String(item))
      : clean(record.features_included),
    concept_notes: clean(record.concept_notes),
    template_variant: clean(record.template_variant),
    design_family: clean(record.design_family),
    brand_style_notes: clean(record.brand_style_notes),
    visual_direction: clean(record.visual_direction),
    brand_tone: clean(record.brand_tone),
    layout_signature: clean(record.layout_signature),
    hero_mode: clean(record.hero_mode),
    design_style_key: clean(record.design_style_key),
    image_treatment: clean(record.image_treatment),
    cta_style: clean(record.cta_style),
    proof_style: clean(record.proof_style),
    palette_direction: clean(record.palette_direction),
    typography_direction: clean(record.typography_direction),
    photo_strategy: clean(record.photo_strategy),
    visual_profile: cleanRecord(record.visual_profile) as MockupVisualProfile | null,
    media_assets: Array.isArray(record.media_assets) ? (record.media_assets as MockupMediaAsset[]) : null,
    proof_assets: Array.isArray(record.proof_assets) ? (record.proof_assets as MockupMediaAsset[]) : null,
    gallery_assets: Array.isArray(record.gallery_assets) ? (record.gallery_assets as MockupMediaAsset[]) : null,
    primary_colors: Array.isArray(record.primary_colors)
      ? record.primary_colors.map((item) => String(item))
      : clean(record.primary_colors),
    secondary_colors: Array.isArray(record.secondary_colors)
      ? record.secondary_colors.map((item) => String(item))
      : clean(record.secondary_colors),
    menu_or_offer_items: Array.isArray(record.menu_or_offer_items)
      ? record.menu_or_offer_items.map((item) => String(item))
      : clean(record.menu_or_offer_items),
    trust_signals: Array.isArray(record.trust_signals)
      ? record.trust_signals.map((item) => String(item))
      : clean(record.trust_signals),
    website_issue_examples: Array.isArray(record.website_issue_examples)
      ? record.website_issue_examples.map((item) => String(item))
      : clean(record.website_issue_examples),
    cta_strategy: clean(record.cta_strategy),
    local_seo_angle: clean(record.local_seo_angle),
    content_strategy_angle: clean(record.content_strategy_angle),
    meta_ads_angle: clean(record.meta_ads_angle),
    original_site_notes: clean(record.original_site_notes),
    original_site_url: clean(record.original_site_url),
    inspiration_notes: clean(record.inspiration_notes),
    current_site_snapshot: clean(record.current_site_snapshot),
    online_presence_status: Array.isArray(record.online_presence_status)
      ? record.online_presence_status.map((item) => String(item))
      : clean(record.online_presence_status),
    section_priority: Array.isArray(record.section_priority)
      ? record.section_priority.map((item) => String(item))
      : clean(record.section_priority),
    proposed_site_nav: Array.isArray(record.proposed_site_nav)
      ? record.proposed_site_nav.map((item) => String(item))
      : clean(record.proposed_site_nav),
    homepage_sections: Array.isArray(record.homepage_sections)
      ? record.homepage_sections.map((item) => String(item))
      : clean(record.homepage_sections),
    social_audit: cleanRecord(record.social_audit) as SocialAuditScorecard | null,
    content_opportunity: clean(record.content_opportunity),
    content_plan: cleanRecord(record.content_plan) as SocialContentPlan | null,
    website_social_gap: clean(record.website_social_gap),
    first_email_angle: clean(record.first_email_angle),
    call_follow_up_angle: cleanRecord(record.call_follow_up_angle) as CallFollowUpAngle | null,
    apex_delivery_mode: inferApexDeliveryMode(record),
    first_impression_audit: cleanRecord(record.first_impression_audit) as FirstImpressionAudit | null,
    website_audit: cleanRecord(record.website_audit) as WebsiteAuditSnapshot | null,
    trigger_reason: clean(record.trigger_reason),
    personalized_observation: clean(record.personalized_observation),
    business_implication: clean(record.business_implication),
    proof_asset_type: clean(record.proof_asset_type),
    what_to_test_first: clean(record.what_to_test_first),
    follow_up_sequence: cleanRecord(record.follow_up_sequence) as ApexFollowUpSequence | null,
    measurement_hypothesis: clean(record.measurement_hypothesis),
    campaign_type: clean(resinateRecord.campaign_type),
    resinate_delivery_mode: inferResinateDeliveryMode(record, resinateRecord),
    buyer_type: clean(resinateRecord.buyer_type),
    property_type: clean(resinateRecord.property_type),
    portfolio_or_property_context: clean(resinateRecord.portfolio_or_property_context),
    likely_surface_problem: clean(resinateRecord.likely_surface_problem),
    likely_surface_areas: clean(resinateRecord.likely_surface_areas),
    traffic_needs: clean(resinateRecord.traffic_needs),
    cleaning_needs: clean(resinateRecord.cleaning_needs),
    downtime_needs: clean(resinateRecord.downtime_needs),
    moisture_needs: clean(resinateRecord.moisture_needs),
    slip_resistance_needs: clean(resinateRecord.slip_resistance_needs),
    recommended_flooring_system: clean(resinateRecord.recommended_flooring_system),
    system_reasoning: clean(resinateRecord.system_reasoning),
    best_resinate_offer: clean(resinateRecord.best_resinate_offer),
    facility_use_case: clean(resinateRecord.facility_use_case),
    decision_maker_path: clean(resinateRecord.decision_maker_path),
    procurement_path: clean(resinateRecord.procurement_path),
    likely_objection: clean(resinateRecord.likely_objection),
    objection_response: clean(resinateRecord.objection_response),
    next_sales_action: clean(resinateRecord.next_sales_action),
    walkthrough_offer: clean(resinateRecord.walkthrough_offer),
    vendor_packet_angle: clean(resinateRecord.vendor_packet_angle),
    prep_considerations: clean(resinateRecord.prep_considerations),
    moisture_considerations: clean(resinateRecord.moisture_considerations),
    polyaspartic_value: clean(resinateRecord.polyaspartic_value),
    surface_system_summary: clean(resinateRecord.surface_system_summary),
    email_subject: clean(record.email_subject),
    email_body: clean(record.email_body),
    notes: clean(record.notes),
  };
}

export async function previewHermesImport(records: ProspectIntakeInput[]) {
  const websiteMap = new Map<string, number[]>();
  const emailMap = new Map<string, number[]>();

  records.forEach((record, index) => {
    const website = normalizeWebsite(record.website_url);
    const email = normalizeEmail(record.public_email);
    if (website) websiteMap.set(website, [...(websiteMap.get(website) ?? []), index]);
    if (email) emailMap.set(email, [...(emailMap.get(email) ?? []), index]);
  });

  const duplicateIndexes = new Set<number>();
  for (const indexes of [...websiteMap.values(), ...emailMap.values()]) {
    if (indexes.length > 1) indexes.forEach((index) => duplicateIndexes.add(index));
  }

  if (getDataSource() === 'supabase') {
    const websiteValues = [...websiteMap.keys()];
    const emailValues = [...emailMap.keys()];

    if (websiteValues.length > 0) {
      const { data, error } = await withSupabaseTimeout(
        db().from('prospects').select('website_url').in('website_url', websiteValues),
        'Website duplicate lookup'
      );
      if (error) throw new Error(formatSupabaseError('Website duplicate lookup', error));
      for (const row of data ?? []) {
        const indexes = websiteMap.get(normalizeWebsite(row.website_url) ?? '');
        indexes?.forEach((index) => duplicateIndexes.add(index));
      }
    }

    if (emailValues.length > 0) {
      const { data, error } = await withSupabaseTimeout(
        db().from('prospects').select('public_email').in('public_email', emailValues),
        'Email duplicate lookup'
      );
      if (error) throw new Error(formatSupabaseError('Email duplicate lookup', error));
      for (const row of data ?? []) {
        const indexes = emailMap.get(normalizeEmail(row.public_email) ?? '');
        indexes?.forEach((index) => duplicateIndexes.add(index));
      }
    }
  }

  const previews = records.map<HermesImportPreview>((record, index) => {
    const validation = validateBaseInput(record, true);
    const duplicate = duplicateIndexes.has(index);
    const resinateFlooring = getResinateImportSummary(record as Record<string, unknown>, record.email_body);
    const apexDelivery = getApexImportSummary(record as Record<string, unknown>, record.email_body);
    const rich = normalizeRichMockupData(record as Record<string, unknown>);
    const mockupTemplate = getMockupTemplateSelection({
      businessName: record.business_name,
      niche: record.niche,
      campaignType: record.campaign_type,
      fields: rich as Record<string, unknown>,
      text: [record.main_problem, record.conversion_opportunity, record.recommended_offer, record.mockup_angle, record.audit_notes],
    });
    const mockupV2 = getMockupV2Diagnostics({
      rich,
      template: mockupTemplate,
      niche: record.niche,
      businessName: record.business_name,
      campaignType: record.campaign_type,
      apexDeliveryMode: apexDelivery?.deliveryMode,
      emailBody: record.email_body,
    });
    const resinateWarnings =
      resinateFlooring?.missingFields.map((field) => `Resinate missing ${field}.`) ?? [];
    return {
      index,
      input: record,
      businessName: cleanRequired(record.business_name),
      websiteUrl: normalizeWebsite(record.website_url),
      publicEmail: normalizeEmail(record.public_email),
      status: deriveHermesStatus(record),
      slug: slugifyBusinessName(clean(record.mockup_slug) ?? `${cleanRequired(record.business_name)} mockup`),
      valid: validation.errors.length === 0 && !duplicate,
      duplicate,
      errors: duplicate ? [...validation.errors, 'Duplicate website_url or public_email detected.'] : validation.errors,
      warnings: [...validation.warnings, ...resinateWarnings, ...mockupV2.warnings],
      mockupRichness: getMockupRichness(record as Record<string, unknown>, hasMockupData(record)),
      mockupTemplate,
      mockupV2,
      socialAuditRichness: getSocialAuditRichness(record as Record<string, unknown>),
      apexDelivery,
      resinateFlooring,
    };
  });

  const publicApexPreviews = previews.filter(
    (item) => item.apexDelivery?.deliveryMode === 'public_mockup' || item.apexDelivery?.deliveryMode === 'link_plus_summary'
  );
  const explicitLayoutSet = new Set(publicApexPreviews.map((item) => item.mockupV2.layoutSignature));
  if (publicApexPreviews.length > 1 && explicitLayoutSet.size === 1) {
    for (const item of publicApexPreviews) {
      item.warnings.push('All Apex public mockups in this paste use the same layout signature; vary layout_signature to avoid repeated section order.');
    }
  }
  const familyCounts = new Map<string, number>();
  for (const item of publicApexPreviews) {
    familyCounts.set(item.mockupV2.designFamily, (familyCounts.get(item.mockupV2.designFamily) ?? 0) + 1);
  }
  const topFamily = [...familyCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (publicApexPreviews.length > 1 && familyCounts.size === 1) {
    for (const item of publicApexPreviews) {
      item.warnings.push('All Apex public mockups in this paste use the same design family; vary design_family to prevent repeated art direction.');
    }
  } else if (topFamily && publicApexPreviews.length >= 5 && topFamily[1] / publicApexPreviews.length >= 0.6) {
    for (const item of publicApexPreviews) {
      if (item.mockupV2.designFamily === topFamily[0]) {
        item.warnings.push(`Design family "${item.mockupV2.designFamilyLabel}" is overused in this paste; rebalance design_family across the batch.`);
      }
    }
  }
  const rendererSet = new Set(publicApexPreviews.map((item) => item.mockupV2.layoutRendererName));
  if (publicApexPreviews.length > 1 && rendererSet.size === 1) {
    for (const item of publicApexPreviews) {
      item.warnings.push('All Apex public mockups in this paste use the same layout renderer; vary template_variant and layout_signature to avoid repeated hero/header structure.');
    }
  }

  return previews;
}
