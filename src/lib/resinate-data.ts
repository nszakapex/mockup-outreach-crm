export const RESINATE_CAMPAIGN_TYPE = 'resinate_flooring' as const;

export const RESINATE_TEXT_FIELDS = [
  'buyer_type',
  'property_type',
  'portfolio_or_property_context',
  'likely_surface_problem',
  'likely_surface_areas',
  'traffic_needs',
  'cleaning_needs',
  'downtime_needs',
  'moisture_needs',
  'slip_resistance_needs',
  'recommended_flooring_system',
  'system_reasoning',
  'best_resinate_offer',
  'facility_use_case',
  'decision_maker_path',
  'procurement_path',
  'likely_objection',
  'objection_response',
  'next_sales_action',
  'walkthrough_offer',
  'vendor_packet_angle',
  'prep_considerations',
  'moisture_considerations',
  'polyaspartic_value',
  'surface_system_summary',
] as const;

export const RESINATE_IMPORT_REQUIRED_FIELDS = [
  'recommended_flooring_system',
  'traffic_needs',
  'moisture_needs',
  'next_sales_action',
] as const;

export type ResinateCampaignType = typeof RESINATE_CAMPAIGN_TYPE;
export type ResinateTextField = (typeof RESINATE_TEXT_FIELDS)[number];
export type ResinateImportRequiredField = (typeof RESINATE_IMPORT_REQUIRED_FIELDS)[number];

export type ResinateFlooringData = {
  campaign_type?: ResinateCampaignType | null;
} & Partial<Record<ResinateTextField, string | null>>;

export type FlooringSystemKey =
  | 'flake'
  | 'quartz'
  | 'metallic'
  | 'solid_color'
  | 'polyaspartic'
  | 'moisture_mitigation'
  | 'custom';

export type FlooringSystemProfile = {
  key: FlooringSystemKey;
  label: string;
  bestFor: string[];
  benefits: string[];
  note: string;
};

export type ResinateImportSummary = {
  isResinate: boolean;
  signalCount: number;
  missingFields: string[];
  buyerType: string | null;
  propertyType: string | null;
  recommendedSystem: string | null;
  bestOffer: string | null;
  nextSalesAction: string | null;
  flooringAuditAvailable: boolean;
};

type StoredConceptNotes = {
  resinate_flooring_data?: unknown;
  resinateFlooringData?: unknown;
};

const FLOORING_SYSTEMS: Record<FlooringSystemKey, FlooringSystemProfile> = {
  flake: {
    key: 'flake',
    label: 'Flake System',
    bestFor: [
      'garages',
      'light commercial spaces',
      'retail backrooms',
      'locker rooms',
      'utility areas',
      'patios',
      'school hallways',
      'vet clinics',
    ],
    benefits: [
      'decorative commercial finish',
      'durable traffic surface',
      'hides concrete imperfections',
      'slip resistance can be tuned by texture',
    ],
    note: 'A strong fit when the space needs a cleaner designer look without giving up durability.',
  },
  quartz: {
    key: 'quartz',
    label: 'Quartz System',
    bestFor: [
      'commercial wet areas',
      'pool areas',
      'locker rooms',
      'kitchens',
      'schools',
      'heavy-use commercial spaces',
    ],
    benefits: [
      'higher slip-resistance potential',
      'higher durability',
      'commercial-grade texture',
      'good for wet or high-use environments',
    ],
    note: 'Quartz is the stronger recommendation when traffic, water, and slip resistance matter most.',
  },
  metallic: {
    key: 'metallic',
    label: 'Metallic System',
    bestFor: [
      'showrooms',
      'luxury garages',
      'salons',
      'spas',
      'bars',
      'nightclubs',
      'statement basements',
    ],
    benefits: [
      'custom artistic finish',
      'premium visual impact',
      'high-end surface statement',
      'pairs with a protective topcoat',
    ],
    note: 'Metallic systems are artistic and custom, so final pattern and movement vary by installation.',
  },
  solid_color: {
    key: 'solid_color',
    label: 'Solid Color / Neat Coat',
    bestFor: [
      'basements',
      'commercial utility spaces',
      'clean simple upgrades',
      'storage rooms',
      'back-of-house areas',
    ],
    benefits: [
      'clean professional finish',
      'simple maintenance upgrade',
      'budget-conscious system option',
      'works well where decoration is secondary',
    ],
    note: 'Solid color systems are useful when the space needs a cleaner durable surface without a decorative broadcast.',
  },
  polyaspartic: {
    key: 'polyaspartic',
    label: 'Polyaspartic Topcoat',
    bestFor: [
      'UV-exposed spaces',
      'fast-turn commercial projects',
      'chemical exposure areas',
      'high-abrasion surfaces',
    ],
    benefits: [
      'UV-stable finish',
      'fast-curing schedule',
      'chemical resistance',
      'abrasion resistance',
      'premium protective layer',
    ],
    note: 'Polyaspartic is the premium protective topcoat that helps the finished system last.',
  },
  moisture_mitigation: {
    key: 'moisture_mitigation',
    label: 'Moisture Mitigation Review',
    bestFor: [
      'slab-on-grade concrete',
      'basements',
      'elevated moisture risk',
      'failed plastic moisture tests',
      'long-term adhesion concerns',
    ],
    benefits: [
      'protects long-term adhesion',
      'treats vapor risk seriously',
      'reduces coating failure risk',
      'supports the right system choice',
    ],
    note: 'Moisture conditions should be evaluated before system selection when the slab or use case raises risk.',
  },
  custom: {
    key: 'custom',
    label: 'Custom Surface System',
    bestFor: ['commercial surfaces with specific traffic, moisture, or finish needs'],
    benefits: [
      'system matched to the surface',
      'traffic-aware recommendation',
      'moisture-aware recommendation',
      'long-term-use planning',
    ],
    note: 'The final system should be chosen after a walkthrough, concrete inspection, and moisture review.',
  },
};

