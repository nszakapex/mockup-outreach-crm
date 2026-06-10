import 'server-only';

import {
  encodeMimeSubject,
  normalizeMimeLineEndings,
  sanitizeEmailAddress,
  sanitizeHeaderValue,
} from '@/lib/email-sanitization';
import {
  buildPublicFlooringAuditUrl,
  buildPublicMockupUrl,
  buildPublicSocialAuditUrl,
  getMockupTemplateSelection,
} from '@/lib/mockup-templates';
import { getMockupV2Diagnostics } from '@/lib/mockup-v2';
import {
  buildInlineApexBrief,
  containsInlineApexBriefReference,
  getApexDeliveryMode,
  getApexDeliveryModeLabel,
  getApexPublicArtifactRequired,
  getApexPublicMockupRequired,
  getApexPublicSocialAuditRequired,
  hasApexContentDirection,
  parseApexDeliveryConceptNotes,
  type ApexDeliveryMode,
} from '@/lib/apex-delivery-data';
import { parseMockupConceptNotes } from '@/lib/mockup-rich-data';
import {
  buildInlineFlooringBrief,
  containsInlineFlooringBriefReference,
  containsPublicFlooringBriefReference,
  getResinateDeliveryMode,
  getResinateDeliveryModeLabel,
  getResinatePublicArtifactRequired,
  parseResinateConceptNotes,
  type ResinateDeliveryMode,
} from '@/lib/resinate-data';
import { parseSocialAuditConceptNotes } from '@/lib/social-audit-data';
import {
  getCampaignTypeForProspect,
  getSenderProfileByKey,
  getSenderProfileForProspect,
  type SenderProfile,
  type SenderProfileKey,
} from './sender-identities';
import { getErrorMessage, getServerSupabase } from './supabase';

const SEND_SUCCESS_STATUSES = ['sent', 'test_sent'];
const SEND_BLOCKING_STATUSES = ['queued', 'sent', 'test_sent', 'skipped'];
const SENDABLE_DRAFT_STATUSES = ['approved', 'sendable'];
const DEFAULT_DAILY_CAP = 30;

type EmailDraftRow = {
  id: string;
  subject: string;
  body: string;
  status: string;
};

type MockupRow = {
  id: string;
  slug: string;
  title: string;
  mockup_url: string | null;
  mockup_status: string;
  hero_headline: string | null;
  hero_subheadline: string | null;
  primary_cta: string | null;
  concept_notes: string | null;
};

type AuditRow = {
  main_problem: string | null;
  conversion_opportunity: string | null;
  recommended_offer: string | null;
  audit_notes: string | null;
};

type ProspectRow = {
  id: string;
  business_name: string;
  niche: string;
  notes: string | null;
  public_email: string | null;
  status: string;
  city: string;
  state: string;
  mockups?: MockupRow[] | null;
  email_drafts?: EmailDraftRow[] | null;
  audits?: AuditRow[] | null;
};

type OutreachSendRow = {
  prospect_id: string;
  email_draft_id: string | null;
  status: string;
};

type RecentSendRow = {
  id: string;
  prospect_id: string;
  email_draft_id: string | null;
  provider: string;
  to_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
  prospects?: { id: string; business_name: string } | { id: string; business_name: string }[] | null;
  email_drafts?: { id: string; subject: string } | { id: string; subject: string }[] | null;
};

export type SendQueueItem = {
  prospectId: string;
  emailDraftId: string;
  businessName: string;
  toEmail: string;
  fromEmail: string;
  subject: string;
  body: string;
  finalBody: string;
  mockupUrl: string;
  socialAuditUrl: string;
  flooringAuditUrl: string;
  inlineFlooringBrief: string;
  inlineApexBrief: string;
  campaignTypeDetected: string;
  campaignLabel: string;
  apexDeliveryMode: ApexDeliveryMode | null;
  apexDeliveryModeLabel: string;
  resinateDeliveryMode: ResinateDeliveryMode | null;
  resinateDeliveryModeLabel: string;
  publicArtifactRequired: boolean;
  publicSocialAuditRequired: boolean;
  publicMockupRequired: boolean;
  publicSocialAuditIncluded: boolean;
  publicMockupIncluded: boolean;
  selectedPrimaryArtifactUrl: string;
  selectedPrimaryArtifactLabel: string;
  primaryArtifactType: string;
  hasMockupLink: boolean;
  hasSocialAuditLink: boolean;
  hasFlooringAuditLink: boolean;
  hasInlineFlooringBrief: boolean;
  hasInlineApexBrief: boolean;
  usesMockupLink: boolean;
  usesSocialAuditLink: boolean;
  usesFlooringAuditLink: boolean;
  usesInlineFlooringBrief: boolean;
  usesInlineApexBrief: boolean;
  publicBriefLinkIncluded: boolean;
  inlineBriefIncluded: boolean;
  inlineApexBriefIncluded: boolean;
  senderProfileKey: SenderProfileKey;
  senderLabel: string;
  senderProviderName: 'gmail';
  senderConfigured: boolean;
  senderMissingFields: string[];
  linkReplacementApplied: boolean;
  fallbackLinkAppended: boolean;
  optOutIncluded: boolean;
  emailQualityWarnings: string[];
  status: string;
  sendable: boolean;
  blockedReasons: string[];
};

export type RecentSendItem = {
  id: string;
  prospectId: string;
  emailDraftId: string | null;
  businessName: string;
  toEmail: string;
  subject: string;
  status: string;
  provider: string;
  sentAt: string | null;
  createdAt: string;
  errorMessage: string | null;
};

