import 'server-only';

import { buildPublicFlooringAuditUrl, buildPublicMockupUrl } from '@/lib/mockup-templates';
import { isResinateCampaign, parseResinateConceptNotes, type ResinateFlooringData } from '@/lib/resinate-data';
import { getServerSupabase } from './supabase';

const TELEGRAM_TIMEOUT_MS = 10000;
const CALLBACK_PREFIX = 'mo';
const CALLBACK_ID_PATTERN =
  /^mo:(approve|needs_edit|reject):([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export type TelegramApprovalAction = 'approve' | 'needs_edit' | 'reject';

interface ApprovalMockup {
  id: string;
  slug: string;
  title: string;
  mockup_status: string;
  concept_notes: string | null;
}

interface ApprovalEmailDraft {
  id: string;
  subject: string;
  body: string;
  status: string;
  reply_status: string | null;
}

interface ApprovalProspect {
  id: string;
  business_name: string;
  niche: string;
  city: string;
  state: string;
  public_email: string | null;
  status: string;
  lead_score: number;
  notes: string | null;
  mockups?: ApprovalMockup[] | null;
  email_drafts?: ApprovalEmailDraft[] | null;
}

interface TelegramMessageResult {
  message_id?: number;
  chat?: {
    id?: number;
  };
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

type TelegramInlineKeyboardButton =
  | { text: string; callback_data: string }
  | { text: string; url: string };

export interface ApprovalActionResult {
  action: TelegramApprovalAction;
  prospectId: string;
  prospectName: string;
  prospectStatus: string;
  emailDraftStatus: string;
  message: string;
}

export function getTelegramConfig() {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN?.trim() || '',
    chatId: process.env.TELEGRAM_CHAT_ID?.trim() || '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || '',
  };
}

export function buildCallbackData(action: TelegramApprovalAction, prospectId: string) {
  return `${CALLBACK_PREFIX}:${action}:${prospectId}`;
}

export function parseCallbackData(value: unknown):
  | { ok: true; action: TelegramApprovalAction; prospectId: string }
  | { ok: false; error: string } {
  if (typeof value !== 'string') return { ok: false, error: 'Callback data is missing.' };

  const match = value.match(CALLBACK_ID_PATTERN);
  if (!match) return { ok: false, error: 'Callback data is invalid.' };

  return {
    ok: true,
    action: match[1] as TelegramApprovalAction,
    prospectId: match[2],
  };
}

export function isValidTelegramAction(value: unknown): value is TelegramApprovalAction {
  return value === 'approve' || value === 'needs_edit' || value === 'reject';
}

export function assertWebhookSecret(requestSecret: string | null) {
  const expected = getTelegramConfig().webhookSecret;
  if (!expected) throw new Error('TELEGRAM_WEBHOOK_SECRET is not configured.');
  if (requestSecret !== expected) throw new Error('Invalid Telegram webhook secret.');
}

export async function sendApprovalCard(prospectId: string, origin: string) {
  const config = getTelegramConfig();
  if (!config.botToken) throw new Error('TELEGRAM_BOT_TOKEN is not configured.');
  if (!config.chatId) throw new Error('TELEGRAM_CHAT_ID is not configured.');

  const prospect = await fetchApprovalProspect(prospectId);
  const { mockup, emailDraft } = await validateApprovalCandidate(prospect);
  if (!mockup) throw new Error('Prospect is missing a mockup.');
  const mockupUrl = buildPublicMockupUrl(mockup.slug, origin);
  const flooring = parseResinateConceptNotes(mockup.concept_notes);
  const resinateCampaign = isResinateCampaign(flooring);
  const flooringAuditUrl = buildPublicFlooringAuditUrl(mockup.slug, origin);
  const inlineKeyboard: TelegramInlineKeyboardButton[][] = [
    [
      { text: 'Approve', callback_data: buildCallbackData('approve', prospect.id) },
      { text: 'Needs Edit', callback_data: buildCallbackData('needs_edit', prospect.id) },
      { text: 'Reject', callback_data: buildCallbackData('reject', prospect.id) },
    ],
  ];

  if (isPublicHttpsUrl(mockupUrl)) {
    inlineKeyboard.push([{ text: 'Open Mockup', url: mockupUrl }]);
  }

  if (resinateCampaign && isPublicHttpsUrl(flooringAuditUrl)) {
    inlineKeyboard.push([{ text: 'Open Flooring Audit', url: flooringAuditUrl }]);
  }

  const message = buildApprovalMessage(prospect, emailDraft, mockupUrl, resinateCampaign ? flooring : null, flooringAuditUrl);
  const response = await telegramApi<TelegramMessageResult>('sendMessage', {
    chat_id: config.chatId,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: false,
    reply_markup: {
      inline_keyboard: inlineKeyboard,
    },
  });

  return {
    prospectId: prospect.id,
    prospectName: prospect.business_name,
    telegramMessageId: response.result?.message_id ?? null,
    mockupUrl,
  };
}

export async function applyTelegramApprovalAction(
  prospectId: string,
  action: TelegramApprovalAction
): Promise<ApprovalActionResult> {
  const prospect = await fetchApprovalProspect(prospectId);
  const { emailDraft } = await validateApprovalCandidate(prospect, {
    requireMockup: false,
    checkOptOut: false,
  });
  const supabase = getServerSupabase();

  const next =
    action === 'approve'
      ? {
          prospectStatus: 'approved_to_send',
          emailDraftStatus: 'approved',
          emailDraftPatch: { status: 'approved', approved_at: new Date().toISOString() },
          message: `${prospect.business_name} approved for sending.`,
        }
      : action === 'needs_edit'
        ? {
            prospectStatus: 'email_ready',
            emailDraftStatus: 'draft',
            emailDraftPatch: { status: 'draft', approved_at: null },
            message: `${prospect.business_name} marked as needing edits.`,
          }
        : {
            prospectStatus: 'not_interested',
            emailDraftStatus: 'rejected',
            emailDraftPatch: { status: 'rejected', approved_at: null },
            message: `${prospect.business_name} rejected.`,
          };

  if (action === 'approve') {
    await assertNotOptedOut(prospect.public_email);
  }

  const { error: prospectError } = await supabase
    .from('prospects')
    .update({ status: next.prospectStatus })
    .eq('id', prospect.id);
  if (prospectError) throw new Error(`Update prospect: ${prospectError.message}`);

  const { error: draftError } = await supabase
    .from('email_drafts')
    .update(next.emailDraftPatch)
    .eq('id', emailDraft.id);
  if (draftError) throw new Error(`Update email draft: ${draftError.message}`);

  return {
    action,
    prospectId: prospect.id,
    prospectName: prospect.business_name,
    prospectStatus: next.prospectStatus,
    emailDraftStatus: next.emailDraftStatus,
    message: next.message,
  };
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text: string,
  showAlert = false
) {
  return telegramApi('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
    show_alert: showAlert,
  });
}

export async function editTelegramMessage(chatId: number | string, messageId: number, text: string) {
  return telegramApi('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
  });
}

