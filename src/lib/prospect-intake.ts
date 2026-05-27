import { getDataSource, getSupabase, SUPABASE_QUERY_TIMEOUT_MS } from './supabase';
import { PROSPECT_STATUSES, type Prospect, type ProspectStatus } from './types';

type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export type ProspectIntakeInput = {
  business_name: string;
  niche: string;
  website_url?: string | null;
  public_email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  google_maps_url?: string | null;
  lead_score?: number | string | null;
  status?: string | null;
  source?: string | null;
  notes?: string | null;
  main_problem?: string | null;
  conversion_opportunity?: string | null;
  recommended_offer?: string | null;
  mockup_angle?: string | null;
  audit_notes?: string | null;
  mockup_slug?: string | null;
  mockup_url?: string | null;
  hero_headline?: string | null;
  hero_subheadline?: string | null;
  primary_cta?: string | null;
  features_included?: string | string[] | null;
  concept_notes?: string | null;
  email_subject?: string | null;
  email_body?: string | null;
};

export type ProspectBundleResult = {
  data: {
    prospect: Prospect;
    auditId: string | null;
    mockupId: string | null;
    emailDraftId: string | null;
  } | null;
  error: string | null;
};

export type HermesImportPreview = {
  index: number;
  input: ProspectIntakeInput;
  businessName: string;
  websiteUrl: string | null;
  publicEmail: string | null;
  status: ProspectStatus;
  slug: string;
  valid: boolean;
  duplicate: boolean;
  errors: string[];
  warnings: string[];
};

const STATUS_ALIASES: Record<string, ProspectStatus> = {
  new_prospect: 'new',
  email_sent: 'sent',
  follow_up_due: 'follow_up_1',
};

function db() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase env vars are not configured.');
  return client;
}

async function withSupabaseTimeout<T>(query: PromiseLike<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(query),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error(`${label} timed out after ${SUPABASE_QUERY_TIMEOUT_MS / 1000}s`)),
          SUPABASE_QUERY_TIMEOUT_MS
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function clean(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanRequired(value: unknown) {
  return clean(value) ?? '';
}

function clampLeadScore(value: unknown, fallback: number) {
  const score = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(score)) return fallback;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function stringifyFeatureList(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(', ');
  return clean(value);
}

function normalizeWebsite(value: string | null | undefined) {
  const trimmed = clean(value);
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, '').toLowerCase();
}

function normalizeEmail(value: string | null | undefined) {
  return clean(value)?.toLowerCase() ?? null;
}

export function formatSupabaseError(action: string, error: SupabaseErrorLike) {
  const details = [
    error.message,
    error.code ? `code: ${error.code}` : null,
    error.details ? `details: ${error.details}` : null,
    error.hint ? `hint: ${error.hint}` : null,
  ].filter(Boolean);

  return `${action}: ${details.join(' | ') || 'Unknown Supabase error'}`;
}

export function slugifyBusinessName(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);

  return slug || 'prospect';
}

function coerceProspectStatus(value: string | null | undefined, fallback: ProspectStatus) {
  const normalized = clean(value)?.toLowerCase().replace(/\s+/g, '_');
  if (!normalized) return fallback;
  const alias = STATUS_ALIASES[normalized];
  if (alias) return alias;
  if ((PROSPECT_STATUSES as readonly string[]).includes(normalized)) return normalized as ProspectStatus;
  return fallback;
}

function hasAuditData(input: ProspectIntakeInput) {
  return Boolean(
    clean(input.main_problem) ||
      clean(input.conversion_opportunity) ||
      clean(input.recommended_offer) ||
      clean(input.mockup_angle) ||
      clean(input.audit_notes)
  );
}

function hasMockupData(input: ProspectIntakeInput) {
  return Boolean(
    clean(input.mockup_slug) ||
      clean(input.mockup_url) ||
      clean(input.hero_headline) ||
      clean(input.hero_subheadline) ||
      clean(input.primary_cta) ||
      stringifyFeatureList(input.features_included) ||
      clean(input.concept_notes)
  );
}

function hasEmailData(input: ProspectIntakeInput) {
  return Boolean(clean(input.email_subject) && clean(input.email_body));
}

export function deriveHermesStatus(input: ProspectIntakeInput): ProspectStatus {
  if (clean(input.public_email) && hasEmailData(input)) return 'email_ready';
  if (hasMockupData(input)) return 'mockup_ready';
  if (hasAuditData(input)) return 'audited';
  return 'qualified';
}

