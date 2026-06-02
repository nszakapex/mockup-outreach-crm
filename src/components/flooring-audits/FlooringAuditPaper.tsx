import {
  getFlooringSystemProfile,
  getResinateDisplayValue,
} from '@/lib/resinate-data';
import type { PublicFlooringAudit } from '@/lib/server/flooring-audit';
import styles from './FlooringAuditPaper.module.css';

type BuyerCategory = 'contractor' | 'realEstate' | 'facility' | 'propertyManager';

const APPLICATIONS: Record<BuyerCategory, string[]> = {
  contractor: [
    'tenant improvement concrete scopes',
    'retail / restaurant back-of-house',
    'mechanical or utility rooms',
    'service corridors',
    'commercial kitchens where relevant',
    'shop floors / light industrial spaces',
    'showroom or public-facing concrete',
  ],
  propertyManager: [
    'garages',
    'laundry rooms',
    'storage areas',
    'maintenance rooms',
    'common-use concrete',
    'corridors / utility areas',
  ],
  realEstate: [
    'leasing presentation',
    'tenant improvement surfaces',
    'listing-prep surfaces',
    'garage / showroom upgrades',
    'common-area upgrades',
  ],
  facility: [
    'locker rooms',
    'restrooms',
    'service corridors',
    'utility rooms',
    'wet areas',
    'high-traffic public areas',
  ],
};

const WALKTHROUGH_CHECKS = [
  'concrete condition',
  'moisture risk',
  'traffic level',
  'cleaning requirements',
  'slip-resistance needs',
  'schedule / downtime constraints',
];

const INSTALLATION_STEPS = [
  'concrete inspection',
  'diamond grinding',
  'crack / pit repair',
  'dust extraction',
  'correct primer / base coat',
  'broadcast or finish system',
  'polyaspartic or appropriate topcoat',
];

