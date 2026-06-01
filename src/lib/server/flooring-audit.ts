import 'server-only';

import { parseMockupConceptNotes, type RichMockupData } from '@/lib/mockup-rich-data';
import {
  parseResinateConceptNotes,
  type ResinateFlooringData,
} from '@/lib/resinate-data';
import { SEED_AUDITS, SEED_MOCKUPS, SEED_PROSPECTS } from '@/lib/seed-data';
import type { Audit, Mockup, Prospect } from '@/lib/types';
import { getServerSupabase } from './supabase';

export type PublicFlooringAudit = {
  slug: string;
  mockup: Pick<
    Mockup,
    | 'slug'
    | 'title'
    | 'hero_headline'
    | 'hero_subheadline'
    | 'primary_cta'
    | 'features_included'
    | 'concept_notes'
  >;
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
  flooring: ResinateFlooringData;
  rich: RichMockupData;
};

type PublicFlooringAuditProspect = PublicFlooringAudit['prospect'] & {
  audits?: PublicFlooringAudit['audit'][] | null;
};

type PublicFlooringAuditRow = PublicFlooringAudit['mockup'] & {
  prospects?: PublicFlooringAuditProspect | PublicFlooringAuditProspect[] | null;
};

export async function getPublicFlooringAuditBySlug(slug: string): Promise<PublicFlooringAudit | null> {
  if (!hasSupabaseEnv()) return getSeedFlooringAuditBySlug(slug);

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('mockups')
    .select(
      'slug, title, hero_headline, hero_subheadline, primary_cta, features_included, concept_notes, prospects(business_name, niche, website_url, instagram_url, facebook_url, google_maps_url, city, state, audits(website_score, mobile_score, seo_score, social_score, main_problem, conversion_opportunity, recommended_offer, mockup_angle, audit_notes))'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Flooring audit query: ${error.message}`);
  if (!data) return null;

  return mapFlooringAuditRow(data as unknown as PublicFlooringAuditRow);
}

function getSeedFlooringAuditBySlug(slug: string): PublicFlooringAudit | null {
  const mockup = SEED_MOCKUPS.find((item) => item.slug === slug);
  if (!mockup) return null;

  const prospect = SEED_PROSPECTS.find((item) => item.id === mockup.prospect_id);
  if (!prospect) return null;

  const audit = SEED_AUDITS.find((item) => item.prospect_id === mockup.prospect_id) || null;
  return mapFlooringAuditRow({
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
        ? [
            {
              website_score: audit.website_score,
              mobile_score: audit.mobile_score,
              seo_score: audit.seo_score,
              social_score: audit.social_score,
              main_problem: audit.main_problem,
              conversion_opportunity: audit.conversion_opportunity,
              recommended_offer: audit.recommended_offer,
              mockup_angle: audit.mockup_angle,
              audit_notes: audit.audit_notes,
            },
          ]
        : [],
    },
  });
}

function mapFlooringAuditRow(row: PublicFlooringAuditRow): PublicFlooringAudit | null {
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
  const flooring = parseResinateConceptNotes(mockup.concept_notes);

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
    flooring,
    rich: parsedMockup.rich,
  };
}

function hasSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  return Boolean(url && key);
}
