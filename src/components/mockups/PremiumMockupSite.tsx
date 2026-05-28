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
  Gift,
  HeartHandshake,
  Megaphone,
  Music2,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
  Wrench,
} from 'lucide-react';
import {
  cleanRichList,
  parseMockupConceptNotes,
  splitStrategyText,
  type RichMockupData,
} from '@/lib/mockup-rich-data';
import type { Audit, Mockup, Prospect } from '@/lib/types';
import {
  buildPublicMockupUrl,
  getMockupTemplateVariant,
  parseMockupFeatures,
  type MockupTemplateVariant,
} from '@/lib/mockup-templates';
import styles from './PremiumMockupSite.module.css';

type PublicProspect = Pick<Prospect, 'business_name' | 'niche' | 'city' | 'state'>;
type PublicAudit = Pick<
  Audit,
  'main_problem' | 'conversion_opportunity' | 'recommended_offer' | 'mockup_angle' | 'audit_notes'
>;

type PremiumMockupSiteProps = {
  mockup: Mockup;
  prospect: PublicProspect | null;
  audit?: PublicAudit | null;
};

type ConceptContext = {
  businessName: string;
  niche: string;
  location: string;
  city: string;
  variant: MockupTemplateVariant;
  config: VariantConfig;
  headline: string;
  subheadline: string;
  primaryCta: string;
  navItems: string[];
  offers: string[];
  trustSignals: string[];
  issueFixes: IssueFix[];
  conversionSteps: string[];
  localSearches: string[];
  contentIdeas: string[];
  metaAdsIdeas: string[];
  visualDirection: string;
  palette: string[];
  rich: RichMockupData;
  audit?: PublicAudit | null;
  conceptNotes: string | null;
  mockupUrl: string;
};

type VariantConfig = {
  icon: LucideIcon;
  navItems: string[];
  primaryCta: string;
  eyebrow: string;
  heroKicker: string;
  fallbackHeadline: (businessName: string) => string;
  fallbackSubheadline: (location: string) => string;
  utility: string[];
  offers: string[];
  trustSignals: string[];
  conversionSteps: string[];
  localSearches: string[];
  contentIdeas: string[];
  metaAdsIdeas: string[];
  issueFallbacks: IssueFix[];
  layout: 'luxury' | 'tavern' | 'cafe' | 'mission' | 'mobile' | 'dining' | 'service';
};

type IssueFix = {
  label: string;
  current: string;
  fix: string;
  severity: 'low' | 'medium' | 'high';
};

export const MOCKUP_VISUAL_RULES = [
  'Every mockup has a website-style nav.',
  'Every mockup has a clear primary CTA.',
  'Every mockup includes business-specific content.',
  'Every mockup includes a conversion path.',
  'Every mockup includes an online presence snapshot.',
  'Every variant uses a different layout rhythm.',
];