export function FlooringAuditPaper({ audit }: { audit: PublicFlooringAudit }) {
  const flooring = audit.flooring;
  const buyerType = getResinateDisplayValue(flooring.buyer_type, deriveBuyerType(audit));
  const propertyType = getResinateDisplayValue(flooring.property_type, derivePropertyType(audit));
  const category = getBuyerCategory(buyerType, propertyType, audit.prospect.niche);
  const location = [audit.prospect.city, audit.prospect.state].filter(Boolean).join(', ');
  const applications = parseList(flooring.likely_surface_areas, APPLICATIONS[category]);
  const system = getFlooringSystemProfile(flooring.recommended_flooring_system);
  const primarySystem = getResinateDisplayValue(flooring.recommended_flooring_system, system.label);
  const alternateSystem = getAlternateSystem(primarySystem, category);
  const summary = buildClientSummary(audit, category, propertyType);
  const nextStep = getResinateDisplayValue(
    flooring.next_sales_action,
    getDefaultNextStep(category)
  );
  const primaryOffer = getResinateDisplayValue(
    flooring.walkthrough_offer || flooring.best_resinate_offer,
    category === 'contractor' ? 'Subcontractor capabilities packet' : 'High-traffic surface walkthrough'
  );

  return (
    <main className={styles.page}>
      <article className={styles.note}>
        <header className={styles.header}>
          <div>
            <span className={styles.brand}>Resinate Custom Flooring</span>
            <h1>Commercial Surface Fit Note</h1>
            <p>
              Prepared for <strong>{audit.prospect.business_name}</strong>
            </p>
          </div>
          <dl className={styles.metaGrid} aria-label="Brief details">
            <MetaItem label="Buyer type" value={buyerType} />
            <MetaItem label="Property type" value={propertyType} />
            <MetaItem label="Location" value={location || 'Northern Colorado'} />
          </dl>
        </header>

        <section className={styles.summary}>
          <SectionTitle label="Why this may be relevant" />
          <p>{summary}</p>
        </section>

        <section className={styles.twoColumn}>
          <div className={styles.panel}>
            <SectionTitle label="Potential surface applications" />
            <ul className={styles.checkList}>
              {applications.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
          </div>

          <div className={styles.panel}>
            <SectionTitle label="Recommended system direction" />
            <div className={styles.systemBlock}>
              <span>Primary system</span>
              <strong>{primarySystem}</strong>
              <p>{flooring.system_reasoning || getSystemReason(primarySystem, category)}</p>
            </div>
            {alternateSystem && (
              <div className={styles.alternateBlock}>
                <span>Alternate to consider</span>
                <p>{alternateSystem}</p>
              </div>
            )}
          </div>
        </section>

        <section className={styles.walkthrough}>
          <SectionTitle label="What Resinate would verify during a walkthrough" />
          <ul className={styles.compactList}>
            {WALKTHROUGH_CHECKS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            {flooring.moisture_considerations ||
              'Moisture and slab condition should be checked before selecting primer, base coat, broadcast, or finish system.'}
          </p>
        </section>

        <section className={styles.standard}>
          <SectionTitle label="Resinate installation standard" />
          <ol className={styles.stepList}>
            {INSTALLATION_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>
            {flooring.prep_considerations ||
              'The finished surface depends on surface preparation, concrete repair, dust-controlled grinding, and the correct system for the space.'}
          </p>
          <p>
            {flooring.polyaspartic_value ||
              'Polyaspartic topcoats provide a durable, fast-curing protective finish with strong abrasion, chemical, and UV resistance.'}
          </p>
        </section>

        <section className={styles.nextStep} id="next-step">
          <div>
            <SectionTitle label="Suggested next step" />
            <h2>{primaryOffer}</h2>
            <p>{nextStep}</p>
          </div>
          <div className={styles.nextCards}>
            <NextCard label="Capabilities fit" value={flooring.vendor_packet_angle || getDefaultPacketAngle(category)} />
            <NextCard label="Best contact path" value={flooring.decision_maker_path || getDefaultDecisionPath(category)} />
          </div>
        </section>

        <footer className={styles.footer}>
          <p>
            Preliminary fit note based on public information and expected surface use. Final
            recommendations require a walkthrough and concrete inspection.
          </p>
          <strong>Resinate Custom Flooring</strong>
        </footer>
      </article>
    </main>
  );
}

function SectionTitle({ label }: { label: string }) {
  return <h2 className={styles.sectionTitle}>{label}</h2>;
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function NextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.nextCard}>
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function getBuyerCategory(buyerType: string, propertyType: string, niche: string): BuyerCategory {
  const value = `${buyerType} ${propertyType} ${niche}`.toLowerCase();
  if (/\b(contractor|construction|builder|tenant improvement|gc|estimating)\b/.test(value)) return 'contractor';
  if (/\b(real estate|broker|investor|leasing|asset)\b/.test(value)) return 'realEstate';
  if (/\b(facility|school|district|maintenance director|operations)\b/.test(value)) return 'facility';
  return 'propertyManager';
}

function buildClientSummary(audit: PublicFlooringAudit, category: BuyerCategory, propertyType: string) {
  const name = audit.prospect.business_name;
  if (category === 'contractor') {
    return `Resinate may be useful on future commercial concrete coating scopes where durability, cleaning, slip resistance, or schedule-conscious installation matter. For ${name}, the fit is specialty surface-system subcontractor support for ${propertyType.toLowerCase()}. A walkthrough or packet review would confirm scope, concrete condition, moisture risk, and the correct system.`;
  }

  if (category === 'realEstate') {
    return `Resinate may be useful for future property upgrade, leasing, tenant improvement, or listing-prep conversations where concrete surfaces affect presentation and long-term use. For ${name}, the fit is a practical surface-system resource for ${propertyType.toLowerCase()}. A walkthrough would confirm traffic, moisture risk, and the correct system direction.`;
  }

  if (category === 'facility') {
    return `Resinate may be useful for facility surfaces where cleaning, traffic, slip resistance, and downtime planning matter. For ${name}, the fit is a surface-system review for ${propertyType.toLowerCase()}. A walkthrough would confirm concrete condition, moisture risk, safety needs, and schedule constraints.`;
  }

  return `Resinate may be useful for future high-traffic surface projects where durability, cleaning, and lower maintenance matter. For ${name}, the fit is a practical review of ${propertyType.toLowerCase()} surfaces. A walkthrough would confirm concrete condition, traffic level, moisture risk, and the correct system.`;
}

function getSystemReason(primarySystem: string, category: BuyerCategory) {
  const normalized = primarySystem.toLowerCase();
  if (normalized.includes('quartz')) {
    return 'Useful where durability, cleaning, wet-use conditions, or slip resistance are central to the scope.';
  }
  if (normalized.includes('flake')) {
    return category === 'contractor'
      ? 'Useful for lighter-use utility, back-of-house, garage, or common concrete scopes where durability and presentation both matter.'
      : 'Useful for garages, utility rooms, storage areas, and common-use concrete where a durable textured finish makes sense.';
  }
  if (normalized.includes('metallic')) {
    return 'Useful for showroom, luxury garage, or statement spaces where the final finish is intentionally custom and visual.';
  }
  return 'Useful where the space needs a clean, durable commercial surface system matched to traffic, cleaning, and concrete condition.';
}

function getAlternateSystem(primarySystem: string, category: BuyerCategory) {
  const normalized = primarySystem.toLowerCase();
  if (normalized.includes('quartz')) return 'Flake system for lighter-use utility or common-area concrete.';
  if (normalized.includes('flake')) return 'Quartz system where wet-use conditions or higher slip resistance are important.';
  if (normalized.includes('metallic')) return 'Flake or quartz system where durability and texture matter more than a statement finish.';
  if (category === 'contractor') return 'Quartz or flake depending on traffic, cleaning, and slip-resistance needs.';
  return 'Flake or quartz depending on traffic, moisture, and slip-resistance needs.';
}

function getDefaultNextStep(category: BuyerCategory) {
  if (category === 'contractor') return 'Send a subcontractor capabilities packet or review one upcoming concrete coating scope with estimating or project management.';
  if (category === 'realEstate') return 'Send a capabilities fit note or identify one property where a surface walkthrough would be useful.';
  if (category === 'facility') return 'Walk one high-traffic area and confirm concrete condition, cleaning needs, slip resistance, moisture risk, and downtime constraints.';
  return 'Walk one high-traffic area and confirm whether a surface-system upgrade belongs in the vendor conversation.';
}

function getDefaultPacketAngle(category: BuyerCategory) {
  if (category === 'contractor') return 'Subcontractor packet with prep process, scope fit, system options, and project-specific estimate path.';
  if (category === 'realEstate') return 'Capabilities note for investor, owner, tenant improvement, or listing-prep surface conversations.';
  if (category === 'facility') return 'Facilities packet with cleaning, safety, durability, moisture, and downtime considerations.';
  return 'Vendor packet with prep process, moisture review, recommended system, and walkthrough scope.';
}

function getDefaultDecisionPath(category: BuyerCategory) {
  if (category === 'contractor') return 'Estimating, project management, or subcontractor prequalification contact.';
  if (category === 'realEstate') return 'Broker, asset manager, owner, investor, or tenant improvement contact.';
  if (category === 'facility') return 'Facilities, maintenance, operations, or procurement contact.';
  return 'Property manager, maintenance lead, owner-services contact, or vendor coordinator.';
}

function parseList(value: string | null | undefined, fallback: string[]) {
  const cleaned = value
    ?.split(/[\n,;|]+/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return cleaned && cleaned.length > 0 ? cleaned.slice(0, 7) : fallback;
}

function deriveBuyerType(audit: PublicFlooringAudit) {
  const niche = audit.prospect.niche.toLowerCase();
  if (niche.includes('school')) return 'school facilities or operations leader';
  if (niche.includes('contractor') || niche.includes('construction')) return 'general contractor or estimating lead';
  if (niche.includes('real estate') || niche.includes('broker')) return 'real estate, investor, or commercial property advisor';
  if (niche.includes('property')) return 'property manager or maintenance lead';
  return 'owner, facility manager, or operations decision-maker';
}

function derivePropertyType(audit: PublicFlooringAudit) {
  const niche = audit.prospect.niche.toLowerCase();
  if (niche.includes('contractor') || niche.includes('construction')) return 'commercial construction or tenant improvement project';
  if (niche.includes('real estate') || niche.includes('broker')) return 'commercial, investor, or listing-prep property';
  if (niche.includes('school')) return 'education facility';
  if (niche.includes('property')) return 'managed property, HOA, multifamily, or commercial asset';
  return audit.prospect.niche || 'commercial property';
}
