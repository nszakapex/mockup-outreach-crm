import { AlertTriangle } from 'lucide-react';
import { SocialAuditPaper } from '@/components/social-audits/SocialAuditPaper';
import { getPublicSocialAuditBySlug } from '@/lib/server/social-audit';

export const dynamic = 'force-dynamic';

export default async function SocialAuditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let loadError: string | null = null;
  let audit: Awaited<ReturnType<typeof getPublicSocialAuditBySlug>> = null;

  try {
    audit = await getPublicSocialAuditBySlug(slug);
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Unknown social audit error.';
  }

  if (loadError) {
    return (
      <SocialAuditState
        title="Social Audit Did Not Load"
        message={loadError}
        tone="error"
      />
    );
  }

  if (!audit) {
    return (
      <SocialAuditState
        title="Social Audit Not Found"
        message="This audit may have been removed or the link is incorrect."
      />
    );
  }

  return <SocialAuditPaper audit={audit} />;
}

function SocialAuditState({
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
