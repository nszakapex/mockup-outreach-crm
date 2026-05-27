import 'server-only';

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

export type SendQueueItem = {
  prospectId: string;
  emailDraftId: string;
  businessName: string;
  toEmail: string;
  subject: string;
  body: string;
  mockupUrl: string;
  status: string;
  sendable: boolean;
  blockedReasons: string[];
};

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
  const [stats, prospects, optOutEmails, successfulSends] = await Promise.all([
    getOutreachStats(),
    fetchQueueProspects(),
    fetchOptOutEmails(),
    fetchSuccessfulSends(),
  ]);

  const successfulKeys = new Set(
    successfulSends
      .filter((send) => send.email_draft_id)
      .map((send) => sendKey(send.prospect_id, send.email_draft_id as string))
  );

  const items = prospects
    .map((prospect) => buildQueueItem(prospect, origin, optOutEmails, successfulKeys))
    .filter((item): item is SendQueueItem => Boolean(item))
    .filter((item) => item.sendable);

  return { items, stats };
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
  const item = buildQueueItem(prospect, origin, optOutEmails, successfulKeys);

  if (!item) throw new Error('Prospect is missing a sendable email draft.');
  if ((options.enforceDailyCap ?? true) && stats.remainingToday <= 0) {
    item.blockedReasons.push(`Daily send cap reached (${stats.sentToday}/${stats.dailyCap}).`);
  }

  if (item.blockedReasons.length > 0) {
    throw new Error(item.blockedReasons.join(' '));
  }

  return { item, stats };
}

export async function sendOutreachEmail(prospectId: string, origin: string) {
  const { item } = await validateSendEligibility(prospectId, origin);
  const config = getOutreachConfig();
  const supabase = getServerSupabase();
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
        to_email: item.toEmail,
        from_email: config.gmailSenderEmail || 'test-mode@mockup-outreach-crm.local',
        subject: item.subject,
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
      if (!config.gmailSenderEmail) throw new Error('GMAIL_SENDER_EMAIL is not configured.');
      const gmailResult = await sendGmailOutreachEmail({
        to: item.toEmail,
        from: config.gmailSenderEmail,
        subject: item.subject,
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
  const config = getOutreachConfig();
  const supabase = getServerSupabase();

  const { error: insertError } = await supabase.from('outreach_sends').insert({
    prospect_id: item.prospectId,
    email_draft_id: item.emailDraftId,
    provider: 'test',
    to_email: item.toEmail,
    from_email: config.gmailSenderEmail || 'not-sent',
    subject: item.subject,
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
  const accessToken = await getGmailAccessToken();
  const raw = encodeBase64Url(buildMimeMessage({ to, from, subject, body }));

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
    cache: 'no-store',
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message || `Gmail send failed with HTTP ${response.status}`);
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
  return new Set((data || []).map((row) => String(row.email).toLowerCase()));
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

function buildQueueItem(
  prospect: ProspectRow,
  origin: string,
  optOutEmails: Set<string>,
  successfulSendKeys: Set<string>
) {
  const blockedReasons: string[] = [];

  if (prospect.status !== 'approved_to_send') {
    blockedReasons.push('Prospect must be approved through Telegram before sending.');
  }

  if (prospect.status === 'do_not_contact' || prospect.status === 'not_interested') {
    blockedReasons.push('Rejected or do-not-contact prospects cannot be sent.');
  }

  if (!prospect.public_email) {
    blockedReasons.push('Prospect is missing public_email.');
  } else if (optOutEmails.has(prospect.public_email.toLowerCase())) {
    blockedReasons.push('Prospect email is opted out.');
  }

  const emailDraft = pickEmailDraft(prospect.email_drafts);
  if (!emailDraft) {
    blockedReasons.push('Prospect is missing an approved email draft.');
  } else {
    if (!emailDraft.subject?.trim()) blockedReasons.push('Email draft is missing a subject.');
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

  return {
    prospectId: prospect.id,
    emailDraftId: emailDraft.id,
    businessName: prospect.business_name,
    toEmail: prospect.public_email,
    subject: emailDraft.subject,
    body: emailDraft.body,
    mockupUrl: buildMockupUrl(mockup, origin),
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
  return `${origin.replace(/\/$/, '')}/mockups/${mockup.slug}`;
}

function buildEmailBody(item: SendQueueItem) {
  const bodyWithMockup = item.body.includes('[Mockup Link]')
    ? item.body.replaceAll('[Mockup Link]', item.mockupUrl)
    : item.body;

  return [
    bodyWithMockup,
    '',
    `Mockup link: ${item.mockupUrl}`,
    '',
    'If you would rather not hear from me again, reply with "opt out" and I will not contact you again.',
  ].join('\n');
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
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeMimeHeader(subject)}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
  ].join('\r\n');
}

function encodeMimeHeader(value: string) {
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
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