const VARIANT_CONFIG: Record<MockupTemplateVariant, VariantConfig> = {
  premium_dining: {
    icon: Sparkles,
    navItems: ['Menu', 'Reservations', 'Private Dining', 'Gift Cards', 'Awards'],
    primaryCta: 'Reserve a table',
    eyebrow: 'Premium dining homepage concept',
    heroKicker: 'Reservation-first dining experience',
    fallbackHeadline: (businessName) => `${businessName} deserves a more composed path to the table`,
    fallbackSubheadline: (location) =>
      `A refined homepage direction for ${location} guests comparing special-night restaurants, private dining, and giftable experiences.`,
    utility: ['Reservation-first hero', 'Private dining path', 'Gift cards surfaced'],
    offers: ['Signature steaks', 'Reservations', 'Gift cards', 'Private dining'],
    trustSignals: ['Special-occasion dining', 'Private dining available', 'Gift cards ready'],
    conversionSteps: ['Explore menu', 'Choose occasion', 'Review private dining', 'Reserve table'],
    localSearches: ['best steakhouse in {city}', 'fine dining in {city}', 'private dining {city}'],
    contentIdeas: ['date-night menu stories', 'chef feature posts', 'gift-card seasonal campaigns'],
    metaAdsIdeas: ['date-night ads', 'private dining inquiry campaigns'],
    issueFallbacks: [
      {
        label: 'Reservation path',
        current: 'Reservation intent competes with too many equal-weight actions.',
        fix: 'Make Reserve a Table the dominant above-the-fold action.',
        severity: 'high',
      },
      {
        label: 'Private dining',
        current: 'Private dining and group occasions are not visible early enough.',
        fix: 'Add a dedicated private dining and bar room module.',
        severity: 'medium',
      },
      {
        label: 'Gift cards',
        current: 'Gift cards are easy to miss during seasonal buying windows.',
        fix: 'Give gift cards a premium CTA near the reservation flow.',
        severity: 'medium',
      },
    ],
    layout: 'luxury',
  },
  bar_grill: {
    icon: Music2,
    navItems: ['Menu', 'Happy Hour', 'Events', 'Order', 'Visit'],
    primaryCta: 'See tonight',
    eyebrow: 'Bar and grill homepage concept',
    heroKicker: "Tonight's reason to come in",
    fallbackHeadline: (businessName) => `${businessName} should feel alive before the first scroll`,
    fallbackSubheadline: (location) =>
      `A social, event-forward homepage for ${location} guests choosing where to watch, eat, meet, and stay later.`,
    utility: ['Happy hour visible', 'Events in the first scroll', 'Order or waitlist path'],
    offers: ['Happy hour', 'Live music', 'Online ordering', 'Waitlist'],
    trustSignals: ['Live music and events', 'Patio or game-night energy', 'Regulars and group nights'],
    conversionSteps: ['See happy hour', 'View events', 'Choose food or drinks', 'Visit tonight'],
    localSearches: ['happy hour in {city}', 'bar and grill near {city}', 'live music tonight {city}'],
    contentIdeas: ['happy hour/event promotions', 'tap list posts', 'live music reminders'],
    metaAdsIdeas: ['game-day ads', 'patio weather campaigns'],
    issueFallbacks: [
      {
        label: 'Tonight signal',
        current: 'Guests do not immediately see what is happening tonight.',
        fix: 'Lead with happy hour, events, and a visit-now path.',
        severity: 'high',
      },
      {
        label: 'Ordering path',
        current: 'Online ordering or waitlist actions can get buried behind menu copy.',
        fix: 'Repeat order and waitlist CTAs in the hero and menu modules.',
        severity: 'medium',
      },
    ],
    layout: 'tavern',
  },
  coffee_shop: {
    icon: Coffee,
    navItems: ['Menu', 'Order', 'Visit', 'Community', 'Loyalty'],
    primaryCta: 'Start an order',
    eyebrow: 'Cafe homepage concept',
    heroKicker: 'Menu-first neighborhood cafe',
    fallbackHeadline: (businessName) => `${businessName} can make the first order feel effortless`,
    fallbackSubheadline: (location) =>
      `A warm, menu-forward concept for ${location} guests who want the drink, the vibe, and the fastest way to visit or order.`,
    utility: ['Featured drinks', 'Daily specials', 'Loyalty path'],
    offers: ['Featured drinks', 'Breakfast bites', 'Loyalty signup', 'Community events'],
    trustSignals: ['Local regulars path', 'Seasonal menu rhythm', 'Community gathering place'],
    conversionSteps: ['View menu', 'Find best order', 'Choose pickup or visit', 'Join loyalty'],
    localSearches: ['coffee shop in {city}', 'breakfast coffee near {city}', 'cafe downtown {city}'],
    contentIdeas: ['weekly featured drink reels', 'behind-the-bar posts', 'community event reminders'],
    metaAdsIdeas: ['gift card seasonal campaigns', 'new drink launch ads'],
    issueFallbacks: [
      {
        label: 'Menu clarity',
        current: 'Menu, hours, and ordering are not bundled into one easy path.',
        fix: 'Put featured drinks, daily specials, and order CTA in the first screen.',
        severity: 'high',
      },
      {
        label: 'Community story',
        current: 'The site does not show why guests come back.',
        fix: 'Add a community and loyalty section that feels local.',
        severity: 'medium',
      },
    ],
    layout: 'cafe',
  },
  nonprofit_cafe: {
    icon: HeartHandshake,
    navItems: ['Mission', 'Menu', 'Donate', 'Volunteer', 'Visit'],
    primaryCta: 'Visit or support',
    eyebrow: 'Mission-first homepage concept',
    heroKicker: 'Community impact with a clear next step',
    fallbackHeadline: (businessName) => `${businessName} can make the mission visible immediately`,
    fallbackSubheadline: (location) =>
      `A community-first concept for ${location} guests who need to understand the food, the purpose, and how to participate.`,
    utility: ['Mission above the fold', 'Donate and volunteer paths', 'Visit details visible'],
    offers: ['Dine', 'Donate', 'Volunteer', 'Community impact'],
    trustSignals: ['Community-driven model', 'Volunteer participation', 'Local impact story'],
    conversionSteps: ['Understand mission', 'See menu', 'Choose donate or volunteer', 'Visit or support'],
    localSearches: ['community cafe in {city}', 'nonprofit cafe {city}', 'volunteer cafe {city}'],
    contentIdeas: ['volunteer/donation storytelling', 'program spotlight posts', 'community meal updates'],
    metaAdsIdeas: ['donation campaigns', 'volunteer recruitment ads'],
    issueFallbacks: [
      {
        label: 'Mission path',
        current: 'Donation and volunteer paths are not obvious enough for new visitors.',
        fix: 'Place donate and volunteer CTAs beside the menu and mission story.',
        severity: 'high',
      },
      {
        label: 'Impact clarity',
        current: 'The current experience may not explain the model fast enough.',
        fix: 'Use a mission explainer and impact story before the footer.',
        severity: 'medium',
      },
    ],
    layout: 'mission',
  },
  food_truck: {
    icon: Navigation,
    navItems: ['Menu', 'Location', 'Catering', 'Events', 'Contact'],
    primaryCta: 'Find the truck',
    eyebrow: 'Mobile food homepage concept',
    heroKicker: 'Location and catering first',
    fallbackHeadline: (businessName) => `${businessName} needs the route right up front`,
    fallbackSubheadline: (location) =>
      `A bold mobile-first concept for ${location} customers who need location, hours, menu, and catering in seconds.`,
    utility: ['Route-first layout', 'Catering inquiry path', 'Event booking CTA'],
    offers: ['Weekly location', 'Catering', 'Menu highlights', 'Event booking'],
    trustSignals: ['Event booking available', 'Weekly route updates', 'Mobile ordering energy'],
    conversionSteps: ['Find location', 'Choose menu item', 'Check event schedule', 'Book catering'],
    localSearches: ['food truck catering {city}', 'food truck near {city}', 'mobile catering {city}'],
    contentIdeas: ['weekly location posts', 'menu highlight shorts', 'event-day reminders'],
    metaAdsIdeas: ['catering inquiry campaigns', 'near-stop lunch ads'],
    issueFallbacks: [
      {
        label: 'Location clarity',
        current: 'The next location or event path can be hard to find quickly.',
        fix: 'Make location, schedule, and catering CTAs the first visible actions.',
        severity: 'high',
      },
      {
        label: 'Catering path',
        current: 'Event booking demand needs a dedicated inquiry path.',
        fix: 'Add a catering module with one simple booking CTA.',
        severity: 'medium',
      },
    ],
    layout: 'mobile',
  },
  restaurant: {
    icon: Utensils,
    navItems: ['Menu', 'Order', 'Reserve', 'Visit', 'Catering'],
    primaryCta: 'Plan your visit',
    eyebrow: 'Restaurant homepage concept',
    heroKicker: 'Food-forward visit planning',
    fallbackHeadline: (businessName) => `${businessName} can make tonight's choice easier`,
    fallbackSubheadline: (location) =>
      `A flexible restaurant concept for ${location} diners who need menu highlights, visit details, and the next action without hunting.`,
    utility: ['Featured dishes', 'Order or reserve path', 'Best-time visit cues'],
    offers: ['Featured dishes', 'Find your order', 'Best time to visit', 'Catering'],
    trustSignals: ['Local dining destination', 'Menu built for repeat visits', 'Catering and group occasions'],
    conversionSteps: ['See menu', 'Choose occasion', 'Plan visit', 'Order or reserve'],
    localSearches: ['restaurant in {city}', 'best lunch near {city}', 'catering in {city}'],
    contentIdeas: ['weekly featured dish reels', 'chef or owner notes', 'catering reminders'],
    metaAdsIdeas: ['date-night ads', 'family dinner promotions'],
    issueFallbacks: [
      {
        label: 'Menu path',
        current: 'Menu highlights and the primary action are not clear enough on mobile.',
        fix: 'Use food-forward cards with order, reserve, and visit CTAs.',
        severity: 'high',
      },
      {
        label: 'Visit planning',
        current: 'Guests need hours, location, and best-time cues before choosing.',
        fix: 'Add a visit planner section with practical next steps.',
        severity: 'medium',
      },
    ],
    layout: 'dining',
  },
  local_service: {
    icon: Wrench,
    navItems: ['Services', 'Results', 'Areas', 'Reviews', 'Quote'],
    primaryCta: 'Request quote',
    eyebrow: 'Local service homepage concept',
    heroKicker: 'Proof and quote path first',
    fallbackHeadline: (businessName) => `${businessName} can turn service searches into quote requests`,
    fallbackSubheadline: (location) =>
      `A service-focused concept for ${location} customers comparing options and ready to request help.`,
    utility: ['Quote-first CTA', 'Service area clarity', 'Trust proof early'],
    offers: ['Emergency request', 'Estimate path', 'Service areas', 'Maintenance plan'],
    trustSignals: ['Service area coverage', 'Estimate request path', 'Review and proof section'],
    conversionSteps: ['See services', 'Confirm service area', 'Review proof', 'Request quote'],
    localSearches: ['service provider in {city}', 'emergency service {city}', 'request quote {city}'],
    contentIdeas: ['seasonal checklist posts', 'before-and-after proof', 'service area reminders'],
    metaAdsIdeas: ['quote request campaigns', 'maintenance reminder retargeting'],
    issueFallbacks: [
      {
        label: 'Quote path',
        current: 'Visitors do not get a simple quote or booking path early enough.',
        fix: 'Make Request Quote the dominant hero and sticky mobile action.',
        severity: 'high',
      },
      {
        label: 'Proof',
        current: 'Trust and service-area proof need to support the decision sooner.',
        fix: 'Show service cards, proof, and areas before the final CTA.',
        severity: 'medium',
      },
    ],
    layout: 'service',
  },
};

