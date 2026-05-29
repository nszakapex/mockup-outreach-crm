export type SanitizedValueResult =
  | { ok: true; value: string }
  | { ok: false; errorMessage: string };

const SIMPLE_EMAIL_REGEX =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function sanitizeEmailAddress(value: unknown): SanitizedValueResult {
  if (typeof value !== 'string') {
    return { ok: false, errorMessage: 'Email address must be a string.' };
  }

  const raw = value.trim();
  if (!raw) return { ok: false, errorMessage: 'Email address is required.' };
  if (/[\r\n]/.test(raw)) {
    return { ok: false, errorMessage: 'Email address cannot contain line breaks.' };
  }

  let email = extractMarkdownMailto(raw) ?? raw;

  if (/^mailto:/i.test(email)) {
    email = email.replace(/^mailto:/i, '');
  }

  email = email.replace(/[?#].*$/, '').trim();

  if ((email.startsWith('<') && email.endsWith('>')) || (email.startsWith('(') && email.endsWith(')'))) {
    email = email.slice(1, -1).trim();
  }

  if (email.includes(',') || email.includes(';')) {
    return { ok: false, errorMessage: 'Only one recipient is supported. Remove comma-separated addresses.' };
  }

  if (/\s/.test(email)) {
    return { ok: false, errorMessage: 'Email address cannot contain spaces.' };
  }

  const normalized = email.toLowerCase();
  if (!SIMPLE_EMAIL_REGEX.test(normalized)) {
    return { ok: false, errorMessage: `"${email}" is not a valid email address.` };
  }

  return { ok: true, value: normalized };
}

export function sanitizeHeaderValue(value: unknown): SanitizedValueResult {
  if (typeof value !== 'string') {
    return { ok: false, errorMessage: 'Header value must be a string.' };
  }

  if (/[\r\n]/.test(value)) {
    return { ok: false, errorMessage: 'Header value cannot contain line breaks.' };
  }

  const sanitized = value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

  if (!sanitized) return { ok: false, errorMessage: 'Header value cannot be empty.' };
  return { ok: true, value: sanitized };
}

export function encodeMimeSubject(value: string) {
  const sanitized = sanitizeHeaderValue(value);
  if (!sanitized.ok) throw new Error(sanitized.errorMessage);
  if (/^[\x00-\x7F]*$/.test(sanitized.value)) return sanitized.value;

  const bytes = new TextEncoder().encode(sanitized.value);
  return `=?UTF-8?B?${base64Encode(bytes)}?=`;
}

export function normalizeMimeLineEndings(value: string) {
  return value.replace(/\r\n|\r|\n/g, '\r\n');
}

export function normalizePublicEmail(value: unknown) {
  const result = sanitizeEmailAddress(value);
  return result.ok ? result.value : null;
}

function extractMarkdownMailto(value: string) {
  const markdownMatch = value.match(/^\[[^\]]*\]\((mailto:[^)]+)\)$/i);
  if (!markdownMatch) return null;
  return markdownMatch[1];
}

function base64Encode(bytes: Uint8Array) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];

    output += alphabet[first >> 2];
    output += alphabet[((first & 0x03) << 4) | ((second ?? 0) >> 4)];
    output += index + 1 < bytes.length ? alphabet[((second & 0x0f) << 2) | ((third ?? 0) >> 6)] : '=';
    output += index + 2 < bytes.length ? alphabet[(third ?? 0) & 0x3f] : '=';
  }

  return output;
}
