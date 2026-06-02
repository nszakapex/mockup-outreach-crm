import type { RichMockupData } from './mockup-rich-data';
import type { Audit, Prospect } from './types';
import type { SocialAuditData } from './social-audit-data';

export const APEX_DELIVERY_MODES = [
  'public_social_audit',
  'public_mockup',
  'link_plus_summary',
  'inline_apex_brief',
] as const;

export type ApexDeliveryMode = (typeof APEX_DELIVERY_MODES)[number];

export type ApexDeliveryData = {
  apex_delivery_mode?: ApexDeliveryMode | null;
  artifact_delivery_mode?: ApexDeliveryMode | null;
  public_social_audit_required?: boolean | null;
  public_mockup_required?: boolean | null;
};

export type ApexImportSummary = {
  deliveryMode: ApexDeliveryMode;
  publicArtifactRequired: boolean;
  publicSocialAuditRequired: boolean;
  publicMockupRequired: boolean;
  contentDataPresent: boolean;
  inlineBriefPlaceholderPresent: boolean;
};

type StoredConceptNotes = {
  apex_delivery_data?: unknown;
  apexDeliveryData?: unknown;
};

export type ApexBriefSource = {
  prospect?: Partial<Pick<Prospect, 'business_name' | 'niche' | 'city' | 'notes'>> | null;
  audit?: Partial<Pick<Audit, 'main_problem' | 'conversion_opportunity' | 'recommended_offer' | 'audit_notes'>> | null;
  rich?: RichMockupData | null;
  social?: SocialAuditData | null;
};

export function normalizeApexDeliveryData(
  input: Record<string, unknown> | null | undefined,
  emailBody?: string | null
): ApexDeliveryData {
  const source = mergeNestedApexSource(input);
  const deliveryMode =
    normalizeApexDeliveryMode(source.apex_delivery_mode) ||
    normalizeApexDeliveryMode(source.artifact_delivery_mode) ||
    inferApexDeliveryMode(emailBody);

  const data: ApexDeliveryData = {};
  if (deliveryMode) {
    data.apex_delivery_mode = deliveryMode;
    data.artifact_delivery_mode = deliveryMode;
    data.public_social_audit_required = getApexPublicSocialAuditRequired(data, emailBody);
    data.public_mockup_required = getApexPublicMockupRequired(data, emailBody);
  }

  return data;
}

export function parseApexDeliveryConceptNotes(conceptNotes: string | null | undefined): ApexDeliveryData {
  const raw = cleanString(conceptNotes);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as StoredConceptNotes & Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const stored = parsed.apex_delivery_data || parsed.apexDeliveryData;
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      return normalizeApexDeliveryData(stored as Record<string, unknown>);
    }

    return normalizeApexDeliveryData(parsed);
  } catch {
    return {};
  }
}

export function hasNormalizedApexDeliveryData(data: ApexDeliveryData | null | undefined) {
  return Boolean(data?.apex_delivery_mode || data?.artifact_delivery_mode);
}

export function getApexImportSummary(
  input: Record<string, unknown>,
  emailBody?: string | null
): ApexImportSummary | null {
  const data = normalizeApexDeliveryData(input, emailBody);
  if (!hasNormalizedApexDeliveryData(data)) return null;

  return {
    deliveryMode: getApexDeliveryMode(data, emailBody),
    publicArtifactRequired: getApexPublicArtifactRequired(data, emailBody),
    publicSocialAuditRequired: getApexPublicSocialAuditRequired(data, emailBody),
    publicMockupRequired: getApexPublicMockupRequired(data, emailBody),
    contentDataPresent: hasApexContentDirection(input),
    inlineBriefPlaceholderPresent: containsInlineApexBriefReference(emailBody),
  };
}

export function normalizeApexDeliveryMode(value: unknown): ApexDeliveryMode | null {
  const normalized = cleanString(value)?.toLowerCase();
  if (!normalized) return null;
  return (APEX_DELIVERY_MODES as readonly string[]).includes(normalized)
    ? (normalized as ApexDeliveryMode)
    : null;
}

export function inferApexDeliveryMode(emailBody?: string | null): ApexDeliveryMode | null {
  const hasInlineBrief = containsInlineApexBriefReference(emailBody);
  const hasSocialAudit = containsSocialAuditReference(emailBody);
  const hasMockup = containsMockupReference(emailBody);

  if (hasInlineBrief && (hasSocialAudit || hasMockup)) return 'link_plus_summary';
  if (hasSocialAudit && hasMockup) return 'link_plus_summary';
  if (hasInlineBrief) return 'inline_apex_brief';
  if (hasSocialAudit) return 'public_social_audit';
  if (hasMockup) return 'public_mockup';
  return null;
}

