import { ExternalLink } from 'lucide-react';
import { parseMockupFeatures } from '@/lib/mockup-templates';
import type { PublicSocialAudit } from '@/lib/server/social-audit';
import type { SocialContentPlan } from '@/lib/social-audit-data';
import styles from './SocialAuditPaper.module.css';

type StatusRow = {
  label: string;
  current: string;
  fix: string;
  severity: 'low' | 'medium' | 'high';
};

export function SocialAuditPaper({ audit }: { audit: PublicSocialAudit }) {
  const scorecard = audit.social.social_audit;
  const score = scorecard?.overall_social_score ?? audit.audit?.social_score ?? 56;
  const issueList = buildIssueList(audit);
  const plan = buildContentPlan(audit);
  const themes = plan.priority_content_themes?.length
    ? plan.priority_content_themes
    : deriveThemes(audit);
  const statusRows = buildStatusRows(audit);
  const recommendedAction =
    audit.social.call_follow_up_angle?.goal_of_call ||
    audit.social.first_email_angle ||
    `Walk through a one-month content system for ${audit.prospect.business_name}.`;

  return (
    <main className={styles.auditPage}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.kicker}>Social Content Audit</div>
          <h1>{audit.prospect.business_name}</h1>
          <p className={styles.heroMeta}>
            {audit.prospect.niche} in {audit.prospect.city}, {audit.prospect.state}
          </p>
          <p className={styles.heroCopy}>
            A focused look at how the current social presence can turn stronger visuals into weekly
            content, clearer calls to action, and a better path from interest to inquiry.
          </p>
          <div className={styles.prepared}>Prepared by Apex Marketing Group</div>
        </div>
        <div className={styles.scorePanel} aria-label="Overall social score">
          <span>Overall Social Score</span>
          <strong>{score}</strong>
          <small>{score <= 45 ? 'Needs attention' : score <= 65 ? 'Underused opportunity' : 'Healthy baseline'}</small>
        </div>
      </section>

      <section className={styles.linkStrip} aria-label="Public presence links">
        <PresenceLink href={audit.prospect.website_url} label="Website" />
        <PresenceLink href={audit.prospect.instagram_url} label="Instagram" />
        <PresenceLink href={audit.prospect.facebook_url} label="Facebook" />
        <PresenceLink href={audit.prospect.google_maps_url} label="Google Maps" />
      </section>

      <section className={styles.sectionGrid}>
        <div className={styles.snapshot}>
          <div className={styles.sectionHeader}>
            <span>Current Social Presence Snapshot</span>
            <h2>What a local customer sees now</h2>
          </div>
          <div className={styles.statusList}>
            {statusRows.map((row) => (
              <StatusItem key={row.label} row={row} />
            ))}
          </div>
        </div>

        <div className={styles.issuePanel}>
          <div className={styles.sectionHeader}>
            <span>What&apos;s Underperforming</span>
            <h2>Specific gaps to tighten first</h2>
          </div>
          <ol className={styles.issueList}>
            {issueList.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.opportunityBand}>
        <div>
          <div className={styles.sectionHeader}>
            <span>Missed Content Opportunities</span>
            <h2>{audit.social.content_opportunity || deriveOpportunity(audit)}</h2>
          </div>
          <p>
            {audit.social.website_social_gap ||
              audit.audit?.conversion_opportunity ||
              `The social feed should lead viewers toward a simple next step on the site, not leave them to hunt for how to act.`}
          </p>
        </div>
        <div className={styles.themeStack}>
          {themes.slice(0, 5).map((theme) => (
            <span key={theme}>{theme}</span>
          ))}
        </div>
      </section>

      <section className={styles.planSection}>
        <div className={styles.sectionHeader}>
          <span>4-Week Starter Content Plan</span>
          <h2>A practical first month without overproducing</h2>
        </div>
        <div className={styles.planGrid}>
          <PlanWeek label="Week 1" value={plan.week_1} fallback={deriveWeek(audit, 1)} />
          <PlanWeek label="Week 2" value={plan.week_2} fallback={deriveWeek(audit, 2)} />
          <PlanWeek label="Week 3" value={plan.week_3} fallback={deriveWeek(audit, 3)} />
          <PlanWeek label="Week 4" value={plan.week_4} fallback={deriveWeek(audit, 4)} />
        </div>
        <div className={styles.cadenceGrid}>
          <CadenceItem label="Posting cadence" value={plan.recommended_posting_cadence || '2 reels plus 2 to 4 posts or stories per week'} />
          <CadenceItem label="Reels per week" value={plan.recommended_reels_per_week || '2'} />
          <CadenceItem label="Shoot frequency" value={plan.shoot_frequency || 'One short content shoot per week'} />
        </div>
      </section>

      <section className={styles.metaSection}>
        <div className={styles.metaCopy}>
          <div className={styles.sectionHeader}>
            <span>Meta Ads Opportunity</span>
            <h2>{audit.social.meta_ads_angle || deriveMetaAdsAngle(audit)}</h2>
          </div>
          <p>
            Start with a small retargeting or local awareness campaign only after the weekly content
            pattern is visible enough to support the offer.
          </p>
        </div>
        <div className={styles.nextAction}>
          <span>Recommended Next Action</span>
          <p>{recommendedAction}</p>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div>
          <span>Want me to walk you through this?</span>
          <h2>A quick walkthrough can turn this audit into a simple first shoot plan.</h2>
        </div>
        <p>
          This is a public social audit concept created to show direction. It is not a final
          strategy, campaign plan, or guarantee of results.
        </p>
      </section>
    </main>
  );
}

