'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coffee,
  Compass,
  MapPin,
  Megaphone,
  Navigation,
  Search,
  Sparkles,
  Star,
  Utensils,
  Users,
  Wrench,
} from 'lucide-react';
import type { Audit, Mockup, Prospect } from '@/lib/types';
import {
  buildPublicMockupUrl,
  getMockupTemplateVariant,
  getMockupVariantLabel,
  parseMockupFeatures,
  type MockupTemplateVariant,
} from '@/lib/mockup-templates';
import styles from './PremiumMockupSite.module.css';

type PublicProspect = Pick<Prospect, 'business_name' | 'niche' | 'city' | 'state'>;
type PublicAudit = Pick<
  Audit,
  'main_problem' | 'conversion_opportunity' | 'recommended_offer' | 'mockup_angle'
>;

type PremiumMockupSiteProps = {
  mockup: Mockup;
  prospect: PublicProspect | null;
  audit?: PublicAudit | null;
};

type VariantConfig = {
  icon: LucideIcon;
  navCta: string;
  eyebrow: string;
  primaryCta: string;
  fallbackHeadline: (businessName: string) => string;
  fallbackSubheadline: (businessName: string, location: string) => string;
  utility: string[];
  featureFallbacks: string[];
  offerTitle: string;
  offerIntro: string;
  offers: string[];
  plannerTitle: string;
  plannerIntro: string;
  plannerSteps: string[];
  bestWindows: string[];
  localSeoTitle: string;
  contentTitle: string;
  contentIdeas: string[];
};

