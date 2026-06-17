/* Hallmark pre-emit critique: P5 H4 E4 S4 R5 V5 */

export const MOCKUP_TEMPLATE_VARIANTS = [
  'home_service',
  'contractor',
  'medical_aesthetics',
  'auto_service',
  'pet_service',
  'fitness_studio',
  'professional_service',
  'local_service',
  'coffee_shop',
  'restaurant',
  'bar_grill',
  'premium_dining',
  'nonprofit_cafe',
  'food_truck',
] as const;

export type MockupTemplateVariant = (typeof MOCKUP_TEMPLATE_VARIANTS)[number];

export const MOCKUP_LAYOUT_SIGNATURES = [
  'immersive_photo_hero',
  'split_proof_hero',
  'editorial_service_grid',
  'dark_premium_transform',
  'clean_clinic_trust',
  'warm_local_story',
  'contractor_project_board',
  'auto_detail_showcase',
  'pet_care_booking',
  'fitness_energy_landing',
  'professional_trust_page',
  'luxury_service_page',
] as const;

export type MockupLayoutSignature = (typeof MOCKUP_LAYOUT_SIGNATURES)[number];

export const FOOD_TEMPLATE_VARIANTS = [
  'coffee_shop',
  'restaurant',
  'bar_grill',
  'premium_dining',
  'nonprofit_cafe',
  'food_truck',
] as const satisfies readonly MockupTemplateVariant[];

export const SERVICE_TEMPLATE_VARIANTS = [
  'home_service',
  'contractor',
  'medical_aesthetics',
  'auto_service',
  'pet_service',
  'fitness_studio',
  'professional_service',
  'local_service',
] as const satisfies readonly MockupTemplateVariant[];

const VARIANT_LABELS: Record<MockupTemplateVariant, string> = {
  home_service: 'Home Service',
  contractor: 'Contractor',
  medical_aesthetics: 'Medical Aesthetics',
  auto_service: 'Auto Service',
  pet_service: 'Pet Service',
  fitness_studio: 'Fitness Studio',
  professional_service: 'Professional Service',
  local_service: 'Local Service',
  coffee_shop: 'Coffee Shop',
  restaurant: 'Restaurant',
  bar_grill: 'Bar & Grill',
  premium_dining: 'Premium Dining',
  nonprofit_cafe: 'Nonprofit Cafe',
  food_truck: 'Food Truck',
};

const LAYOUT_SIGNATURE_LABELS: Record<MockupLayoutSignature, string> = {
  immersive_photo_hero: 'Immersive Photo Hero',
  split_proof_hero: 'Split Proof Hero',
  editorial_service_grid: 'Editorial Service Grid',
  dark_premium_transform: 'Dark Premium Transform',
  clean_clinic_trust: 'Clean Clinic Trust',
  warm_local_story: 'Warm Local Story',
  contractor_project_board: 'Contractor Project Board',
  auto_detail_showcase: 'Auto Detail Showcase',
  pet_care_booking: 'Pet Care Booking',
  fitness_energy_landing: 'Fitness Energy Landing',
  professional_trust_page: 'Professional Trust Page',
  luxury_service_page: 'Luxury Service Page',
};

const DEFAULT_LAYOUT_SIGNATURES: Record<MockupTemplateVariant, readonly MockupLayoutSignature[]> = {
  home_service: ['split_proof_hero', 'editorial_service_grid', 'warm_local_story'],
  contractor: ['contractor_project_board', 'split_proof_hero', 'immersive_photo_hero'],
  medical_aesthetics: ['clean_clinic_trust', 'luxury_service_page', 'split_proof_hero'],
  auto_service: ['dark_premium_transform', 'auto_detail_showcase', 'immersive_photo_hero'],
  pet_service: ['pet_care_booking', 'warm_local_story', 'split_proof_hero'],
  fitness_studio: ['fitness_energy_landing', 'immersive_photo_hero', 'editorial_service_grid'],
  professional_service: ['professional_trust_page', 'clean_clinic_trust', 'split_proof_hero'],
  local_service: ['editorial_service_grid', 'split_proof_hero', 'warm_local_story'],
  coffee_shop: ['immersive_photo_hero'],
  restaurant: ['immersive_photo_hero'],
  bar_grill: ['immersive_photo_hero'],
  premium_dining: ['immersive_photo_hero'],
  nonprofit_cafe: ['immersive_photo_hero'],
  food_truck: ['immersive_photo_hero'],
};