type SanitizedSendFields = {
  to: string;
  from: string;
  subject: string;
};

export class OutreachValidationError extends Error {
  failedStep: string;
  field: string;

  constructor(failedStep: string, field: string, message: string) {
    super(message);
    this.name = 'OutreachValidationError';
    this.failedStep = failedStep;
    this.field = field;
  }
}

export class GmailSendError extends Error {
  failedStep = 'gmail_api_send';
  gmailError: string;
  sanitizedTo: string;
  sanitizedFrom: string;
  sanitizedSubject: string;

  constructor(message: string, sanitized: SanitizedSendFields) {
    super(message);
    this.name = 'GmailSendError';
    this.gmailError = message;
    this.sanitizedTo = sanitized.to;
    this.sanitizedFrom = sanitized.from;
    this.sanitizedSubject = sanitized.subject;
  }
}

export function getOutreachConfig() {
  const rawCap = Number(process.env.OUTREACH_DAILY_SEND_CAP || DEFAULT_DAILY_CAP);
  const apexProfile = getSenderProfileByKey('apex');
  return {
    googleClientIdConfigured: apexProfile.clientIdConfigured,
    googleClientSecretConfigured: apexProfile.clientSecretConfigured,
    googleRefreshTokenConfigured: apexProfile.refreshTokenConfigured,
    gmailSenderEmailConfigured: apexProfile.senderEmailConfigured,
    gmailSenderEmail: apexProfile.senderEmail,
    testMode: (process.env.OUTREACH_EMAIL_TEST_MODE ?? 'true').toLowerCase() !== 'false',
    dailyCap: Number.isFinite(rawCap) && rawCap > 0 ? Math.floor(rawCap) : DEFAULT_DAILY_CAP,
  };
}

export function serializeOutreachError(error: unknown) {
  if (error instanceof OutreachValidationError) {
    return {
      ok: false,
      failedStep: error.failedStep,
      field: error.field,
      errorMessage: error.message,
    };
  }

  if (error instanceof GmailSendError) {
    return {
      ok: false,
      failedStep: error.failedStep,
      gmailError: error.gmailError,
      sanitizedTo: error.sanitizedTo,
      sanitizedFrom: error.sanitizedFrom,
      sanitizedSubject: error.sanitizedSubject,
      errorMessage: error.message,
    };
  }

  return { ok: false, errorMessage: getErrorMessage(error) };
}

export async function getOutreachStats() {
  const supabase = getServerSupabase();
  const config = getOutreachConfig();
  const todayStart = startOfTodayIso();

  const { count, error } = await supabase
    .from('outreach_sends')
    .select('id', { count: 'exact', head: true })
    .in('status', SEND_SUCCESS_STATUSES)
    .gte('sent_at', todayStart);

  if (error) throw new Error(`Fetch outreach send stats: ${error.message}`);

  const sentToday = count || 0;
  return {
    sentToday,
    remainingToday: Math.max(0, config.dailyCap - sentToday),
    dailyCap: config.dailyCap,
    testMode: config.testMode,
  };
}

export async function getSendQueue(origin: string) {
  const config = getOutreachConfig();
  const [stats, prospects, optOutEmails, successfulSends, recentSends] = await Promise.all([
    getOutreachStats(),
    fetchQueueProspects(),
    fetchOptOutEmails(),
    fetchSuccessfulSends(),
    getRecentSends(),
  ]);

  const successfulKeys = new Set(
    successfulSends
      .filter((send) => send.email_draft_id)
      .map((send) => sendKey(send.prospect_id, send.email_draft_id as string))
  );

  const items = prospects
    .map((prospect) => buildQueueItem(prospect, origin, optOutEmails, successfulKeys, config))
    .filter((item): item is SendQueueItem => Boolean(item));

  return { items, stats, recentSends };
}

export async function getRecentSends(limit = 10) {
  const supabase = getServerSupabase();
  const parsedLimit = Number.isFinite(limit) ? Math.floor(limit) : 10;
  const safeLimit = Math.max(1, Math.min(parsedLimit, 50));
  const { data, error } = await supabase
    .from('outreach_sends')
    .select('id, prospect_id, email_draft_id, provider, to_email, subject, status, error_message, sent_at, created_at, prospects(id, business_name), email_drafts(id, subject)')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (error) throw new Error(`Fetch recent sends: ${error.message}`);
  return (data || []).map(mapRecentSend);
}

export async function validateSendEligibility(
  prospectId: string,
  origin: string,
  options: { enforceDailyCap?: boolean } = {}
) {
  const [stats, prospect, optOutEmails, successfulSends] = await Promise.all([
    getOutreachStats(),
    fetchProspectForSend(prospectId),
    fetchOptOutEmails(),
    fetchSuccessfulSends(prospectId),
  ]);

  if (!prospect) throw new Error('Prospect not found.');

  const successfulKeys = new Set(
    successfulSends
      .filter((send) => send.email_draft_id)
      .map((send) => sendKey(send.prospect_id, send.email_draft_id as string))
  );
  const item = buildQueueItem(prospect, origin, optOutEmails, successfulKeys, getOutreachConfig());

  if (!item) throw new Error('Prospect is missing a sendable email draft.');
  if ((options.enforceDailyCap ?? true) && stats.remainingToday <= 0) {
    item.blockedReasons.push(`Daily send cap reached (${stats.sentToday}/${stats.dailyCap}).`);
  }

  if (item.blockedReasons.length > 0) {
    throw new OutreachValidationError(
      'validate_send_eligibility',
      validationFieldFromReasons(item.blockedReasons),
      item.blockedReasons.join(' ')
    );
  }

  return { item, stats };
}

