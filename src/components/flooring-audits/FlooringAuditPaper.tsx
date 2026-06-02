import {
  getFlooringSystemProfile,
  getResinateDisplayValue,
} from '@/lib/resinate-data';
import type { PublicFlooringAudit } from '@/lib/server/flooring-audit';
import styles from './FlooringAuditPaper.module.css';

type PacketRow = {
  label: string;
  value: string;
};

type SystemNote = {
  label: string;
  use: string;
  note: string;
};

const DEFAULT_AREAS = [
  'garages',
  'maintenance rooms',
  'storage spaces',
  'laundry rooms',
  'common-use concrete',
  'utility spaces',
];

const PREP_STEPS = [
  'Concrete inspection',
  'Diamond grinding',
  'Crack and pit repair',
  'Dust extraction',
  'Primer or moisture mitigation when needed',
  'Base coat',
  'Broadcast or finish system',
  'Polyaspartic or appropriate topcoat',
];

const SYSTEM_NOTES: SystemNote[] = [
  {
    label: 'Flake',
    use: 'Multifamily garages, utility rooms, light commercial, maintenance rooms, common-use concrete',
    note: 'Decorative, durable, hides imperfections, and can add texture for everyday commercial use.',
  },
  {
    label: 'Quartz',
    use: 'Wet areas, locker rooms, restrooms, schools, heavy-use commercial, slip-resistance needs',
    note: 'More textured and durable than flake, making it stronger for wet and public-use spaces.',
  },
  {
    label: 'Metallic',
    use: 'Showrooms, luxury garages, salons, bars, statement commercial spaces',
    note: 'A custom artistic finish where the final movement and pattern naturally vary.',
  },
  {
    label: 'Solid color / neat coat',
    use: 'Clean utility spaces, commercial back-of-house, basements, simple upgrades',
    note: 'A straightforward finish when the space needs clean, durable surface protection.',
  },
  {
    label: 'Moisture mitigation',
    use: 'Slab-on-grade spaces, basements, vapor risk, prior coating failure, adhesion concerns',
    note: 'Moisture needs to be handled before the finish system is selected.',
  },
];

