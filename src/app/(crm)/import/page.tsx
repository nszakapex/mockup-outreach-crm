'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, FileJson, Upload } from 'lucide-react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import ErrorBanner from '@/components/ErrorBanner';
import StatusBadge from '@/components/StatusBadge';
import {
  createProspectBundle,
  normalizeHermesJsonRecord,
  previewHermesImport,
  type HermesImportPreview,
  type ProspectIntakeInput,
} from '@/lib/prospect-intake';

const SAMPLE_JSON = `[
  {
    "business_name": "Example Detail Studio",
    "niche": "auto detailing",
    "website_url": "https://example-detail-studio.com",
    "public_email": "hello@example-detail-studio.com",
    "city": "Denver",
    "state": "CO",
    "lead_score": 82,
    "main_problem": "No clear mobile booking path.",
    "conversion_opportunity": "Show packages and make booking obvious above the fold.",
    "mockup_slug": "example-detail-studio-concept",
    "hero_headline": "Premium Detailing Without the Guesswork",
    "primary_cta": "Request a Detail Quote",
    "email_subject": "Quick mockup for Example Detail Studio",
    "email_body": "Hi there, I put together a quick website concept showing a cleaner booking path for your detailing services."
  }
]`;

type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
  links: { id: string; name: string }[];
};

export default function ImportPage() {
  const [jsonText, setJsonText] = useState('');
  const [preview, setPreview] = useState<HermesImportPreview[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importable = useMemo(() => preview.filter((item) => item.valid), [preview]);

  async function buildPreview(text: string) {
    setPreviewing(true);
    setParseError(null);
    setResult(null);

    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('Hermes import must be a JSON array.');
      }

      const records = parsed.map((item, index) => {
        const normalized = normalizeHermesJsonRecord(item);
        if (!normalized) {
          throw new Error(`Record ${index + 1} must be a JSON object.`);
        }
        return normalized;
      });

      const nextPreview = await previewHermesImport(records);
      setPreview(nextPreview);
    } catch (error) {
      setPreview([]);
      setParseError(error instanceof Error ? error.message : 'Unable to parse Hermes JSON.');
    } finally {
      setPreviewing(false);
    }
  }

  async function handleFile(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setJsonText(text);
    await buildPreview(text);
  }

  async function handleImport() {
    setImporting(true);
    setParseError(null);
    setResult(null);

    const links: { id: string; name: string }[] = [];
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (const item of preview) {
      if (!item.valid) {
        skipped += 1;
        continue;
      }

      const response = await createProspectBundle(item.input as ProspectIntakeInput, {
        source: 'hermes_import',
        requireDestinationIdentity: true,
        statusMode: 'derive',
      });

      if (response.error || !response.data) {
        errors.push(`${item.businessName || `Record ${item.index + 1}`}: ${response.error ?? 'Import failed.'}`);
        continue;
      }

      imported += 1;
      links.push({
        id: response.data.prospect.id,
        name: response.data.prospect.business_name,
      });
    }

    setResult({ imported, skipped, errors, links });
    setImporting(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
          Hermes JSON Import
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-ink-3)' }}>
          Paste or upload a Hermes-generated prospect batch. Import creates prospect, audit, mockup,
          and email draft rows without sending email.
        </p>
      </div>

      {parseError && <div className="mb-6"><ErrorBanner message={parseError} /></div>}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <Card title="Paste JSON array">
          <div className="space-y-4">
            <textarea
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              rows={18}
              spellCheck={false}
              placeholder={SAMPLE_JSON}
              className="w-full rounded-xl px-4 py-3 font-mono text-xs leading-6 outline-none"
              style={{
                background: 'var(--color-paper-3)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-ink)',
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => buildPreview(jsonText)} disabled={previewing || !jsonText.trim()}>
                <FileJson size={16} />
                {previewing ? 'Building preview...' : 'Preview import'}
              </Button>
              <label
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
                style={{
                  background: 'var(--color-paper-3)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-ink)',
                }}
              >
                <Upload size={16} />
                Upload JSON
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <Button variant="ghost" onClick={() => setJsonText(SAMPLE_JSON)}>
                Use sample
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Import rules">
          <div className="space-y-3 text-sm" style={{ color: 'var(--color-ink-2)' }}>
            <Rule label="Required" value="business_name, niche, plus website_url or public_email" />
            <Rule label="Duplicate check" value="website_url or public_email, including duplicates inside the pasted batch" />
            <Rule label="Source" value="hermes_import" />
            <Rule label="Creates" value="prospect, audit, mockup, and email draft rows" />
            <Rule label="Approval" value="email_ready rows can appear in /approval when email and mockup data exist" />
            <p className="rounded-lg p-3 text-xs leading-5" style={{ background: 'var(--color-paper-3)' }}>
              Import never sends Gmail, never scrapes, and never bypasses Telegram approval.
            </p>
          </div>
        </Card>
      </div>

      {preview.length > 0 && (
        <Card title="Preview" className="mt-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm" style={{ color: 'var(--color-ink-3)' }}>
              {importable.length} importable of {preview.length} records.
            </p>
            <Button onClick={handleImport} disabled={importing || importable.length === 0}>
              <CheckCircle size={16} />
              {importing ? 'Importing...' : `Import ${importable.length} records`}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Record</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Status</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Mockup slug</th>
                  <th className="px-3 py-2 text-left text-xs uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>Eligibility</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item) => (
                  <tr key={item.index} style={{ borderBottom: '1px solid var(--color-divider)' }}>
                    <td className="px-3 py-3">
                      <div className="font-medium" style={{ color: 'var(--color-ink)' }}>
                        {item.businessName || `Record ${item.index + 1}`}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-ink-3)' }}>
                        {item.publicEmail || item.websiteUrl || 'No destination identity'}
                      </div>
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-3 py-3 font-mono text-xs" style={{ color: 'var(--color-ink-2)' }}>{item.slug}</td>
                    <td className="px-3 py-3">
                      {item.valid ? (
                        <span className="text-xs" style={{ color: 'var(--color-emerald)' }}>Ready to import</span>
                      ) : (
                        <div className="space-y-1">
                          {item.errors.map((error) => (
                            <div key={error} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--color-warning)' }}>
                              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                              {error}
                            </div>
                          ))}
                        </div>
                      )}
                      {item.warnings.map((warning) => (
                        <div key={warning} className="mt-1 text-xs" style={{ color: 'var(--color-ink-3)' }}>{warning}</div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {result && (
        <Card title="Import result" className="mt-6">
          <div className="space-y-3 text-sm" style={{ color: 'var(--color-ink-2)' }}>
            <p>
              Imported {result.imported}. Skipped {result.skipped}. Errors {result.errors.length}.
            </p>
            {result.links.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.links.map((link) => (
                  <Link key={link.id} href={`/prospects/${link.id}`} className="rounded-lg px-3 py-1.5 text-xs font-medium" style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
            {result.errors.map((error) => (
              <ErrorBanner key={error} message={error} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-ink-3)' }}>
        {label}
      </div>
      <div>{value}</div>
    </div>
  );
}
