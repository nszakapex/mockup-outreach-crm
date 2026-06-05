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

export type MockupTemplateSelectionInput = {
  niche?: string | null;
  businessName?: string | null;
  campaignType?: string | null;
  fields?: Record<string, unknown> | null;
  text?: string | Array<string | null | undefined> | null;
};

export type MockupTemplateSelection = {
  variant: MockupTemplateVariant;
  label: string;
  reason: string;
  matchedKeyword: string | null;
  isFoodTemplate: boolean;
  isClearlyNonFood: boolean;
  mismatchWarning: string | null;
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
      'orthodontic',
      'orthodontics',
      'dentist',
      'dentistry',
      'dental',
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
    keywords: ['coffee', 'cafe', 'coffeehouse', 'espresso', 'roaster', 'java'],
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
  const serviceMatch = findKeywordMatch(SERVICE_VARIANT_KEYWORDS, normalized);
  const foodMatch = findKeywordMatch(FOOD_VARIANT_KEYWORDS, normalized);
  const isClearlyNonFood = Boolean(serviceMatch);

  const selected = serviceMatch || foodMatch || null;
  const variant = selected?.group.variant ?? 'local_service';
  const isFoodTemplate = isFoodMockupTemplate(variant);
  const mismatchWarning =
    isClearlyNonFood && isFoodTemplate ? 'Template mismatch: non-food prospect mapped to food template.' : null;

  return {
    variant,
    label: getMockupVariantLabel(variant),
    reason: selected
      ? `Selected from ${selected.group.reason}: "${selected.keyword}".`
      : 'No food or niche-specific service keywords matched; using the non-food local service fallback.',
    matchedKeyword: selected?.keyword ?? null,
    isFoodTemplate,
    isClearlyNonFood,
    mismatchWarning,
  };
}

export function getMockupVariantLabel(variant: MockupTemplateVariant) {
  return VARIANT_LABELS[variant];
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return (appUrl || fallbackOrigin || 'https://mockupcrm67.netlify.app').replace(/\/+$/, '');
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