function PresenceLink({ href, label }: { href?: string | null; label: string }) {
  if (!href) {
    return (
      <div className={styles.presenceMissing}>
        <span>{label}</span>
        <small>Not found in record</small>
      </div>
    );
  }

  return (
    <a className={styles.presenceLink} href={href} target="_blank" rel="noopener noreferrer">
      <span>{label}</span>
      <ExternalLink size={14} />
    </a>
  );
}

function StatusItem({ row }: { row: StatusRow }) {
  return (
    <article className={styles.statusItem} data-severity={row.severity}>
      <div>
        <span>{row.label}</span>
        <p>{row.current}</p>
      </div>
      <strong>{row.fix}</strong>
    </article>
  );
}

function PlanWeek({ label, value, fallback }: { label: string; value?: string | null; fallback: string }) {
  return (
    <article className={styles.planWeek}>
      <span>{label}</span>
      <p>{value || fallback}</p>
    </article>
  );
}

function CadenceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.cadenceItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildStatusRows(audit: PublicSocialAudit): StatusRow[] {
  const scorecard = audit.social.social_audit;
  const business = audit.prospect.business_name;
  const issue = audit.audit?.main_problem;
  const niche = audit.prospect.niche.toLowerCase();

  return [
    {
      label: 'Instagram status',
      current: scorecard?.instagram_status || `${business} needs a clearer Instagram rhythm around its strongest visual moments.`,
      fix: 'Turn product, service, or atmosphere moments into a repeatable weekly series.',
      severity: 'high',
    },
    {
      label: 'Facebook status',
      current: scorecard?.facebook_status || 'Facebook should support events, specials, proof, and the next step rather than only mirror updates.',
      fix: 'Use posts to point people toward the website, booking, ordering, or inquiry path.',
      severity: 'medium',
    },
    {
      label: 'Posting consistency',
      current: scorecard?.posting_consistency || 'The audience is not seeing a dependable weekly content system.',
      fix: 'Plan one short weekly shoot and publish two reels plus supporting posts.',
      severity: 'high',
    },
    {
      label: 'Content quality',
      current: scorecard?.content_quality || issue || `The real-world ${niche} experience is stronger than the current content makes it feel.`,
      fix: 'Lead with specific offers, scenes, proof, and customer-use moments.',
      severity: 'medium',
    },
    {
      label: 'Reels/video usage',
      current: scorecard?.reels_video_usage || 'Short video is underused for the moments that would be easiest to show.',
      fix: 'Create simple repeatable reels: prep, result, staff pick, offer, and behind the scenes.',
      severity: 'high',
    },
    {
      label: 'CTA clarity',
      current: scorecard?.cta_usage || 'Posts need a clearer action after someone becomes interested.',
      fix: 'Repeat one primary CTA that matches the website path.',
      severity: 'medium',
    },
    {
      label: 'Visual branding',
      current: scorecard?.visual_branding || 'The feed would benefit from a more recognizable format across recurring content.',
      fix: 'Use consistent post frames, captions, hooks, and weekly themes.',
      severity: 'medium',
    },
  ];
}

