import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const DEFAULT_REDIRECT_URI = 'http://localhost:3001/oauth2callback';

loadLocalEnv();

const clientId = requireEnv('GOOGLE_CLIENT_ID');
const senderEmail = requireEnv('GMAIL_SENDER_EMAIL');
const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() || DEFAULT_REDIRECT_URI;

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', redirectUri);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', GMAIL_SEND_SCOPE);
authUrl.searchParams.set('access_type', 'offline');
authUrl.searchParams.set('prompt', 'consent');
authUrl.searchParams.set('login_hint', senderEmail);

console.log('\nGmail OAuth consent URL\n');
console.log(authUrl.toString());
console.log('\nAfter approving, copy the code= value from the redirected URL.');
console.log(`Redirect URI used: ${redirectUri}`);
console.log('Keep OUTREACH_EMAIL_TEST_MODE=true until you intentionally test one live message.\n');

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && typeof process.env[key] === 'undefined') process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`${name} is required. Put it in .env.local or export it in this shell.`);
    process.exit(1);
  }
  return value;
}