export async function sendOutreachEmail(prospectId: string, origin: string) {
  const { item } = await validateSendEligibility(prospectId, origin);
  const config = getOutreachConfig();
  const supabase = getServerSupabase();
  const sanitized = sanitizeSendFields(item.toEmail, item.fromEmail, item.subject);
  const body = item.finalBody;
  const now = new Date().toISOString();
  let providerMessageId: string | null = null;
  const sendStatus = config.testMode ? 'test_sent' : 'sent';
  let sendRecordId: string | null = null;
  let sendCommitted = false;

  try {
    const { data: queuedSend, error: insertError } = await supabase
      .from('outreach_sends')
      .insert({
        prospect_id: item.prospectId,
        email_draft_id: item.emailDraftId,
        provider: config.testMode ? 'test' : 'gmail',
        to_email: sanitized.to,
        from_email: sanitized.from,
        subject: sanitized.subject,
        body,
        status: 'queued',
        provider_message_id: null,
        error_message: null,
        sent_at: null,
      })
      .select('id')
      .single();
    if (insertError) throw new Error(`Create queued outreach send: ${insertError.message}`);
    sendRecordId = queuedSend?.id || null;
    if (!sendRecordId) throw new Error('Create queued outreach send: missing send id.');

    if (config.testMode) {
      providerMessageId = `test_${Date.now()}`;
    } else {
      const senderProfile = getSenderProfileByKey(item.senderProfileKey);
      const gmailResult = await sendGmailOutreachEmail({
        to: sanitized.to,
        from: sanitized.from,
        subject: sanitized.subject,
        body,
        senderProfile,
      });
      providerMessageId = gmailResult.id;
    }

    const { error: sendUpdateError } = await supabase
      .from('outreach_sends')
      .update({
        status: sendStatus,
        provider_message_id: providerMessageId,
        error_message: null,
        sent_at: now,
      })
      .eq('id', sendRecordId);
    if (sendUpdateError) throw new Error(`Update outreach send: ${sendUpdateError.message}`);
    sendCommitted = true;

    const { error: prospectError } = await supabase
      .from('prospects')
      .update({ status: 'sent' })
      .eq('id', item.prospectId);
    if (prospectError) throw new Error(`Update prospect: ${prospectError.message}`);

    const { error: draftError } = await supabase
      .from('email_drafts')
      .update({ status: 'sent', sent_at: now })
      .eq('id', item.emailDraftId);
    if (draftError) throw new Error(`Update email draft: ${draftError.message}`);

    const { error: taskError } = await supabase.from('follow_up_tasks').insert({
      prospect_id: item.prospectId,
      task_type: 'follow_up',
      due_date: addBusinessDays(new Date(), 3).toISOString().split('T')[0],
      status: 'pending',
      notes: config.testMode
        ? 'Test-mode send completed. Review before any live Gmail sending.'
        : 'Follow up 3 business days after Gmail outreach send.',
    });
    if (taskError) throw new Error(`Create follow-up task: ${taskError.message}`);

    return {
      ok: true,
      testMode: config.testMode,
      providerMessageId,
      status: sendStatus,
      prospectId: item.prospectId,
      emailDraftId: item.emailDraftId,
      message: config.testMode
        ? 'Test send recorded. No Gmail message was sent.'
        : 'Gmail outreach email sent.',
    };
  } catch (error) {
    if (sendRecordId && !sendCommitted && !providerMessageId) {
      await supabase
        .from('outreach_sends')
        .update({
          status: 'failed',
          provider_message_id: providerMessageId,
          error_message: getErrorMessage(error),
          sent_at: null,
        })
        .eq('id', sendRecordId);
    }
    throw error;
  }
}

export async function skipOutreachEmail(prospectId: string, origin: string) {
  const { item } = await validateSendEligibility(prospectId, origin, { enforceDailyCap: false });
  const supabase = getServerSupabase();
  const sanitized = sanitizeSendFields(item.toEmail, item.fromEmail, item.subject);

  const { error: insertError } = await supabase.from('outreach_sends').insert({
    prospect_id: item.prospectId,
    email_draft_id: item.emailDraftId,
    provider: 'test',
    to_email: sanitized.to,
    from_email: sanitized.from,
    subject: sanitized.subject,
    body: item.finalBody,
    status: 'skipped',
    provider_message_id: null,
    error_message: 'Skipped manually from send queue.',
    sent_at: null,
  });
  if (insertError) throw new Error(`Insert skipped outreach send: ${insertError.message}`);

  return {
    ok: true,
    prospectId: item.prospectId,
    emailDraftId: item.emailDraftId,
    message: 'Prospect skipped and removed from the send queue.',
  };
}

export async function sendGmailOutreachEmail({
  to,
  from,
  subject,
  body,
  senderProfile,
}: {
  to: string;
  from: string;
  subject: string;
  body: string;
  senderProfile: SenderProfile;
}) {
  const sanitized = sanitizeSendFields(to, from, subject);
  const accessToken = await getGmailAccessToken(senderProfile);
  const raw = encodeBase64Url(buildMimeMessage({ ...sanitized, body }));

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
    cache: 'no-store',
  }).catch((error) => {
    throw new GmailSendError(`Gmail request failed: ${getErrorMessage(error)}`, sanitized);
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new GmailSendError(data?.error?.message || `Gmail send failed with HTTP ${response.status}`, sanitized);
  }

  return { id: data?.id as string | null };
}