export type MockupTemplateSelectionInput = {
  niche?: string | null;
  businessName?: string | null;
  campaignType?: string | null;
  fields?: Record<string, unknown> | null;
  text?: string | Array<string | null | undefined> | null;
};

export type MockupLayoutSignatureSelection = {
  signature: MockupLayoutSignature;
  label: string;
  reason: string;
  inferred: boolean;
};

export type MockupTemplateSelection = {
  variant: MockupTemplateVariant;
  label: string;
  reason: string;
  matchedKeyword: string | null;
  isFoodTemplate: boolean;
  isClearlyNonFood: boolean;
  mismatchWarning: string | null;
  layoutSignature: MockupLayoutSignature;
  layoutLabel: string;
  layoutReason: string;
  layoutInferred: boolean;
};

type KeywordGroup = {
  variant: MockupTemplateVariant;
  keywords: string[];
  reason: string;
};

const SERVICE_VARIANT_KEYWORDS: KeywordGroup[] = [
  {
    variant: 'contractor',
    reason: 'contractor/project keywords',
    keywords: [
      'contractor',
      'contracting',
      'construction',
      'remodel',
      'remodeling',
      'basement',
      'roofing',
      'roofer',
      'siding',
      'deck',
      'fence',
      'concrete',
      'cement',
      'painting',
      'painter',
      'flooring',
      'floor',
      'landscaping',
      'hardscaping',
      'outdoor living',
      'builder',
      'home solutions',
    ],
  },
  {
    variant: 'home_service',
    reason: 'home-service urgency or quote keywords',
    keywords: [
      'hvac',
      'heating',
      'cooling',
      'plumbing',
      'plumber',
      'electrical',
      'electrician',
      'pest control',
      'cleaning',
      'pressure washing',
      'window cleaning',
      'garage door',
      'moving',
      'appliance',
      'carpet cleaning',
      'upholstery cleaning',
      'steam clean',
      'repair service',
    ],
  },
  {
    variant: 'medical_aesthetics',
    reason: 'medical aesthetics treatment keywords',
    keywords: [
      'med spa',
      'medical spa',
      'aesthetic',
      'aesthetics',
      'injectables',
      'botox',
      'filler',
      'laser',
      'facial',
      'skin',
      'wellness clinic',
      'dentist',
      'dentistry',
      'dental',
      'orthodontic',
      'orthodontics',
    ],
  },
  {
    variant: 'auto_service',
    reason: 'auto-service transformation keywords',
    keywords: [
      'auto detail',
      'auto detailing',
      'mobile detail',
      'detailing',
      'ceramic coating',
      'window tint',
      'tint',
      'car wash',
      'truck wash',
      'auto repair',
      'truck repair',
      'mechanic',
      'collision',
    ],
  },
  {
    variant: 'pet_service',
    reason: 'pet-service booking keywords',
    keywords: ['pet grooming', 'dog grooming', 'mobile grooming', 'pet service', 'animal grooming', 'grooming school', 'groomer'],
  },
  {
    variant: 'fitness_studio',
    reason: 'fitness studio program keywords',
    keywords: ['gym', 'fitness', 'personal training', 'pilates', 'yoga', 'studio', 'crossfit', 'trainer'],
  },
  {
    variant: 'professional_service',
    reason: 'professional trust/service keywords',
    keywords: [
      'attorney',
      'law firm',
      'accountant',
      'consultant',
      'professional service',
      'real estate',
      'insurance',
      'financial advisor',
      'bookkeeping',
    ],
  },
  {
    variant: 'local_service',
    reason: 'general local-service keywords',
    keywords: ['salon', 'barber', 'spa', 'beauty', 'service business', 'appointment', 'quote', 'estimate', 'booking'],
  },
];

const FOOD_VARIANT_KEYWORDS: KeywordGroup[] = [
  {
    variant: 'food_truck',
    reason: 'food truck/mobile food keywords',
    keywords: ['food truck', 'mobile food', 'mobile cafe', 'mobile coffee', 'taco truck', 'lunch truck', 'pop-up', 'pop up'],
  },
  {
    variant: 'nonprofit_cafe',
    reason: 'mission cafe keywords',
    keywords: ['nonprofit', 'non-profit', 'community cafe', 'publick house', 'public market', 'mission'],
  },
  {
    variant: 'premium_dining',
    reason: 'premium dining keywords',
    keywords: ['steakhouse', 'premium dining', 'fine dining', 'supper club', 'bistro', 'wine bar'],
  },
  {
    variant: 'bar_grill',
    reason: 'bar/grill hospitality keywords',
    keywords: ['bar', 'grill', 'tavern', 'patio', 'pub', 'sports bar', 'taproom', 'brewery'],
  },
  {
    variant: 'coffee_shop',
    reason: 'coffee/cafe keywords',
    keywords: ['coffee', 'cafe', 'coffeehouse', 'espresso', 'roaster', 'java', 'bakery', 'bakeshop', 'pastry', 'patisserie'],
  },
  {
    variant: 'restaurant',
    reason: 'restaurant/menu keywords',
    keywords: ['restaurant', 'casual dining', 'diner', 'eatery', 'kitchen', 'pizza'],
  },
];

