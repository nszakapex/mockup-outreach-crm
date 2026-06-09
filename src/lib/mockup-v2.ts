import type { MockupMediaAsset, MockupVisualProfile, RichMockupData } from './mockup-rich-data';
import {
  getMockupLayoutSignatureLabel,
  isFoodMockupTemplate,
  type MockupLayoutSignature,
  type MockupTemplateSelection,
  type MockupTemplateVariant,
} from './mockup-templates';

export type MockupV2Diagnostics = {
  layoutSignature: MockupLayoutSignature;
  layoutLabel: string;
  layoutInferred: boolean;
  visualProfileSummary: string;
  hasVisualProfile: boolean;
  mediaAssetCount: number;
  usableMediaAssetCount: number;
  heroImageUrl: string | null;
  heroImageSourceType: string | null;
  imageSourceTypes: string[];
  warnings: string[];
};

type DiagnosticsInput = {
  rich: RichMockupData;
  template: MockupTemplateSelection;
  niche?: string | null;
  businessName?: string | null;
  campaignType?: string | null;
  apexDeliveryMode?: string | null;
  emailBody?: string | null;
};

const FOOD_TERMS = [
  'menu',
  'order',
  'reservations',
  'reservation',
  'happy hour',
  'catering',
  'gift cards',
  'gift card',
  'best time to visit',
  'find your order',
];

const GENERIC_NAV_TERMS = ['home', 'about', 'services', 'gallery', 'contact'];
const GENERIC_OFFER_TERMS = ['services', 'service', 'quality service', 'free estimate', 'contact us', 'about us'];
const GENERIC_SECTION_TERMS = ['hero', 'services', 'about', 'reviews', 'contact', 'gallery'];

export function getAllMockupMediaAssets(rich: RichMockupData) {
  return dedupeMediaAssets([...(rich.media_assets || []), ...(rich.proof_assets || []), ...(rich.gallery_assets || [])]);
}

export function getUsableMockupMediaAssets(rich: RichMockupData) {
  return getAllMockupMediaAssets(rich).filter((asset) => isUsableImageUrl(asset.image_url));
}

export function selectHeroMediaAsset(assets: MockupMediaAsset[]) {
  return (
    assets.find((asset) => asset.type === 'hero' && asset.confidence !== 'low') ||
    assets.find((asset) => asset.type === 'hero') ||
    assets.find((asset) => ['project', 'proof', 'service', 'exterior', 'atmosphere'].includes(asset.type)) ||
    assets[0] ||
    null
  );
}