async function fetchQueueProspects() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('prospects')
    .select('id, business_name, niche, notes, public_email, status, city, state, audits(main_problem, conversion_opportunity, recommended_offer, audit_notes), mockups(id, slug, title, mockup_url, mockup_status, hero_headline, hero_subheadline, primary_cta, concept_notes), email_drafts(id, subject, body, status)')
    .eq('status', 'approved_to_send')
    .order('updated_at', { ascending: true });

  if (error) throw new Error(`Fetch send queue: ${error.message}`);
  return (data || []) as ProspectRow[];
}

async function fetchProspectForSend(prospectId: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('prospects')
    .select('id, business_name, niche, notes, public_email, status, city, state, audits(main_problem, conversion_opportunity, recommended_offer, audit_notes), mockups(id, slug, title, mockup_url, mockup_status, hero_headline, hero_subheadline, primary_cta, concept_notes), email_drafts(id, subject, body, status)')
    .eq('id', prospectId)
    .maybeSingle();

  if (error) throw new Error(`Fetch prospect for send: ${error.message}`);
  return data as ProspectRow | null;
}

async function fetchOptOutEmails() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from('opt_outs').select('email');

  if (error) throw new Error(`Fetch opt-outs: ${error.message}`);
  return new Set(
    (data || [])
      .map((row) => sanitizeEmailAddress(String(row.email)))
      .filter((result): result is { ok: true; value: string } => result.ok)
      .map((result) => result.value)
  );
}

async function fetchSuccessfulSends(prospectId?: string) {
  const supabase = getServerSupabase();
  let query = supabase
    .from('outreach_sends')
    .select('prospect_id, email_draft_id, status')
    .in('status', SEND_BLOCKING_STATUSES);

  if (prospectId) query = query.eq('prospect_id', prospectId);

  const { data, error } = await query;
  if (error) throw new Error(`Fetch previous sends: ${error.message}`);
  return (data || []) as OutreachSendRow[];
}

function sanitizeSendFields(to: string, from: string, subject: string): SanitizedSendFields {
  const toResult = sanitizeEmailAddress(to);
  if (!toResult.ok) throw new OutreachValidationError('sanitize_gmail_headers', 'to', toResult.errorMessage);

  const fromResult = sanitizeEmailAddress(from);
  if (!fromResult.ok) throw new OutreachValidationError('sanitize_gmail_headers', 'from', fromResult.errorMessage);

  const subjectResult = sanitizeHeaderValue(subject);
  if (!subjectResult.ok) {
    throw new OutreachValidationError('sanitize_gmail_headers', 'subject', subjectResult.errorMessage);
  }

  return {
    to: toResult.value,
    from: fromResult.value,
    subject: subjectResult.value,
  };
}

function getSenderEmailForMode(senderProfile: SenderProfile, config = getOutreachConfig()) {
  if (senderProfile.senderEmail) return senderProfile.senderEmail;
  return config.testMode && senderProfile.key === 'apex' ? 'test-mode@mockup-outreach-crm.local' : '';
}

function validationFieldFromReasons(reasons: string[]) {
  const joined = reasons.join(' ').toLowerCase();
  if (joined.includes('public_email') || joined.includes('recipient') || joined.includes('opted out')) return 'to';
  if (joined.includes('sender') || joined.includes('gmail_sender_email')) return 'from';
  if (joined.includes('subject')) return 'subject';
  if (joined.includes('mockup')) return 'mockup_url';
  return 'eligibility';
}