export function FlooringAuditPaper({ audit }: { audit: PublicFlooringAudit }) {
  const flooring = audit.flooring;
  const system = getFlooringSystemProfile(flooring.recommended_flooring_system);
  const buyerType = getResinateDisplayValue(flooring.buyer_type, deriveBuyerType(audit));
  const propertyType = getResinateDisplayValue(flooring.property_type, derivePropertyType(audit));
  const location = [audit.prospect.city, audit.prospect.state].filter(Boolean).join(', ');
  const likelyAreas = parseList(flooring.likely_surface_areas, DEFAULT_AREAS);
  const recommendedSystem = getResinateDisplayValue(flooring.recommended_flooring_system, system.label);
  const primaryOffer = getResinateDisplayValue(
    flooring.walkthrough_offer || flooring.best_resinate_offer,
    'High-traffic surface walkthrough'
  );
  const nextAction = getResinateDisplayValue(
    flooring.next_sales_action,
    'Confirm the right decision-maker and review one priority surface area.'
  );
  const executiveSummary = buildExecutiveSummary(audit, buyerType, propertyType, primaryOffer);
  const packetRows = buildPacketRows({
    buyerType,
    propertyType,
    likelyAreas,
    audit,
    recommendedSystem,
    nextAction,
  });
  const buyerNotes = buildBuyerNotes(buyerType);

  return (
    <main className={styles.page}>
      <article className={styles.packet}>
        <header className={styles.documentHeader}>
          <div className={styles.brandBlock}>
            <span className={styles.brandName}>Resinate Custom Flooring</span>
            <h1>Commercial Surface Opportunity Brief</h1>
            <p>
              Premium, long-lasting flooring systems designed around the surface, traffic,
              moisture conditions, and long-term use of the space.
            </p>
          </div>

          <aside className={styles.metaPanel} aria-label="Brief context">
            <MetaLine label="Prepared for" value={audit.prospect.business_name} />
            <MetaLine label="Buyer type" value={buyerType} />
            <MetaLine label="Property type" value={propertyType} />
            <MetaLine label="Location" value={location || 'Northern Colorado'} />
            <MetaLine label="Prepared by" value="Resinate" />
          </aside>
        </header>

        <section className={styles.summarySection}>
          <div>
            <SectionTitle label="Executive Fit Summary" title="Why this may be worth a walkthrough" />
            <p>{executiveSummary}</p>
          </div>
          <a className={styles.topCta} href="#next-step">
            Request walkthrough / capabilities packet
          </a>
        </section>

        <section className={styles.tableSection} aria-labelledby="surface-opportunity">
          <SectionTitle
            id="surface-opportunity"
            label="Surface Opportunity Table"
            title="Deal context and system fit"
          />
          <div className={styles.packetTable}>
            {packetRows.map((row) => (
              <div className={styles.tableRow} key={row.label}>
                <div>{row.label}</div>
                <div>{row.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.splitSection}>
          <div className={styles.paperPanel}>
            <SectionTitle label="Likely Surface Areas" title="Areas to review first" />
            <ul className={styles.checkList}>
              {likelyAreas.map((area) => (
                <li key={area}>{area}</li>
              ))}
            </ul>
          </div>

          <div className={styles.paperPanel}>
            <SectionTitle label="Buyer-Specific Angle" title={buyerNotes.title} />
            <p>{buyerNotes.body}</p>
          </div>
        </section>

        <section className={styles.recommendationSection}>
          <SectionTitle label="Recommended Resinate System" title={recommendedSystem} />
          <div className={styles.recommendationGrid}>
            <div>
              <h3>Why it fits</h3>
              <p>{flooring.system_reasoning || system.note}</p>
            </div>
            <div>
              <h3>Where it should be used</h3>
              <p>
                {flooring.facility_use_case ||
                  `Prioritize ${likelyAreas.slice(0, 3).join(', ')} where traffic, cleaning, and presentation matter.`}
              </p>
            </div>
            <div>
              <h3>Conditions to check</h3>
              <p>
                {flooring.moisture_considerations ||
                  'Concrete condition, moisture vapor risk, slab age, prior coating failure, traffic, and slip-resistance needs should be checked before final specification.'}
              </p>
            </div>
          </div>
        </section>

        <section className={styles.systemExplanation}>
          <SectionTitle label="Surface System Explanation" title="A full system, not a quick coating" />
          <ol className={styles.processList}>
            {PREP_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p>
            {flooring.prep_considerations ||
              'The finished surface depends on preparation quality, concrete condition, the right base system, and the correct protective topcoat for the space.'}
          </p>
        </section>

        <section className={styles.systemMatchSection}>
          <SectionTitle label="System Match Notes" title="How the system choice should be framed" />
          <div className={styles.systemTable}>
            {SYSTEM_NOTES.map((note) => (
              <div className={styles.systemRow} key={note.label}>
                <strong>{note.label}</strong>
                <span>{note.use}</span>
                <p>{note.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.valueSection}>
          <SectionTitle label="Commercial Value" title="Why this can matter beyond appearance" />
          <ul className={styles.valueList}>
            <li>Lower maintenance burden</li>
            <li>Cleaner property presentation</li>
            <li>Longer-lasting surface protection</li>
            <li>Easier cleaning for maintenance teams</li>
            <li>Better tenant, user, or buyer perception</li>
            <li>Schedule-conscious installation planning</li>
            <li>Repeatable use across similar properties or projects</li>
          </ul>
        </section>

        <section className={styles.nextStepSection} id="next-step">
          <div>
            <SectionTitle label="Walkthrough / Vendor Packet Next Step" title={primaryOffer} />
            <div className={styles.nextGrid}>
              <NextItem label="Walkthrough offer" value={primaryOffer} />
              <NextItem
                label="Vendor packet angle"
                value={
                  flooring.vendor_packet_angle ||
                  'Provide capabilities, preparation process, system options, moisture review, and commercial scheduling information.'
                }
              />
              <NextItem
                label="Decision-maker path"
                value={flooring.decision_maker_path || 'Route to the property, facilities, maintenance, estimating, or owner contact.'}
              />
              <NextItem
                label="Procurement path"
                value={flooring.procurement_path || 'Start with capabilities packet, then walkthrough, then scope and estimate if there is fit.'}
              />
              <NextItem label="Next sales action" value={nextAction} />
            </div>
          </div>
          <div className={styles.closeBox}>
            <h3>Recommended ask</h3>
            <p>Identify one high-traffic area to review, or forward this to the facilities, maintenance, estimating, or vendor contact.</p>
          </div>
        </section>

        <section className={styles.objectionSection}>
          <div>
            <span>Likely objection</span>
            <p>{flooring.likely_objection || 'We already have vendors or are not ready to start a flooring project.'}</p>
          </div>
          <div>
            <span>Response</span>
            <p>
              {flooring.objection_response ||
                'That is fair. The first step is only a fit review: concrete condition, use case, moisture risk, and whether Resinate belongs in the vendor conversation.'}
            </p>
          </div>
        </section>

        <footer className={styles.footer}>
          <p>
            This is a preliminary fit note based on public information and expected surface use.
            Final system recommendations require a walkthrough and concrete inspection.
          </p>
          <strong>Resinate Custom Flooring</strong>
        </footer>
      </article>
    </main>
  );
}

function SectionTitle({ label, title, id }: { label: string; title: string; id?: string }) {
  return (
    <div className={styles.sectionTitle}>
      <span>{label}</span>
      <h2 id={id}>{title}</h2>
    </div>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metaLine}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NextItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.nextItem}>
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

function buildPacketRows({
  buyerType,
  propertyType,
  likelyAreas,
  audit,
  recommendedSystem,
  nextAction,
}: {
  buyerType: string;
  propertyType: string;
  likelyAreas: string[];
  audit: PublicFlooringAudit;
  recommendedSystem: string;
  nextAction: string;
}): PacketRow[] {
  const flooring = audit.flooring;
  return [
    { label: 'Buyer type', value: buyerType },
    { label: 'Property type', value: propertyType },
    { label: 'Likely surface areas', value: likelyAreas.join(', ') },
    { label: 'Traffic needs', value: flooring.traffic_needs || 'Match finish durability to daily use, equipment, tenants, residents, staff, or public traffic.' },
    { label: 'Cleaning / maintenance needs', value: flooring.cleaning_needs || 'Reduce surface wear, concrete dusting, stains, and repeat maintenance friction.' },
    { label: 'Moisture considerations', value: flooring.moisture_needs || 'Review slab-on-grade, basement, vapor, or prior coating failure risk before coating.' },
    { label: 'Slip-resistance considerations', value: flooring.slip_resistance_needs || 'Select texture by use case, especially wet, public, utility, or service areas.' },
    { label: 'Downtime / scheduling considerations', value: flooring.downtime_needs || 'Plan around tenants, residents, other trades, access windows, or operating schedules.' },
    { label: 'Recommended system', value: recommendedSystem },
    { label: 'Next action', value: nextAction },
  ];
}

function buildExecutiveSummary(
  audit: PublicFlooringAudit,
  buyerType: string,
  propertyType: string,
  offer: string
) {
  const problem =
    audit.flooring.likely_surface_problem ||
    audit.audit?.main_problem ||
    'there may be concrete surfaces where durability, cleaning, moisture, and long-term use should drive the system choice';
  return `${audit.prospect.business_name} appears to be a fit because the buyer context is ${buyerType.toLowerCase()} tied to ${propertyType.toLowerCase()}. ${problem} The right next step is not a hard pitch; it is a ${offer.toLowerCase()} to confirm surface condition, traffic, moisture risk, and the correct Resinate system.`;
}

function buildBuyerNotes(buyerType: string) {
  const value = buyerType.toLowerCase();
  if (value.includes('contractor') || value.includes('construction')) {
    return {
      title: 'Subcontractor reliability and scope clarity',
      body: 'For contractors, the value is a specialty surface partner who can support clear scope, fast estimates, clean execution, preparation credibility, and schedule protection.',
    };
  }

  if (value.includes('real estate') || value.includes('broker') || value.includes('invest')) {
    return {
      title: 'Asset presentation and deal support',
      body: 'For real estate groups, the value is a practical surface upgrade option for leasing, tenant improvements, investor properties, listing preparation, and portfolio presentation.',
    };
  }

  if (value.includes('school') || value.includes('facility') || value.includes('maintenance')) {
    return {
      title: 'Facilities, cleaning, and durability',
      body: 'For facilities teams, the value is safer, cleaner, durable surfaces with serious attention to slip resistance, sanitation, downtime, procurement, and long-term maintenance.',
    };
  }

  return {
    title: 'Property maintenance and repeatability',
    body: 'For property managers, the value is lower maintenance, cleaner common areas, better tenant perception, vendor reliability, and a repeatable surface option across similar properties.',
  };
}

function parseList(value: string | null | undefined, fallback: string[]) {
  const cleaned = value
    ?.split(/[\n,;|]+/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return cleaned && cleaned.length > 0 ? cleaned : fallback;
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
