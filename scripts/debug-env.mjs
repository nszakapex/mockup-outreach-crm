import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const envPath = join(process.cwd(), '.env.local');
const expectedVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_CHAT_ID',
  'TELEGRAM_WEBHOOK_SECRET',
];

function parseEnvFile(path) {
  if (!existsSync(path)) return new Map();

  const entries = new Map();
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsAt = trimmed.indexOf('=');
    if (equalsAt === -1) continue;

    const name = trimmed.slice(0, equalsAt).trim();
    const value = trimmed.slice(equalsAt + 1).trim();
    entries.set(name, value);
  }

  return entries;
}

const env = parseEnvFile(envPath);
const supabaseKeyConfigured =
  Boolean(env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')) ||
  Boolean(env.get('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'));

console.log('App: mockup-outreach-crm');
console.log('Expected local URL: localhost:3001');
console.log(`.env.local present: ${existsSync(envPath) ? 'yes' : 'no'}`);

for (const name of expectedVars) {
  console.log(`${name}: ${env.get(name) ? 'configured' : 'missing'}`);
}

console.log(`Supabase public key accepted by app: ${supabaseKeyConfigured ? 'yes' : 'no'}`);