export function getMockupTemplateVariant(niche?: string | null): MockupTemplateVariant {
  return getMockupTemplateSelection({ niche }).variant;
}

export function getMockupTemplateSelection(input?: string | null | MockupTemplateSelectionInput): MockupTemplateSelection {
  const normalizedInput = typeof input === 'string' || input == null ? { niche: input ?? null } : input;
  const normalized = buildSelectionText(normalizedInput);
  const explicitVariant = normalizeTemplateVariant(findTemplateVariantInput(normalizedInput.fields) || findTemplateVariantInput(normalizedInput));
  const serviceMatch = findKeywordMatch(SERVICE_VARIANT_KEYWORDS, normalized);
  const foodMatch = findKeywordMatch(FOOD_VARIANT_KEYWORDS, normalized);
  const isClearlyNonFood = Boolean(serviceMatch);

  const selected = serviceMatch || foodMatch || null;
  const variant = explicitVariant ?? selected?.group.variant ?? 'local_service';
  const isFoodTemplate = isFoodMockupTemplate(variant);
  const mismatchWarning =
    isClearlyNonFood && isFoodTemplate ? 'Template mismatch: non-food prospect mapped to food template.' : null;
  const layoutSelection = getMockupLayoutSignatureSelection({
    ...normalizedInput,
    variant,
  });

  return {
    variant,
    label: getMockupVariantLabel(variant),
    reason: explicitVariant
      ? `Explicit template_variant "${explicitVariant}" supplied in mockup data.`
      : selected
        ? `Selected from ${selected.group.reason}: "${selected.keyword}".`
        : 'No food or niche-specific service keywords matched; using the non-food local service fallback.',
    matchedKeyword: explicitVariant ? null : selected?.keyword ?? null,
    isFoodTemplate,
    isClearlyNonFood,
    mismatchWarning,
    layoutSignature: layoutSelection.signature,
    layoutLabel: layoutSelection.label,
    layoutReason: layoutSelection.reason,
    layoutInferred: layoutSelection.inferred,
  };
}

export function getMockupVariantLabel(variant: MockupTemplateVariant) {
  return VARIANT_LABELS[variant];
}

export function getMockupLayoutSignatureLabel(signature: MockupLayoutSignature) {
  return LAYOUT_SIGNATURE_LABELS[signature];
}

export function getMockupLayoutSignatureSelection(
  input: MockupTemplateSelectionInput & { variant: MockupTemplateVariant }
): MockupLayoutSignatureSelection {
  const explicit = normalizeLayoutSignature(findLayoutSignatureInput(input.fields) || findLayoutSignatureInput(input));
  if (explicit) {
    return {
      signature: explicit,
      label: getMockupLayoutSignatureLabel(explicit),
      reason: `Explicit layout_signature "${explicit}" supplied in mockup data.`,
      inferred: false,
    };
  }

  const options = DEFAULT_LAYOUT_SIGNATURES[input.variant];
  const seed = [input.businessName, input.niche, input.variant, ...(Array.isArray(input.text) ? input.text : [input.text])]
    .filter(Boolean)
    .join('|');
  const signature = options[hashString(seed) % options.length] || options[0];

  return {
    signature,
    label: getMockupLayoutSignatureLabel(signature),
    reason: `Inferred ${getMockupLayoutSignatureLabel(signature)} from ${getMockupVariantLabel(input.variant)} template and prospect text.`,
    inferred: true,
  };
}

export function isFoodMockupTemplate(variant: MockupTemplateVariant) {
  return (FOOD_TEMPLATE_VARIANTS as readonly string[]).includes(variant);
}

export function isServiceMockupTemplate(variant: MockupTemplateVariant) {
  return (SERVICE_TEMPLATE_VARIANTS as readonly string[]).includes(variant);
}

export function buildPublicMockupUrl(slug: string | null | undefined, fallbackOrigin?: string | null) {
  const base = getPublicBaseUrl(fallbackOrigin);
  const cleanSlug = cleanPublicSlug(slug, 'mockups');

  return cleanSlug ? `${base}/mockups/${encodeURIComponent(cleanSlug)}` : base;
}