function buildQueueItem(
  prospect: ProspectRow,
  origin: string,
  optOutEmails: Set<string>,
  successfulSendKeys: Set<string>,
  config = getOutreachConfig()
) {
  const blockedReasons: string[] = [];
  const campaignTypeDetected = getCampaignTypeForProspect(prospect);
  const senderProfile = getSenderProfileForProspect(prospect);
  const fromCandidate = getSenderEmailForMode(senderProfile, config);
  const fromValidation = sanitizeEmailAddress(fromCandidate);
  const toValidation = prospect.public_email ? sanitizeEmailAddress(prospect.public_email) : null;
  const senderBlockedReason = getSenderBlockedReason(senderProfile, config.testMode);

  if (prospect.status !== 'approved_to_send') {
    blockedReasons.push('Prospect must be approved through Telegram before sending.');
  }

  if (prospect.status === 'do_not_contact' || prospect.status === 'not_interested') {
    blockedReasons.push('Rejected or do-not-contact prospects cannot be sent.');
  }

  if (!prospect.public_email) {
    blockedReasons.push('Prospect is missing public_email.');
  } else if (!toValidation?.ok) {
    blockedReasons.push(`Invalid public_email: ${toValidation?.errorMessage || 'Email address is invalid.'}`);
  } else if (optOutEmails.has(toValidation.value)) {
    blockedReasons.push('Prospect email is opted out.');
  }

  if (senderBlockedReason) {
    blockedReasons.push(senderBlockedReason);
  }

  if (!fromCandidate && !senderBlockedReason) {
    blockedReasons.push(`${senderProfile.senderLabel} sender email is not configured.`);
  } else if (!fromValidation.ok) {
    blockedReasons.push(`Invalid sender email: ${fromValidation.errorMessage}`);
  }

  const emailDraft = pickEmailDraft(prospect.email_drafts);
  if (!emailDraft) {
    blockedReasons.push('Prospect is missing an approved email draft.');
  } else {
    const subjectValidation = sanitizeHeaderValue(emailDraft.subject);
    if (!subjectValidation.ok) blockedReasons.push(`Invalid email subject: ${subjectValidation.errorMessage}`);
    if (!emailDraft.body?.trim()) blockedReasons.push('Email draft is missing a body.');
    if (successfulSendKeys.has(sendKey(prospect.id, emailDraft.id))) {
      blockedReasons.push('This prospect/email draft is already queued, sent, or skipped.');
    }
  }

  const mockup = pickMockup(prospect.mockups);
  const isResinateCampaign = campaignTypeDetected === 'resinate_flooring';
  const isApexCampaign = !isResinateCampaign;
  const resinateFlooring = mockup ? parseResinateConceptNotes(mockup.concept_notes) : {};
  const apexDelivery = mockup ? parseApexDeliveryConceptNotes(mockup.concept_notes) : {};
  const draftBody = emailDraft?.body || '';
  const apexDeliveryMode = isApexCampaign
    ? getApexDeliveryMode(apexDelivery, draftBody)
    : null;
  const resinateDeliveryMode = isResinateCampaign
    ? getResinateDeliveryMode(resinateFlooring, draftBody)
    : null;
  const publicSocialAuditRequired = isApexCampaign
    ? getApexPublicSocialAuditRequired(apexDelivery, draftBody)
    : false;
  const publicMockupRequired = isApexCampaign
    ? getApexPublicMockupRequired(apexDelivery, draftBody)
    : false;
  const publicArtifactRequired = isResinateCampaign
    ? getResinatePublicArtifactRequired(resinateFlooring, draftBody)
    : getApexPublicArtifactRequired(apexDelivery, draftBody);

  if (!mockup) {
    blockedReasons.push('Prospect is missing internal campaign content.');
  } else if ((publicArtifactRequired || publicSocialAuditRequired) && !mockup.slug && !mockup.mockup_url) {
    blockedReasons.push('Prospect is missing a public artifact slug or URL.');
  }

  if (!emailDraft || !prospect.public_email || !mockup) return null;

  const mockupUrl = buildMockupUrl(mockup, origin);
  const socialAuditUrl = buildPublicSocialAuditUrl(mockup.slug, origin);
  const flooringAuditUrl = publicArtifactRequired ? buildPublicFlooringAuditUrl(mockup.slug, origin) : '';
  const audit = pickAudit(prospect.audits);
  const mockupStrategy = parseMockupConceptNotes(mockup.concept_notes);
  const socialAuditStrategy = parseSocialAuditConceptNotes(mockup.concept_notes);
  const mockupTemplate = getMockupTemplateSelection({
    businessName: prospect.business_name,
    niche: prospect.niche,
    campaignType: campaignTypeDetected,
    fields: mockupStrategy.rich as Record<string, unknown>,
    text: [audit?.main_problem, audit?.conversion_opportunity, audit?.recommended_offer, audit?.audit_notes],
  });
  const mockupV2Diagnostics = getMockupV2Diagnostics({
    rich: mockupStrategy.rich,
    template: mockupTemplate,
    social: socialAuditStrategy,
    niche: prospect.niche,
    businessName: prospect.business_name,
    campaignType: isApexCampaign ? apexDelivery.campaign_type || campaignTypeDetected : campaignTypeDetected,
    apexDeliveryMode,
    emailBody: draftBody,
    heroHeadline: mockup.hero_headline,
    heroSubheadline: mockup.hero_subheadline,
    primaryCta: mockup.primary_cta,
    publicEmail: prospect.public_email,
    notes: prospect.notes,
  });
  if (isApexCampaign && mockupV2Diagnostics.qualityGate.required && !mockupV2Diagnostics.qualityGate.outreachReady) {
    blockedReasons.push(`Mockup not outreach-ready: ${mockupV2Diagnostics.qualityGate.failures.join(' ')}`);
  }
  const inlineFlooringBrief = buildInlineFlooringBrief(resinateFlooring);
  const inlineApexBrief = buildInlineApexBrief({
    prospect: {
      business_name: prospect.business_name,
      city: prospect.city,
      niche: prospect.niche,
      notes: prospect.notes,
    },
    audit,
    rich: mockupStrategy.rich,
    social: socialAuditStrategy,
    apex: apexDelivery,
  });
  const usesMockupLink = containsMockupReference(emailDraft.body);
  const usesSocialAuditLink = containsSocialAuditReference(emailDraft.body);
  const usesFlooringAuditLink = containsPublicFlooringBriefReference(emailDraft.body);
  const usesInlineFlooringBrief = containsInlineFlooringBriefReference(emailDraft.body);
  const usesInlineApexBrief = containsInlineApexBriefReference(emailDraft.body);
  const apexContentDirectionPresent = hasApexContentDirection({
    ...audit,
    ...mockupStrategy.rich,
    ...socialAuditStrategy,
    ...apexDelivery,
    business_name: prospect.business_name,
    city: prospect.city,
  });
  const selectedArtifact = selectPrimaryArtifactUrl({
    isResinateCampaign,
    apexDeliveryMode,
    resinateDeliveryMode,
    usesMockupLink,
    usesSocialAuditLink,
    usesFlooringAuditLink,
    usesInlineApexBrief,
    mockupUrl,
    socialAuditUrl,
    flooringAuditUrl,
  });
  const intentionalLinkPresent = hasIntentionalLink(emailDraft.body);
  const sanitizedTo = toValidation?.ok ? toValidation.value : prospect.public_email;
  const sanitizedFrom = fromValidation.ok ? fromValidation.value : fromCandidate;
  const sanitizedSubject = sanitizeHeaderValue(emailDraft.subject);
  const replacedBody = replaceOutreachReferences(
    emailDraft.body,
    mockupUrl,
    socialAuditUrl,
    flooringAuditUrl,
    inlineFlooringBrief,
    inlineApexBrief
  );
  const finalEmail = buildFinalEmailBody({
    body: replacedBody,
    fallbackUrl: selectedArtifact.url,
    intentionalLinkPresent,
  });

  return {
    prospectId: prospect.id,
    emailDraftId: emailDraft.id,
    businessName: prospect.business_name,
    toEmail: sanitizedTo,
    fromEmail: sanitizedFrom,
    subject: sanitizedSubject.ok ? sanitizedSubject.value : emailDraft.subject,
    body: replacedBody,
    finalBody: finalEmail.body,
    mockupUrl,
    socialAuditUrl,
    flooringAuditUrl,
    inlineFlooringBrief,
    inlineApexBrief,
    campaignTypeDetected,
    campaignLabel: getCampaignLabel(campaignTypeDetected),
    apexDeliveryMode,
    apexDeliveryModeLabel: apexDeliveryMode ? getApexDeliveryModeLabel(apexDeliveryMode) : 'Standard',
    resinateDeliveryMode,
    resinateDeliveryModeLabel: resinateDeliveryMode ? getResinateDeliveryModeLabel(resinateDeliveryMode) : 'Standard',
    publicArtifactRequired,
    publicSocialAuditRequired,
    publicMockupRequired,
    publicSocialAuditIncluded: usesSocialAuditLink,
    publicMockupIncluded: usesMockupLink,
    selectedPrimaryArtifactUrl: selectedArtifact.url,
    selectedPrimaryArtifactLabel: selectedArtifact.label,
    primaryArtifactType: selectedArtifact.type,
    hasMockupLink: usesMockupLink,
    hasSocialAuditLink: usesSocialAuditLink,
    hasFlooringAuditLink: usesFlooringAuditLink,
    hasInlineFlooringBrief: usesInlineFlooringBrief,
    hasInlineApexBrief: usesInlineApexBrief,
    usesMockupLink,
    usesSocialAuditLink,
    usesFlooringAuditLink,
    usesInlineFlooringBrief,
    usesInlineApexBrief,
    publicBriefLinkIncluded: usesFlooringAuditLink && Boolean(flooringAuditUrl),
    inlineBriefIncluded: usesInlineFlooringBrief,
    inlineApexBriefIncluded: usesInlineApexBrief,
    senderProfileKey: senderProfile.key,
    senderLabel: senderProfile.senderLabel,
    senderProviderName: senderProfile.providerName,
    senderConfigured: senderProfile.configured,
    senderMissingFields: senderProfile.missingFields,
    linkReplacementApplied: replacedBody !== emailDraft.body,
    fallbackLinkAppended: finalEmail.fallbackLinkAppended,
    optOutIncluded: finalEmail.optOutIncluded,
    emailQualityWarnings: [
      ...getEmailQualityWarnings({
        businessName: prospect.business_name,
        rawBody: emailDraft.body,
        finalBody: finalEmail.body,
        usesMockupLink,
        usesSocialAuditLink,
        usesFlooringAuditLink,
        usesInlineFlooringBrief,
        usesInlineApexBrief,
        apexDeliveryMode,
        apexContentDirectionPresent,
      }),
      ...(isApexCampaign && mockupV2Diagnostics.qualityGate.required
        ? mockupV2Diagnostics.qualityGate.warnings
        : []),
    ],
    status: prospect.status,
    sendable: blockedReasons.length === 0,
    blockedReasons,
  };
}