const VARIANT_CONFIG: Record<MockupTemplateVariant, VariantConfig> = {
  coffee_shop: {
    icon: Coffee,
    navCta: 'Start an order',
    eyebrow: 'Roastery-style website concept',
    primaryCta: 'Find your order',
    fallbackHeadline: (businessName) => `${businessName} with a warmer path to the first order`,
    fallbackSubheadline: (_businessName, location) =>
      `A cafe landing page for ${location} customers who want the menu, the mood, and the right reason to stop in today.`,
    utility: ['Morning rush friendly', 'Mobile menu first', 'Cafe regulars path'],
    featureFallbacks: ['Signature drinks', 'Seasonal menu blocks', 'Pickup flow', 'Events and loyalty'],
    offerTitle: 'Find Your Order',
    offerIntro: 'Help a new guest decide quickly, then give regulars a direct path back to their usual.',
    offers: ['Today at the bar', 'Quiet work table', 'Beans to take home', 'Weekend pastry drop'],
    plannerTitle: 'Best Time to Visit',
    plannerIntro: 'A simple daypart guide turns local browsing into an actual visit.',
    plannerSteps: ['Before work', 'Midday reset', 'After-school window'],
    bestWindows: ['7-9 AM pickup', '11 AM-1 PM work session', 'Saturday pastry release'],
    localSeoTitle: 'Local coffee searches, mapped to a real visit',
    contentTitle: 'Weekly content and Meta ads rhythm',
    contentIdeas: ['Drink of the week', 'Behind the bar', 'Neighborhood morning offer'],
  },
  restaurant: {
    icon: Utensils,
    navCta: 'Plan a visit',
    eyebrow: 'Restaurant landing page concept',
    primaryCta: 'Plan your visit',
    fallbackHeadline: (businessName) => `${businessName} made easier to choose tonight`,
    fallbackSubheadline: (_businessName, location) =>
      `A mobile-first restaurant concept for ${location} diners who need the menu, the reason to come in, and the next step without hunting.`,
    utility: ['Menu-first mobile', 'Dinner decision path', 'Local search ready'],
    featureFallbacks: ['Featured menu sections', 'Reservation prompt', 'Google review placement', 'Catering or events'],
    offerTitle: 'Menu Highlights That Sell the Visit',
    offerIntro: 'The page leads with decision-making: what to try, when to come, and what makes the meal worth it.',
    offers: ['First-timer favorites', 'Family table picks', 'Weeknight special', 'Private event angle'],
    plannerTitle: 'Plan Your Visit',
    plannerIntro: 'Give people the practical details they need before they bounce back to search results.',
    plannerSteps: ['Choose a meal window', 'Preview the menu', 'Reserve or get directions'],
    bestWindows: ['Lunch rush', 'Early dinner', 'Weekend group tables'],
    localSeoTitle: 'Local dining searches with conversion intent',
    contentTitle: 'Social content and Meta ads that point to the menu',
    contentIdeas: ['Chef feature', 'Weekly special', 'Neighborhood dinner reminder'],
  },
  bar_grill: {
    icon: Star,
    navCta: 'See what is on',
    eyebrow: 'Bar and grill experience concept',
    primaryCta: 'See tonight',
    fallbackHeadline: (businessName) => `${businessName} built around tonight's reason to go`,
    fallbackSubheadline: (_businessName, location) =>
      `A high-energy concept for ${location} guests choosing where to watch, meet, eat, and stay a little longer.`,
    utility: ['Patio and game-night path', 'Events visible fast', 'Late-day mobile traffic'],
    featureFallbacks: ['Events calendar', 'Patio feature', 'Tap list or menu highlights', 'Group reservations'],
    offerTitle: 'Tonight, This Weekend, and the Table After Work',
    offerIntro: 'The page gives the regular crowd a reason to check back and gives new guests a confident first choice.',
    offers: ['Game night', 'Patio hour', 'Burger and beer pairing', 'Live music slot'],
    plannerTitle: 'Best Window to Come In',
    plannerIntro: 'Timely prompts help guests pick a moment instead of postponing the decision.',
    plannerSteps: ['After work', 'Game start', 'Weekend late table'],
    bestWindows: ['4-6 PM patio', 'Game-day rush', 'Friday music window'],
    localSeoTitle: 'Bar, grill, patio, and event searches in one path',
    contentTitle: 'Weekly content and paid social for regular reasons to return',
    contentIdeas: ['This week on tap', 'Game-day post', 'Patio weather reminder'],
  },
  premium_dining: {
    icon: Sparkles,
    navCta: 'Reserve a table',
    eyebrow: 'Premium dining concept',
    primaryCta: 'Reserve a table',
    fallbackHeadline: (businessName) => `${businessName} with a more composed reservation path`,
    fallbackSubheadline: (_businessName, location) =>
      `A refined concept for ${location} guests comparing special-night restaurants and private dining options.`,
    utility: ['Reservation intent', 'Private dining signal', 'Refined mobile flow'],
    featureFallbacks: ['Reservation hero', 'Chef menu story', 'Private dining', 'Wine or cocktail feature'],
    offerTitle: 'The Right Table for the Right Night',
    offerIntro: 'The concept moves from mood to menu to reservation without flattening the restaurant into a generic lead form.',
    offers: ['Date night', 'Chef feature', 'Private room', 'Seasonal tasting angle'],
    plannerTitle: 'Reserve With Context',
    plannerIntro: 'Premium guests want confidence before they commit: what kind of night, what kind of table, what to expect.',
    plannerSteps: ['Pick the occasion', 'Preview the signature course', 'Request the table'],
    bestWindows: ['Early seating', 'Prime dinner', 'Private dining inquiries'],
    localSeoTitle: 'High-intent dining searches with a reservation-ready page',
    contentTitle: 'Editorial content and Meta ads for special occasions',
    contentIdeas: ['Chef note', 'Seasonal menu', 'Occasion-specific reservation ad'],
  },
  nonprofit_cafe: {
    icon: Users,
    navCta: 'Join the mission',
    eyebrow: 'Community cafe concept',
    primaryCta: 'Visit or support',
    fallbackHeadline: (businessName) => `${businessName} with the mission visible above the fold`,
    fallbackSubheadline: (_businessName, location) =>
      `A community-first concept for ${location} guests who need to understand the food, the purpose, and how to participate.`,
    utility: ['Mission-forward', 'Visit and support paths', 'Volunteer-ready'],
    featureFallbacks: ['Mission story', 'Menu highlights', 'Volunteer or donate CTA', 'Community calendar'],
    offerTitle: 'Choose the Way You Want to Show Up',
    offerIntro: 'Food, mission, and participation sit together so the site supports both customers and community partners.',
    offers: ['Grab lunch', 'Support a program', 'Volunteer shift', 'Community event'],
    plannerTitle: 'Plan a Visit With Purpose',
    plannerIntro: 'A lightweight planner helps people choose lunch, a meeting spot, or a way to support the work.',
    plannerSteps: ['See what is served', 'Find the mission fit', 'Choose the next step'],
    bestWindows: ['Lunch window', 'Community event', 'Volunteer inquiry'],
    localSeoTitle: 'Community searches, cafe searches, and mission searches together',
    contentTitle: 'Weekly stories and light paid promotion for programs',
    contentIdeas: ['Program spotlight', 'Community meal update', 'Local partner story'],
  },
  food_truck: {
    icon: Navigation,
    navCta: 'Find the truck',
    eyebrow: 'Mobile food concept',
    primaryCta: 'Find the truck',
    fallbackHeadline: (businessName) => `${businessName} with the route right up front`,
    fallbackSubheadline: (_businessName, location) =>
      `A fast-moving concept for ${location} customers who need location, hours, menu, and the next stop at a glance.`,
    utility: ['Route-first layout', 'Fast menu scanning', 'Event booking path'],
    featureFallbacks: ['Live location block', 'Short menu', 'Event booking CTA', 'Instagram feed'],
    offerTitle: 'Find the Stop, Pick the Order',
    offerIntro: 'A truck site has one job: make the next stop and the best order unmistakable on a phone.',
    offers: ['Today location', 'Fan favorite', 'Event booking', 'Pop-up schedule'],
    plannerTitle: 'Route Planner',
    plannerIntro: 'The page makes movement part of the concept instead of burying it under a static homepage.',
    plannerSteps: ['Check today', 'Pick a menu item', 'Book the truck'],
    bestWindows: ['Lunch stop', 'Brewery pop-up', 'Weekend event'],
    localSeoTitle: 'Food truck searches tied to current location intent',
    contentTitle: 'Weekly route content and Meta ads near each stop',
    contentIdeas: ['Route drop', 'Menu short', 'Event-day ad'],
  },
  local_service: {
    icon: Wrench,
    navCta: 'Request service',
    eyebrow: 'Local service website concept',
    primaryCta: 'Request service',
    fallbackHeadline: (businessName) => `${businessName} with the urgent next step made obvious`,
    fallbackSubheadline: (_businessName, location) =>
      `A trust-first service concept for ${location} customers comparing options and ready to request help.`,
    utility: ['Click-to-act hero', 'Trust proof path', 'Service area clarity'],
    featureFallbacks: ['Primary service CTA', 'Service area section', 'Review proof', 'Estimate request'],
    offerTitle: 'Find the Right Service Fast',
    offerIntro: 'Service buyers arrive with a problem. This concept routes them to the right action without making them decode the company.',
    offers: ['Emergency request', 'Estimate path', 'Service area', 'Maintenance plan'],
    plannerTitle: 'Service Planner',
    plannerIntro: 'A simple sequence helps visitors choose the service, share the issue, and book the next step.',
    plannerSteps: ['Choose the problem', 'Confirm service area', 'Request a time'],
    bestWindows: ['Same-day request', 'Scheduled quote', 'Maintenance reminder'],
    localSeoTitle: 'Local service searches with trust and action in the first screen',
    contentTitle: 'Useful content and Meta retargeting for service demand',
    contentIdeas: ['Seasonal checklist', 'Before-and-after proof', 'Service area reminder'],
  },
};