export function buildConfirmationMessage(result: ApprovalActionResult) {
  const icon =
    result.action === 'approve' ? 'Approved' : result.action === 'needs_edit' ? 'Needs edit' : 'Rejected';

  return [
    `<b>${escapeHtml(icon)}: ${escapeHtml(result.prospectName)}</b>`,
    '',
    `Prospect status: <code>${escapeHtml(result.prospectStatus)}</code>`,
    `Email draft status: <code>${escapeHtml(result.emailDraftStatus)}</code>`,
    '',
    escapeHtml(result.message),
  ].join('\n');
}

async function fetchApprovalProspect(prospectId: string): Promise<ApprovalProspect> {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('prospects')
    .select(
      'id, business_name, niche, city, state, public_email, status, lead_score, notes, mockups(id, slug, title, mockup_status, concept_notes), email_drafts(id, subject, body, status, reply_status)'
    )
    .eq('id', prospectId)
    .maybeSingle();

  if (error) throw new Error(`Fetch prospect: ${error.message}`);
  if (!data) throw new Error('Prospect not found.');

  return data as ApprovalProspect;
}

async function validateApprovalCandidate(
  prospect: ApprovalProspect,
  options: { requireMockup?: boolean; checkOptOut?: boolean } = {}
) {
  const requireMockup = options.requireMockup ?? true;
  const checkOptOut = options.checkOptOut ?? true;
  const allowedStatuses = new Set(['email_ready', 'approved_to_send']);

  if (!allowedStatuses.has(prospect.status)) {
    throw new Error(`Prospect status ${prospect.status} cannot be sent to Telegram.`);
  }

  if (prospect.status === 'do_not_contact') {
    throw new Error('Do-not-contact prospects cannot be sent to Telegram.');
  }

  if (!prospect.public_email) {
    throw new Error('Prospect is missing a public email.');
  }

  const emailDraft = pickEmailDraft(prospect.email_drafts);
  if (!emailDraft) throw new Error('Prospect is missing an email draft.');
  if (!emailDraft.subject.trim() || !emailDraft.body.trim()) {
    throw new Error('Prospect email draft must include a subject and body.');
  }

  const mockup = pickMockup(prospect.mockups);
  if (requireMockup && !mockup) throw new Error('Prospect is missing a mockup.');

  if (checkOptOut) {
    await assertNotOptedOut(prospect.public_email);
  }

  return { emailDraft, mockup };
}