function getSenderBlockedReason(senderProfile: SenderProfile, testMode: boolean) {
  if (senderProfile.key === 'resinate' && !senderProfile.configured) {
    return 'Resinate Gmail sender is not configured.';
  }

  if (!testMode && !senderProfile.configured) {
    return `${senderProfile.senderLabel} Gmail sender is not configured.`;
  }

  return null;
}

function pickEmailDraft(drafts: EmailDraftRow[] | null | undefined) {
  if (!drafts || drafts.length === 0) return null;
  return drafts.find((draft) => SENDABLE_DRAFT_STATUSES.includes(draft.status)) || null;
}

function pickMockup(mockups: MockupRow[] | null | undefined) {
  if (!mockups || mockups.length === 0) return null;
  return (
    mockups.find((mockup) => mockup.mockup_status === 'published') ||
    mockups.find((mockup) => mockup.mockup_status === 'ready') ||
    mockups.find((mockup) => mockup.slug || mockup.mockup_url) ||
    null
  );
}

function pickAudit(audits: AuditRow[] | null | undefined) {
  if (!audits || audits.length === 0) return null;
  return audits[0];
}

function buildMockupUrl(mockup: MockupRow, origin: string) {
  if (mockup.mockup_url) return mockup.mockup_url;
  return buildPublicMockupUrl(mockup.slug, origin);
}

function getCampaignLabel(campaignType: string) {
  return campaignType === 'resinate_flooring' ? 'Resinate Commercial Flooring' : 'Apex Website/Social';
}