export function getApexDeliveryMode(
  data: ApexDeliveryData | null | undefined,
  emailBody?: string | null
): ApexDeliveryMode {
  return inferApexDeliveryMode(emailBody) || data?.apex_delivery_mode || data?.artifact_delivery_mode || 'public_mockup';
}

export function getApexDeliveryModeLabel(mode: ApexDeliveryMode | null | undefined) {
  switch (mode) {
    case 'inline_apex_brief':
      return 'Inline Apex Brief';
    case 'link_plus_summary':
      return 'Link plus summary';
    case 'public_social_audit':
      return 'Public social audit';
    case 'public_mockup':
    default:
      return 'Public mockup';
  }
}

export function getApexPublicSocialAuditRequired(
  data: ApexDeliveryData | null | undefined,
  emailBody?: string | null
) {
  const mode = getApexDeliveryMode(data, emailBody);
  if (typeof data?.public_social_audit_required === 'boolean') return data.public_social_audit_required;
  return mode === 'public_social_audit' || mode === 'link_plus_summary';
}

export function getApexPublicMockupRequired(
  data: ApexDeliveryData | null | undefined,
  emailBody?: string | null
) {
  const mode = getApexDeliveryMode(data, emailBody);
  if (typeof data?.public_mockup_required === 'boolean') return data.public_mockup_required;
  return mode === 'public_mockup' || mode === 'link_plus_summary';
}

export function getApexPublicArtifactRequired(
  data: ApexDeliveryData | null | undefined,
  emailBody?: string | null
) {
  return getApexPublicSocialAuditRequired(data, emailBody) || getApexPublicMockupRequired(data, emailBody);
}

export function containsInlineApexBriefReference(body: string | null | undefined) {
  return /\[inline apex brief\]/i.test(cleanString(body) || '');
}

export function containsSocialAuditReference(body: string | null | undefined) {
  const value = cleanString(body) || '';
  return /\[social audit link\]/i.test(value) || /\/social-audits\//i.test(value);
}

export function containsMockupReference(body: string | null | undefined) {
  const value = cleanString(body) || '';
  return /\[mockup link\]/i.test(value) || /\/mockups\//i.test(value);
}

export function hasApexContentDirection(input: Record<string, unknown> | null | undefined) {
  const socialAudit = asRecord(input?.social_audit);
  const contentPlan = asRecord(input?.content_plan);
  return Boolean(
    cleanString(input?.content_opportunity) ||
      cleanString(input?.meta_ads_angle) ||
      cleanString(input?.website_social_gap) ||
      cleanString(input?.first_email_angle) ||
      cleanString(input?.content_strategy_angle) ||
      cleanString(input?.main_problem) ||
      cleanString(input?.conversion_opportunity) ||
      cleanString(input?.recommended_offer) ||
      cleanString(input?.notes) ||
      cleanString(socialAudit?.content_quality) ||
      cleanString(socialAudit?.posting_consistency) ||
      cleanString(socialAudit?.reels_video_usage) ||
      cleanList(socialAudit?.why_underperforming).length > 0 ||
      cleanString(contentPlan?.week_1) ||
      cleanString(contentPlan?.recommended_posting_cadence) ||
      cleanString(contentPlan?.recommended_reels_per_week) ||
      cleanString(contentPlan?.shoot_frequency)
  );
}