export function buildPublicSocialAuditUrl(slug: string | null | undefined, fallbackOrigin?: string | null) {
  const base = getPublicBaseUrl(fallbackOrigin);
  const cleanSlug = cleanPublicSlug(slug, 'social-audits');

  return cleanSlug ? `${base}/social-audits/${encodeURIComponent(cleanSlug)}` : base;
}

export function buildPublicFlooringAuditUrl(slug: string | null | undefined, fallbackOrigin?: string | null) {
  const base = getPublicBaseUrl(fallbackOrigin);
  const cleanSlug = cleanPublicSlug(slug, 'flooring-audits');

  return cleanSlug ? `${base}/flooring-audits/${encodeURIComponent(cleanSlug)}` : base;
}

function getPublicBaseUrl(fallbackOrigin?: string | null) {
  const requestOrigin = normalizePublicBaseUrl(fallbackOrigin);
  const browserOrigin =
    typeof window === 'undefined' ? '' : normalizePublicBaseUrl(window.location.origin);
  const appUrl = normalizePublicBaseUrl(process.env.NEXT_PUBLIC_APP_URL);

  return requestOrigin || browserOrigin || appUrl || 'https://mockupcrm67.netlify.app';
}

function normalizePublicBaseUrl(value: string | null | undefined) {
  return (value || '').trim().replace(/\/+$/, '');
}

function cleanPublicSlug(slug: string | null | undefined, route: 'mockups' | 'social-audits' | 'flooring-audits') {
  return (slug || '')
    .trim()
    .replace(new RegExp(`^https?:\\/\\/[^/]+\\/${route}\\/`, 'i'), '')
    .replace(new RegExp(`^\\/?${route}\\/`, 'i'), '')
    .replace(/^\/+/, '');
}

export function parseMockupFeatures(featuresIncluded?: string | null) {
  return (featuresIncluded || '')
    .split(/[\n,;|]+/)
    .map((feature) => feature.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function findKeywordMatch(groups: KeywordGroup[], normalized: string) {
  for (const group of groups) {
    const keyword = group.keywords.find((item) => normalized.includes(item));
    if (keyword) return { group, keyword };
  }

  return null;
}

function buildSelectionText(input: MockupTemplateSelectionInput) {
  return [
    input.businessName,
    input.niche,
    input.campaignType,
    ...(Array.isArray(input.text) ? input.text : [input.text]),
    ...flattenTemplateFields(input.fields),
  ]
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

function findLayoutSignatureInput(input: Record<string, unknown> | MockupTemplateSelectionInput | null | undefined) {
  if (!input) return null;
  const record = input as Record<string, unknown>;
  const visualProfile = record.visual_profile || record.visualProfile;
  if (visualProfile && typeof visualProfile === 'object' && !Array.isArray(visualProfile)) {
    const nested = visualProfile as Record<string, unknown>;
    if (typeof nested.layout_signature === 'string') return nested.layout_signature;
    if (typeof nested.layoutSignature === 'string') return nested.layoutSignature;
  }
  if (typeof record.layout_signature === 'string') return record.layout_signature;
  if (typeof record.layoutSignature === 'string') return record.layoutSignature;
  return null;
}

function findTemplateVariantInput(input: Record<string, unknown> | MockupTemplateSelectionInput | null | undefined) {
  if (!input) return null;
  const record = input as Record<string, unknown>;
  if (typeof record.template_variant === 'string') return record.template_variant;
  if (typeof record.templateVariant === 'string') return record.templateVariant;
  return null;
}

function normalizeTemplateVariant(value: unknown): MockupTemplateVariant | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return (MOCKUP_TEMPLATE_VARIANTS as readonly string[]).includes(normalized)
    ? (normalized as MockupTemplateVariant)
    : null;
}

function normalizeLayoutSignature(value: unknown): MockupLayoutSignature | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return (MOCKUP_LAYOUT_SIGNATURES as readonly string[]).includes(normalized)
    ? (normalized as MockupLayoutSignature)
    : null;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function flattenTemplateFields(fields: Record<string, unknown> | null | undefined) {
  if (!fields) return [];
  const values: string[] = [];
  for (const value of Object.values(fields)) {
    if (typeof value === 'string') {
      values.push(value);
    } else if (Array.isArray(value)) {
      values.push(...value.map((item) => String(item)));
    } else if (value && typeof value === 'object') {
      values.push(...flattenTemplateFields(value as Record<string, unknown>));
    }
  }
  return values;
}
