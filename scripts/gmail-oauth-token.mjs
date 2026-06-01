import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_REDIRECT_URI = 'http://localhost:3001/oauth2callback';

loadLocalEnv();

const profile = getProfile();
const profileConfig = getProfileConfig(profile);
const code = getAuthCode();
const clientId = requireAnyEnv(profileConfig.clientIdVars);
const clientSecret = requireAnyEnv(profileConfig.clientSecretVars);
const senderEmail = requireAnyEnv(profileConfig.senderEmailVars);
const redirectUri = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() || DEFAULT_REDIRECT_URI;

const response = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  }),
});

const payload = await response.json().catch(() => null);

if (!response.ok || !payload?.refresh_token) {
  console.error('\nToken exchange failed.');
  if (payload?.error) console.error(`Google error: ${payload.error}`);
  if (payload?.error_description) console.error(`Description: ${payload.error_description}`);
  console.error('\nIf no refresh token was returned, generate the auth URL again and make sure prompt=consent and access_type=offline are present.');
  process.exit(1);
}

console.log(`\nGmail OAuth refresh token generated (${profileConfig.label} profile).\n`);
console.log(`Add this to .env.local and Netlify production env vars as ${profileConfig.refreshTokenVar}:\n`);
console.log(`${profileConfig.refreshTokenVar}=${payload.refresh_token}`);
console.log(`\nSender email: ${senderEmail}`);
console.log('Keep OUTREACH_EMAIL_TEST_MODE=true until you intentionally test one live message.\n');

function getProfile() {
  const profileArg = process.argv.find((arg) => arg.startsWith('--profile='));
  const profileValue = profileArg?.split('=')[1]?.trim().toLowerCase() || 'apex';

  if (profileValue !== 'apex' && profileValue !== 'resinate') {
    console.error('Invalid profile. Use --profile=apex or --profile=resinate.');
    process.exit(1);
  }

  return profileValue;
}

function getProfileConfig(profileValue) {
  if (profileValue === 'resinate') {
    return {
      label: 'Resinate',
      clientIdVars: ['RESINATE_GOOGLE_CLIENT_ID'],
      clientSecretVars: ['RESINATE_GOOGLE_CLIENT_SECRET'],
      senderEmailVars: ['RESINATE_GMAIL_SENDER_EMAIL'],
      refreshTokenVar: 'RESINATE_GOOGLE_REFRESH_TOKEN',
    };
  }

  return {
    label: 'Apex',
    clientIdVars: ['APEX_GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_ID'],
    clientSecretVars: ['APEX_GOOGLE_CLIENT_SECRET', 'GOOGLE_CLIENT_SECRET'],
    senderEmailVars: ['APEX_GMAIL_SENDER_EMAIL', 'GMAIL_SENDER_EMAIL'],
    refreshTokenVar: 'APEX_GOOGLE_REFRESH_TOKEN',
  };
}

function getAuthCode() {
  const argCode = process.argv.find((arg) => !arg.startsWith('--') && arg !== process.argv[0] && arg !== process.argv[1])?.trim();
  const envCode = process.env.GOOGLE_AUTH_CODE?.trim();
  const codeValue = argCode || envCode;

  if (!codeValue) {
    console.error('Usage: npm run gmail:exchange-code -- --profile=resinate <code>');
    console.error('Or: npm run gmail:exchange-code -- <code>');
    console.error('Or set GOOGLE_AUTH_CODE in this shell before running the script.');
    process.exit(1);
  }

  return codeValue;
}

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

function requireAnyEnv(names) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  console.error(`${names.join(' or ')} is required. Put it in .env.local or export it in this shell.`);
  process.exit(1);
}
