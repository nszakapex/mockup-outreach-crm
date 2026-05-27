'use client';

import { use } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PremiumMockupSite } from '@/components/mockups/PremiumMockupSite';
import { useMockupBySlug } from '@/lib/hooks';

export default function MockupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { mockup, prospect, audit, loading, error } = useMockupBySlug(slug);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-paper)' }}
      >
        <div
          className="w-10 h-10 border-2 rounded-full animate-spin"
          style={{
            borderColor: 'var(--color-border)',
            borderTopColor: 'var(--color-accent)',
          }}
          aria-label="Loading mockup"
        />
      </div>
    );
  }

  if (error) {
    return (
      <MockupState
        title="Mockup Data Did Not Load"
        message={error}
        tone="error"
      />
    );
  }

  if (!mockup) {
    return (
      <MockupState
        title="Mockup Not Found"
        message="This mockup may have been removed or the link is incorrect."
      />
    );
  }

  return <PremiumMockupSite mockup={mockup} prospect={prospect} audit={audit} />;
}

function MockupState({
  title,
  message,
  tone = 'warning',
}: {
  title: string;
  message: string;
  tone?: 'warning' | 'error';
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--color-paper)' }}
    >
      <AlertTriangle
        size={32}
        className="mb-4"
        style={{ color: tone === 'error' ? 'var(--color-error)' : 'var(--color-warning)' }}
      />
      <h1 className="text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
        {title}
      </h1>
      <p
        className="text-sm mt-2 max-w-xl break-words"
        style={{ color: tone === 'error' ? 'var(--color-error)' : 'var(--color-ink-3)' }}
      >
        {message}
      </p>
    </div>
  );
}