function selectPrimaryArtifactUrl({
  isResinateCampaign,
  apexDeliveryMode,
  resinateDeliveryMode,
  usesMockupLink,
  usesSocialAuditLink,
  usesFlooringAuditLink,
  usesInlineApexBrief,
  mockupUrl,
  socialAuditUrl,
  flooringAuditUrl,
}: {
  isResinateCampaign: boolean;
  apexDeliveryMode: ApexDeliveryMode | null;
  resinateDeliveryMode: ResinateDeliveryMode | null;
  usesMockupLink: boolean;
  usesSocialAuditLink: boolean;
  usesFlooringAuditLink: boolean;
  usesInlineApexBrief: boolean;
  mockupUrl: string;
  socialAuditUrl: string;
  flooringAuditUrl: string;
}) {
  if (isResinateCampaign && resinateDeliveryMode === 'inline_brief') {
    return { label: 'Inline commercial surface note', url: '', type: 'inline_flooring_brief' };
  }

  if (!isResinateCampaign && apexDeliveryMode === 'inline_apex_brief') {
    return { label: 'Inline first impression direction', url: '', type: 'inline_apex_brief' };
  }

  if ((isResinateCampaign || usesFlooringAuditLink) && flooringAuditUrl) {
    return { label: 'Commercial Surface Brief URL', url: flooringAuditUrl, type: 'flooring_brief_url' };
  }

  if (usesSocialAuditLink) {
    return {
      label: usesMockupLink ? 'Social audit + mockup links' : 'Social Audit URL',
      url: socialAuditUrl,
      type: usesMockupLink ? 'social_audit_and_mockup_urls' : 'social_audit_url',
    };
  }

  if (usesMockupLink) {
    return { label: 'Mockup URL', url: mockupUrl, type: 'mockup_url' };
  }

  if (usesInlineApexBrief) {
    return { label: 'Inline first impression direction', url: '', type: 'inline_apex_brief' };
  }

  return { label: 'Fallback Reference URL', url: mockupUrl, type: 'fallback_url' };
}

function buildFinalEmailBody({
  body,
  fallbackUrl,
  intentionalLinkPresent,
}: {
  body: string;
  fallbackUrl: string;
  intentionalLinkPresent: boolean;
}) {
  const fallbackLinkAppended = Boolean(fallbackUrl) && !intentionalLinkPresent && !hasIntentionalLink(body);
  const withFallback = fallbackLinkAppended ? `${body.trim()}\n\nReference link: ${fallbackUrl}` : body.trim();
  const withOptOut = appendOptOutOnce(withFallback);

  return {
    body: withOptOut.body,
    fallbackLinkAppended,
    optOutIncluded: withOptOut.optOutIncluded,
  };
}

function replaceOutreachReferences(
  body: string,
  mockupUrl: string,
  socialAuditUrl: string,
  flooringAuditUrl: string,
  inlineFlooringBrief: string,
  inlineApexBrief: string
) {
  return body
    .replace(/\[mockup link\]/gi, mockupUrl)
    .replace(/\[social audit link\]/gi, socialAuditUrl)
    .replace(/\[inline apex brief\]/gi, inlineApexBrief)
    .replace(/\[inline flooring brief\]/gi, inlineFlooringBrief)
    .replace(/\[flooring audit link\]/gi, flooringAuditUrl)
    .replace(/\[flooring brief link\]/gi, flooringAuditUrl)
    .replace(/\[commercial surface brief link\]/gi, flooringAuditUrl)
    .replace(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/mockups\/[^\s)]+/gi, mockupUrl)
    .replace(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/social-audits\/[^\s)]+/gi, socialAuditUrl)
    .replace(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/flooring-audits\/[^\s)]+/gi, flooringAuditUrl);
}

function containsMockupReference(body: string) {
  return /\[mockup link\]/i.test(body) || /\/mockups\//i.test(body);
}

function containsSocialAuditReference(body: string) {
  return /\[social audit link\]/i.test(body) || /\/social-audits\//i.test(body);
}

function hasIntentionalLink(body: string) {
  return (
    /\[mockup link\]/i.test(body) ||
    /\[social audit link\]/i.test(body) ||
    /\[inline apex brief\]/i.test(body) ||
    /\[inline flooring brief\]/i.test(body) ||
    /\[flooring audit link\]/i.test(body) ||
    /\[flooring brief link\]/i.test(body) ||
    /\[commercial surface brief link\]/i.test(body) ||
    /\/mockups\//i.test(body) ||
    /\/social-audits\//i.test(body) ||
    /\/flooring-audits\//i.test(body)
  );
}

function appendOptOutOnce(body: string) {
  const optOutText = 'If you would rather not hear from me again, just reply and let me know.';
  const cleanedBody = body
    .replace(/(?:\n\s*)*if you would rather not hear from me again,[^\n]*(?:\n|$)/gi, '\n')
    .replace(/(?:\n\s*)*[^\n]*(?:opt[-\s]?out|unsubscribe)[^\n]*(?:\n|$)/gi, '\n')
    .trim();

  return {
    body: cleanedBody ? `${cleanedBody}\n\n${optOutText}` : optOutText,
    optOutIncluded: true,
  };
}