function pickEmailDraft(drafts: ApprovalEmailDraft[] | null | undefined) {
  if (!drafts || drafts.length === 0) return null;
  return (
    drafts.find((draft) => draft.status === 'ready') ||
    drafts.find((draft) => draft.status === 'approved') ||
    drafts.find((draft) => draft.status === 'draft') ||
    drafts[0]
  );
}

function pickMockup(mockups: ApprovalMockup[] | null | undefined) {
  if (!mockups || mockups.length === 0) return null;
  return (
    mockups.find((mockup) => mockup.mockup_status === 'published') ||
    mockups.find((mockup) => mockup.mockup_status === 'ready') ||
    mockups[0]
  );
}

async function assertNotOptedOut(email: string | null) {
  if (!email) return;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('opt_outs')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (error) throw new Error(`Check opt-out: ${error.message}`);
  if (data) throw new Error('This email is on the opt-out list. Cannot approve or send.');
}

function buildApprovalMessage(
  prospect: ApprovalProspect,
  emailDraft: ApprovalEmailDraft,
  mockupUrl: string,
  flooring: ResinateFlooringData | null,
  flooringAuditUrl: string
) {
  const location = [prospect.city, prospect.state].filter(Boolean).join(', ');
  const notes = prospect.notes ? `\n\n<b>Notes</b>\n${escapeHtml(prospect.notes)}` : '';
  const flooringBlock = flooring
    ? [
        '',
        '<b>Campaign</b>: Resinate Flooring',
        flooring.recommended_flooring_system
          ? `<b>Recommended system</b>: ${escapeHtml(flooring.recommended_flooring_system)}`
          : null,
        flooring.next_sales_action ? `<b>Next action</b>: ${escapeHtml(flooring.next_sales_action)}` : null,
        `<b>Flooring audit</b>: ${escapeHtml(flooringAuditUrl)}`,
      ].filter(Boolean)
    : [];

  return [
    `<b>Approval needed: ${escapeHtml(prospect.business_name)}</b>`,
    '',
    `<b>Status</b>: <code>${escapeHtml(prospect.status)}</code>`,
    `<b>Niche</b>: ${escapeHtml(prospect.niche)}`,
    `<b>Location</b>: ${escapeHtml(location)}`,
    `<b>Lead score</b>: ${prospect.lead_score}`,
    '',
    `<b>Email subject</b>`,
    escapeHtml(emailDraft.subject),
    '',
    `<b>Email body</b>`,
    escapeHtml(truncate(emailDraft.body, 1400)),
    '',
    `<b>Mockup</b>`,
    escapeHtml(mockupUrl),
    ...flooringBlock,
    notes,
  ].join('\n');
}

async function telegramApi<T>(method: string, payload: unknown) {
  const { botToken } = getTelegramConfig();
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not configured.');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TELEGRAM_TIMEOUT_MS);

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
      signal: controller.signal,
    });

    const data = (await response.json().catch(() => null)) as TelegramApiResponse<T> | null;
    if (!response.ok || data?.ok !== true) {
      throw new Error(data?.description || `Telegram ${method} failed with HTTP ${response.status}`);
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function isPublicHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname !== 'localhost' &&
      url.hostname !== '127.0.0.1' &&
      url.hostname !== '[::1]'
    );
  } catch {
    return false;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