export function PremiumMockupSite({ mockup, prospect, audit }: PremiumMockupSiteProps) {
  const businessName = prospect?.business_name || mockup.title.replace(/\s+mockup.*$/i, '') || mockup.title;
  const location = [prospect?.city, prospect?.state].filter(Boolean).join(', ') || 'your area';
  const variant = getMockupTemplateVariant(prospect?.niche);
  const config = VARIANT_CONFIG[variant];
  const features = mergeItems(parseMockupFeatures(mockup.features_included), config.featureFallbacks, 6);
  const headline = mockup.hero_headline || config.fallbackHeadline(businessName);
  const subheadline =
    mockup.hero_subheadline || audit?.conversion_opportunity || config.fallbackSubheadline(businessName, location);
  const primaryCta = mockup.primary_cta || config.primaryCta;
  const mockupUrl = buildPublicMockupUrl(mockup.slug);

  return (
    <MockupSiteShell variant={variant}>
      <MockupNavPreview businessName={businessName} ctaLabel={config.navCta} />
      <MockupHero
        businessName={businessName}
        location={location}
        headline={headline}
        subheadline={subheadline}
        ctaLabel={primaryCta}
        config={config}
        variant={variant}
      />
      <UtilityStrip items={config.utility} location={location} />
      <MockupFeatureGrid features={features} audit={audit} />
      <MockupMenuOrOfferSection config={config} recommendedOffer={audit?.recommended_offer} />
      <MockupVisitPlanner config={config} location={location} />
      <MockupLocalSEOSection
        title={config.localSeoTitle}
        location={location}
        conversionOpportunity={audit?.conversion_opportunity}
        mockupAngle={audit?.mockup_angle}
      />
      <MockupContentAdsSection title={config.contentTitle} ideas={config.contentIdeas} />
      <MockupFinalCTA businessName={businessName} />
      <MockupFooter businessName={businessName} mockupUrl={mockupUrl} variant={variant} />
    </MockupSiteShell>
  );
}

