import { hasNormalizedApexDeliveryData, type ApexDeliveryData } from './apex-delivery-data';
import { hasNormalizedResinateFlooringData, type ResinateFlooringData } from './resinate-data';

export const RICH_MOCKUP_TEXT_FIELDS = [
  'approved_archetype',
  'template_variant',
  'design_family',
  'brand_style_notes',
  'visual_direction',
  'brand_tone',
  'layout_signature',
  'hero_mode',
  'design_style_key',
  'image_treatment',
  'cta_style',
  'proof_style',
  'palette_direction',
  'typography_direction',
  'photo_strategy',
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
  'section_priority',
] as const;

export const RICH_MOCKUP_SIGNAL_FIELDS = [
  'approved_archetype',
  'visual_direction',
  'template_variant',
  'design_family',
  'brand_tone',
  'layout_signature',
  'hero_mode',
  'design_style_key',
  'image_treatment',
  'cta_style',
  'proof_style',
  'palette_direction',
  'typography_direction',
  'photo_strategy',
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
  'section_priority',
] as const;

export type RichMockupTextField = (typeof RICH_MOCKUP_TEXT_FIELDS)[number];
export type RichMockupListField = (typeof RICH_MOCKUP_LIST_FIELDS)[number];
export type RichMockupSignalField = (typeof RICH_MOCKUP_SIGNAL_FIELDS)[number];

export type MockupVisualProfile = {
  brand_mood?: string | null;
  brand_tone?: string | null;
  design_family?: string | null;
  design_style_key?: string | null;
  color_palette?: {
    primary?: string | null;
    secondary?: string | null;
    accent?: string | null;
    background?: string | null;
    text?: string | null;
  } | null;
  typography_mood?: string | null;
  layout_signature?: string | null;
  hero_mode?: string | null;
  image_treatment?: string | null;
  proof_style?: string | null;
  palette_direction?: string | null;
  typography_direction?: string | null;
  photo_strategy?: string | null;
  ui_personality?: string | null;
  trust_style?: string | null;
  cta_style?: string | null;
};

export type MockupMediaAsset = {
  type:
    | 'hero'
    | 'proof'
    | 'gallery'
    | 'process'
    | 'team'
    | 'exterior'
    | 'project'
    | 'service'
    | 'atmosphere';
  image_url: string;
  source_url?: string | null;
  source_type: 'website' | 'google_profile' | 'instagram' | 'facebook' | 'fallback';
  alt?: string | null;
  usage_note?: string | null;
  confidence: 'high' | 'medium' | 'low';
};

export type RichMockupData = Partial<Record<RichMockupTextField, string | null>> &
  Partial<Record<RichMockupListField, string[]>> & {
    personalization_score?: number | null;
    visual_profile?: MockupVisualProfile | null;
    media_assets?: MockupMediaAsset[];
    proof_assets?: MockupMediaAsset[];
    gallery_assets?: MockupMediaAsset[];
  };

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

  const personalizationScore = cleanScore(input?.personalization_score ?? input?.personalizationScore);
  if (personalizationScore !== null) rich.personalization_score = personalizationScore;

  const visualProfile = normalizeVisualProfile(input?.visual_profile ?? input?.visualProfile);
  if (visualProfile) {
    rich.visual_profile = visualProfile;
    if (!rich.design_family && visualProfile.design_family) rich.design_family = visualProfile.design_family;
    if (!rich.brand_tone && visualProfile.brand_tone) rich.brand_tone = visualProfile.brand_tone;
    if (!rich.design_style_key && visualProfile.design_style_key) rich.design_style_key = visualProfile.design_style_key;
    if (!rich.layout_signature && visualProfile.layout_signature) rich.layout_signature = visualProfile.layout_signature;
    if (!rich.hero_mode && visualProfile.hero_mode) rich.hero_mode = visualProfile.hero_mode;
    if (!rich.image_treatment && visualProfile.image_treatment) rich.image_treatment = visualProfile.image_treatment;
    if (!rich.proof_style && visualProfile.proof_style) rich.proof_style = visualProfile.proof_style;
    if (!rich.palette_direction && visualProfile.palette_direction) rich.palette_direction = visualProfile.palette_direction;
    if (!rich.typography_direction && visualProfile.typography_direction) rich.typography_direction = visualProfile.typography_direction;
    if (!rich.photo_strategy && visualProfile.photo_strategy) rich.photo_strategy = visualProfile.photo_strategy;
  }

  const mediaAssets = normalizeMediaAssetList(input?.media_assets ?? input?.mediaAssets);
  if (mediaAssets.length > 0) rich.media_assets = mediaAssets;

  const proofAssets = normalizeMediaAssetList(input?.proof_assets ?? input?.proofAssets);
  if (proofAssets.length > 0) rich.proof_assets = proofAssets;

  const galleryAssets = normalizeMediaAssetList(input?.gallery_assets ?? input?.galleryAssets);
  if (galleryAssets.length > 0) rich.gallery_assets = galleryAssets;

  return rich;
}

export function hasRichMockupData(input: Record<string, unknown> | null | undefined) {
  return getRichMockupSignalCount(normalizeRichMockupData(input)) > 0;
}