export function normalizeResinateFlooringData(
  input: Record<string, unknown> | null | undefined
): ResinateFlooringData {
  const source = mergeNestedResinateSource(input);
  const data: ResinateFlooringData = {};
  const campaignType = cleanString(source.campaign_type)?.toLowerCase();

  for (const field of RESINATE_TEXT_FIELDS) {
    const value = cleanString(source[field]);
    if (value) data[field] = value;
  }

  if (campaignType === RESINATE_CAMPAIGN_TYPE || getResinateSignalCount(data) > 0) {
    data.campaign_type = RESINATE_CAMPAIGN_TYPE;
  }

  return data;
}

export function parseResinateConceptNotes(conceptNotes: string | null | undefined): ResinateFlooringData {
  const raw = cleanString(conceptNotes);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as StoredConceptNotes & Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const stored = parsed.resinate_flooring_data || parsed.resinateFlooringData;
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      return normalizeResinateFlooringData(stored as Record<string, unknown>);
    }

    return normalizeResinateFlooringData(parsed);
  } catch {
    return {};
  }
}

export function hasResinateFlooringData(input: Record<string, unknown> | null | undefined) {
  return hasNormalizedResinateFlooringData(normalizeResinateFlooringData(input));
}

export function hasNormalizedResinateFlooringData(data: ResinateFlooringData | null | undefined) {
  return Boolean(data?.campaign_type === RESINATE_CAMPAIGN_TYPE || getResinateSignalCount(data || {}) > 0);
}

export function isResinateCampaign(data: ResinateFlooringData | null | undefined) {
  return data?.campaign_type === RESINATE_CAMPAIGN_TYPE;
}

export function getResinateSignalCount(data: ResinateFlooringData) {
  return RESINATE_TEXT_FIELDS.filter((field) => Boolean(data[field])).length;
}

export function getMissingResinateImportFields(
  data: ResinateFlooringData,
  emailBody?: string | null
): string[] {
  const missing: string[] = RESINATE_IMPORT_REQUIRED_FIELDS.filter((field) => !data[field]);
  const body = cleanString(emailBody) || '';

  if (!body) missing.push('email_body');
  if (
    body &&
    !/\[flooring audit link\]/i.test(body) &&
    !/\[flooring brief link\]/i.test(body) &&
    !/\[commercial surface brief link\]/i.test(body)
  ) {
    missing.push('[Flooring Brief Link]');
  }

  return missing;
}

export function getResinateImportSummary(
  input: Record<string, unknown>,
  emailBody?: string | null
): ResinateImportSummary | null {
  const data = normalizeResinateFlooringData(input);
  if (!hasNormalizedResinateFlooringData(data)) return null;

  return {
    isResinate: isResinateCampaign(data),
    signalCount: getResinateSignalCount(data),
    missingFields: getMissingResinateImportFields(data, emailBody),
    buyerType: data.buyer_type || null,
    propertyType: data.property_type || null,
    recommendedSystem: data.recommended_flooring_system || null,
    bestOffer: data.best_resinate_offer || data.walkthrough_offer || data.vendor_packet_angle || null,
    nextSalesAction: data.next_sales_action || null,
    flooringAuditAvailable: Boolean(data.campaign_type === RESINATE_CAMPAIGN_TYPE),
  };
}

export function getFlooringSystemProfile(system: string | null | undefined): FlooringSystemProfile {
  const normalized = cleanString(system)?.toLowerCase() || '';

  if (normalized.includes('quartz')) return FLOORING_SYSTEMS.quartz;
  if (normalized.includes('metallic')) return FLOORING_SYSTEMS.metallic;
  if (normalized.includes('polyaspartic')) return FLOORING_SYSTEMS.polyaspartic;
  if (normalized.includes('moisture')) return FLOORING_SYSTEMS.moisture_mitigation;
  if (normalized.includes('solid') || normalized.includes('neat')) return FLOORING_SYSTEMS.solid_color;
  if (normalized.includes('flake')) return FLOORING_SYSTEMS.flake;

  return FLOORING_SYSTEMS.custom;
}

export function getResinateDisplayValue(value: string | null | undefined, fallback: string) {
  return cleanString(value) || fallback;
}

function mergeNestedResinateSource(input: Record<string, unknown> | null | undefined) {
  const base = input || {};
  const nested =
    asRecord(base.resinate_flooring_data) ||
    asRecord(base.resinateFlooringData) ||
    asRecord(base.resinate);

  return nested ? { ...base, ...nested } : base;
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function cleanString(value: unknown): string | null {
  if (Array.isArray(value)) {
    const joined = value
      .map((item) => cleanString(item))
      .filter((item): item is string => Boolean(item))
      .join(', ');
    return joined.length > 0 ? joined : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}