export function MockupSiteShell({
  variant,
  children,
}: {
  variant: MockupTemplateVariant;
  children: ReactNode;
}) {
  return <main className={`${styles.shell} ${styles[variant]}`}>{children}</main>;
}

export function MockupNavPreview({
  businessName,
  ctaLabel,
}: {
  businessName: string;
  ctaLabel: string;
}) {
  return (
    <header className={styles.nav}>
      <a href="#top" className={styles.brandMark}>
        <span className={styles.brandGlyph}>{businessInitials(businessName)}</span>
        <span>{businessName}</span>
      </a>
      <nav className={styles.navLinks} aria-label="Concept navigation">
        <a href="#offers">Menu</a>
        <a href="#visit">Visit</a>
        <a href="#growth">Growth</a>
      </nav>
      <a href="#walkthrough" className={styles.navButton}>
        {ctaLabel}
      </a>
    </header>
  );
}

export function TemplateBadge({ variant }: { variant: MockupTemplateVariant }) {
  return (
    <span className={styles.templateBadge}>
      Visual concept
      <span>{getMockupVariantLabel(variant)}</span>
    </span>
  );
}

export function MockupHero({
  businessName,
  location,
  headline,
  subheadline,
  ctaLabel,
  config,
  variant,
}: {
  businessName: string;
  location: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  config: VariantConfig;
  variant: MockupTemplateVariant;
}) {
  const Icon = config.icon;

  return (
    <section id="top" className={styles.hero}>
      <div className={styles.heroCopy}>
        <TemplateBadge variant={variant} />
        <p className={styles.eyebrow}>{config.eyebrow}</p>
        <h1>{headline}</h1>
        <p className={styles.lede}>{subheadline}</p>
        <div className={styles.heroActions}>
          <a href="#offers" className={styles.primaryButton}>
            {ctaLabel}
            <ArrowRight size={18} />
          </a>
          <a href="#walkthrough" className={styles.secondaryButton}>
            Walk through the concept
          </a>
        </div>
      </div>

      <div className={styles.heroVisual} aria-label={`${businessName} website concept preview`}>
        <div className={styles.visualTopline}>
          <span>{location}</span>
          <span>Fresh this week</span>
        </div>
        <div className={styles.visualPlate}>
          <Icon size={44} />
          <span>{config.offerTitle}</span>
        </div>
        <div className={styles.visualCards}>
          {config.offers.slice(0, 3).map((offer, index) => (
            <div key={offer} className={styles.visualCard}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {offer}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UtilityStrip({ items, location }: { items: string[]; location: string }) {
  return (
    <section className={styles.utilityStrip} aria-label="Concept quick facts">
      <div>
        <MapPin size={18} />
        <span>{location}</span>
      </div>
      {items.map((item) => (
        <div key={item}>
          <CheckCircle2 size={18} />
          <span>{item}</span>
        </div>
      ))}
    </section>
  );
}

export function MockupFeatureGrid({
  features,
  audit,
}: {
  features: string[];
  audit?: PublicAudit | null;
}) {
  const cards = features.slice(0, 6).map((feature, index) => ({
    title: feature,
    detail:
      index === 0 && audit?.main_problem
        ? `Built to answer: ${audit.main_problem}`
        : FEATURE_DETAILS[index % FEATURE_DETAILS.length],
  }));

  return (
    <section className={styles.section}>
      <div className={styles.sectionIntro}>
        <p>What the concept emphasizes</p>
        <h2>A homepage that helps people choose, not just browse.</h2>
      </div>
      <div className={styles.featureGrid}>
        {cards.map((card, index) => (
          <article key={`${card.title}-${index}`} className={styles.featureCard}>
            <span className={styles.cardNumber}>{String(index + 1).padStart(2, '0')}</span>
            <h3>{card.title}</h3>
            <p>{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MockupMenuOrOfferSection({
  config,
  recommendedOffer,
}: {
  config: VariantConfig;
  recommendedOffer?: string | null;
}) {
  return (
    <section id="offers" className={`${styles.section} ${styles.offerSection}`}>
      <div className={styles.offerCopy}>
        <p>Decision path</p>
        <h2>{config.offerTitle}</h2>
        <p>{recommendedOffer || config.offerIntro}</p>
      </div>
      <div className={styles.offerGrid}>
        {config.offers.map((offer, index) => (
          <article key={offer} className={styles.offerCard}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{offer}</h3>
            <p>{OFFER_DETAILS[index % OFFER_DETAILS.length]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function MockupVisitPlanner({
  config,
  location,
}: {
  config: VariantConfig;
  location: string;
}) {
  return (
    <section id="visit" className={`${styles.section} ${styles.plannerSection}`}>
      <div className={styles.plannerPanel}>
        <div>
          <p>Visit planner</p>
          <h2>{config.plannerTitle}</h2>
          <p>{config.plannerIntro}</p>
        </div>
        <div className={styles.stepList}>
          {config.plannerSteps.map((step, index) => (
            <div key={step}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {step}
            </div>
          ))}
        </div>
      </div>
      <div className={styles.timelinePanel}>
        <div className={styles.timelineHeader}>
          <Clock3 size={18} />
          <span>{location}</span>
        </div>
        {config.bestWindows.map((window) => (
          <div key={window} className={styles.timelineRow}>
            <CalendarDays size={16} />
            <span>{window}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MockupLocalSEOSection({
  title,
  location,
  conversionOpportunity,
  mockupAngle,
}: {
  title: string;
  location: string;
  conversionOpportunity?: string | null;
  mockupAngle?: string | null;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionIntro}>
        <p>Local search and conversion</p>
        <h2>{title}</h2>
      </div>
      <div className={styles.seoGrid}>
        <article>
          <Search size={22} />
          <h3>Search intent</h3>
          <p>Shape the page around the way customers search near {location} before they choose a competitor.</p>
        </article>
        <article>
          <Compass size={22} />
          <h3>Conversion path</h3>
          <p>{conversionOpportunity || 'Move the visitor from first impression to the clearest next action.'}</p>
        </article>
        <article>
          <Star size={22} />
          <h3>Concept angle</h3>
          <p>{mockupAngle || 'Make the strongest local differentiator visible before the first scroll.'}</p>
        </article>
      </div>
    </section>
  );
}

export function MockupContentAdsSection({ title, ideas }: { title: string; ideas: string[] }) {
  return (
    <section id="growth" className={`${styles.section} ${styles.growthSection}`}>
      <div className={styles.growthCopy}>
        <p>After launch</p>
        <h2>{title}</h2>
        <p>
          The mockup is built so website updates, social posts, and paid traffic can point to a clear
          offer instead of a generic homepage.
        </p>
      </div>
      <div className={styles.growthRail}>
        {ideas.map((idea) => (
          <div key={idea}>
            <Megaphone size={16} />
            <span>{idea}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function MockupFinalCTA({
  businessName,
}: {
  businessName: string;
}) {
  return (
    <section id="walkthrough" className={styles.finalCta}>
      <div>
        <p>Walkthrough ready</p>
        <h2>See how this concept could work for {businessName}.</h2>
        <p>
          This is a visual concept, not the final production website. The next step is a short review
          of the sections, offer, and launch plan.
        </p>
      </div>
      <a href="mailto:nate@apexmarketing.ai?subject=Mockup Walkthrough Request" className={styles.primaryButton}>
        Schedule a walkthrough
        <ArrowRight size={18} />
      </a>
    </section>
  );
}

export function MockupFooter({
  businessName,
  mockupUrl,
  variant,
}: {
  businessName: string;
  mockupUrl: string;
  variant: MockupTemplateVariant;
}) {
  return (
    <footer className={styles.footer}>
      <span>{businessName}</span>
      <span>{getMockupVariantLabel(variant)} template concept</span>
      <span className={styles.footerUrl}>{mockupUrl}</span>
      <span>Visual concept by Apex Marketing & AI Solutions. Not a final production website.</span>
    </footer>
  );
}

const FEATURE_DETAILS = [
  'The first screen answers the visitor question before it asks for a click.',
  'The layout is designed for phone traffic first, with short routes to action.',
  'Content blocks can support organic search without making the page feel like an article.',
  'The visual system can grow into a complete site after the walkthrough.',
];

const OFFER_DETAILS = [
  'A focused block that makes the choice feel concrete.',
  'A short explanation gives context without slowing the page down.',
  'The CTA connects the offer to the next action.',
  'The section can rotate seasonally without redesigning the whole site.',
];

function mergeItems(primary: string[], fallback: string[], limit: number) {
  const seen = new Set<string>();
  return [...primary, ...fallback]
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function businessInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