export function getRichMockupSignalCount(rich: RichMockupData) {
  const legacySignals = RICH_MOCKUP_SIGNAL_FIELDS.filter((field) => {
    const value = rich[field as keyof RichMockupData];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  }).length;

  const v2Signals = [
    rich.visual_profile && Object.values(flattenVisualProfile(rich.visual_profile)).some(Boolean),
    rich.media_assets && rich.media_assets.length > 0,
    rich.proof_assets && rich.proof_assets.length > 0,
    rich.gallery_assets && rich.gallery_assets.length > 0,
  ].filter(Boolean).length;

  return legacySignals + v2Signals;
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

function cleanScore(value: unknown) {
  const score = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function cleanRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function normalizeVisualProfile(value: unknown): MockupVisualProfile | null {
  const record = cleanRecord(value);
  if (!record) return null;

  const colorRecord = cleanRecord(record.color_palette) || cleanRecord(record.colorPalette);
  const colorPalette = colorRecord
    ? {
        primary: cleanString(colorRecord.primary),
        secondary: cleanString(colorRecord.secondary),
        accent: cleanString(colorRecord.accent),
        background: cleanString(colorRecord.background),
        text: cleanString(colorRecord.text),
      }
    : null;

  const profile: MockupVisualProfile = {
    brand_mood: cleanString(record.brand_mood ?? record.brandMood),
    brand_tone: cleanString(record.brand_tone ?? record.brandTone),
    design_family: cleanString(record.design_family ?? record.designFamily),
    design_style_key: cleanString(record.design_style_key ?? record.designStyleKey),
    color_palette: colorPalette && Object.values(colorPalette).some(Boolean) ? colorPalette : null,
    typography_mood: cleanString(record.typography_mood ?? record.typographyMood),
    layout_signature: cleanString(record.layout_signature ?? record.layoutSignature),
    hero_mode: cleanString(record.hero_mode ?? record.heroMode),
    image_treatment: cleanString(record.image_treatment ?? record.imageTreatment),
    proof_style: cleanString(record.proof_style ?? record.proofStyle),
    palette_direction: cleanString(record.palette_direction ?? record.paletteDirection),
    typography_direction: cleanString(record.typography_direction ?? record.typographyDirection),
    photo_strategy: cleanString(record.photo_strategy ?? record.photoStrategy),
    ui_personality: cleanString(record.ui_personality ?? record.uiPersonality),
    trust_style: cleanString(record.trust_style ?? record.trustStyle),
    cta_style: cleanString(record.cta_style ?? record.ctaStyle),
  };

  return Object.values(flattenVisualProfile(profile)).some(Boolean) ? profile : null;
}

function flattenVisualProfile(profile: MockupVisualProfile) {
  return {
    brand_mood: profile.brand_mood,
    brand_tone: profile.brand_tone,
    design_family: profile.design_family,
    design_style_key: profile.design_style_key,
    primary: profile.color_palette?.primary,
    secondary: profile.color_palette?.secondary,
    accent: profile.color_palette?.accent,
    background: profile.color_palette?.background,
    text: profile.color_palette?.text,
    typography_mood: profile.typography_mood,
    layout_signature: profile.layout_signature,
    hero_mode: profile.hero_mode,
    image_treatment: profile.image_treatment,
    proof_style: profile.proof_style,
    palette_direction: profile.palette_direction,
    typography_direction: profile.typography_direction,
    photo_strategy: profile.photo_strategy,
    ui_personality: profile.ui_personality,
    trust_style: profile.trust_style,
    cta_style: profile.cta_style,
  };
}

function normalizeMediaAssetList(value: unknown) {
  const rawItems = Array.isArray(value) ? value : cleanString(value) ? [value] : [];
  const assets = rawItems
    .map((item) => normalizeMediaAsset(item))
    .filter((item): item is MockupMediaAsset => Boolean(item));

  const seen = new Set<string>();
  return assets.filter((asset) => {
    const key = asset.image_url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 18);
}

function normalizeMediaAsset(value: unknown): MockupMediaAsset | null {
  if (typeof value === 'string') {
    const imageUrl = cleanImageUrl(value);
    return imageUrl
      ? {
          type: 'gallery',
          image_url: imageUrl,
          source_url: null,
          source_type: 'fallback',
          alt: null,
          usage_note: 'Category concept visual',
          confidence: 'low',
        }
      : null;
  }

  const record = cleanRecord(value);
  if (!record) return null;

  const imageUrl = cleanImageUrl(record.image_url ?? record.imageUrl ?? record.url ?? record.src);
  if (!imageUrl) return null;

  return {
    type: normalizeMediaType(record.type),
    image_url: imageUrl,
    source_url: cleanString(record.source_url ?? record.sourceUrl),
    source_type: normalizeSourceType(record.source_type ?? record.sourceType),
    alt: cleanString(record.alt),
    usage_note: cleanString(record.usage_note ?? record.usageNote),
    confidence: normalizeConfidence(record.confidence),
  };
}

function cleanImageUrl(value: unknown) {
  const url = cleanString(value);
  if (!url) return null;
  if (/^(https?:\/\/|\/)/i.test(url)) return url;
  return null;
}

function normalizeMediaType(value: unknown): MockupMediaAsset['type'] {
  const clean = cleanString(value)?.toLowerCase().replace(/[\s-]+/g, '_');
  const allowed: MockupMediaAsset['type'][] = [
    'hero',
    'proof',
    'gallery',
    'process',
    'team',
    'exterior',
    'project',
    'service',
    'atmosphere',
  ];
  return allowed.includes(clean as MockupMediaAsset['type']) ? (clean as MockupMediaAsset['type']) : 'gallery';
}

function normalizeSourceType(value: unknown): MockupMediaAsset['source_type'] {
  const clean = cleanString(value)?.toLowerCase().replace(/[\s-]+/g, '_');
  const allowed: MockupMediaAsset['source_type'][] = ['website', 'google_profile', 'instagram', 'facebook', 'fallback'];
  return allowed.includes(clean as MockupMediaAsset['source_type'])
    ? (clean as MockupMediaAsset['source_type'])
    : 'fallback';
}

function normalizeConfidence(value: unknown): MockupMediaAsset['confidence'] {
  const clean = cleanString(value)?.toLowerCase();
  if (clean === 'high' || clean === 'medium' || clean === 'low') return clean;
  return 'medium';
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
