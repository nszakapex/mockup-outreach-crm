import type { MockupMediaAsset, MockupVisualProfile, RichMockupData } from './mockup-rich-data';
import {
  getMockupLayoutSignatureLabel,
  isFoodMockupTemplate,
  type MockupLayoutSignature,
  type MockupTemplateSelection,
  type MockupTemplateVariant,
} from './mockup-templates';

export type MockupV2Diagnostics = {
  designFamily: MockupDesignFamily;
  designFamilyLabel: string;
  designFamilyInferred: boolean;
  designFamilyReason: string;
  layoutSignature: MockupLayoutSignature;
  layoutLabel: string;
  layoutRendererName: MockupLayoutRendererName;
  sectionPlan: string[];
  layoutInferred: boolean;
  visualProfileSummary: string;
  hasVisualProfile: boolean;
  mediaAssetCount: number;
  usableMediaAssetCount: number;
  fallbackMediaCount: number;
  usesFallbackMedia: boolean;
  heroImageUrl: string | null;
  heroImageSourceType: string | null;
  imageSourceTypes: string[];
  mobileRiskWarnings: string[];
  warnings: string[];
};

export const MOCKUP_DESIGN_FAMILIES = [
  'editorial_photo_story',
  'modern_service_stack',
  'premium_dark_showcase',
  'clean_conversion_clinic',
  'project_board_contractor',
  'cozy_local_brand',
  'transformation_gallery',
  'hospitality_experience',
  'minimalist_luxury_service',
  'bold_action_local_service',
] as const;

export type MockupDesignFamily = (typeof MOCKUP_DESIGN_FAMILIES)[number];

export type MockupDesignFamilySelection = {
  family: MockupDesignFamily;
  label: string;
  reason: string;
  inferred: boolean;
};

export type MockupLayoutRendererName =
  | 'ImmersivePhotoHeroLayout'
  | 'SplitProofHeroLayout'
  | 'EditorialServiceGridLayout'
  | 'DarkPremiumTransformLayout'
  | 'CleanClinicTrustLayout'
  | 'WarmLocalStoryLayout'
  | 'ContractorProjectBoardLayout'
  | 'AutoDetailShowcaseLayout'
  | 'PetCareBookingLayout'
  | 'FitnessEnergyLandingLayout'
  | 'ProfessionalTrustPageLayout'
  | 'LuxuryServicePageLayout'
  | 'RestaurantExperienceLayout'
  | 'LocalServiceFallbackLayout';

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

const DESIGN_FAMILY_LABELS: Record<MockupDesignFamily, string> = {
  editorial_photo_story: 'Editorial Photo Story',
  modern_service_stack: 'Modern Service Stack',
  premium_dark_showcase: 'Premium Dark Showcase',
  clean_conversion_clinic: 'Clean Conversion Clinic',
  project_board_contractor: 'Project Board Contractor',
  cozy_local_brand: 'Cozy Local Brand',
  transformation_gallery: 'Transformation Gallery',
  hospitality_experience: 'Hospitality Experience',
  minimalist_luxury_service: 'Minimalist Luxury Service',
  bold_action_local_service: 'Bold Action Local Service',
};

const FAMILY_OPTIONS_BY_VARIANT: Record<MockupTemplateVariant, readonly MockupDesignFamily[]> = {
  home_service: ['modern_service_stack', 'bold_action_local_service', 'cozy_local_brand'],
  contractor: ['project_board_contractor', 'modern_service_stack', 'bold_action_local_service'],
  medical_aesthetics: ['clean_conversion_clinic', 'minimalist_luxury_service', 'editorial_photo_story'],
  auto_service: ['premium_dark_showcase', 'transformation_gallery', 'bold_action_local_service'],
  pet_service: ['cozy_local_brand', 'modern_service_stack', 'editorial_photo_story'],
  fitness_studio: ['bold_action_local_service', 'transformation_gallery', 'premium_dark_showcase'],
  professional_service: ['minimalist_luxury_service', 'clean_conversion_clinic', 'modern_service_stack'],
  local_service: ['modern_service_stack', 'cozy_local_brand', 'bold_action_local_service'],
  coffee_shop: ['hospitality_experience', 'cozy_local_brand', 'editorial_photo_story'],
  restaurant: ['hospitality_experience', 'editorial_photo_story', 'minimalist_luxury_service'],
  bar_grill: ['hospitality_experience', 'premium_dark_showcase', 'bold_action_local_service'],
  premium_dining: ['minimalist_luxury_service', 'hospitality_experience', 'editorial_photo_story'],
  nonprofit_cafe: ['cozy_local_brand', 'editorial_photo_story', 'hospitality_experience'],
  food_truck: ['bold_action_local_service', 'hospitality_experience', 'modern_service_stack'],
};

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

