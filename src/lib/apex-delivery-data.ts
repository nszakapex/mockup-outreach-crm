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

export type FirstImpressionAudit = {
  homepage_clarity?: string | null;
  offer_clarity?: string | null;
  primary_cta?: string | null;
  trust_signals?: string | null;
  video_or_photo_gap?: string | null;
  social_proof_gap?: string | null;
  mobile_first_impression?: string | null;
  lead_path_issue?: string | null;
  ad_readiness?: string | null;
  what_to_fix_first?: string | null;
};

export type WebsiteAuditSnapshot = {
  website_status?: string | null;
  primary_conversion_issue?: string | null;
  mobile_or_cta_issue?: string | null;
  service_page_issue?: string | null;
  proof_or_gallery_issue?: string | null;
  website_social_connection_issue?: string | null;
  recommended_website_fix?: string | null;
};

export type ApexFollowUpSequence = {
  touch_1_observation_email?: string | null;
  touch_2_custom_video_or_mockup?: string | null;
  touch_3_social_touch?: string | null;
  touch_4_proof_followup?: string | null;
  touch_5_permission_breakup?: string | null;
  call_walkthrough_angle?: string | null;
  starter_package_recommendation?: string | null;
};

export type ApexDeliveryData = {
  campaign_type?: string | null;
  apex_delivery_mode?: ApexDeliveryMode | null;
  artifact_delivery_mode?: ApexDeliveryMode | null;
  public_social_audit_required?: boolean | null;
  public_mockup_required?: boolean | null;
  first_impression_audit?: FirstImpressionAudit;
  website_audit?: WebsiteAuditSnapshot;
  trigger_reason?: string | null;
  personalized_observation?: string | null;
  business_implication?: string | null;
  proof_asset_type?: string | null;
  what_to_test_first?: string | null;
  measurement_hypothesis?: string | null;
  follow_up_sequence?: ApexFollowUpSequence;
};

export type FirstImpressionRichnessLevel = 'rich' | 'basic' | 'missing';

export type FirstImpressionRichness = {
  level: FirstImpressionRichnessLevel;
  label: string;
  signalCount: number;
};

export type ApexEmailStructure = {
  level: 'strong' | 'needs_review';
  label: string;
  missing: string[];
};

export type ApexImportSummary = {
  deliveryMode: ApexDeliveryMode;
  publicArtifactRequired: boolean;
  publicSocialAuditRequired: boolean;
  publicMockupRequired: boolean;
  contentDataPresent: boolean;
  inlineBriefPlaceholderPresent: boolean;
  firstImpressionData: FirstImpressionRichness;
  proofAsset: string;
  emailStructure: ApexEmailStructure;
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
  apex?: ApexDeliveryData | null;
};

const FIRST_IMPRESSION_AUDIT_FIELDS = [
  'homepage_clarity',
  'offer_clarity',
  'primary_cta',
  'trust_signals',
  'video_or_photo_gap',
  'social_proof_gap',
  'mobile_first_impression',
  'lead_path_issue',
  'ad_readiness',
  'what_to_fix_first',
] as const;

const WEBSITE_AUDIT_FIELDS = [
  'website_status',
  'primary_conversion_issue',
  'mobile_or_cta_issue',
  'service_page_issue',
  'proof_or_gallery_issue',
  'website_social_connection_issue',
  'recommended_website_fix',
] as const;

const FOLLOW_UP_SEQUENCE_FIELDS = [
  'touch_1_observation_email',
  'touch_2_custom_video_or_mockup',
  'touch_3_social_touch',
  'touch_4_proof_followup',
  'touch_5_permission_breakup',
  'call_walkthrough_angle',
  'starter_package_recommendation',
] as const;

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
  const campaignType = cleanString(source.campaign_type);
  if (campaignType && campaignType !== 'resinate_flooring') data.campaign_type = campaignType;

  if (deliveryMode) {
    data.apex_delivery_mode = deliveryMode;
    data.artifact_delivery_mode = deliveryMode;
    data.public_social_audit_required = getApexPublicSocialAuditRequired(data, emailBody);
    data.public_mockup_required = getApexPublicMockupRequired(data, emailBody);
  }

  const firstImpressionAudit = normalizeFirstImpressionAudit(asRecord(source.first_impression_audit));
  if (hasFirstImpressionAuditData(firstImpressionAudit)) data.first_impression_audit = firstImpressionAudit;

  const websiteAudit = normalizeWebsiteAudit(asRecord(source.website_audit));
  if (hasWebsiteAuditData(websiteAudit)) data.website_audit = websiteAudit;

  const triggerReason = cleanString(source.trigger_reason);
  if (triggerReason) data.trigger_reason = triggerReason;

  const personalizedObservation = cleanString(source.personalized_observation);
  if (personalizedObservation) data.personalized_observation = personalizedObservation;

  const businessImplication = cleanString(source.business_implication);
  if (businessImplication) data.business_implication = businessImplication;

  const proofAssetType = cleanString(source.proof_asset_type);
  if (proofAssetType) data.proof_asset_type = proofAssetType;

  const whatToTestFirst = cleanString(source.what_to_test_first);
  if (whatToTestFirst) data.what_to_test_first = whatToTestFirst;

  const measurementHypothesis = cleanString(source.measurement_hypothesis);
  if (measurementHypothesis) data.measurement_hypothesis = measurementHypothesis;

  const followUpSequence = normalizeFollowUpSequence(asRecord(source.follow_up_sequence));
  if (hasFollowUpSequenceData(followUpSequence)) data.follow_up_sequence = followUpSequence;

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
  return Boolean(
    data?.apex_delivery_mode ||
      data?.artifact_delivery_mode ||
      data?.campaign_type ||
      getFirstImpressionSignalCount(data) > 0 ||
      hasFollowUpSequenceData(data?.follow_up_sequence)
  );
}

