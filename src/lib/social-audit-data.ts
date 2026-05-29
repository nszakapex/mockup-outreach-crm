export type SocialAuditScorecard = {
  instagram_status?: string | null;
  facebook_status?: string | null;
  posting_consistency?: string | null;
  content_quality?: string | null;
  reels_video_usage?: string | null;
  engagement_quality?: string | null;
  cta_usage?: string | null;
  visual_branding?: string | null;
  overall_social_score?: number | null;
  why_underperforming?: string[];
};

export type SocialContentPlan = {
  week_1?: string | null;
  week_2?: string | null;
  week_3?: string | null;
  week_4?: string | null;
  recommended_posting_cadence?: string | null;
  recommended_reels_per_week?: string | null;
  shoot_frequency?: string | null;
  priority_content_themes?: string[];
};

export type CallFollowUpAngle = {
  opening_line?: string | null;
  strongest_observation?: string | null;
  first_question?: string | null;
  likely_objection?: string | null;
  objection_response?: string | null;
  goal_of_call?: string | null;
};

export type SocialAuditData = {
  social_audit?: SocialAuditScorecard;
  content_opportunity?: string | null;
  content_plan?: SocialContentPlan;
  meta_ads_angle?: string | null;
  website_social_gap?: string | null;
  first_email_angle?: string | null;
  call_follow_up_angle?: CallFollowUpAngle;
};

export type SocialAuditRichnessLevel = 'rich' | 'basic' | 'missing';

export type SocialAuditRichness = {
  level: SocialAuditRichnessLevel;
  label: string;
  signalCount: number;
};

const SCORECARD_TEXT_FIELDS = [
  'instagram_status',
  'facebook_status',
  'posting_consistency',
  'content_quality',
  'reels_video_usage',
  'engagement_quality',
  'cta_usage',
  'visual_branding',
] as const;

const CONTENT_PLAN_TEXT_FIELDS = [
  'week_1',
  'week_2',
  'week_3',
  'week_4',
  'recommended_posting_cadence',
  'recommended_reels_per_week',
  'shoot_frequency',
] as const;

const CALL_FOLLOW_UP_TEXT_FIELDS = [
  'opening_line',
  'strongest_observation',
  'first_question',
  'likely_objection',
  'objection_response',
  'goal_of_call',
] as const;

type StoredConceptNotes = {
  social_audit_data?: unknown;
  socialAuditData?: unknown;
};

export function normalizeSocialAuditData(input: Record<string, unknown> | null | undefined): SocialAuditData {
  const data: SocialAuditData = {};
  const socialAudit = normalizeScorecard(asRecord(input?.social_audit));
  const contentPlan = normalizeContentPlan(asRecord(input?.content_plan));
  const callFollowUp = normalizeCallFollowUpAngle(asRecord(input?.call_follow_up_angle));

  if (hasScorecardData(socialAudit)) data.social_audit = socialAudit;
  if (hasContentPlanData(contentPlan)) data.content_plan = contentPlan;
  if (hasCallFollowUpData(callFollowUp)) data.call_follow_up_angle = callFollowUp;

  const contentOpportunity = cleanString(input?.content_opportunity);
  if (contentOpportunity) data.content_opportunity = contentOpportunity;

  const metaAdsAngle = cleanString(input?.meta_ads_angle);
  if (metaAdsAngle) data.meta_ads_angle = metaAdsAngle;

  const websiteSocialGap = cleanString(input?.website_social_gap);
  if (websiteSocialGap) data.website_social_gap = websiteSocialGap;

  const firstEmailAngle = cleanString(input?.first_email_angle);
  if (firstEmailAngle) data.first_email_angle = firstEmailAngle;

  return data;
}

export function parseSocialAuditConceptNotes(conceptNotes: string | null | undefined): SocialAuditData {
  const raw = cleanString(conceptNotes);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as StoredConceptNotes & Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const stored = parsed.social_audit_data || parsed.socialAuditData;
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      return normalizeSocialAuditData(stored as Record<string, unknown>);
    }

    return normalizeSocialAuditData(parsed);
  } catch {
    return {};
  }
}