export function getMockupDesignFamilyLabel(family: MockupDesignFamily) {
  return DESIGN_FAMILY_LABELS[family];
}

export function getMockupDesignFamilySelection({
  rich,
  template,
  niche,
  businessName,
}: {
  rich: RichMockupData;
  template: MockupTemplateSelection;
  niche?: string | null;
  businessName?: string | null;
}): MockupDesignFamilySelection {
  const explicit = normalizeDesignFamily(rich.design_family || rich.visual_profile?.design_family);
  if (explicit) {
    return {
      family: explicit,
      label: getMockupDesignFamilyLabel(explicit),
      reason: `Explicit design_family "${explicit}" supplied in mockup data.`,
      inferred: false,
    };
  }

  const text = [
    rich.visual_direction,
    rich.brand_tone,
    rich.design_style_key,
    rich.hero_mode,
    rich.image_treatment,
    rich.cta_style,
    rich.proof_style,
    rich.palette_direction,
    rich.typography_direction,
    rich.photo_strategy,
    rich.visual_profile?.brand_mood,
    rich.visual_profile?.brand_tone,
    rich.visual_profile?.design_style_key,
    rich.visual_profile?.hero_mode,
    rich.visual_profile?.image_treatment,
    rich.visual_profile?.proof_style,
    rich.visual_profile?.palette_direction,
    rich.visual_profile?.typography_direction,
    rich.visual_profile?.photo_strategy,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const textMatch = inferDesignFamilyFromDirection(text, template.variant);
  if (textMatch) {
    return {
      family: textMatch,
      label: getMockupDesignFamilyLabel(textMatch),
      reason: 'Inferred from visual direction, tone, hero mode, image treatment, CTA style, or proof style.',
      inferred: true,
    };
  }

  const options = FAMILY_OPTIONS_BY_VARIANT[template.variant];
  const seed = [businessName, niche, template.variant, rich.layout_signature, rich.template_variant]
    .filter(Boolean)
    .join('|');
  const family = options[hashString(seed) % options.length] || options[0];

  return {
    family,
    label: getMockupDesignFamilyLabel(family),
    reason: `Inferred from ${template.label} niche using family rotation.`,
    inferred: true,
  };
}

export function getMockupLayoutRendererName(
  signature: MockupLayoutSignature,
  variant: MockupTemplateVariant,
  designFamily?: MockupDesignFamily | null
): MockupLayoutRendererName {
  if (designFamily) {
    if (designFamily === 'hospitality_experience') return 'RestaurantExperienceLayout';
    if (designFamily === 'editorial_photo_story') {
      return isFoodMockupTemplate(variant) ? 'ImmersivePhotoHeroLayout' : 'WarmLocalStoryLayout';
    }
    if (designFamily === 'modern_service_stack') return 'EditorialServiceGridLayout';
    if (designFamily === 'premium_dark_showcase') return 'DarkPremiumTransformLayout';
    if (designFamily === 'clean_conversion_clinic') return 'CleanClinicTrustLayout';
    if (designFamily === 'project_board_contractor') return 'ContractorProjectBoardLayout';
    if (designFamily === 'cozy_local_brand') return variant === 'pet_service' ? 'PetCareBookingLayout' : 'WarmLocalStoryLayout';
    if (designFamily === 'transformation_gallery') {
      if (variant === 'fitness_studio') return 'FitnessEnergyLandingLayout';
      return 'AutoDetailShowcaseLayout';
    }
    if (designFamily === 'minimalist_luxury_service') return 'LuxuryServicePageLayout';
    if (designFamily === 'bold_action_local_service') {
      if (variant === 'fitness_studio') return 'FitnessEnergyLandingLayout';
      return 'SplitProofHeroLayout';
    }
  }

  if (signature === 'pet_care_booking') return 'PetCareBookingLayout';
  if (signature === 'contractor_project_board') return 'ContractorProjectBoardLayout';
  if (signature === 'auto_detail_showcase') return 'AutoDetailShowcaseLayout';
  if (signature === 'dark_premium_transform') return 'DarkPremiumTransformLayout';
  if (signature === 'clean_clinic_trust') return 'CleanClinicTrustLayout';
  if (signature === 'fitness_energy_landing') return 'FitnessEnergyLandingLayout';
  if (signature === 'professional_trust_page') return 'ProfessionalTrustPageLayout';
  if (signature === 'luxury_service_page') return 'LuxuryServicePageLayout';
  if (signature === 'warm_local_story') return 'WarmLocalStoryLayout';
  if (signature === 'split_proof_hero') return 'SplitProofHeroLayout';
  if (signature === 'editorial_service_grid') return 'EditorialServiceGridLayout';
  if (signature === 'immersive_photo_hero') return 'ImmersivePhotoHeroLayout';

  if (isFoodMockupTemplate(variant)) {
    return 'RestaurantExperienceLayout';
  }

  return 'LocalServiceFallbackLayout';
}

export function getMockupLayoutSectionPlan({
  signature,
  variant,
  designFamily,
  hasGallery,
  hasSnapshot,
}: {
  signature: MockupLayoutSignature;
  variant: MockupTemplateVariant;
  designFamily?: MockupDesignFamily | null;
  hasGallery: boolean;
  hasSnapshot: boolean;
}) {
  const rendererName = getMockupLayoutRendererName(signature, variant, designFamily);
  const plans: Record<MockupLayoutRendererName, string[]> = {
    PetCareBookingLayout: ['pet hero', 'booking strip', 'grooming services', 'trust and safety', 'happy-pet proof', 'location', 'appointment CTA'],
    RestaurantExperienceLayout: ['atmosphere hero', 'occasion story', 'menu highlights', 'visit or reservation', 'social proof', 'reserve CTA'],
    ContractorProjectBoardLayout: ['project-board hero', 'project proof', 'services and scope', 'process timeline', 'review strip', 'service area', 'estimate CTA'],
    AutoDetailShowcaseLayout: ['dark showcase hero', 'transformation proof', 'package cards', 'detail process', 'finish gallery', 'book detail CTA'],
    DarkPremiumTransformLayout: ['dark transformation hero', 'before and after proof', 'package cards', 'process', 'protection proof', 'book detail CTA'],
    CleanClinicTrustLayout: ['consultation hero', 'treatments', 'provider trust', 'what to expect', 'reviews', 'consultation CTA'],
    LuxuryServicePageLayout: ['quiet premium hero', 'service menu', 'trust editorial', 'what to expect', 'proof', 'consultation CTA'],
    FitnessEnergyLandingLayout: ['movement hero', 'program cards', 'schedule and trial', 'coach proof', 'community proof', 'start trial CTA'],
    ProfessionalTrustPageLayout: ['authority hero', 'service clarity', 'process', 'proof', 'contact CTA'],
    WarmLocalStoryLayout: ['warm story hero', 'local trust', 'services', 'proof', 'location', 'final CTA'],
    SplitProofHeroLayout: ['split proof hero', 'proof cards', 'services', 'process', 'service area', 'CTA'],
    EditorialServiceGridLayout: ['service index hero', 'service grid', 'proof rail', 'process', 'local search', 'CTA'],
    ImmersivePhotoHeroLayout: ['full-bleed hero', 'proof ribbon', 'service highlights', 'gallery', 'visit path', 'final CTA'],
    LocalServiceFallbackLayout: ['service-first hero', 'proof', 'services', 'process', 'service area', 'CTA'],
  };

  return plans[rendererName].filter((section) => {
    if (!hasGallery && /gallery/i.test(section)) return false;
    if (!hasSnapshot && section === 'proof rail') return true;
    return true;
  });
}

export function getMockupV2Diagnostics(input: DiagnosticsInput): MockupV2Diagnostics {
  const mediaAssets = getAllMockupMediaAssets(input.rich);
  const usableMediaAssets = mediaAssets.filter((asset) => isUsableImageUrl(asset.image_url));
  const fallbackMediaCount = mediaAssets.filter((asset) => asset.source_type === 'fallback').length;
  const heroAsset = selectHeroMediaAsset(usableMediaAssets);
  const sourceTypes = [...new Set(usableMediaAssets.map((asset) => asset.source_type))];
  const hasVisualProfile = hasUsefulVisualProfile(input.rich.visual_profile);
  const designFamilySelection = getMockupDesignFamilySelection({
    rich: input.rich,
    template: input.template,
    niche: input.niche,
    businessName: input.businessName,
  });
  const layoutRendererName = getMockupLayoutRendererName(
    input.template.layoutSignature,
    input.template.variant,
    designFamilySelection.family
  );
  const sectionPlan = getMockupLayoutSectionPlan({
    signature: input.template.layoutSignature,
    variant: input.template.variant,
    designFamily: designFamilySelection.family,
    hasGallery: usableMediaAssets.length > 1,
    hasSnapshot: Boolean(input.rich.current_site_snapshot),
  });
  const isApexPublicMockup =
    input.campaignType === 'apex_social_content' &&
    (input.apexDeliveryMode === 'public_mockup' || input.apexDeliveryMode === 'link_plus_summary');
  const warnings: string[] = [];
  const mobileRiskWarnings: string[] = [];

  for (const asset of mediaAssets) {
    if (!isUsableImageUrl(asset.image_url)) {
      warnings.push(`Broken or missing image URL in media asset: ${asset.alt || asset.type}.`);
    }
  }

  if (input.template.layoutInferred) {
    warnings.push('No explicit layout_signature; renderer will use an inferred layout.');
    mobileRiskWarnings.push('Layout is inferred; confirm the mobile renderer matches the prospect category.');
  }

  if (designFamilySelection.inferred) {
    warnings.push('No explicit design_family; renderer selected a family from niche and art-direction signals.');
  }

  if (layoutRendererName === 'LocalServiceFallbackLayout' && input.rich.layout_signature) {
    warnings.push('layout_signature is present but maps to the local-service fallback renderer.');
  }

  if (!hasVisualProfile) {
    warnings.push('No visual_profile; renderer will infer a niche-based visual profile.');
    mobileRiskWarnings.push('No visual_profile; mobile page may feel less tailored.');
  } else if (isGenericVisualProfile(input.rich.visual_profile)) {
    warnings.push('Visual profile is generic; add mood, style, trust, CTA, and photo direction.');
    mobileRiskWarnings.push('Generic visual_profile; mobile hero and CTA may feel templated.');
  }

  if (mediaAssets.length === 0) warnings.push('No media_assets supplied; mockup will use concept visuals.');
  if (usableMediaAssets.length > 0 && usableMediaAssets.length < 2) {
    warnings.push('Fewer than 2 usable images; public mockup may still feel thin.');
    mobileRiskWarnings.push('Fewer than 2 usable images; mobile visual rhythm may feel thin.');
  }
  if (mediaAssets.length === 0) mobileRiskWarnings.push('No media assets; mobile page will rely on designed image surfaces.');
  if (fallbackMediaCount > 0) {
    mobileRiskWarnings.push('Fallback media is present; public labels are hidden, but real public photos would improve mobile polish.');
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
  if (!input.rich.hero_mode && !input.rich.image_treatment && !input.rich.cta_style && !input.rich.proof_style) {
    warnings.push('No hero_mode, image_treatment, cta_style, or proof_style; design differentiation depends mostly on inferred family.');
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
    if (!input.rich.design_family && !input.rich.visual_profile?.design_family) {
      warnings.push('Apex public mockup record should include design_family for better batch variety.');
    }
    if (!input.rich.visual_profile) warnings.push('Apex public mockup record should include visual_profile.');
    if (mediaAssets.length === 0) warnings.push('Apex public mockup record should include media_assets.');
    if (usableMediaAssets.length < 2) {
      warnings.push('Apex public mockup record should include at least 2 usable public images when available.');
    }
  }

  return {
    designFamily: designFamilySelection.family,
    designFamilyLabel: designFamilySelection.label,
    designFamilyInferred: designFamilySelection.inferred,
    designFamilyReason: designFamilySelection.reason,
    layoutSignature: input.template.layoutSignature,
    layoutLabel: getMockupLayoutSignatureLabel(input.template.layoutSignature),
    layoutRendererName,
    sectionPlan,
    layoutInferred: input.template.layoutInferred,
    visualProfileSummary: summarizeVisualProfile(input.rich.visual_profile, input.template.variant),
    hasVisualProfile,
    mediaAssetCount: mediaAssets.length,
    usableMediaAssetCount: usableMediaAssets.length,
    fallbackMediaCount,
    usesFallbackMedia: fallbackMediaCount > 0,
    heroImageUrl: heroAsset?.image_url || null,
    heroImageSourceType: heroAsset?.source_type || null,
    imageSourceTypes: sourceTypes,
    mobileRiskWarnings: [...new Set(mobileRiskWarnings)],
    warnings: [...new Set(warnings)],
  };
}

function normalizeDesignFamily(value: unknown): MockupDesignFamily | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return (MOCKUP_DESIGN_FAMILIES as readonly string[]).includes(normalized)
    ? (normalized as MockupDesignFamily)
    : null;
}

function inferDesignFamilyFromDirection(text: string, variant: MockupTemplateVariant): MockupDesignFamily | null {
  if (!text) return null;
  if (/project|estimate|proof board|portfolio|worksite|hard edge|scope/.test(text)) return 'project_board_contractor';
  if (/dark|gloss|showroom|high contrast|black|premium dark/.test(text)) return 'premium_dark_showcase';
  if (/transform|before|after|result|gallery|reveal/.test(text)) return 'transformation_gallery';
  if (/clinic|clinical|consultation|treatment|provider|calm|compliant/.test(text)) return 'clean_conversion_clinic';
  if (/warm|friendly|cozy|local|comfort|soft|neighborhood/.test(text)) return 'cozy_local_brand';
  if (/hospitality|reservation|occasion|atmosphere|dining|chef|menu|private dining/.test(text)) return 'hospitality_experience';
  if (/minimal|luxury|elegant|quiet|refined|premium service/.test(text)) return 'minimalist_luxury_service';
  if (/bold|kinetic|energy|urgent|action|call now|fast|high energy/.test(text)) return 'bold_action_local_service';
  if (/editorial|story|photo story|narrative|magazine/.test(text)) return 'editorial_photo_story';
  if (/stack|service grid|service index|practical|utility/.test(text)) return 'modern_service_stack';
  if (variant === 'restaurant' || variant === 'premium_dining') return 'hospitality_experience';
  return null;
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function summarizeVisualProfile(profile: MockupVisualProfile | null | undefined, variant: MockupTemplateVariant) {
  if (!profile) return `Inferred ${variant.replace(/_/g, ' ')} visual profile`;
  const parts = [
    profile.brand_mood,
    profile.brand_tone,
    profile.design_family,
    profile.design_style_key,
    profile.typography_mood,
    profile.hero_mode,
    profile.image_treatment,
    profile.proof_style,
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
      profile.brand_tone ||
      profile.design_family ||
      profile.design_style_key ||
      profile.typography_mood ||
      profile.layout_signature ||
      profile.hero_mode ||
      profile.image_treatment ||
      profile.proof_style ||
      profile.palette_direction ||
      profile.typography_direction ||
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
    profile.brand_tone,
    profile.design_family,
    profile.design_style_key,
    profile.typography_mood,
    profile.hero_mode,
    profile.image_treatment,
    profile.proof_style,
    profile.palette_direction,
    profile.typography_direction,
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
