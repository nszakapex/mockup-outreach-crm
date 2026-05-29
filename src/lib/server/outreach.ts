import 'server-only';

import {
  encodeMimeSubject,
  normalizeMimeLineEndings,
  sanitizeEmailAddress,
  sanitizeHeaderValue,
} from '@/lib/email-sanitization';
import { buildPublicMockupUrl } from '@/lib/mockup-templates';
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
};

type ProspectRow = {
  id: string;
  business_name: string;
  public_email: string | null;
  status: string;
  city: string;
  state: string;
  mockups?: MockupRow[] | null;
  email_drafts?: EmailDraftRow[] | null;
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
  mockupUrl: string;
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
  return {
    googleClientIdConfigured: Boolean(process.env.GOOGLE_CLIENT_ID?.trim()),
    googleClientSecretConfigured: Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim()),
    googleRefreshTokenConfigured: Boolean(process.env.GOOGLE_REFRESH_TOKEN?.trim()),
    gmailSenderEmailConfigured: Boolean(process.env.GMAIL_SENDER_EMAIL?.trim()),
    gmailSenderEmail: process.env.GMAIL_SENDER_EMAIL?.trim() || '',
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
    .filter((item): item is SendQueueItem => Boolean(item))
    .filter((item) => item.sendable);

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
  const body = buildEmailBody(item);
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
      const gmailResult = await sendGmailOutreachEmail({
        to: sanitized.to,
        from: sanitized.from,
        subject: sanitized.subject,
        body,
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
    body: buildEmailBody(item),
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
}: {
  to: string;
  from: string;
  subject: string;
  body: string;
}) {
  const sanitized = sanitizeSendFields(to, from, subject);
  const accessToken = await getGmailAccessToken();
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
    .select('id, business_name, public_email, status, city, state, mockups(id, slug, title, mockup_url, mockup_status), email_drafts(id, subject, body, status)')
    .eq('status', 'approved_to_send')
    .order('updated_at', { ascending: true });

  if (error) throw new Error(`Fetch send queue: ${error.message}`);
  return (data || []) as ProspectRow[];
}

async function fetchProspectForSend(prospectId: string) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('prospects')
    .select('id, business_name, public_email, status, city, state, mockups(id, slug, title, mockup_url, mockup_status), email_drafts(id, subject, body, status)')
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

function getSenderEmailForMode(config = getOutreachConfig()) {
  if (config.gmailSenderEmail) return config.gmailSenderEmail;
  return config.testMode ? 'test-mode@mockup-outreach-crm.local' : '';
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
  const fromCandidate = getSenderEmailForMode(config);
  const fromValidation = sanitizeEmailAddress(fromCandidate);
  const toValidation = prospect.public_email ? sanitizeEmailAddress(prospect.public_email) : null;

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

  if (!fromCandidate) {
    blockedReasons.push('GMAIL_SENDER_EMAIL is not configured.');
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
  if (!mockup?.slug && !mockup?.mockup_url) {
    blockedReasons.push('Prospect is missing a mockup link.');
  }

  if (!emailDraft || !prospect.public_email || !mockup) return null;

  const mockupUrl = buildMockupUrl(mockup, origin);
  const sanitizedTo = toValidation?.ok ? toValidation.value : prospect.public_email;
  const sanitizedFrom = fromValidation.ok ? fromValidation.value : fromCandidate;
  const sanitizedSubject = sanitizeHeaderValue(emailDraft.subject);

  return {
    prospectId: prospect.id,
    emailDraftId: emailDraft.id,
    businessName: prospect.business_name,
    toEmail: sanitizedTo,
    fromEmail: sanitizedFrom,
    subject: sanitizedSubject.ok ? sanitizedSubject.value : emailDraft.subject,
    body: replaceMockupReferences(emailDraft.body, mockupUrl),
    mockupUrl,
    status: prospect.status,
    sendable: blockedReasons.length === 0,
    blockedReasons,
  };
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

function buildMockupUrl(mockup: MockupRow, origin: string) {
  if (mockup.mockup_url) return mockup.mockup_url;
  return buildPublicMockupUrl(mockup.slug, origin);
}

function buildEmailBody(item: SendQueueItem) {
  const bodyWithMockup = replaceMockupReferences(item.body, item.mockupUrl);

  return [
    bodyWithMockup,
    '',
    `Mockup link: ${item.mockupUrl}`,
    '',
    'If you would rather not hear from me again, reply with "opt out" and I will not contact you again.',
  ].join('\n');
}

function replaceMockupReferences(body: string, mockupUrl: string) {
  return body
    .replace(/\[mockup link\]/gi, mockupUrl)
    .replace(/https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/mockups\/[^\s)]+/gi, mockupUrl);
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

async function getGmailAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not configured.');
  if (!clientSecret) throw new Error('GOOGLE_CLIENT_SECRET is not configured.');
  if (!refreshToken) throw new Error('GOOGLE_REFRESH_TOKEN is not configured.');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
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
