import { ExternalLink } from 'lucide-react';
import {
  getFlooringSystemProfile,
  getResinateDisplayValue,
} from '@/lib/resinate-data';
import type { PublicFlooringAudit } from '@/lib/server/flooring-audit';
import styles from './FlooringAuditPaper.module.css';

type NeedCard = {
  label: string;
  value: string;
  note: string;
};

export function FlooringAuditPaper({ audit }: { audit: PublicFlooringAudit }) {
  const flooring = audit.flooring;
  const system = getFlooringSystemProfile(flooring.recommended_flooring_system);
  const buyerType = getResinateDisplayValue(flooring.buyer_type, deriveBuyerType(audit));
  const propertyType = getResinateDisplayValue(flooring.property_type, derivePropertyType(audit));
  const surfaceProblem = getResinateDisplayValue(
    flooring.likely_surface_problem,
    audit.audit?.main_problem || 'The surface likely needs a more durable system matched to traffic, moisture, and long-term use.'
  );
  const primaryOffer = getResinateDisplayValue(
    flooring.walkthrough_offer || flooring.best_resinate_offer,
    'Free high-traffic flooring walkthrough'
  );
  const nextAction = getResinateDisplayValue(
    flooring.next_sales_action,
    'Confirm the right decision-maker and schedule a walkthrough of one priority surface area.'
  );
  const facilityUse = getResinateDisplayValue(
    flooring.facility_use_case,
    `${propertyType} surface upgrade for safer daily use, easier maintenance, and a more professional finish.`
  );
  const objection = getResinateDisplayValue(
    flooring.likely_objection,
    'We are not ready to replace the floor yet.'
  );
  const response = getResinateDisplayValue(
    flooring.objection_response,
    'That is fair. The first step can simply identify the right surface system, moisture risk, and budget range before any project decision.'
  );
  const needCards = buildNeedCards(audit);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <nav className={styles.topline} aria-label="Audit header">
          <span>Resinate Commercial Surface Audit</span>
          <span>Prepared for {audit.prospect.city}, {audit.prospect.state}</span>
        </nav>
        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <div className={styles.kicker}>Commercial Surface Opportunity</div>
            <h1>{audit.prospect.business_name}</h1>
            <p className={styles.lede}>
              Premium, long-lasting flooring systems designed around the surface, traffic, moisture
              conditions, and long-term use of the space.
            </p>
            <div className={styles.heroActions}>
              <a href="#walkthrough" className={styles.primaryCta}>
                Schedule a Walkthrough
              </a>
              <a href="#system" className={styles.secondaryCta}>
                Review Recommended System
              </a>
            </div>
          </div>
          <aside className={styles.systemCard} id="system">
            <span>Recommended Resinate System</span>
            <strong>{flooring.recommended_flooring_system || system.label}</strong>
            <p>{flooring.system_reasoning || system.note}</p>
          </aside>
        </div>
      </header>

      <section className={styles.identityStrip} aria-label="Prospect context">
        <ContextItem label="Prospect / property type" value={propertyType} />
        <ContextItem label="Buyer type" value={buyerType} />
        <ContextItem label="Facility use case" value={facilityUse} />
      </section>

      <section className={styles.twoColumn}>
        <div className={styles.surfacePanel}>
          <SectionIntro label="Likely Surface Problem" title={surfaceProblem} />
          <p>
            Resinate should not be positioned as a simple coating vendor here. The stronger angle is
            a commercial-grade surface system chosen after looking at the concrete, use case,
            moisture conditions, and expected wear.
          </p>
          <div className={styles.needGrid}>
            {needCards.map((card) => (
              <article key={card.label} className={styles.needCard}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.note}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className={styles.offerPanel}>
          <span>Commercial Offer</span>
          <h2>{primaryOffer}</h2>
          <p>
            Start with one practical surface area instead of a full project pitch. The goal is to
            understand conditions, risk, decision path, and fit.
          </p>
          <div className={styles.offerList}>
            <small>Decision path</small>
            <strong>{flooring.decision_maker_path || 'Facility manager, owner, or operations lead'}</strong>
            <small>Procurement path</small>
            <strong>{flooring.procurement_path || 'Walkthrough, scope confirmation, estimate, then vendor packet if needed'}</strong>
          </div>
        </aside>
      </section>

      <section className={styles.systemSection}>
        <SectionIntro label="Why This System Fits" title={flooring.surface_system_summary || `${system.label} for ${propertyType}`} />
        <div className={styles.systemGrid}>
          <div className={styles.systemBenefits}>
            <h3>{system.label}</h3>
            <ul>
              {system.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </div>
          <div className={styles.systemBenefits}>
            <h3>Best-fit spaces</h3>
            <ul>
              {system.bestFor.slice(0, 6).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className={styles.systemBenefits}>
            <h3>Polyaspartic topcoat value</h3>
            <p>
              {flooring.polyaspartic_value ||
                'A premium protective topcoat can add UV stability, fast cure time, chemical resistance, abrasion resistance, and a high-end finish.'}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.credibilitySection}>
        <div>
          <SectionIntro label="Surface Preparation Credibility" title="The finished floor is only as good as the prep." />
          <p>
            {flooring.prep_considerations ||
              'A credible commercial recommendation should include concrete inspection, diamond grinding, crack or pit repair, dust extraction, and the right primer, base, broadcast, and topcoat sequence.'}
          </p>
        </div>
        <div>
          <SectionIntro label="Moisture Mitigation" title="Moisture risk needs to be checked early." />
          <p>
            {flooring.moisture_considerations ||
              'Slab-on-grade areas, basements, elevated vapor transmission, failed plastic moisture tests, and long-term adhesion concerns should be handled before system selection.'}
          </p>
        </div>
      </section>

      <section className={styles.valueBand}>
        <div>
          <span>Commercial Value</span>
          <h2>{audit.audit?.conversion_opportunity || flooring.best_resinate_offer || 'Turn one problem surface into a cleaner, safer, easier-to-maintain space.'}</h2>
        </div>
        <p>
          {flooring.vendor_packet_angle ||
            'If the organization needs vendor review, Resinate can lead with capabilities, system examples, surface prep credibility, and a practical walkthrough before asking for a formal bid.'}
        </p>
      </section>

      <section className={styles.objectionSection}>
        <article>
          <span>Likely Objection</span>
          <p>{objection}</p>
        </article>
        <article>
          <span>Response</span>
          <p>{response}</p>
        </article>
        <article>
          <span>Next Sales Action</span>
          <p>{nextAction}</p>
        </article>
      </section>

      <section className={styles.linksSection}>
        <PresenceLink href={audit.prospect.website_url} label="Website" />
        <PresenceLink href={audit.prospect.google_maps_url} label="Google Profile" />
        <PresenceLink href={audit.prospect.facebook_url} label="Facebook" />
        <PresenceLink href={audit.prospect.instagram_url} label="Instagram" />
      </section>

      <section className={styles.ctaSection} id="walkthrough">
        <div>
          <span>Walkthrough / Estimate Offer</span>
          <h2>{primaryOffer}</h2>
          <p>
            This is a directional commercial flooring audit, not a final specification. A
            walkthrough, concrete inspection, and moisture review determine the final system.
          </p>
        </div>
        <a href={audit.prospect.website_url || '#'} className={styles.finalCta}>
          Request a Capabilities Packet
        </a>
      </section>
    </main>
  );
}

function ContextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.contextItem}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionIntro({ label, title }: { label: string; title: string }) {
  return (
    <div className={styles.sectionIntro}>
      <span>{label}</span>
      <h2>{title}</h2>
    </div>
  );
}

function PresenceLink({ href, label }: { href?: string | null; label: string }) {
  if (!href) {
    return (
      <div className={styles.presenceMissing}>
        <span>{label}</span>
        <small>Not listed</small>
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

function buildNeedCards(audit: PublicFlooringAudit): NeedCard[] {
  const flooring = audit.flooring;
  return [
    {
      label: 'Traffic needs',
      value: flooring.traffic_needs || 'Daily commercial traffic',
      note: 'Match the system to how the space is actually used, not just how it looks on day one.',
    },
    {
      label: 'Moisture needs',
      value: flooring.moisture_needs || 'Moisture review before specification',
      note: 'Concrete moisture can affect adhesion, especially in slab-on-grade and basement conditions.',
    },
    {
      label: 'Slip-resistance needs',
      value: flooring.slip_resistance_needs || 'Texture selected for the environment',
      note: 'Wet areas, kitchens, locker rooms, and public traffic zones need a serious slip-resistance conversation.',
    },
  ];
}

function deriveBuyerType(audit: PublicFlooringAudit) {
  const niche = audit.prospect.niche.toLowerCase();
  if (niche.includes('school')) return 'school facilities or operations leader';
  if (niche.includes('restaurant') || niche.includes('bar') || niche.includes('kitchen')) return 'owner or operations manager';
  if (niche.includes('vet') || niche.includes('clinic')) return 'clinic owner or practice manager';
  if (niche.includes('property')) return 'property manager';
  return 'owner, facility manager, or operations decision-maker';
}

function derivePropertyType(audit: PublicFlooringAudit) {
  const niche = audit.prospect.niche.toLowerCase();
  if (niche.includes('restaurant') || niche.includes('bar')) return 'hospitality / food-service property';
  if (niche.includes('school')) return 'education facility';
  if (niche.includes('salon') || niche.includes('spa')) return 'salon, spa, or showroom space';
  if (niche.includes('garage') || niche.includes('auto')) return 'garage, shop, or showroom';
  if (niche.includes('clinic') || niche.includes('vet')) return 'clinic or care facility';
  return audit.prospect.niche || 'commercial property';
}