export function getApexImportSummary(
  input: Record<string, unknown>,
  emailBody?: string | null
): ApexImportSummary | null {
  const data = normalizeApexDeliveryData(input, emailBody);
  const campaignType = cleanString(input.campaign_type)?.toLowerCase();
  const hasApexSignal =
    hasNormalizedApexDeliveryData(data) ||
    containsInlineApexBriefReference(emailBody) ||
    campaignType === 'apex_social_content' ||
    hasApexContentDirection(input);
  if (!hasApexSignal || campaignType === 'resinate_flooring') return null;

  const deliveryMode = getApexDeliveryMode(data, emailBody);
  return {
    deliveryMode,
    publicArtifactRequired: getApexPublicArtifactRequired(data, emailBody),
    publicSocialAuditRequired: getApexPublicSocialAuditRequired(data, emailBody),
    publicMockupRequired: getApexPublicMockupRequired(data, emailBody),
    contentDataPresent: hasApexContentDirection(input),
    inlineBriefPlaceholderPresent: containsInlineApexBriefReference(emailBody),
    firstImpressionData: getFirstImpressionRichness(input),
    proofAsset: getProofAssetLabel(deliveryMode, emailBody),
    emailStructure: getApexEmailStructure(input, emailBody),
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

export function getFirstImpressionRichness(input: Record<string, unknown> | null | undefined): FirstImpressionRichness {
  const data = normalizeApexDeliveryData(input);
  const signalCount = getFirstImpressionSignalCount(data);

  if (signalCount >= 4) {
    return { level: 'rich', label: 'Rich First Impression Data', signalCount };
  }

  if (signalCount > 0 || hasApexContentDirectionFallback(input)) {
    return { level: 'basic', label: 'Basic First Impression Data', signalCount };
  }

  return { level: 'missing', label: 'Missing First Impression Data', signalCount };
}

export function getFirstImpressionSignalCount(data: ApexDeliveryData | null | undefined) {
  if (!data) return 0;
  let count = 0;
  if (hasFirstImpressionAuditData(data.first_impression_audit)) count += Object.values(data.first_impression_audit || {}).filter(Boolean).length;
  if (hasWebsiteAuditData(data.website_audit)) count += Math.min(3, Object.values(data.website_audit || {}).filter(Boolean).length);
  if (data.trigger_reason) count += 1;
  if (data.personalized_observation) count += 1;
  if (data.business_implication) count += 1;
  if (data.proof_asset_type) count += 1;
  if (data.what_to_test_first) count += 1;
  if (data.measurement_hypothesis) count += 1;
  return count;
}

export function getProofAssetLabel(mode: ApexDeliveryMode | null | undefined, emailBody?: string | null) {
  if (containsInlineApexBriefReference(emailBody) || mode === 'inline_apex_brief') return 'Inline Brief';
  if (containsSocialAuditReference(emailBody) || mode === 'public_social_audit') return 'Social Audit';
  if (containsMockupReference(emailBody) || mode === 'public_mockup') return 'Mockup';
  if (mode === 'link_plus_summary') return 'Inline Brief';
  return 'None';
}

export function getApexEmailStructure(
  input: Record<string, unknown> | null | undefined,
  emailBody?: string | null
): ApexEmailStructure {
  const body = cleanString(emailBody) || '';
  const lower = body.toLowerCase();
  const data = normalizeApexDeliveryData(input, emailBody);
  const missing: string[] = [];

  if (!hasSpecificObservation(input, lower, data)) missing.push('specific observation');
  if (!hasBusinessImplication(input, lower, data)) missing.push('business implication');
  if (!hasProofAsset(body)) missing.push('proof asset');
  if (!hasSoftAsk(lower)) missing.push('soft ask');
  if (countWords(body) > 150) missing.push('under 150 words');

  return {
    level: missing.length === 0 ? 'strong' : 'needs_review',
    label: missing.length === 0 ? 'Strong' : 'Needs Review',
    missing,
  };
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
  const firstImpressionAudit = asRecord(input?.first_impression_audit);
  const websiteAudit = asRecord(input?.website_audit);
  const followUpSequence = asRecord(input?.follow_up_sequence);
  return Boolean(
    getFirstImpressionSignalCount(normalizeApexDeliveryData(input)) > 0 ||
      cleanString(input?.content_opportunity) ||
      cleanString(input?.meta_ads_angle) ||
      cleanString(input?.website_social_gap) ||
      cleanString(input?.first_email_angle) ||
      cleanString(input?.content_strategy_angle) ||
      cleanString(input?.trigger_reason) ||
      cleanString(input?.personalized_observation) ||
      cleanString(input?.business_implication) ||
      cleanString(input?.proof_asset_type) ||
      cleanString(input?.what_to_test_first) ||
      cleanString(input?.measurement_hypothesis) ||
      cleanString(input?.main_problem) ||
      cleanString(input?.conversion_opportunity) ||
      cleanString(input?.recommended_offer) ||
      cleanString(input?.notes) ||
      FIRST_IMPRESSION_AUDIT_FIELDS.some((field) => cleanString(firstImpressionAudit?.[field])) ||
      WEBSITE_AUDIT_FIELDS.some((field) => cleanString(websiteAudit?.[field])) ||
      FOLLOW_UP_SEQUENCE_FIELDS.some((field) => cleanString(followUpSequence?.[field])) ||
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
  const apex = source.apex || {};
  const firstImpression = apex.first_impression_audit || {};
  const websiteAudit = apex.website_audit || {};
  const socialAudit = social.social_audit || {};
  const niche = prospect.niche || '';

  const trustLeak = shortenPhrase(
    firstUsefulValue(
      firstImpression.video_or_photo_gap,
      firstImpression.social_proof_gap,
      firstImpression.mobile_first_impression,
      firstImpression.trust_signals,
      websiteAudit.proof_or_gallery_issue,
      websiteAudit.website_status,
      apex.personalized_observation,
      social.website_social_gap,
      audit.main_problem,
      socialAudit.why_underperforming?.[0],
      socialAudit.content_quality,
      socialAudit.posting_consistency,
      prospect.notes,
      deriveMainGap(niche)
    ),
    16
  );

  const leadPath = shortenPhrase(
    firstUsefulValue(
      firstImpression.lead_path_issue,
      firstImpression.primary_cta,
      websiteAudit.primary_conversion_issue,
      websiteAudit.mobile_or_cta_issue,
      apex.business_implication,
      audit.conversion_opportunity,
      deriveLeadPath(niche)
    ),
    15
  );

  const proofAsset = shortenPhrase(
    firstUsefulValue(
      apex.proof_asset_type,
      social.content_opportunity,
      rich.content_strategy_angle,
      audit.recommended_offer,
      deriveProofAsset(niche)
    ),
    14
  );

  const metaAdsAngle = shortenPhrase(
    firstUsefulValue(
      social.meta_ads_angle,
      rich.meta_ads_angle,
      firstImpression.ad_readiness,
      `Retarget nearby ${deriveAudience(niche)} with the strongest proof asset.`
    ),
    14
  );

  const firstStep = shortenPhrase(
    firstUsefulValue(
      apex.what_to_test_first,
      firstImpression.what_to_fix_first,
      websiteAudit.recommended_website_fix,
      social.first_email_angle,
      deriveFirstTest(niche)
    ),
    12
  );

  return [
    'First impression direction:',
    `\u2022 Trust leak: ${trustLeak}`,
    `\u2022 Lead path: ${leadPath}`,
    `\u2022 Proof asset: ${proofAsset}`,
    `\u2022 Meta angle: ${metaAdsAngle}`,
    `\u2022 What I would test first: ${firstStep}`,
  ].join('\n');
}

function deriveMainGap(niche: string) {
  if (isServiceNiche(niche)) return 'Service proof is not connected clearly to quote or booking actions.';
  if (isFoodNiche(niche)) return 'Content does not consistently show what to order, visit, or book this week.';
  if (isFitnessOrWellnessNiche(niche)) return 'Class, service, or transformation content needs a clearer booking path.';
  return 'Website and social content need a clearer path from proof to inquiry.';
}

function deriveProofAsset(niche: string) {
  if (isServiceNiche(niche)) return 'Weekly before-and-after or process reels tied to quote requests.';
  if (isFoodNiche(niche)) return 'Weekly featured item, visit prompt, and special/event content.';
  if (isFitnessOrWellnessNiche(niche)) return 'Weekly service education, staff expertise, and booking prompts.';
  return 'Weekly proof content tied to a simple call, booking, or inquiry path.';
}

function deriveLeadPath(niche: string) {
  if (isServiceNiche(niche)) return 'Proof should make the quote, booking, or estimate request obvious.';
  if (isFoodNiche(niche)) return 'Menu, visit, order, or reservation actions should be clear before scrolling.';
  if (isFitnessOrWellnessNiche(niche)) return 'Service proof should point to booking, consultation, or intro-offer action.';
  return 'The next step from proof to inquiry should be easier to see.';
}

function deriveFirstTest(niche: string) {
  if (isServiceNiche(niche)) return 'One proof clip tied to the quote path.';
  if (isFoodNiche(niche)) return 'One featured offer tied to the visit or order path.';
  if (isFitnessOrWellnessNiche(niche)) return 'One proof or education clip tied to booking.';
  return 'One proof asset tied to the clearest lead path.';
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

function normalizeFirstImpressionAudit(record: Record<string, unknown> | null): FirstImpressionAudit {
  const audit: FirstImpressionAudit = {};
  if (!record) return audit;

  for (const field of FIRST_IMPRESSION_AUDIT_FIELDS) {
    const value = cleanString(record[field]);
    if (value) audit[field] = value;
  }

  return audit;
}

function normalizeWebsiteAudit(record: Record<string, unknown> | null): WebsiteAuditSnapshot {
  const audit: WebsiteAuditSnapshot = {};
  if (!record) return audit;

  for (const field of WEBSITE_AUDIT_FIELDS) {
    const value = cleanString(record[field]);
    if (value) audit[field] = value;
  }

  return audit;
}

function normalizeFollowUpSequence(record: Record<string, unknown> | null): ApexFollowUpSequence {
  const sequence: ApexFollowUpSequence = {};
  if (!record) return sequence;

  for (const field of FOLLOW_UP_SEQUENCE_FIELDS) {
    const value = cleanString(record[field]);
    if (value) sequence[field] = value;
  }

  return sequence;
}

function hasFirstImpressionAuditData(audit: FirstImpressionAudit | null | undefined) {
  return Boolean(audit && FIRST_IMPRESSION_AUDIT_FIELDS.some((field) => audit[field]));
}

function hasWebsiteAuditData(audit: WebsiteAuditSnapshot | null | undefined) {
  return Boolean(audit && WEBSITE_AUDIT_FIELDS.some((field) => audit[field]));
}

function hasFollowUpSequenceData(sequence: ApexFollowUpSequence | null | undefined) {
  return Boolean(sequence && FOLLOW_UP_SEQUENCE_FIELDS.some((field) => sequence[field]));
}

function hasApexContentDirectionFallback(input: Record<string, unknown> | null | undefined) {
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
      cleanString(input?.audit_notes) ||
      cleanString(input?.notes) ||
      cleanString(socialAudit?.content_quality) ||
      cleanString(socialAudit?.posting_consistency) ||
      cleanString(socialAudit?.reels_video_usage) ||
      cleanList(socialAudit?.why_underperforming).length > 0 ||
      cleanString(contentPlan?.week_1)
  );
}

function hasSpecificObservation(input: Record<string, unknown> | null | undefined, lowerBody: string, data: ApexDeliveryData) {
  return Boolean(
    data.personalized_observation ||
      data.trigger_reason ||
      data.first_impression_audit?.homepage_clarity ||
      data.first_impression_audit?.video_or_photo_gap ||
      data.first_impression_audit?.social_proof_gap ||
      data.website_audit?.website_status ||
      data.website_audit?.proof_or_gallery_issue ||
      cleanString(input?.main_problem) ||
      /\b(i was looking|i noticed|noticed|saw|your website|your instagram|your facebook|your social|your site)\b/i.test(lowerBody)
  );
}

function hasBusinessImplication(input: Record<string, unknown> | null | undefined, lowerBody: string, data: ApexDeliveryData) {
  return Boolean(
    data.business_implication ||
      data.first_impression_audit?.lead_path_issue ||
      data.website_audit?.primary_conversion_issue ||
      cleanString(input?.conversion_opportunity) ||
      /(first impression|trust|proof|lead path|quote path|booking path|order path|visit path|inquiry path|estimate|book|call|reach out|request)/i.test(lowerBody)
  );
}

function hasProofAsset(body: string) {
  return (
    containsInlineApexBriefReference(body) ||
    containsSocialAuditReference(body) ||
    containsMockupReference(body)
  );
}

function hasSoftAsk(lowerBody: string) {
  return /(would you be open|would it be worth|would it make sense|quick walkthrough|quick call|worth a quick|open to a quick|right person)/i.test(lowerBody);
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
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
