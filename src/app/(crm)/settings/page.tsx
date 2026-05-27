'use client';

import { useState, useRef, useEffect } from 'react';
import { Save, Check, Zap, RefreshCw, Bot, ShieldCheck } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ConnectionPanel from '@/components/ConnectionPanel';
import GmailStatusPanel from '@/components/GmailStatusPanel';
import { DEFAULT_SETTINGS, type AppSettings } from '@/lib/types';

function getStoredSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem('mockup-crm-settings');
  if (!stored) return DEFAULT_SETTINGS;
  try { return JSON.parse(stored); } catch { return DEFAULT_SETTINGS; }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      async function init() {
        setSettings(getStoredSettings());
      }
      init();
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('mockup-crm-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('mockup-crm-settings');
  };

  const update = (key: keyof AppSettings, value: string | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>Settings</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>Configure your outreach defaults</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RefreshCw size={14} /> Reset
          </Button>
          <Button size="sm" onClick={handleSave}>
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? 'Saved' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Status */}
        <ConnectionPanel />

        <GmailStatusPanel />

        {/* Outreach Settings */}
        <Card title="Outreach Defaults">
          <div className="space-y-4">
            <SettingField label="Daily Send Goal" type="number" value={settings.daily_send_goal} onChange={(v) => update('daily_send_goal', parseInt(v) || 0)} />
            <SettingField label="Default Niche" value={settings.default_niche} onChange={(v) => update('default_niche', v)} />
            <SettingField label="Default City" value={settings.default_city} onChange={(v) => update('default_city', v)} />
            <SettingField label="Default CTA" value={settings.default_cta} onChange={(v) => update('default_cta', v)} />
          </div>
        </Card>

        {/* Agency Info */}
        <Card title="Agency Information">
          <div className="space-y-4">
            <SettingField label="Sender Name" value={settings.sender_name} onChange={(v) => update('sender_name', v)} />
            <SettingField label="Agency Name" value={settings.agency_name} onChange={(v) => update('agency_name', v)} />
          </div>
        </Card>

        <Card title="Telegram Approval Webhook">
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Bot size={14} style={{ color: 'var(--color-accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Local message sending</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-ink-2)' }}>
                The Approval Queue sends review cards through <code className="font-mono">/api/telegram/send-approval</code> using server-side env vars. Button callbacks require a deployed public URL.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={14} style={{ color: 'var(--color-emerald)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-ink-3)' }}>Webhook registration template</span>
              </div>
              <CodeBlock value="https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=https://YOUR_NETLIFY_SITE.netlify.app/api/telegram/webhook?secret=<TELEGRAM_WEBHOOK_SECRET>" />
            </div>

            <div>
              <span className="block text-xs font-medium mb-2" style={{ color: 'var(--color-ink-3)' }}>Webhook info template</span>
              <CodeBlock value="https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo" />
            </div>

            <div>
              <span className="block text-xs font-medium mb-2" style={{ color: 'var(--color-ink-3)' }}>Netlify env checklist</span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs" style={{ color: 'var(--color-ink-2)' }}>
                <li><code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code></li>
                <li><code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code></li>
                <li><code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code></li>
                <li><code className="font-mono">TELEGRAM_BOT_TOKEN</code></li>
                <li><code className="font-mono">TELEGRAM_CHAT_ID</code></li>
                <li><code className="font-mono">TELEGRAM_WEBHOOK_SECRET</code></li>
                <li><code className="font-mono">GOOGLE_CLIENT_ID</code></li>
                <li><code className="font-mono">GOOGLE_CLIENT_SECRET</code></li>
                <li><code className="font-mono">GOOGLE_REFRESH_TOKEN</code></li>
                <li><code className="font-mono">GMAIL_SENDER_EMAIL</code></li>
                <li><code className="font-mono">OUTREACH_EMAIL_TEST_MODE</code></li>
                <li><code className="font-mono">OUTREACH_DAILY_SEND_CAP</code></li>
              </ul>
              <p className="text-xs mt-2" style={{ color: 'var(--color-ink-muted)' }}>
                Use either Supabase public key variable. Do not expose actual Telegram or Gmail secrets in browser text.
              </p>
            </div>
          </div>
        </Card>

        {/* Hermes / AI Integration */}
        <Card
          title="Hermes / AI Integration"
          action={<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--color-paper-3)', color: 'var(--color-ink-muted)' }}>Coming Soon</span>}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ background: 'var(--color-accent-subtle)', border: '1px solid var(--color-accent-muted)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} style={{ color: 'var(--color-accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>Phase 2 Features</span>
              </div>
              <ul className="space-y-1.5 text-xs" style={{ color: 'var(--color-ink-2)' }}>
                <li>AI-powered prospect discovery via Hermes</li>
                <li>Automated website & social audits</li>
                <li>AI-generated email drafts</li>
                <li>Gmail API integration for sending</li>
                <li>Auto follow-up scheduling</li>
                <li>Lead scoring with AI analysis</li>
              </ul>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-3)' }}>Notes for Hermes Integration</label>
              <textarea
                value={settings.hermes_notes}
                onChange={(e) => update('hermes_notes', e.target.value)}
                rows={4}
                placeholder="Add any notes about how you want Hermes/AI to handle prospecting, audits, or email generation..."
                className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none"
                style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function CodeBlock({ value }: { value: string }) {
  return (
    <div
      className="font-mono text-xs break-all rounded-lg p-3"
      style={{
        background: 'var(--color-paper-3)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-ink-2)',
      }}
    >
      {value}
    </div>
  );
}

function SettingField({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (val: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-ink-3)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
        style={{ background: 'var(--color-paper-3)', border: '1px solid var(--color-border)', color: 'var(--color-ink)' }}
      />
    </div>
  );
}
