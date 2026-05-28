/* Hallmark pre-emit critique: P5 H4 E4 S4 R5 V5 */

export const MOCKUP_TEMPLATE_VARIANTS = [
  'coffee_shop',
  'restaurant',
  'bar_grill',
  'premium_dining',
  'nonprofit_cafe',
  'food_truck',
  'local_service',
] as const;

export type MockupTemplateVariant = (typeof MOCKUP_TEMPLATE_VARIANTS)[number];

const VARIANT_LABELS: Record<MockupTemplateVariant, string> = {
  coffee_shop: 'Coffee Shop',
  restaurant: 'Restaurant',
  bar_grill: 'Bar & Grill',
  premium_dining: 'Premium Dining',
  nonprofit_cafe: 'Nonprofit Cafe',
  food_truck: 'Food Truck',
  local_service: 'Local Service',
};

const VARIANT_KEYWORDS: Array<{ variant: MockupTemplateVariant; keywords: string[] }> = [
  {
    variant: 'food_truck',
    keywords: ['food truck', 'mobile cafe', 'mobile coffee', 'truck', 'pop-up', 'pop up'],
  },
  {
    variant: 'nonprofit_cafe',
    keywords: ['nonprofit', 'non-profit', 'community cafe', 'publick house', 'public market', 'mission'],
  },
  {
    variant: 'premium_dining',
    keywords: ['steakhouse', 'premium dining', 'fine dining', 'supper club', 'bistro', 'wine bar'],
  },
  {
    variant: 'bar_grill',
    keywords: ['bar', 'grill', 'tavern', 'patio', 'pub', 'sports bar', 'taproom', 'brewery'],
  },
  {
    variant: 'coffee_shop',
    keywords: ['coffee', 'cafe', 'coffeehouse', 'espresso', 'roaster', 'java'],
  },
  {
    variant: 'local_service',
    keywords: [
      'hvac',
      'plumbing',
      'plumber',
      'roofing',
      'contractor',
      'repair',
      'dental',
      'salon',
      'spa',
      'service',
      'heating',
      'electric',
      'landscaping',
    ],
  },
  {
    variant: 'restaurant',
    keywords: ['restaurant', 'casual dining', 'diner', 'eatery', 'kitchen', 'pizza'],
  },
];

export function getMockupTemplateVariant(niche?: string | null): MockupTemplateVariant {
  const normalized = (niche || '').toLowerCase();
  for (const { variant, keywords } of VARIANT_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return variant;
  }
  return 'restaurant';
}

export function getMockupVariantLabel(variant: MockupTemplateVariant) {
  return VARIANT_LABELS[variant];
}

export function buildPublicMockupUrl(slug: string | null | undefined, fallbackOrigin?: string | null) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const base = (appUrl || fallbackOrigin || 'https://mockupcrm67.netlify.app').replace(/\/+$/, '');
  const cleanSlug = (slug || '')
    .trim()
    .replace(/^https?:\/\/[^/]+\/mockups\//i, '')
    .replace(/^\/?mockups\//i, '')
    .replace(/^\/+/, '');

  return cleanSlug ? `${base}/mockups/${encodeURIComponent(cleanSlug)}` : base;
}

export function parseMockupFeatures(featuresIncluded?: string | null) {
  return (featuresIncluded || '')
    .split(/[\n,;|]+/)
    .map((feature) => feature.trim())
    .filter(Boolean)
    .slice(0, 8);
}