function buildIssueList(audit: PublicSocialAudit) {
  const reasons = audit.social.social_audit?.why_underperforming || [];
  const fallback = [
    audit.audit?.main_problem,
    audit.audit?.audit_notes,
    audit.social.website_social_gap,
    audit.social.content_opportunity,
  ].filter((item): item is string => Boolean(item));

  const issues = [...reasons, ...fallback].filter(Boolean);
  if (issues.length >= 3) return issues.slice(0, 4);

  return [
    ...issues,
    'The strongest offer is not repeated often enough across social and the website.',
    'Short-form video can show proof faster than static posts alone.',
    'The current content does not consistently tell people what to do next.',
  ].slice(0, 4);
}

function buildContentPlan(audit: PublicSocialAudit): SocialContentPlan {
  return audit.social.content_plan || {};
}

function deriveThemes(audit: PublicSocialAudit) {
  const features = parseMockupFeatures(audit.mockup.features_included);
  if (features.length > 0) return features;

  const niche = audit.prospect.niche.toLowerCase();
  if (niche.includes('coffee') || niche.includes('cafe')) {
    return ['featured drinks', 'morning rush', 'community moments', 'loyalty prompts', 'seasonal specials'];
  }
  if (niche.includes('bar') || niche.includes('pub') || niche.includes('grill')) {
    return ['happy hour', 'events', 'featured plates', 'game night', 'visit tonight'];
  }
  if (niche.includes('salon') || niche.includes('spa')) {
    return ['before and after', 'service education', 'appointment openings', 'client proof', 'seasonal offers'];
  }
  if (niche.includes('detail') || niche.includes('auto')) {
    return ['before and after', 'package explainers', 'ceramic coating', 'interior refresh', 'gift cards'];
  }
  return ['signature offer', 'behind the scenes', 'customer proof', 'local story', 'clear CTA'];
}

function deriveOpportunity(audit: PublicSocialAudit) {
  const niche = audit.prospect.niche.toLowerCase();
  if (niche.includes('coffee') || niche.includes('cafe')) return 'Turn daily drinks, food, and community moments into a consistent local content rhythm.';
  if (niche.includes('bar') || niche.includes('pub') || niche.includes('grill')) return 'Promote weekly reasons to visit: happy hour, events, featured food, and atmosphere.';
  if (niche.includes('detail') || niche.includes('auto')) return 'Package before-and-after proof into repeatable reels that lead to quote requests.';
  return audit.audit?.recommended_offer || 'Build a weekly content system around the moments customers already care about.';
}

function deriveWeek(audit: PublicSocialAudit, week: number) {
  const themes = deriveThemes(audit);
  const business = audit.prospect.business_name;

  switch (week) {
    case 1:
      return `Capture ${themes[0]} and ${themes[1] || 'customer proof'} during one short shoot at ${business}.`;
    case 2:
      return `Publish a simple CTA series around ${themes[2] || 'the main offer'} and the website next step.`;
    case 3:
      return `Use staff picks, process clips, or before-and-after moments to make the offer feel specific.`;
    default:
      return `Review which posts created saves, replies, or clicks, then repeat the strongest theme.`;
  }
}

function deriveMetaAdsAngle(audit: PublicSocialAudit) {
  const niche = audit.prospect.niche.toLowerCase();
  if (niche.includes('coffee') || niche.includes('cafe')) return 'Local awareness ads for featured drinks, breakfast traffic, and loyalty signups.';
  if (niche.includes('bar') || niche.includes('pub') || niche.includes('grill')) return 'Event and happy-hour ads aimed at nearby visitors this week.';
  if (niche.includes('detail') || niche.includes('auto')) return 'Before-and-after proof ads that drive package and quote inquiries.';
  return `Local Meta ads that retarget social viewers toward ${audit.mockup.primary_cta || 'the main inquiry path'}.`;
}