export function getMockupV2Diagnostics(input: DiagnosticsInput): MockupV2Diagnostics {
  const mediaAssets = getAllMockupMediaAssets(input.rich);
  const usableMediaAssets = mediaAssets.filter((asset) => isUsableImageUrl(asset.image_url));
  const heroAsset = selectHeroMediaAsset(usableMediaAssets);
  const sourceTypes = [...new Set(usableMediaAssets.map((asset) => asset.source_type))];
  const hasVisualProfile = hasUsefulVisualProfile(input.rich.visual_profile);
  const isApexPublicMockup =
    input.campaignType === 'apex_social_content' &&
    (input.apexDeliveryMode === 'public_mockup' || input.apexDeliveryMode === 'link_plus_summary');
  const warnings: string[] = [];

  for (const asset of mediaAssets) {
    if (!isUsableImageUrl(asset.image_url)) {
      warnings.push(`Broken or missing image URL in media asset: ${asset.alt || asset.type}.`);
    }
  }

  if (input.template.layoutInferred) {
    warnings.push('No explicit layout_signature; renderer will use an inferred layout.');
  }

  if (!hasVisualProfile) {
    warnings.push('No visual_profile; renderer will infer a niche-based visual profile.');
  } else if (isGenericVisualProfile(input.rich.visual_profile)) {
    warnings.push('Visual profile is generic; add mood, style, trust, CTA, and photo direction.');
  }

  if (mediaAssets.length === 0) warnings.push('No media_assets supplied; mockup will use concept visuals.');
  if (usableMediaAssets.length > 0 && usableMediaAssets.length < 2) {
    warnings.push('Fewer than 2 usable images; public mockup may still feel thin.');
  }

  if (isGenericList(input.rich.homepage_sections, GENERIC_SECTION_TERMS)) {
    warnings.push('homepage_sections look generic; add prospect-specific section ideas.');
  }
  if (isGenericList(input.rich.proposed_site_nav, GENERIC_NAV_TERMS)) {
    warnings.push('proposed_site_nav looks generic; make the nav match the buyer journey.');
  }
  if (isGenericList(input.rich.menu_or_offer_items, GENERIC_OFFER_TERMS)) {
    warnings.push('menu_or_offer_items look generic; use actual services or conservative category-level offers.');
  }
  if (!input.rich.visual_direction && !input.rich.visual_profile?.brand_mood) {
    warnings.push('visual_direction is empty; mockup may read as templated.');
  }

  if (!isFoodMockupTemplate(input.template.variant)) {
    const foodHits = findFoodTerms(input.rich);
    if (foodHits.length > 0) {
      warnings.push(`Non-food prospect contains food-specific labels: ${foodHits.join(', ')}.`);
    }
  }

  if (isApexPublicMockup) {
    if (!input.rich.layout_signature && !input.rich.visual_profile?.layout_signature) {
      warnings.push('Apex public mockup record should include layout_signature.');
    }
    if (!input.rich.visual_profile) warnings.push('Apex public mockup record should include visual_profile.');
    if (mediaAssets.length === 0) warnings.push('Apex public mockup record should include media_assets.');
    if (usableMediaAssets.length < 2) {
      warnings.push('Apex public mockup record should include at least 2 usable public images when available.');
    }
  }

  return {
    layoutSignature: input.template.layoutSignature,
    layoutLabel: getMockupLayoutSignatureLabel(input.template.layoutSignature),
    layoutInferred: input.template.layoutInferred,
    visualProfileSummary: summarizeVisualProfile(input.rich.visual_profile, input.template.variant),
    hasVisualProfile,
    mediaAssetCount: mediaAssets.length,
    usableMediaAssetCount: usableMediaAssets.length,
    heroImageUrl: heroAsset?.image_url || null,
    heroImageSourceType: heroAsset?.source_type || null,
    imageSourceTypes: sourceTypes,
    warnings: [...new Set(warnings)],
  };
}

export function summarizeVisualProfile(profile: MockupVisualProfile | null | undefined, variant: MockupTemplateVariant) {
  if (!profile) return `Inferred ${variant.replace(/_/g, ' ')} visual profile`;
  const parts = [
    profile.brand_mood,
    profile.design_style_key,
    profile.typography_mood,
    profile.photo_strategy,
    profile.ui_personality,
    profile.trust_style,
    profile.cta_style,
  ].filter((item): item is string => Boolean(item && item.trim()));
  return parts.length > 0 ? parts.slice(0, 4).join(' | ') : `Generic ${variant.replace(/_/g, ' ')} visual profile`;
}

export function isUsableImageUrl(value: string | null | undefined) {
  return Boolean(value && /^(https?:\/\/|\/)/i.test(value.trim()));
}

function dedupeMediaAssets(assets: MockupMediaAsset[]) {
  const seen = new Set<string>();
  return assets.filter((asset) => {
    const key = asset.image_url.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasUsefulVisualProfile(profile: MockupVisualProfile | null | undefined) {
  if (!profile) return false;
  return Boolean(
    profile.brand_mood ||
      profile.design_style_key ||
      profile.typography_mood ||
      profile.layout_signature ||
      profile.photo_strategy ||
      profile.ui_personality ||
      profile.trust_style ||
      profile.cta_style ||
      Object.values(profile.color_palette || {}).some(Boolean)
  );
}

function isGenericVisualProfile(profile: MockupVisualProfile | null | undefined) {
  if (!profile) return false;
  const text = [
    profile.brand_mood,
    profile.design_style_key,
    profile.typography_mood,
    profile.photo_strategy,
    profile.ui_personality,
    profile.trust_style,
    profile.cta_style,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (!text) return true;
  return /clean modern|professional|premium|local business|high quality|generic/.test(text) && text.length < 90;
}

function isGenericList(items: string[] | undefined, genericTerms: string[]) {
  if (!items || items.length === 0) return true;
  const normalized = items.map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (normalized.length === 0) return true;
  return normalized.every((item) => genericTerms.includes(item));
}

function findFoodTerms(rich: RichMockupData) {
  const values = [
    ...(rich.proposed_site_nav || []),
    ...(rich.homepage_sections || []),
    ...(rich.menu_or_offer_items || []),
  ];
  const joined = values.join(' | ').toLowerCase();
  return FOOD_TERMS.filter((term) => joined.includes(term));
}