export function hasSocialAuditData(input: Record<string, unknown> | null | undefined) {
  return getSocialAuditSignalCount(normalizeSocialAuditData(input)) > 0;
}

export function hasNormalizedSocialAuditData(data: SocialAuditData | null | undefined) {
  return getSocialAuditSignalCount(data || {}) > 0;
}

export function getSocialAuditSignalCount(data: SocialAuditData) {
  let count = 0;
  if (hasScorecardData(data.social_audit)) count += 1;
  if (hasContentPlanData(data.content_plan)) count += 1;
  if (data.content_opportunity) count += 1;
  if (data.meta_ads_angle) count += 1;
  if (data.website_social_gap) count += 1;
  if (data.first_email_angle) count += 1;
  if (hasCallFollowUpData(data.call_follow_up_angle)) count += 1;
  return count;
}

export function getSocialAuditRichness(input: Record<string, unknown>): SocialAuditRichness {
  const signalCount = getSocialAuditSignalCount(normalizeSocialAuditData(input));

  if (signalCount >= 3) {
    return { level: 'rich', label: 'Rich Social Audit', signalCount };
  }

  if (signalCount > 0) {
    return { level: 'basic', label: 'Basic Social Audit', signalCount };
  }

  return { level: 'missing', label: 'Missing Social Audit', signalCount };
}

function normalizeScorecard(record: Record<string, unknown> | null): SocialAuditScorecard {
  const scorecard: SocialAuditScorecard = {};
  if (!record) return scorecard;

  for (const field of SCORECARD_TEXT_FIELDS) {
    const value = cleanString(record[field]);
    if (value) scorecard[field] = value;
  }

  const score = numberOrNull(record.overall_social_score);
  if (score !== null) scorecard.overall_social_score = score;

  const reasons = cleanList(record.why_underperforming);
  if (reasons.length > 0) scorecard.why_underperforming = reasons;

  return scorecard;
}

function normalizeContentPlan(record: Record<string, unknown> | null): SocialContentPlan {
  const plan: SocialContentPlan = {};
  if (!record) return plan;

  for (const field of CONTENT_PLAN_TEXT_FIELDS) {
    const value = cleanString(record[field]);
    if (value) plan[field] = value;
  }

  const themes = cleanList(record.priority_content_themes);
  if (themes.length > 0) plan.priority_content_themes = themes;

  return plan;
}

function normalizeCallFollowUpAngle(record: Record<string, unknown> | null): CallFollowUpAngle {
  const callFollowUp: CallFollowUpAngle = {};
  if (!record) return callFollowUp;

  for (const field of CALL_FOLLOW_UP_TEXT_FIELDS) {
    const value = cleanString(record[field]);
    if (value) callFollowUp[field] = value;
  }

  return callFollowUp;
}

function hasScorecardData(scorecard: SocialAuditScorecard | null | undefined) {
  if (!scorecard) return false;
  return Boolean(
    SCORECARD_TEXT_FIELDS.some((field) => scorecard[field]) ||
      typeof scorecard.overall_social_score === 'number' ||
      (scorecard.why_underperforming && scorecard.why_underperforming.length > 0)
  );
}

function hasContentPlanData(plan: SocialContentPlan | null | undefined) {
  if (!plan) return false;
  return Boolean(
    CONTENT_PLAN_TEXT_FIELDS.some((field) => plan[field]) ||
      (plan.priority_content_themes && plan.priority_content_themes.length > 0)
  );
}

function hasCallFollowUpData(callFollowUp: CallFollowUpAngle | null | undefined) {
  if (!callFollowUp) return false;
  return CALL_FOLLOW_UP_TEXT_FIELDS.some((field) => callFollowUp[field]);
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function cleanString(value: unknown) {
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

function numberOrNull(value: unknown) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return null;
  return Math.max(0, Math.min(100, Math.round(numberValue)));
}