export function PremiumMockupSite({ mockup, prospect, audit }: PremiumMockupSiteProps) {
  const context = buildConceptContext(mockup, prospect, audit);

  return (
    <WebsiteConceptShell variant={context.variant}>
      <ConceptTopBar context={context} />
      <div className={styles.homepagePreview}>
        <WebsiteNav context={context} />
        <WebsiteHero context={context} />
        {renderVariantHomepage(context)}
        <WebsiteFooter context={context} />
      </div>
      <OnlinePresenceSnapshot context={context} />
      <WalkthroughCTA businessName={context.businessName} />
    </WebsiteConceptShell>
  );
}

function buildConceptContext(mockup: Mockup, prospect: PublicProspect | null, audit?: PublicAudit | null): ConceptContext {
  const parsedConcept = parseMockupConceptNotes(mockup.concept_notes);
  const rich = parsedConcept.rich;
  const businessName = prospect?.business_name || mockup.title.replace(/\s+mockup.*$/i, '') || mockup.title;
  const niche = prospect?.niche || 'local business';
  const location = [prospect?.city, prospect?.state].filter(Boolean).join(', ') || 'your area';
  const city = prospect?.city || 'your area';
  const variant = getMockupTemplateVariant(niche);
  const config = VARIANT_CONFIG[variant];
  const features = parseMockupFeatures(mockup.features_included);
  const offers = mergeItems(rich.menu_or_offer_items, config.offers, features, 6);
  const trustSignals = deriveTrustSignals(rich, audit, config);
  const issueFixes = deriveIssueFixes(rich, audit, config);
  const conversionSteps = deriveConversionSteps(rich.cta_strategy, config.conversionSteps);
  const localSearches = deriveLocalSearches(rich, config, city);
  const contentIdeas = mergeItems(cleanRichList(rich.content_strategy_angle), rich.homepage_sections, config.contentIdeas, 4);
  const metaAdsIdeas = mergeItems(cleanRichList(rich.meta_ads_angle), [], config.metaAdsIdeas, 3);
  const navItems = deriveNavItems(rich, config, offers);
  const visualDirection =
    rich.visual_direction ||
    rich.brand_style_notes ||
    rich.inspiration_notes ||
    parsedConcept.notes ||
    config.heroKicker;

  return {
    businessName,
    niche,
    location,
    city,
    variant,
    config,
    headline: mockup.hero_headline || config.fallbackHeadline(businessName),
    subheadline: mockup.hero_subheadline || audit?.conversion_opportunity || config.fallbackSubheadline(location),
    primaryCta: mockup.primary_cta || config.primaryCta,
    navItems,
    offers,
    trustSignals,
    issueFixes,
    conversionSteps,
    localSearches,
    contentIdeas,
    metaAdsIdeas,
    visualDirection,
    palette: mergeItems(rich.primary_colors, rich.secondary_colors, [], 5),
    rich,
    audit,
    conceptNotes: parsedConcept.notes,
    mockupUrl: buildPublicMockupUrl(mockup.slug),
  };
}

