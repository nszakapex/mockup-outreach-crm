import { hasNormalizedApexDeliveryData, type ApexDeliveryData } from './apex-delivery-data';
import { hasNormalizedResinateFlooringData, type ResinateFlooringData } from './resinate-data';

export const RICH_MOCKUP_TEXT_FIELDS = [
  'brand_style_notes',
  'visual_direction',
  'cta_strategy',
  'local_seo_angle',
  'content_strategy_angle',
  'meta_ads_angle',
  'original_site_notes',
  'original_site_url',
  'inspiration_notes',
  'current_site_snapshot',
] as const;

export const RICH_MOCKUP_LIST_FIELDS = [
  'primary_colors',
  'secondary_colors',
  'menu_or_offer_items',
  'trust_signals',
  'website_issue_examples',
  'online_presence_status',
  'proposed_site_nav',
  'homepage_sections',
] as const;

export const RICH_MOCKUP_SIGNAL_FIELDS = [
  'visual_direction',
  'menu_or_offer_items',
  'trust_signals',
  'website_issue_examples',
  'cta_strategy',
  'content_strategy_angle',
  'meta_ads_angle',
  'current_site_snapshot',
  'online_presence_status',
  'proposed_site_nav',
  'homepage_sections',
] as const;

export type RichMockupTextField = (typeof RICH_MOCKUP_TEXT_FIELDS)[number];
export type RichMockupListField = (typeof RICH_MOCKUP_LIST_FIELDS)[number];
export type RichMockupSignalField = (typeof RICH_MOCKUP_SIGNAL_FIELDS)[number];

export type RichMockupData = Partial<Record<RichMockupTextField, string | null>> &
  Partial<Record<RichMockupListField, string[]>>;

export type MockupRichnessLevel = 'rich' | 'basic' | 'missing';

export type MockupRichness = {
  level: MockupRichnessLevel;
  label: string;
  signalCount: number;
};

type StoredConceptNotes = {
  notes?: string | null;
  rich_mockup_data?: RichMockupData;
  social_audit_data?: unknown;
  resinate_flooring_data?: ResinateFlooringData;
  apex_delivery_data?: ApexDeliveryData;
};

export function normalizeRichMockupData(input: Record<string, unknown> | null | undefined): RichMockupData {
  const rich: RichMockupData = {};

  for (const field of RICH_MOCKUP_TEXT_FIELDS) {
    const value = cleanString(input?.[field]);
    if (value) rich[field] = value;
  }

  for (const field of RICH_MOCKUP_LIST_FIELDS) {
    const value = cleanList(input?.[field]);
    if (value.length > 0) rich[field] = value;
  }

  return rich;
}

export function hasRichMockupData(input: Record<string, unknown> | null | undefined) {
  return getRichMockupSignalCount(normalizeRichMockupData(input)) > 0;
}

export function getRichMockupSignalCount(rich: RichMockupData) {
  return RICH_MOCKUP_SIGNAL_FIELDS.filter((field) => {
    const value = rich[field as keyof RichMockupData];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;
}

export function getMockupRichness(input: Record<string, unknown>, hasBasicMockupData: boolean): MockupRichness {
  const rich = normalizeRichMockupData(input);
  const signalCount = getRichMockupSignalCount(rich);

  if (signalCount >= 3) {
    return { level: 'rich', label: 'Rich Mockup Data', signalCount };
  }

  if (hasBasicMockupData || signalCount > 0) {
    return { level: 'basic', label: 'Basic Mockup Data', signalCount };
  }

  return { level: 'missing', label: 'Missing Mockup Data', signalCount };
}

export function encodeMockupConceptNotes(
  notes: string | null,
  rich: RichMockupData,
  socialAuditData?: unknown,
  resinateFlooringData?: ResinateFlooringData,
  apexDeliveryData?: ApexDeliveryData
) {
  const hasSocialAuditData =
    Boolean(socialAuditData) &&
    typeof socialAuditData === 'object' &&
    !Array.isArray(socialAuditData) &&
    Object.keys(socialAuditData as Record<string, unknown>).length > 0;
  const hasResinateFlooringData = hasNormalizedResinateFlooringData(resinateFlooringData);
  const hasApexDeliveryData = hasNormalizedApexDeliveryData(apexDeliveryData);

  if (
    getRichMockupSignalCount(rich) === 0 &&
    !hasSocialAuditData &&
    !hasResinateFlooringData &&
    !hasApexDeliveryData
  ) {
    return notes;
  }

  const payload: StoredConceptNotes = {
    notes,
    rich_mockup_data: rich,
  };

  if (hasSocialAuditData) payload.social_audit_data = socialAuditData;
  if (hasResinateFlooringData) payload.resinate_flooring_data = resinateFlooringData;
  if (hasApexDeliveryData) payload.apex_delivery_data = apexDeliveryData;

  return JSON.stringify(payload);
}

export function parseMockupConceptNotes(conceptNotes: string | null | undefined): {
  notes: string | null;
  rich: RichMockupData;
} {
  const raw = cleanString(conceptNotes);
  if (!raw) return { notes: null, rich: {} };

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const notes = cleanString(parsed.notes) || cleanString(parsed.concept_notes);
      const richSource = parsed.rich_mockup_data || parsed.richMockupData || parsed;
      return {
        notes,
        rich: normalizeRichMockupData(richSource as Record<string, unknown>),
      };
    }
  } catch {
    return { notes: raw, rich: {} };
  }

  return { notes: raw, rich: {} };
}

export function cleanRichList(value: unknown) {
  return cleanList(value);
}

export function splitStrategyText(value: string | null | undefined) {
  const clean = cleanString(value);
  if (!clean) return [];

  return clean
    .replace(/\u2192/g, '->')
    .split(/->|>|[\n;|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanString(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => stringifyListItem(item))
      .filter((item): item is string => Boolean(item))
      .slice(0, 12);
  }

  const asString = cleanString(value);
  if (!asString) return [];

  return asString
    .split(/[\n;|,]+/)
    .map((item) => item.trim())
    .filter((item) => Boolean(item) && !/\[object Object\]/i.test(item))
    .slice(0, 12);
}

function stringifyListItem(item: unknown) {
  if (typeof item === 'string') {
    const trimmed = item.trim();
    return trimmed && !/\[object Object\]/i.test(trimmed) ? trimmed : null;
  }

  if (item && typeof item === 'object' && !Array.isArray(item)) {
    const record = item as Record<string, unknown>;
    const parts = [record.label, record.title, record.current, record.issue, record.fix, record.value]
      .map((part) => (typeof part === 'string' ? part.trim() : ''))
      .filter(Boolean);
    return parts.length > 0 ? parts.join(': ') : null;
  }

  const trimmed = String(item ?? '').trim();
  return trimmed && !/\[object Object\]/i.test(trimmed) ? trimmed : null;
}