export function buildInlineApexBrief(source: ApexBriefSource) {
  const prospect = source.prospect || {};
  const audit = source.audit || {};
  const rich = source.rich || {};
  const social = source.social || {};
  const socialAudit = social.social_audit || {};
  const contentPlan = social.content_plan || {};
  const niche = prospect.niche || '';

  const mainGap = shortenPhrase(
    firstUsefulValue(
      social.website_social_gap,
      audit.main_problem,
      socialAudit.why_underperforming?.[0],
      socialAudit.content_quality,
      socialAudit.posting_consistency,
      prospect.notes,
      deriveMainGap(niche)
    ),
    18
  );
  const contentAngle = shortenPhrase(
    firstUsefulValue(
      social.content_opportunity,
      rich.content_strategy_angle,
      contentPlan.week_1,
      audit.recommended_offer,
      deriveContentAngle(niche)
    ),
    16
  );
  const weeklySystem = shortenPhrase(
    buildWeeklySystem(contentPlan.recommended_posting_cadence, contentPlan.recommended_reels_per_week, contentPlan.shoot_frequency),
    18
  );
  const metaAdsAngle = shortenPhrase(
    firstUsefulValue(
      social.meta_ads_angle,
      rich.meta_ads_angle,
      `Boost the strongest local proof content to nearby ${deriveAudience(niche)}.`
    ),
    16
  );
  const businessGoal = shortenPhrase(
    firstUsefulValue(
      audit.conversion_opportunity,
      audit.recommended_offer,
      deriveBusinessGoal(niche)
    ),
    14
  );
  const firstStep = shortenPhrase(
    firstUsefulValue(
      social.first_email_angle,
      'Quick walkthrough or first content shoot.'
    ),
    10
  );

  return [
    'Content + ads direction:',
    `\u2022 Main gap: ${mainGap}`,
    `\u2022 Content angle: ${contentAngle}`,
    `\u2022 Weekly system: ${weeklySystem}`,
    `\u2022 Meta ads angle: ${metaAdsAngle}`,
    `\u2022 Business goal: ${businessGoal}`,
    `\u2022 First step: ${firstStep}`,
  ].join('\n');
}

function buildWeeklySystem(cadence?: string | null, reels?: string | null, shoot?: string | null) {
  const parts = [shoot, reels ? `${reels} reels per week` : null, cadence].filter(Boolean);
  return parts.length > 0
    ? parts.join(', ')
    : 'One short weekly shoot, 2 reels, and 2-4 supporting posts/stories.';
}

function deriveMainGap(niche: string) {
  if (isServiceNiche(niche)) return 'Service proof is not connected clearly to quote or booking actions.';
  if (isFoodNiche(niche)) return 'Content does not consistently show what to order, visit, or book this week.';
  if (isFitnessOrWellnessNiche(niche)) return 'Class, service, or transformation content needs a clearer booking path.';
  return 'Website and social content need a clearer path from proof to inquiry.';
}

function deriveContentAngle(niche: string) {
  if (isServiceNiche(niche)) return 'Weekly before-and-after or process reels tied to quote requests.';
  if (isFoodNiche(niche)) return 'Weekly featured item, visit prompt, and special/event content.';
  if (isFitnessOrWellnessNiche(niche)) return 'Weekly service education, staff expertise, and booking prompts.';
  return 'Weekly proof content tied to a simple call, booking, or inquiry path.';
}

function deriveBusinessGoal(niche: string) {
  if (isServiceNiche(niche)) return 'More calls, quote requests, bookings, or local inquiries.';
  if (isFoodNiche(niche)) return 'More visits, orders, reservations, catering inquiries, or event turnout.';
  if (isFitnessOrWellnessNiche(niche)) return 'More consultations, appointments, intro offers, or class bookings.';
  return 'More visits, bookings, calls, orders, quote requests, or inquiries.';
}

function deriveAudience(niche: string) {
  if (isServiceNiche(niche)) return 'homeowners or service buyers';
  if (isFoodNiche(niche)) return 'customers';
  if (isFitnessOrWellnessNiche(niche)) return 'appointment or class prospects';
  return 'prospects';
}

function isServiceNiche(niche: string) {
  return /detail|contractor|clean|landscap|roof|paint|hvac|plumb|electric|repair|service|floor|garage|lawn|tree/i.test(niche);
}

function isFoodNiche(niche: string) {
  return /restaurant|cafe|coffee|bar|grill|food|bakery|catering|truck|dining|pub/i.test(niche);
}

function isFitnessOrWellnessNiche(niche: string) {
  return /gym|fitness|yoga|pilates|spa|salon|barber|wellness|med spa|trainer/i.test(niche);
}

function mergeNestedApexSource(input: Record<string, unknown> | null | undefined) {
  const base = input || {};
  const nested =
    asRecord(base.apex_delivery_data) ||
    asRecord(base.apexDeliveryData) ||
    asRecord(base.apex);

  return nested ? { ...base, ...nested } : base;
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function cleanString(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function cleanList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanString(item))
      .filter((item): item is string => Boolean(item))
      .slice(0, 12);
  }

  const asString = cleanString(value);
  if (!asString) return [];

  return asString
    .split(/[\n;|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function firstUsefulValue(...values: Array<string | null | undefined>) {
  return values.map((value) => cleanString(value)).find((value): value is string => Boolean(value)) || '';
}

function shortenPhrase(value: string, maxWords: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return value.trim();
  return `${words.slice(0, maxWords).join(' ').replace(/[.,;:!?]+$/g, '')}.`;
}