export function WebsiteConceptShell({
  variant,
  children,
}: {
  variant: MockupTemplateVariant;
  children: ReactNode;
}) {
  return (
    <main className={`${styles.shell} ${styles[variant]} ${styles[`layout_${VARIANT_CONFIG[variant].layout}`]}`}>
      {children}
    </main>
  );
}

export function ConceptTopBar({ context }: { context: ConceptContext }) {
  return (
    <section className={styles.conceptTopBar}>
      <div>
        <p>Website Concept Preview</p>
        <h1>{context.businessName}</h1>
      </div>
      <div className={styles.conceptMeta}>
        <span>{context.location}</span>
        <span>{context.niche}</span>
        <span>Prepared by Apex Marketing Group</span>
      </div>
      <div className={styles.conceptDisclaimer}>Visual concept, not final production website</div>
    </section>
  );
}

export function WebsiteNav({ context }: { context: ConceptContext }) {
  return (
    <header className={styles.websiteNav}>
      <a href="#top" className={styles.siteBrand}>
        <span>{businessInitials(context.businessName)}</span>
        {context.businessName}
      </a>
      <nav aria-label="Concept website navigation">
        {context.navItems.map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </nav>
      <a href="#walkthrough" className={styles.navCta}>
        {context.primaryCta}
      </a>
    </header>
  );
}

export function WebsiteHero({ context }: { context: ConceptContext }) {
  const Icon = context.config.icon;

  return (
    <section id="top" className={styles.websiteHero}>
      <div className={styles.heroCopy}>
        <p className={styles.kicker}>{context.config.eyebrow}</p>
        <h2>{context.headline}</h2>
        <p className={styles.heroText}>{context.subheadline}</p>
        <div className={styles.heroActions}>
          <a href="#primary-path" className={styles.primaryButton}>
            {context.primaryCta}
            <ArrowRight size={18} />
          </a>
          <a href="#snapshot" className={styles.secondaryButton}>
            See what this fixes
          </a>
        </div>
      </div>
      <div className={styles.heroEditorial}>
        <div className={styles.editorialCard}>
          <Icon size={42} />
          <span>{context.config.heroKicker}</span>
          <p>{context.visualDirection}</p>
        </div>
        <div className={styles.editorialStack}>
          {context.offers.slice(0, 3).map((offer) => (
            <span key={offer}>{offer}</span>
          ))}
        </div>
        {context.palette.length > 0 && (
          <div className={styles.paletteRail}>
            {context.palette.slice(0, 4).map((color) => (
              <span key={color}>{color}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function renderVariantHomepage(context: ConceptContext) {
  switch (context.variant) {
    case 'premium_dining':
      return (
        <>
          <ConversionStrip context={context} />
          <SignatureOfferSection context={context} title="Signature dishes and occasion paths" />
          <TrustStorySection context={context} mode="awards" />
          <GiftCardPrivateDiningSection context={context} />
          <LocalSearchSection context={context} />
        </>
      );
    case 'bar_grill':
      return (
        <>
          <EventOrHappyHourSection context={context} />
          <ConversionStrip context={context} />
          <FeaturedMenuSection context={context} title="Food, taps, and tonight's draw" />
          <SocialContentSection context={context} />
          <VisitPlannerSection context={context} />
        </>
      );
    case 'coffee_shop':
      return (
        <>
          <FeaturedMenuSection context={context} title="Featured drinks and daily comforts" />
          <ConversionStrip context={context} />
          <TrustStorySection context={context} mode="community" />
          <VisitPlannerSection context={context} />
          <SocialContentSection context={context} />
        </>
      );
    case 'nonprofit_cafe':
      return (
        <>
          <MissionImpactSection context={context} />
          <ConversionStrip context={context} />
          <FeaturedMenuSection context={context} title="Food, support, and community access" />
          <VisitPlannerSection context={context} />
          <SocialContentSection context={context} />
        </>
      );
    case 'food_truck':
      return (
        <>
          <VisitPlannerSection context={context} />
          <FeaturedMenuSection context={context} title="Menu highlights for the next stop" />
          <CateringBookingSection context={context} />
          <SocialContentSection context={context} />
          <LocalSearchSection context={context} />
        </>
      );
    case 'local_service':
      return (
        <>
          <SignatureOfferSection context={context} title="Services that route straight to a quote" />
          <TrustStorySection context={context} mode="proof" />
          <ConversionStrip context={context} />
          <LocalSearchSection context={context} />
          <CateringBookingSection context={context} serviceMode />
        </>
      );
    case 'restaurant':
    default:
      return (
        <>
          <FeaturedMenuSection context={context} title="Featured dishes and visit paths" />
          <SignatureOfferSection context={context} title="Find your order" />
          <VisitPlannerSection context={context} />
          <LocalSearchSection context={context} />
          <SocialContentSection context={context} />
        </>
      );
  }
}

export function ConversionStrip({ context }: { context: ConceptContext }) {
  return (
    <section id="primary-path" className={styles.conversionStrip}>
      <div>
        <p>Primary path</p>
        <h3>{context.primaryCta}</h3>
      </div>
      <div className={styles.pathSteps}>
        {context.conversionSteps.slice(0, 4).map((step, index) => (
          <span key={step}>
            <strong>{String(index + 1).padStart(2, '0')}</strong>
            {step}
          </span>
        ))}
      </div>
    </section>
  );
}

export function FeaturedMenuSection({ context, title }: { context: ConceptContext; title: string }) {
  return (
    <section id="menu" className={`${styles.siteSection} ${styles.featuredMenu}`}>
      <div className={styles.sectionLead}>
        <p>{context.variant === 'local_service' ? 'Service menu' : 'Homepage module'}</p>
        <h3>{title}</h3>
      </div>
      <div className={styles.menuBoard}>
        {context.offers.slice(0, 4).map((offer, index) => (
          <article key={offer}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h4>{offer}</h4>
            <p>{menuCardCopy(context, offer, index)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function SignatureOfferSection({ context, title }: { context: ConceptContext; title: string }) {
  return (
    <section id={context.variant === 'restaurant' ? undefined : 'menu'} className={`${styles.siteSection} ${styles.signatureSection}`}>
      <div className={styles.signatureCopy}>
        <p>Signature offer</p>
        <h3>{title}</h3>
        <p>{context.audit?.recommended_offer || context.rich.current_site_snapshot || context.config.heroKicker}</p>
      </div>
      <div className={styles.signatureList}>
        {context.offers.slice(0, 4).map((offer) => (
          <div key={offer}>
            <CheckCircle2 size={17} />
            <span>{offer}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VisitPlannerSection({ context }: { context: ConceptContext }) {
  return (
    <section id="visit" className={`${styles.siteSection} ${styles.visitPlanner}`}>
      <div className={styles.visitCard}>
        <Clock3 size={22} />
        <p>{context.variant === 'food_truck' ? 'Location planner' : 'Visit planner'}</p>
        <h3>{context.variant === 'food_truck' ? 'Where to find us next' : 'Best path to a visit'}</h3>
        <span>{context.location}</span>
      </div>
      <div className={styles.visitTimeline}>
        {context.config.utility.map((item, index) => (
          <div key={item}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function EventOrHappyHourSection({ context }: { context: ConceptContext }) {
  return (
    <section className={`${styles.siteSection} ${styles.eventSection}`}>
      <div>
        <p>This week</p>
        <h3>Happy hour, events, and a reason to visit now</h3>
        <a href="#walkthrough" className={styles.inlineCta}>
          Map the weekly rhythm
          <ArrowRight size={15} />
        </a>
      </div>
      <div className={styles.eventCards}>
        {['Happy hour', 'Live music', 'Game night'].map((item, index) => (
          <article key={item}>
            <CalendarDays size={18} />
            <span>{item}</span>
            <p>{context.contentIdeas[index] || context.config.contentIdeas[index]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function TrustStorySection({
  context,
  mode,
}: {
  context: ConceptContext;
  mode: 'awards' | 'community' | 'proof';
}) {
  const title = mode === 'awards' ? 'Trust, awards, and legacy' : mode === 'proof' ? 'Proof before the quote' : 'A story regulars recognize';

  return (
    <section id="story" className={`${styles.siteSection} ${styles.trustSection}`}>
      <div className={styles.storyPanel}>
        <ShieldCheck size={24} />
        <p>Trust story</p>
        <h3>{title}</h3>
        <span>{context.conceptNotes || context.rich.original_site_notes || context.audit?.audit_notes || context.visualDirection}</span>
      </div>
      <div className={styles.trustStrip}>
        {context.trustSignals.slice(0, 4).map((signal) => (
          <div key={signal}>
            <Star size={16} />
            {signal}
          </div>
        ))}
      </div>
    </section>
  );
}

export function MissionImpactSection({ context }: { context: ConceptContext }) {
  return (
    <section id="mission" className={`${styles.siteSection} ${styles.missionImpact}`}>
      <div>
        <p>Mission made visible</p>
        <h3>Eat here, support the work, or show up to help.</h3>
      </div>
      <div className={styles.impactChoices}>
        {['Dine', 'Donate', 'Volunteer'].map((item, index) => (
          <article key={item}>
            <HeartHandshake size={20} />
            <h4>{context.offers[index] || item}</h4>
            <p>{context.trustSignals[index] || context.config.trustSignals[index]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CateringBookingSection({
  context,
  serviceMode = false,
}: {
  context: ConceptContext;
  serviceMode?: boolean;
}) {
  return (
    <section className={`${styles.siteSection} ${styles.bookingBand}`}>
      <div>
        <p>{serviceMode ? 'Quote path' : `${context.businessName} booking path`}</p>
        <h3>{serviceMode ? 'Turn service-area searches into quote requests.' : 'Give catering and events a direct inquiry path.'}</h3>
      </div>
      <a href="#walkthrough" className={styles.primaryButton}>
        {serviceMode ? 'Request a quote' : 'Start an inquiry'}
        <ArrowRight size={18} />
      </a>
    </section>
  );
}

export function GiftCardPrivateDiningSection({ context }: { context: ConceptContext }) {
  return (
    <section className={`${styles.siteSection} ${styles.giftPrivate}`}>
      <article>
        <Gift size={22} />
        <h3>Gift cards</h3>
        <p>{context.metaAdsIdeas[0] || 'Seasonal gift-card campaigns get a premium landing point.'}</p>
      </article>
      <article>
        <Utensils size={22} />
        <h3>Private dining</h3>
        <p>{context.offers.find((item) => /private|event|room/i.test(item)) || 'A dedicated private dining path supports groups and events.'}</p>
      </article>
    </section>
  );
}

export function LocalSearchSection({ context }: { context: ConceptContext }) {
  return (
    <section className={`${styles.siteSection} ${styles.localSearch}`}>
      <div className={styles.sectionLead}>
        <p>Local search</p>
        <h3>{context.rich.local_seo_angle || `Searches this concept should capture near ${context.city}`}</h3>
      </div>
      <div className={styles.searchTerms}>
        {context.localSearches.slice(0, 4).map((term) => (
          <span key={term}>
            <Search size={14} />
            {term}
          </span>
        ))}
      </div>
    </section>
  );
}

export function SocialContentSection({ context }: { context: ConceptContext }) {
  return (
    <section id="content" className={`${styles.siteSection} ${styles.socialContent}`}>
      <div>
        <p>Content and Meta ads</p>
        <h3>{context.rich.content_strategy_angle || 'A homepage that gives weekly content somewhere useful to point.'}</h3>
      </div>
      <div className={styles.contentTiles}>
        {[...context.contentIdeas, ...context.metaAdsIdeas].slice(0, 4).map((idea) => (
          <article key={idea}>
            <Megaphone size={17} />
            <span>{idea}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function WebsiteFooter({ context }: { context: ConceptContext }) {
  return (
    <footer className={styles.websiteFooter}>
      <div>
        <strong>{context.businessName}</strong>
        <span>{context.location}</span>
      </div>
      <nav>
        {context.navItems.slice(0, 4).map((item) => (
          <a href={navHref(item)} key={item}>
            {item}
          </a>
        ))}
      </nav>
    </footer>
  );
}

export function OnlinePresenceSnapshot({ context }: { context: ConceptContext }) {
  const statuses = buildPresenceStatuses(context);

  return (
    <section id="snapshot" className={styles.snapshot}>
      <div className={styles.snapshotIntro}>
        <p>Online Presence Snapshot</p>
        <h2>What the current presence is asking this concept to solve.</h2>
        {context.rich.original_site_url && (
          <a href={context.rich.original_site_url} target="_blank" rel="noopener noreferrer">
            Original site reviewed
          </a>
        )}
      </div>
      <div className={styles.snapshotGrid}>
        {statuses.map((status) => (
          <WebsiteIssueCard key={status.label} status={status} />
        ))}
      </div>
      <RecommendedFixCard context={context} />
    </section>
  );
}

export function WebsiteIssueCard({ status }: { status: IssueFix }) {
  return (
    <article className={styles.issueCard} data-severity={status.severity}>
      <div>
        <span>{status.label}</span>
        <strong>{status.severity}</strong>
      </div>
      <p>Current: {status.current}</p>
      <p>Fix: {status.fix}</p>
    </article>
  );
}

export function RecommendedFixCard({ context }: { context: ConceptContext }) {
  return (
    <article className={styles.recommendedFix}>
      <Compass size={22} />
      <div>
        <p>Recommended next action</p>
        <h3>{context.audit?.recommended_offer || context.primaryCta}</h3>
        <span>{context.audit?.mockup_angle || context.visualDirection}</span>
      </div>
    </article>
  );
}

export function WalkthroughCTA({ businessName }: { businessName: string }) {
  return (
    <section id="walkthrough" className={styles.walkthrough}>
      <div>
        <p>Walkthrough ready</p>
        <h2>Want a quick walkthrough of this concept?</h2>
        <span>
          This is a visual concept created to show direction, not a final production website. We can
          review how it would work for {businessName} in a short call.
        </span>
      </div>
      <a href="mailto:nate@apexmarketing.ai?subject=Mockup Walkthrough Request" className={styles.primaryButton}>
        Schedule a walkthrough
        <ArrowRight size={18} />
      </a>
    </section>
  );
}

function buildPresenceStatuses(context: ConceptContext): IssueFix[] {
  const [firstFix, secondFix] = context.issueFixes;
  const onlineNotes = context.rich.online_presence_status || [];
  const currentSite = context.rich.current_site_snapshot || context.rich.original_site_notes || context.audit?.main_problem;

  const statuses: IssueFix[] = [
    firstFix || context.config.issueFallbacks[0],
    {
      label: 'Mobile conversion',
      current: onlineNotes[0] || currentSite || 'Mobile visitors need a shorter route to the main action.',
      fix: `Make "${context.primaryCta}" the clearest mobile path.`,
      severity: severityFromText(currentSite, 'high'),
    },
    {
      label: 'Local SEO',
      current: context.rich.local_seo_angle || `The site can better match how customers search around ${context.city}.`,
      fix: `Build page sections around terms like "${context.localSearches[0]}".`,
      severity: 'medium',
    },
    {
      label: 'Social and content',
      current: context.rich.content_strategy_angle || 'Social posts need a stronger website destination.',
      fix: context.contentIdeas[0] || 'Create weekly content modules that connect back to the homepage.',
      severity: 'medium',
    },
    {
      label: 'CTA clarity',
      current: secondFix?.current || 'The next step is not repeated with enough clarity.',
      fix: context.rich.cta_strategy || context.conversionSteps.join(' -> '),
      severity: secondFix?.severity || 'high',
    },
  ];

  return statuses.slice(0, 5);
}

function deriveIssueFixes(rich: RichMockupData, audit: PublicAudit | null | undefined, config: VariantConfig) {
  const issueTexts = mergeItems(rich.website_issue_examples, cleanSingleItem(audit?.main_problem), [], 4);
  const derived = issueTexts.map((issue, index) => issueToFix(issue, index));
  return [...derived, ...config.issueFallbacks].slice(0, 4);
}

function deriveTrustSignals(rich: RichMockupData, audit: PublicAudit | null | undefined, config: VariantConfig) {
  const notes = `${audit?.audit_notes || ''} ${audit?.recommended_offer || ''} ${audit?.mockup_angle || ''}`;
  const derived: string[] = [];

  if (/award|best|legacy|since|established|years/i.test(notes)) derived.push('Established local reputation');
  if (/owner|family|community|local/i.test(notes)) derived.push('Recognizable local story');
  if (/gift/i.test(notes)) derived.push('Gift card demand ready to surface');
  if (/private|cater|event|group|room/i.test(notes)) derived.push('Group occasions and events available');
  if (/loyal|reward|regular/i.test(notes)) derived.push('Repeat-customer loyalty path');
  if (/review|rating|proof|before|after/i.test(notes)) derived.push('Proof that belongs near the first CTA');

  return mergeItems(rich.trust_signals, derived, config.trustSignals, 5);
}

function issueToFix(issue: string, index: number): IssueFix {
  const current = issue.trim().replace(/\.$/, '');
  const lower = current.toLowerCase();
  if (lower.includes('reservation')) {
    return {
      label: 'Reservation path',
      current,
      fix: 'Make Reserve Your Table the dominant above-the-fold path.',
      severity: 'high',
    };
  }
  if (lower.includes('menu') || lower.includes('hours')) {
    return {
      label: 'Menu and hours',
      current,
      fix: 'Move menu and hours into the first decision section.',
      severity: 'high',
    };
  }
  if (lower.includes('donat') || lower.includes('volunteer')) {
    return {
      label: 'Support path',
      current,
      fix: 'Make donate and volunteer choices visible immediately.',
      severity: 'high',
    };
  }
  if (lower.includes('quote') || lower.includes('contact') || lower.includes('book')) {
    return {
      label: 'Inquiry path',
      current,
      fix: 'Replace the broken contact flow with one simple inquiry path.',
      severity: 'high',
    };
  }

  return {
    label: ['Website UX', 'CTA clarity', 'Content path', 'Trust proof'][index] || 'Website UX',
    current,
    fix: 'Turn this issue into a clear homepage module with one obvious next action.',
    severity: severityFromText(current, 'medium'),
  };
}

function deriveConversionSteps(ctaStrategy: string | null | undefined, fallback: string[]) {
  const steps = splitStrategyText(ctaStrategy);
  return steps.length >= 3 ? mergeItems(steps, fallback, [], 4) : fallback;
}

function deriveLocalSearches(rich: RichMockupData, config: VariantConfig, city: string) {
  const fromRich = cleanRichList(rich.local_seo_angle);
  const fallback = config.localSearches.map((item) => item.replace(/\{city\}/g, city));
  return mergeItems(fromRich, fallback, [], 4);
}

function deriveNavItems(rich: RichMockupData, config: VariantConfig, offers: string[]) {
  const nav = rich.proposed_site_nav?.length ? rich.proposed_site_nav : config.navItems;
  const fromOffers = offers.filter((item) => /gift|cater|event|reserve|donate|volunteer|book|order|service|location/i.test(item));
  return mergeItems(nav, fromOffers, [], 5);
}

function menuCardCopy(context: ConceptContext, offer: string, index: number) {
  if (context.rich.homepage_sections?.[index]) return context.rich.homepage_sections[index];
  if (/gift/i.test(offer)) return 'A visible seasonal path that supports easy gifting.';
  if (/private|cater|event/i.test(offer)) return 'A direct inquiry module for group occasions and higher-value bookings.';
  if (/happy|music|waitlist/i.test(offer)) return 'A timely reason for guests to choose this week instead of later.';
  if (/quote|service|emergency|estimate/i.test(offer)) return 'A service card that moves visitors toward a quote request.';
  return 'A homepage-ready block that helps customers choose faster.';
}

function navHref(item: string) {
  if (/mission|story|award|review|result/i.test(item)) return '#story';
  if (/event|visit|location|area|happy/i.test(item)) return '#visit';
  if (/reserv|order|quote|contact|donate|volunteer|book/i.test(item)) return '#primary-path';
  if (/content|social|ads/i.test(item)) return '#content';
  return '#menu';
}

function severityFromText(value: string | null | undefined, fallback: IssueFix['severity']): IssueFix['severity'] {
  const lower = (value || '').toLowerCase();
  if (/broken|missing|buried|hard|unclear|slow|mobile|compete/.test(lower)) return 'high';
  if (/weak|could|better|opportunity/.test(lower)) return 'medium';
  return fallback;
}

function mergeItems(
  primary: string[] | undefined,
  secondary: string[] | undefined,
  tertiary: string[] | undefined,
  limit: number
) {
  const seen = new Set<string>();
  return [...(primary || []), ...(secondary || []), ...(tertiary || [])]
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function cleanSingleItem(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? [trimmed] : [];
}

function businessInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
