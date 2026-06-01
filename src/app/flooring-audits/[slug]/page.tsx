import { AlertTriangle } from 'lucide-react';
import { FlooringAuditPaper } from '@/components/flooring-audits/FlooringAuditPaper';
import { getPublicFlooringAuditBySlug } from '@/lib/server/flooring-audit';

export const dynamic = 'force-dynamic';

export default async function FlooringAuditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let loadError: string | null = null;
  let audit: Awaited<ReturnType<typeof getPublicFlooringAuditBySlug>> = null;

  try {
    audit = await getPublicFlooringAuditBySlug(slug);
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Unknown flooring audit error.';
  }

  if (loadError) {
    return (
      <FlooringAuditState
        title="Flooring Audit Did Not Load"
        message={loadError}
        tone="error"
      />
    );
  }

  if (!audit) {
    return (
      <FlooringAuditState
        title="Flooring Audit Not Found"
        message="This audit may have been removed or the link is incorrect."
      />
    );
  }

  return <FlooringAuditPaper audit={audit} />;
}

function FlooringAuditState({
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