function validateBaseInput(input: ProspectIntakeInput, requireDestinationIdentity: boolean) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!clean(input.business_name)) errors.push('business_name is required.');
  if (!clean(input.niche)) errors.push('niche is required.');
  if (input.lead_score !== undefined && input.lead_score !== null) {
    const score = Number(input.lead_score);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      errors.push('lead_score must be a number between 0 and 100.');
    }
  }
  if (requireDestinationIdentity && !clean(input.website_url) && !clean(input.public_email)) {
    errors.push('website_url or public_email is required for duplicate detection.');
  }
  if (!clean(input.public_email)) {
    warnings.push('No public_email; this prospect will not be eligible for Telegram approval yet.');
  }

  return { errors, warnings };
}

async function getUniqueMockupSlug(baseSlug: string) {
  let candidate = baseSlug;
  let suffix = 2;

  while (suffix < 200) {
    const { data, error } = await withSupabaseTimeout(
      db().from('mockups').select('id').eq('slug', candidate).maybeSingle(),
      'Mockup slug uniqueness check'
    );

    if (error) throw new Error(formatSupabaseError('Check mockup slug', error));
    if (!data) return candidate;

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  throw new Error('Unable to generate a unique mockup slug.');
}

async function rollbackProspect(prospectId: string) {
  await db().from('prospects').delete().eq('id', prospectId);
}

export async function createProspectBundle(
  input: ProspectIntakeInput,
  options: {
    source: 'manual' | 'hermes_import';
    requireDestinationIdentity?: boolean;
    statusMode?: 'manual' | 'derive';
  }
): Promise<ProspectBundleResult> {
  if (getDataSource() !== 'supabase') {
    return { data: null, error: 'Cannot create prospects in seed mode. Configure Supabase first.' };
  }

  const baseValidation = validateBaseInput(input, options.requireDestinationIdentity ?? false);
  if (baseValidation.errors.length > 0) {
    return { data: null, error: baseValidation.errors.join(' ') };
  }

  const status =
    options.statusMode === 'derive'
      ? deriveHermesStatus(input)
      : coerceProspectStatus(input.status, 'qualified');
  const baseSlug = slugifyBusinessName(clean(input.mockup_slug) ?? `${cleanRequired(input.business_name)} mockup`);

  try {
    const slug = await getUniqueMockupSlug(baseSlug);
    const prospectInsert = {
      business_name: cleanRequired(input.business_name),
      niche: cleanRequired(input.niche),
      website_url: clean(input.website_url),
      public_email: clean(input.public_email),
      phone: clean(input.phone),
      city: clean(input.city) ?? '',
      state: clean(input.state) ?? 'CO',
      instagram_url: clean(input.instagram_url),
      facebook_url: clean(input.facebook_url),
      google_maps_url: clean(input.google_maps_url),
      lead_score: clampLeadScore(input.lead_score, options.source === 'manual' ? 70 : 0),
      status,
      source: options.source === 'manual' ? clean(input.source) ?? 'manual' : 'hermes_import',
      notes: clean(input.notes),
    };

    const { data: prospect, error: prospectError } = await withSupabaseTimeout(
      db().from('prospects').insert(prospectInsert).select().single(),
      'Create prospect'
    );

    if (prospectError || !prospect) {
      return {
        data: null,
        error: formatSupabaseError('Create prospect', prospectError ?? { message: 'No prospect row returned.' }),
      };
    }

    const auditInsert = {
      prospect_id: prospect.id,
      main_problem: clean(input.main_problem),
      conversion_opportunity: clean(input.conversion_opportunity),
      recommended_offer: clean(input.recommended_offer),
      mockup_angle: clean(input.mockup_angle),
      audit_notes: clean(input.audit_notes),
    };

    const { data: audit, error: auditError } = await withSupabaseTimeout(
      db().from('audits').insert(auditInsert).select('id').single(),
      'Create audit'
    );
    if (auditError || !audit) {
      await rollbackProspect(prospect.id);
      return {
        data: null,
        error: formatSupabaseError('Create audit', auditError ?? { message: 'No audit row returned.' }),
      };
    }

    const mockupInsert = {
      prospect_id: prospect.id,
      slug,
      title: `${prospect.business_name} Mockup`,
      mockup_url: clean(input.mockup_url),
      mockup_status: hasMockupData(input) ? 'ready' : 'draft',
      hero_headline: clean(input.hero_headline),
      hero_subheadline: clean(input.hero_subheadline),
      primary_cta: clean(input.primary_cta),
      features_included: stringifyFeatureList(input.features_included),
      concept_notes: clean(input.concept_notes),
    };

    const { data: mockup, error: mockupError } = await withSupabaseTimeout(
      db().from('mockups').insert(mockupInsert).select('id').single(),
      'Create mockup'
    );
    if (mockupError || !mockup) {
      await rollbackProspect(prospect.id);
      return {
        data: null,
        error: formatSupabaseError('Create mockup', mockupError ?? { message: 'No mockup row returned.' }),
      };
    }

    const emailInsert = {
      prospect_id: prospect.id,
      subject: clean(input.email_subject) ?? '',
      body: clean(input.email_body) ?? '',
      status: hasEmailData(input) ? 'ready' : 'draft',
    };

    const { data: emailDraft, error: emailError } = await withSupabaseTimeout(
      db().from('email_drafts').insert(emailInsert).select('id').single(),
      'Create email draft'
    );
    if (emailError || !emailDraft) {
      await rollbackProspect(prospect.id);
      return {
        data: null,
        error: formatSupabaseError('Create email draft', emailError ?? { message: 'No email draft row returned.' }),
      };
    }

    return {
      data: {
        prospect,
        auditId: audit.id,
        mockupId: mockup.id,
        emailDraftId: emailDraft.id,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown intake error',
    };
  }
}

export function normalizeHermesJsonRecord(value: unknown): ProspectIntakeInput | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;

  return {
    business_name: cleanRequired(record.business_name),
    niche: cleanRequired(record.niche),
    website_url: clean(record.website_url),
    public_email: clean(record.public_email),
    phone: clean(record.phone),
    city: clean(record.city),
    state: clean(record.state),
    instagram_url: clean(record.instagram_url),
    facebook_url: clean(record.facebook_url),
    google_maps_url: clean(record.google_maps_url),
    lead_score: typeof record.lead_score === 'number' || typeof record.lead_score === 'string' ? record.lead_score : null,
    main_problem: clean(record.main_problem),
    conversion_opportunity: clean(record.conversion_opportunity),
    recommended_offer: clean(record.recommended_offer),
    mockup_angle: clean(record.mockup_angle),
    audit_notes: clean(record.audit_notes),
    mockup_slug: clean(record.mockup_slug),
    mockup_url: clean(record.mockup_url),
    hero_headline: clean(record.hero_headline),
    hero_subheadline: clean(record.hero_subheadline),
    primary_cta: clean(record.primary_cta),
    features_included: Array.isArray(record.features_included)
      ? record.features_included.map((item) => String(item))
      : clean(record.features_included),
    concept_notes: clean(record.concept_notes),
    email_subject: clean(record.email_subject),
    email_body: clean(record.email_body),
    notes: clean(record.notes),
  };
}

export async function previewHermesImport(records: ProspectIntakeInput[]) {
  const websiteMap = new Map<string, number[]>();
  const emailMap = new Map<string, number[]>();

  records.forEach((record, index) => {
    const website = normalizeWebsite(record.website_url);
    const email = normalizeEmail(record.public_email);
    if (website) websiteMap.set(website, [...(websiteMap.get(website) ?? []), index]);
    if (email) emailMap.set(email, [...(emailMap.get(email) ?? []), index]);
  });

  const duplicateIndexes = new Set<number>();
  for (const indexes of [...websiteMap.values(), ...emailMap.values()]) {
    if (indexes.length > 1) indexes.forEach((index) => duplicateIndexes.add(index));
  }

  if (getDataSource() === 'supabase') {
    const websiteValues = [...websiteMap.keys()];
    const emailValues = [...emailMap.keys()];

    if (websiteValues.length > 0) {
      const { data, error } = await withSupabaseTimeout(
        db().from('prospects').select('website_url').in('website_url', websiteValues),
        'Website duplicate lookup'
      );
      if (error) throw new Error(formatSupabaseError('Website duplicate lookup', error));
      for (const row of data ?? []) {
        const indexes = websiteMap.get(normalizeWebsite(row.website_url) ?? '');
        indexes?.forEach((index) => duplicateIndexes.add(index));
      }
    }

    if (emailValues.length > 0) {
      const { data, error } = await withSupabaseTimeout(
        db().from('prospects').select('public_email').in('public_email', emailValues),
        'Email duplicate lookup'
      );
      if (error) throw new Error(formatSupabaseError('Email duplicate lookup', error));
      for (const row of data ?? []) {
        const indexes = emailMap.get(normalizeEmail(row.public_email) ?? '');
        indexes?.forEach((index) => duplicateIndexes.add(index));
      }
    }
  }

  return records.map<HermesImportPreview>((record, index) => {
    const validation = validateBaseInput(record, true);
    const duplicate = duplicateIndexes.has(index);
    return {
      index,
      input: record,
      businessName: cleanRequired(record.business_name),
      websiteUrl: normalizeWebsite(record.website_url),
      publicEmail: normalizeEmail(record.public_email),
      status: deriveHermesStatus(record),
      slug: slugifyBusinessName(clean(record.mockup_slug) ?? `${cleanRequired(record.business_name)} mockup`),
      valid: validation.errors.length === 0 && !duplicate,
      duplicate,
      errors: duplicate ? [...validation.errors, 'Duplicate website_url or public_email detected.'] : validation.errors,
      warnings: validation.warnings,
    };
  });
}
