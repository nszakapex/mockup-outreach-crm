import type { MockupMediaAsset, MockupVisualProfile, RichMockupData } from './mockup-rich-data';
import type { SocialAuditData } from './social-audit-data';
import {
  getMockupLayoutSignatureLabel,
  isFoodMockupTemplate,
  type MockupLayoutSignature,
  type MockupTemplateSelection,
  type MockupTemplateVariant,
} from './mockup-templates';

export type MockupV2Diagnostics = {
  approvedArchetype: ApexApprovedArchetype | null;
  approvedArchetypeLabel: string;
  approvedArchetypeInferred: boolean;
  approvedArchetypeReason: string;
  personalizationScore: number | null;
  qualityGate: ApexPublicMockupQualityGate;
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
  social?: SocialAuditData | null;
  niche?: string | null;
  businessName?: string | null;
  campaignType?: string | null;
  apexDeliveryMode?: string | null;
  emailBody?: string | null;
  heroHeadline?: string | null;
  heroSubheadline?: string | null;
  primaryCta?: string | null;
  publicEmail?: string | null;
  notes?: string | null;
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

export const APEX_APPROVED_ARCHETYPES = [
  'premium_service_landing',
  'proof_first_contractor',
  'transformation_showcase',
  'clean_clinic_conversion',
  'warm_local_booking',
  'hospitality_experience',
  'professional_trust_page',
  'fitness_energy_page',
] as const;

export type ApexApprovedArchetype = (typeof APEX_APPROVED_ARCHETYPES)[number];

export type ApexApprovedArchetypeSelection = {
  archetype: ApexApprovedArchetype | null;
  label: string;
  reason: string;
  inferred: boolean;
};

export type ApexPublicMockupQualityGate = {
  required: boolean;
  outreachReady: boolean;
  label: 'Not applicable' | 'Outreach-ready' | 'Needs manual review' | 'Mockup not outreach-ready';
  severity: 'none' | 'pass' | 'warning' | 'fail';
  approvedArchetype: ApexApprovedArchetype | null;
  approvedArchetypeLabel: string;
  approvedArchetypeInferred: boolean;
  personalizationScore: number | null;
  failures: string[];
  warnings: string[];
};

const ARCHETYPE_LABELS: Record<ApexApprovedArchetype, string> = {
  premium_service_landing: 'Premium Service Landing',
  proof_first_contractor: 'Proof-first Contractor',
  transformation_showcase: 'Transformation Showcase',
  clean_clinic_conversion: 'Clean Clinic Conversion',
  warm_local_booking: 'Warm Local Booking',
  hospitality_experience: 'Hospitality Experience',
  professional_trust_page: 'Professional Trust Page',
  fitness_energy_page: 'Fitness Energy Page',
};

const ARCHETYPES_BY_VARIANT: Record<MockupTemplateVariant, readonly ApexApprovedArchetype[]> = {
  home_service: ['premium_service_landing'],
  contractor: ['proof_first_contractor'],
  medical_aesthetics: ['clean_clinic_conversion'],
  auto_service: ['transformation_showcase'],
  pet_service: ['warm_local_booking'],
  fitness_studio: ['fitness_energy_page', 'transformation_showcase'],
  professional_service: ['professional_trust_page', 'clean_clinic_conversion'],
  local_service: ['premium_service_landing', 'warm_local_booking', 'professional_trust_page'],
  coffee_shop: ['hospitality_experience'],
  restaurant: ['hospitality_experience'],
  bar_grill: ['hospitality_experience'],
  premium_dining: ['hospitality_experience'],
  nonprofit_cafe: ['hospitality_experience'],
  food_truck: ['hospitality_experience'],
};

const BANNED_GENERIC_COPY = [
  /make the result easier to trust/i,
  /make the .{0,40} easier to trust fast/i,
  /premium services for your lifestyle/i,
  /high-quality services you can trust/i,
  /your trusted local experts/i,
  /transform your experience/i,
  /elevate your brand/i,
  /boost your online presence/i,
  /modern solutions/i,
  /professional services for every need/i,
  /experience the difference/i,
];

const WEAK_HERO_PATTERNS = [
  /^premium .+ services$/i,
  /^quality .+ services$/i,
  /^trusted .+ experts$/i,
  /^your local .+$/i,
  /^.+ you can trust$/i,
  /^.+ without the guesswork$/i,
];

const VAGUE_TRUST_PATTERNS = [
  /^public (email|phone|contact|website|social|instagram|facebook)/i,
  /^linked (instagram|facebook|social)/i,
  /^active official site/i,
  /^local business/i,
  /^quality work/i,
  /^trusted service/i,
  /^professional service/i,
];

const INVENTED_TRUST_RISK_PATTERNS = [
  /award[- ]winning/i,
  /\b5[- ]star\b/i,
  /\bfive[- ]star\b/i,
  /\blicensed\b/i,
  /\binsured\b/i,
  /\byears? in business\b/i,
  /\bcertified\b/i,
];

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

export function getApexApprovedArchetypeLabel(archetype: ApexApprovedArchetype | null | undefined) {
  return archetype ? ARCHETYPE_LABELS[archetype] : 'Missing approved archetype';
}

export function getApexApprovedArchetypeSelection({
  rich,
  template,
  niche,
}: {
  rich: RichMockupData;
  template: MockupTemplateSelection;
  niche?: string | null;
}): ApexApprovedArchetypeSelection {
  const explicit = normalizeApprovedArchetype(rich.approved_archetype);
  if (explicit) {
    return {
      archetype: explicit,
      label: getApexApprovedArchetypeLabel(explicit),
      reason: `Explicit approved_archetype "${explicit}" supplied in mockup data.`,
      inferred: false,
    };
  }

  const inferred = inferApprovedArchetype(template.variant, niche);
  return {
    archetype: inferred,
    label: getApexApprovedArchetypeLabel(inferred),
    reason: inferred
      ? `Inferred ${getApexApprovedArchetypeLabel(inferred)} from template/niche for diagnostics only. Public mockups still require an explicit approved_archetype.`
      : 'No approved archetype could be inferred.',
    inferred: true,
  };
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
  const approvedArchetypeSelection = getApexApprovedArchetypeSelection({
    rich: input.rich,
    template: input.template,
    niche: input.niche,
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
  const qualityGate = getApexPublicMockupQualityGate({
    rich: input.rich,
    template: input.template,
    social: input.social,
    campaignType: input.campaignType,
    apexDeliveryMode: input.apexDeliveryMode,
    emailBody: input.emailBody,
    heroHeadline: input.heroHeadline,
    heroSubheadline: input.heroSubheadline,
    primaryCta: input.primaryCta,
    publicEmail: input.publicEmail,
    notes: input.notes,
    niche: input.niche,
    mediaAssets,
    usableMediaAssets,
    approvedArchetypeSelection,
  });

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
    if (approvedArchetypeSelection.inferred) {
      warnings.push('Apex public mockup record must include explicit approved_archetype; inferred value is diagnostics only.');
    }
    if (input.rich.personalization_score == null) {
      warnings.push('Apex public mockup record must include personalization_score.');
    } else if (input.rich.personalization_score < 90) {
      warnings.push('personalization_score is below 90; manually spot-check before outreach.');
    }
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

  if (qualityGate.required) {
    warnings.push(...qualityGate.warnings);
    if (!qualityGate.outreachReady) {
      warnings.push(`Mockup not outreach-ready: ${qualityGate.failures.join(' ')}`);
    }
  }

  return {
    approvedArchetype: approvedArchetypeSelection.archetype,
    approvedArchetypeLabel: approvedArchetypeSelection.label,
    approvedArchetypeInferred: approvedArchetypeSelection.inferred,
    approvedArchetypeReason: approvedArchetypeSelection.reason,
    personalizationScore: input.rich.personalization_score ?? null,
    qualityGate,
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

export function getApexPublicMockupQualityGate({
  rich,
  template,
  social,
  campaignType,
  apexDeliveryMode,
  emailBody,
  heroHeadline,
  heroSubheadline,
  primaryCta,
  publicEmail,
  notes,
  niche,
  mediaAssets = getAllMockupMediaAssets(rich),
  usableMediaAssets = getUsableMockupMediaAssets(rich),
  approvedArchetypeSelection = getApexApprovedArchetypeSelection({ rich, template, niche }),
}: {
  rich: RichMockupData;
  template: MockupTemplateSelection;
  social?: SocialAuditData | null;
  campaignType?: string | null;
  apexDeliveryMode?: string | null;
  emailBody?: string | null;
  heroHeadline?: string | null;
  heroSubheadline?: string | null;
  primaryCta?: string | null;
  publicEmail?: string | null;
  notes?: string | null;
  niche?: string | null;
  mediaAssets?: MockupMediaAsset[];
  usableMediaAssets?: MockupMediaAsset[];
  approvedArchetypeSelection?: ApexApprovedArchetypeSelection;
}): ApexPublicMockupQualityGate {
  const required = isApexPublicMockupWorkflow(campaignType, apexDeliveryMode, emailBody);
  const personalizationScore = rich.personalization_score ?? null;
  const failures: string[] = [];
  const warnings: string[] = [];

  if (!required) {
    return {
      required,
      outreachReady: true,
      label: 'Not applicable',
      severity: 'none',
      approvedArchetype: approvedArchetypeSelection.archetype,
      approvedArchetypeLabel: approvedArchetypeSelection.label,
      approvedArchetypeInferred: approvedArchetypeSelection.inferred,
      personalizationScore,
      failures,
      warnings,
    };
  }

  if (!normalizeApprovedArchetype(rich.approved_archetype)) {
    failures.push('approved_archetype is missing or invalid.');
  }

  if (
    approvedArchetypeSelection.archetype &&
    !isArchetypeCompatibleWithVariant(approvedArchetypeSelection.archetype, template.variant, niche)
  ) {
    failures.push(
      `approved_archetype "${approvedArchetypeSelection.archetype}" does not match the ${template.label} niche standard.`
    );
  }

  if (personalizationScore === null) {
    failures.push('personalization_score is missing.');
  } else if (personalizationScore < 85) {
    failures.push(`personalization_score ${personalizationScore} is below 85.`);
  } else if (personalizationScore < 90) {
    warnings.push(`personalization_score ${personalizationScore} is below 90; manually spot-check before outreach.`);
  }

  const headline = cleanText(heroHeadline);
  const subheadline = cleanText(heroSubheadline);
  const visualDirection = cleanText(rich.visual_direction);
  const headlineFields = [headline, subheadline, visualDirection, ...(rich.homepage_sections || [])];
  if (!headline) {
    failures.push('hero_headline is missing.');
  } else if (isGenericHeroHeadline(headline)) {
    failures.push('hero_headline is generic or awkward.');
  }
  const bannedHits = findBannedCopy(headlineFields);
  if (bannedHits.length > 0) {
    failures.push(`Banned generic copy pattern found: ${bannedHits.join(', ')}.`);
  }

  const issueExamples = rich.website_issue_examples || [];
  const specificIssues = issueExamples.filter(isSpecificWebsiteIssue);
  if (specificIssues.length < 3) {
    failures.push('website_issue_examples must include at least 3 specific, verifiable issues.');
  }

  if (isGenericList(rich.proposed_site_nav, GENERIC_NAV_TERMS) || (rich.proposed_site_nav || []).length < 4) {
    failures.push('proposed_site_nav is missing or generic.');
  }

  if (isGenericList(rich.homepage_sections, GENERIC_SECTION_TERMS) || (rich.homepage_sections || []).length < 4) {
    failures.push('homepage_sections are missing or generic.');
  }

  if (isGenericList(rich.menu_or_offer_items, GENERIC_OFFER_TERMS) || (rich.menu_or_offer_items || []).length < 3) {
    failures.push('menu_or_offer_items are missing, vague, or irrelevant.');
  }

  const trustSignals = rich.trust_signals || [];
  if (trustSignals.length < 2 || trustSignals.every(isVagueTrustSignal)) {
    failures.push('trust_signals are missing or too vague.');
  }
  if (trustSignals.some(isInventedTrustRisk) && !/public|visible|reviewed|official|found/i.test(cleanText(notes))) {
    warnings.push('trust_signals include claims that need public verification.');
  }

  if (isWeakStrategy(rich.cta_strategy)) {
    failures.push('cta_strategy is missing or generic.');
  }

  if (!visualDirection || visualDirection.length < 45 || containsBannedGenericCopy(visualDirection)) {
    failures.push('visual_direction is missing, vague, or generic.');
  }

  if (mediaAssets.length === 0) {
    failures.push('media_assets are empty; public mockup needs real media or a clear fallback strategy.');
  } else if (usableMediaAssets.length === 0) {
    failures.push('media_assets do not include usable image URLs.');
  } else if (mediaAssets.every((asset) => asset.source_type === 'fallback') && !hasStrongFallbackReason(mediaAssets, rich.photo_strategy)) {
    failures.push('fallback media lacks a strong fallback reason.');
  }

  if (!hasSpecificSocialAudit(social)) {
    failures.push('social_audit is missing or generic.');
  }

  if (!hasSpecificContentPlan(social)) {
    failures.push('content_plan is missing or generic.');
  }

  const foodHits = !isFoodMockupTemplate(template.variant) ? findFoodTerms(rich) : [];
  if (foodHits.length > 0) {
    failures.push(`Non-food mockup contains food-specific labels: ${foodHits.join(', ')}.`);
  }

  const normalizedPublicEmail = cleanText(publicEmail);
  if (normalizedPublicEmail && isLikelyGuessedPublicEmail(normalizedPublicEmail, notes)) {
    failures.push('public_email looks guessed or lacks public-source confirmation.');
  }

  const nicheFailures = getNicheQualityFailures({
    archetype: approvedArchetypeSelection.archetype,
    variant: template.variant,
    niche,
    rich,
    primaryCta,
    headline,
  });
  failures.push(...nicheFailures);

  if (recordCouldApplyToAnyBusiness(rich, social, headline, niche)) {
    failures.push('Mockup data is too generic; it could apply to almost any business in the niche.');
  }

  if (containsMockupPromise(emailBody) && failures.length > 0) {
    failures.push('email_body promises a website concept, but the mockup fails the quality gate.');
  }

  const outreachReady = failures.length === 0;
  return {
    required,
    outreachReady,
    label: outreachReady ? (warnings.length > 0 ? 'Needs manual review' : 'Outreach-ready') : 'Mockup not outreach-ready',
    severity: outreachReady ? (warnings.length > 0 ? 'warning' : 'pass') : 'fail',
    approvedArchetype: approvedArchetypeSelection.archetype,
    approvedArchetypeLabel: approvedArchetypeSelection.label,
    approvedArchetypeInferred: approvedArchetypeSelection.inferred,
    personalizationScore,
    failures: [...new Set(failures)],
    warnings: [...new Set(warnings)],
  };
}

function normalizeApprovedArchetype(value: unknown): ApexApprovedArchetype | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return (APEX_APPROVED_ARCHETYPES as readonly string[]).includes(normalized)
    ? (normalized as ApexApprovedArchetype)
    : null;
}

function inferApprovedArchetype(variant: MockupTemplateVariant, niche?: string | null): ApexApprovedArchetype | null {
  const normalizedNiche = cleanText(niche).toLowerCase();
  if (/dent|orthodont|clinic|med spa|medical spa|aesthetic|wellness/.test(normalizedNiche)) return 'clean_clinic_conversion';
  if (/auto detail|detailing|ceramic|tint|wrap|paint protection/.test(normalizedNiche)) return 'transformation_showcase';
  if (/restaurant|cafe|coffee|bar|grill|event|venue|hospitality|food|dining/.test(normalizedNiche)) return 'hospitality_experience';
  if (/pet|groom/.test(normalizedNiche)) return 'warm_local_booking';
  if (/gym|fitness|pilates|yoga|training|trainer/.test(normalizedNiche)) return 'fitness_energy_page';
  if (/photo|studio|consult|professional|b2b|account|insurance|real estate/.test(normalizedNiche)) return 'professional_trust_page';
  return ARCHETYPES_BY_VARIANT[variant]?.[0] || null;
}

function isArchetypeCompatibleWithVariant(
  archetype: ApexApprovedArchetype,
  variant: MockupTemplateVariant,
  niche?: string | null
) {
  const normalizedNiche = cleanText(niche).toLowerCase();
  if (/salon|barber/.test(normalizedNiche)) {
    return archetype === 'warm_local_booking' || archetype === 'transformation_showcase';
  }
  if (/event|venue|hospitality/.test(normalizedNiche)) return archetype === 'hospitality_experience';
  return (ARCHETYPES_BY_VARIANT[variant] || []).includes(archetype);
}

function isApexPublicMockupWorkflow(campaignType?: string | null, apexDeliveryMode?: string | null, emailBody?: string | null) {
  const campaign = cleanText(campaignType).toLowerCase();
  if (campaign === 'resinate_flooring') return false;
  const mode = cleanText(apexDeliveryMode).toLowerCase();
  if (mode === 'public_mockup' || mode === 'link_plus_summary') return true;
  return campaign === 'apex_social_content' && containsMockupPromise(emailBody);
}

function containsMockupPromise(emailBody?: string | null) {
  const body = cleanText(emailBody);
  return /\[mockup link\]|\/mockups\//i.test(body);
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function findBannedCopy(values: Array<string | null | undefined>) {
  const hits: string[] = [];
  for (const value of values) {
    const clean = cleanText(value);
    if (!clean) continue;
    for (const pattern of BANNED_GENERIC_COPY) {
      if (pattern.test(clean)) hits.push(pattern.source.replace(/\\b|\\i|\.\{0,40\}/g, '').replace(/\\/g, ''));
    }
  }
  return [...new Set(hits)].slice(0, 4);
}

function containsBannedGenericCopy(value: string | null | undefined) {
  const clean = cleanText(value);
  return BANNED_GENERIC_COPY.some((pattern) => pattern.test(clean));
}

function isGenericHeroHeadline(value: string) {
  const clean = value.trim();
  const letters = clean.replace(/[^a-z]/gi, '');
  const uppercaseLetters = clean.replace(/[^A-Z]/g, '');
  const uppercaseRatio = letters.length > 0 ? uppercaseLetters.length / letters.length : 0;
  return (
    containsBannedGenericCopy(clean) ||
    WEAK_HERO_PATTERNS.some((pattern) => pattern.test(clean)) ||
    (clean.length > 22 && uppercaseRatio > 0.82 && clean.split(/\s+/).length >= 4)
  );
}

function isSpecificWebsiteIssue(value: string) {
  const clean = value.trim();
  if (clean.length < 45) return false;
  if (containsBannedGenericCopy(clean)) return false;
  return !/(proof and cta|active site reviewed|needs clearer|could be clearer|generic|website issue)$/i.test(clean);
}

function isVagueTrustSignal(value: string) {
  const clean = value.trim();
  return clean.length < 22 || VAGUE_TRUST_PATTERNS.some((pattern) => pattern.test(clean));
}

function isInventedTrustRisk(value: string) {
  return INVENTED_TRUST_RISK_PATTERNS.some((pattern) => pattern.test(value));
}

function isWeakStrategy(value: string | null | undefined) {
  const clean = cleanText(value);
  if (clean.length < 35) return true;
  return /^(show proof|proof first|clear cta|book now|request quote|contact us)$/i.test(clean) || containsBannedGenericCopy(clean);
}

function hasStrongFallbackReason(assets: MockupMediaAsset[], photoStrategy?: string | null) {
  const text = [
    cleanText(photoStrategy),
    ...assets.map((asset) => cleanText(asset.usage_note)),
  ]
    .join(' ')
    .toLowerCase();
  return /fallback|concept|replace|no reliable public|category concept|when available/.test(text);
}

function hasSpecificSocialAudit(social?: SocialAuditData | null) {
  const scorecard = social?.social_audit;
  if (!scorecard) return false;
  const reasons = scorecard.why_underperforming || [];
  if (reasons.length < 4) return false;
  const usefulReasons = reasons.filter((reason) => reason.trim().length >= 38 && !containsBannedGenericCopy(reason));
  return Boolean(
    usefulReasons.length >= 4 &&
      (scorecard.instagram_status ||
        scorecard.facebook_status ||
        scorecard.posting_consistency ||
        scorecard.content_quality ||
        scorecard.reels_video_usage)
  );
}

function hasSpecificContentPlan(social?: SocialAuditData | null) {
  const plan = social?.content_plan;
  if (!plan) return false;
  const weekValues = [plan.week_1, plan.week_2, plan.week_3, plan.week_4].map(cleanText);
  return Boolean(
    weekValues.every((week) => week.length >= 24 && !/post content|make reels|weekly content/i.test(week)) &&
      cleanText(plan.recommended_posting_cadence) &&
      cleanText(plan.recommended_reels_per_week) &&
      cleanText(plan.shoot_frequency)
  );
}

function isLikelyGuessedPublicEmail(publicEmail: string, notes?: string | null) {
  const local = publicEmail.split('@')[0]?.toLowerCase() || '';
  if (!['info', 'hello', 'contact', 'admin', 'office', 'sales'].includes(local)) return false;
  return !/public email found|official contact|contact page|published|visible/i.test(cleanText(notes));
}

function getNicheQualityFailures({
  archetype,
  variant,
  niche,
  rich,
  primaryCta,
  headline,
}: {
  archetype: ApexApprovedArchetype | null;
  variant: MockupTemplateVariant;
  niche?: string | null;
  rich: RichMockupData;
  primaryCta?: string | null;
  headline?: string | null;
}) {
  const failures: string[] = [];
  const text = [
    archetype,
    variant,
    niche,
    primaryCta,
    headline,
    rich.cta_strategy,
    rich.visual_direction,
    ...(rich.proposed_site_nav || []),
    ...(rich.homepage_sections || []),
    ...(rich.menu_or_offer_items || []),
    ...(rich.trust_signals || []),
    ...(rich.website_issue_examples || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (archetype === 'transformation_showcase' || variant === 'auto_service') {
    if (!/(package|pricing|service card|service path)/.test(text)) failures.push('Auto/transformation mockups need package or service-path clarity.');
    if (!/(proof|result|before|after|transformation|finish)/.test(text)) failures.push('Auto/transformation mockups need result or transformation proof.');
    if (!/(process|prep|coating|detail|tint|protection)/.test(text)) failures.push('Auto/transformation mockups need process/service framing.');
    if (!/(book|booking|schedule|quote|request)/.test(text)) failures.push('Auto/transformation mockups need a clear booking CTA.');
  }

  if (archetype === 'proof_first_contractor' || variant === 'contractor') {
    if (!/(project|portfolio|before|after|gallery|proof)/.test(text)) failures.push('Contractor mockups need project proof.');
    if (!/(estimate|quote|request)/.test(text)) failures.push('Contractor mockups need an estimate path.');
    if (!/(process|timeline|scope|walkthrough)/.test(text)) failures.push('Contractor mockups need process or scope framing.');
    if (!/(review|trust|testimonial|proof)/.test(text)) failures.push('Contractor mockups need review or trust proof.');
    if (!/(service area|local|area|near|city)/.test(text)) failures.push('Contractor mockups need service-area framing.');
  }

  if (archetype === 'clean_clinic_conversion' || variant === 'medical_aesthetics') {
    if (/(flawless|perfect|anti-aging miracle|look younger|fix your|flaws?|problem areas?)/.test(text)) {
      failures.push('Clinic mockups must avoid hype or personal-flaw language.');
    }
    if (!/(treatment|service|consultation|consult)/.test(text)) failures.push('Clinic mockups need treatment and consultation clarity.');
    if (!/(provider|trust|review|what to expect|expectation|process)/.test(text)) {
      failures.push('Clinic mockups need provider/trust and what-to-expect sections.');
    }
  }

  if (archetype === 'warm_local_booking' || variant === 'pet_service') {
    if (!/(groom|appointment|booking|book)/.test(text)) failures.push('Pet/local booking mockups need service and booking clarity.');
    if (!/(comfort|safety|trust|care|happy|proof|location|hours|service area)/.test(text)) {
      failures.push('Pet/local booking mockups need comfort, safety, location, or proof framing.');
    }
  }

  if (archetype === 'fitness_energy_page' || variant === 'fitness_studio') {
    if (!/(class|program|training|trial|book|schedule)/.test(text)) failures.push('Fitness mockups need program/class and start-trial clarity.');
    if (!/(coach|community|transformation|lifestyle|proof)/.test(text)) failures.push('Fitness mockups need coach, community, or transformation proof.');
  }

  if (archetype === 'professional_trust_page' || variant === 'professional_service') {
    if (/modern solutions|solutions for every need|elevate/i.test(text)) failures.push('Professional mockups must avoid vague solutions language.');
    if (!/(service|process|proof|authority|consult|contact|portfolio)/.test(text)) {
      failures.push('Professional mockups need service clarity, process, proof, and contact path.');
    }
  }

  if (archetype === 'premium_service_landing' || variant === 'home_service') {
    if (!/(service|repair|install|clean|quote|call|book)/.test(text)) failures.push('Home-service mockups need immediate service clarity.');
    if (!/(review|proof|trust|service area|area|process|what to expect)/.test(text)) {
      failures.push('Home-service mockups need proof, service area, and process framing.');
    }
  }

  if (archetype === 'hospitality_experience' || isFoodMockupTemplate(variant)) {
    if (!isFoodMockupTemplate(variant)) failures.push('Hospitality labels may only be used for food, venue, or hospitality prospects.');
    if (!/(menu|reservation|reserve|visit|occasion|event|private|order)/.test(text)) {
      failures.push('Hospitality mockups need visit, reservation, menu, order, or occasion clarity.');
    }
  }

  return failures;
}

function recordCouldApplyToAnyBusiness(
  rich: RichMockupData,
  social: SocialAuditData | null | undefined,
  headline: string,
  niche?: string | null
) {
  const text = [
    headline,
    rich.current_site_snapshot,
    rich.cta_strategy,
    rich.visual_direction,
    rich.local_seo_angle,
    social?.website_social_gap,
    social?.content_opportunity,
    ...(rich.website_issue_examples || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const nicheWords = cleanText(niche)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length >= 4);
  const matchedNicheWords = nicheWords.filter((word) => text.includes(word)).length;
  const concreteSignals = [
    /\b(before|after|project|package|treatment|consultation|groom|booking|estimate|quote|service area|review|process|provider|class|program)\b/.test(text),
    (rich.website_issue_examples || []).length >= 3,
    (rich.menu_or_offer_items || []).length >= 3,
    (rich.homepage_sections || []).length >= 4,
    matchedNicheWords >= 1,
  ].filter(Boolean).length;
  return concreteSignals < 4;
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
