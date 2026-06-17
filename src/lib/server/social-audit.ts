import 'server-only';

import { parseMockupConceptNotes } from '@/lib/mockup-rich-data';
import { SEED_AUDITS, SEED_MOCKUPS, SEED_PROSPECTS } from '@/lib/seed-data';
import {
  parseSocialAuditConceptNotes,
  type SocialAuditData,
} from '@/lib/social-audit-data';
import type { Audit, Mockup, Prospect } from '@/lib/types';
import { getServerSupabase } from './supabase';

export type PublicSocialAudit = {
  slug: string;
  mockup: Pick<Mockup, 'slug' | 'title' | 'hero_headline' | 'hero_subheadline' | 'primary_cta' | 'features_included' | 'concept_notes'>;
  prospect: Pick<
    Prospect,
    | 'business_name'
    | 'niche'
    | 'website_url'
    | 'instagram_url'
    | 'facebook_url'
    | 'google_maps_url'
    | 'city'
    | 'state'
  >;
  audit: Pick<
    Audit,
    | 'website_score'
    | 'mobile_score'
    | 'seo_score'
    | 'social_score'
    | 'main_problem'
    | 'conversion_opportunity'
    | 'recommended_offer'
    | 'mockup_angle'
    | 'audit_notes'
  > | null;
  social: SocialAuditData;
};

type PublicSocialAuditProspect = Pick<
  Prospect,
  | 'business_name'
  | 'niche'
  | 'website_url'
  | 'instagram_url'
  | 'facebook_url'
  | 'google_maps_url'
  | 'city'
  | 'state'
> & {
  audits?: PublicSocialAudit['audit'][] | null;
};

type PublicSocialAuditRow = PublicSocialAudit['mockup'] & {
  prospects?: PublicSocialAuditProspect | PublicSocialAuditProspect[] | null;
};

export async function getPublicSocialAuditBySlug(slug: string): Promise<PublicSocialAudit | null> {
  const cleanSlug = cleanSocialAuditSlug(slug);
  if (!cleanSlug) return null;

  if (!hasSupabaseEnv()) return getSeedSocialAuditBySlug(cleanSlug);

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('mockups')
    .select(
      'slug, title, hero_headline, hero_subheadline, primary_cta, features_included, concept_notes, prospects(business_name, niche, website_url, instagram_url, facebook_url, google_maps_url, city, state, audits(website_score, mobile_score, seo_score, social_score, main_problem, conversion_opportunity, recommended_offer, mockup_angle, audit_notes))'
    )
    .eq('slug', cleanSlug)
    .maybeSingle();

  if (error) throw new Error(`Social audit query: ${error.message}`);
  if (!data) return null;

  return mapSocialAuditRow(data as unknown as PublicSocialAuditRow);
}

function getSeedSocialAuditBySlug(slug: string): PublicSocialAudit | null {
  const cleanSlug = cleanSocialAuditSlug(slug);
  const mockup = SEED_MOCKUPS.find((item) => item.slug === cleanSlug);
  if (!mockup) return null;

  const prospect = SEED_PROSPECTS.find((item) => item.id === mockup.prospect_id);
  if (!prospect) return null;

  const audit = SEED_AUDITS.find((item) => item.prospect_id === mockup.prospect_id) || null;
  return mapSocialAuditRow({
    slug: mockup.slug,
    title: mockup.title,
    hero_headline: mockup.hero_headline,
    hero_subheadline: mockup.hero_subheadline,
    primary_cta: mockup.primary_cta,
    features_included: mockup.features_included,
    concept_notes: mockup.concept_notes,
    prospects: {
      business_name: prospect.business_name,
      niche: prospect.niche,
      website_url: prospect.website_url,
      instagram_url: prospect.instagram_url,
      facebook_url: prospect.facebook_url,
      google_maps_url: prospect.google_maps_url,
      city: prospect.city,
      state: prospect.state,
      audits: audit
        ? [{
            website_score: audit.website_score,
            mobile_score: audit.mobile_score,
            seo_score: audit.seo_score,
            social_score: audit.social_score,
            main_problem: audit.main_problem,
            conversion_opportunity: audit.conversion_opportunity,
            recommended_offer: audit.recommended_offer,
            mockup_angle: audit.mockup_angle,
            audit_notes: audit.audit_notes,
          }]
        : [],
    },
  });
}

function cleanSocialAuditSlug(slug: string | null | undefined) {
  const raw = (slug || '').trim();
  if (!raw) return '';

  const decoded = safeDecodeURIComponent(raw);
  return decoded
    .replace(/^https?:\/\/[^/]+\/social-audits\//i, '')
    .replace(/^\/?social-audits\//i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function mapSocialAuditRow(row: PublicSocialAuditRow): PublicSocialAudit | null {
  const prospectRelation = Array.isArray(row.prospects) ? row.prospects[0] : row.prospects;
  if (!prospectRelation) return null;

  const audit = Array.isArray(prospectRelation.audits)
    ? prospectRelation.audits[0] || null
    : prospectRelation.audits || null;
  const mockup = {
    slug: row.slug,
    title: row.title,
    hero_headline: row.hero_headline,
    hero_subheadline: row.hero_subheadline,
    primary_cta: row.primary_cta,
    features_included: row.features_included,
    concept_notes: row.concept_notes,
  };
  const parsedMockup = parseMockupConceptNotes(mockup.concept_notes);
  const social = parseSocialAuditConceptNotes(mockup.concept_notes);

  if (!social.meta_ads_angle && parsedMockup.rich.meta_ads_angle) {
    social.meta_ads_angle = parsedMockup.rich.meta_ads_angle;
  }

  if (!social.content_opportunity && parsedMockup.rich.content_strategy_angle) {
    social.content_opportunity = parsedMockup.rich.content_strategy_angle;
  }

  if (!social.website_social_gap && parsedMockup.rich.current_site_snapshot) {
    social.website_social_gap = parsedMockup.rich.current_site_snapshot;
  }

  return {
    slug: mockup.slug,
    mockup,
    prospect: {
      business_name: prospectRelation.business_name,
      niche: prospectRelation.niche,
      website_url: prospectRelation.website_url,
      instagram_url: prospectRelation.instagram_url,
      facebook_url: prospectRelation.facebook_url,
      google_maps_url: prospectRelation.google_maps_url,
      city: prospectRelation.city,
      state: prospectRelation.state,
    },
    audit,
    social,
  };
}

function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  return Boolean(url && key);
}