function getEmailQualityWarnings({
  businessName,
  rawBody,
  finalBody,
  usesMockupLink,
  usesSocialAuditLink,
  usesFlooringAuditLink,
  usesInlineFlooringBrief,
  usesInlineApexBrief,
  apexDeliveryMode,
  apexContentDirectionPresent,
}: {
  businessName: string;
  rawBody: string;
  finalBody: string;
  usesMockupLink: boolean;
  usesSocialAuditLink: boolean;
  usesFlooringAuditLink: boolean;
  usesInlineFlooringBrief: boolean;
  usesInlineApexBrief: boolean;
  apexDeliveryMode: ApexDeliveryMode | null;
  apexContentDirectionPresent: boolean;
}) {
  const warnings: string[] = [];
  const lower = rawBody.toLowerCase();
  const isApexDraft = Boolean(apexDeliveryMode || usesInlineApexBrief || usesMockupLink || usesSocialAuditLink);

  if (/^\s*i hope this email finds you well\b/i.test(rawBody)) {
    warnings.push('Opening sounds generic: remove "I hope this email finds you well."');
  }

  if (
    !usesMockupLink &&
    !usesSocialAuditLink &&
    !usesFlooringAuditLink &&
    !usesInlineFlooringBrief &&
    !usesInlineApexBrief
  ) {
    warnings.push('Draft does not include an approved artifact placeholder.');
  }

  if (apexDeliveryMode === 'inline_apex_brief' && !apexContentDirectionPresent) {
    warnings.push('Apex inline brief needs first-impression, trust, proof, lead-path, or Meta angle fields.');
  }

  if (!mentionsSpecificObservation(lower)) {
    warnings.push('Draft may need one specific website, social, proof, offer, or lead-path observation.');
  }

  if (soundsGeneric(lower, businessName)) {
    warnings.push('Draft may sound generic because it does not mention the business or a concrete content issue.');
  }

  if (isApexDraft && !mentionsFirstImpressionOrLeadPath(lower)) {
    warnings.push('Apex email should mention first impression, trust, proof, lead path, quote path, booking path, order path, visit path, or inquiry path.');
  }

  if (isApexDraft && usesGenericMarketingLanguage(lower)) {
    warnings.push('Apex email uses generic marketing language; make it more diagnostic and proof-oriented.');
  }

  if (isApexDraft && !hasSoftAsk(lower)) {
    warnings.push('Apex email should end with a soft ask for a quick walkthrough or call.');
  }

  const maxWords = isApexDraft ? 150 : 160;
  if (countWords(finalBody) > maxWords) {
    warnings.push(`Final email body is over ${maxWords} words.`);
  }

  if (!hasHumanSignoff(rawBody)) {
    warnings.push('Draft is missing a human signoff.');
  }

  return warnings;
}

function mentionsSpecificObservation(value: string) {
  return [
    'instagram',
    'facebook',
    'reel',
    'video',
    'post',
    'content',
    'social',
    'website',
    'menu',
    'booking',
    'reservation',
    'quote',
    'cta',
    'before-and-after',
    'happy hour',
    'event',
    'offer',
    'ads',
    'meta',
    'shoot',
    'weekly',
    'inquiry',
    'inquiries',
    'flooring',
    'surface',
    'traffic',
    'moisture',
    'slip',
    'walkthrough',
    'facility',
    'commercial',
    'first impression',
    'trust',
    'proof',
    'lead path',
    'estimate',
  ].some((term) => value.includes(term));
}

function mentionsFirstImpressionOrLeadPath(value: string) {
  return /(first impression|trust|proof|lead path|quote path|booking path|order path|visit path|inquiry path|estimate path|request an estimate|book|call|reach out|inquir)/i.test(value);
}

function usesGenericMarketingLanguage(value: string) {
  return /(boost your online presence|optimize engagement|i ran a full audit|comprehensive marketing strategy|take your business to the next level|grow your brand|increase brand awareness)/i.test(value);
}

function hasSoftAsk(value: string) {
  return /(would you be open|would it be worth|would it make sense|quick walkthrough|quick call|open to a quick|worth a quick|right person)/i.test(value);
}

function soundsGeneric(value: string, businessName: string) {
  const mentionsBusiness = businessName
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part.length > 3)
    .some((part) => value.includes(part));

  return (
    !mentionsBusiness &&
    /\byour (business|company|website|social media|online presence)\b/i.test(value) &&
    !mentionsSpecificObservation(value)
  );
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function hasHumanSignoff(value: string) {
  return /best,\s*nate/i.test(value) || /apex marketing group/i.test(value);
}

function startOfTodayIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

function addBusinessDays(startDate: Date, businessDays: number) {
  const date = new Date(startDate);
  let added = 0;

  while (added < businessDays) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }

  return date;
}

async function getGmailAccessToken(senderProfile: SenderProfile) {
  if (!senderProfile.configured) {
    throw new Error(`${senderProfile.senderLabel} Gmail sender is not configured.`);
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: senderProfile.clientId,
      client_secret: senderProfile.clientSecret,
      refresh_token: senderProfile.refreshToken,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error_description || data?.error || `Google token request failed with HTTP ${response.status}`);
  }

  return data.access_token as string;
}

function buildMimeMessage({
  to,
  from,
  subject,
  body,
}: {
  to: string;
  from: string;
  subject: string;
  body: string;
}) {
  const normalizedBody = normalizeMimeLineEndings(body);

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeMimeSubject(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    normalizedBody,
  ].join('\r\n');
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function sendKey(prospectId: string, emailDraftId: string) {
  return `${prospectId}:${emailDraftId}`;
}

function mapRecentSend(row: RecentSendRow): RecentSendItem {
  const prospect = Array.isArray(row.prospects) ? row.prospects[0] : row.prospects;
  const emailDraft = Array.isArray(row.email_drafts) ? row.email_drafts[0] : row.email_drafts;

  return {
    id: row.id,
    prospectId: row.prospect_id,
    emailDraftId: row.email_draft_id,
    businessName: prospect?.business_name || 'Unknown prospect',
    toEmail: row.to_email,
    subject: row.subject || emailDraft?.subject || 'No subject',
    status: row.status,
    provider: row.provider,
    sentAt: row.sent_at,
    createdAt: row.created_at,
    errorMessage: row.error_message,
  };
}
