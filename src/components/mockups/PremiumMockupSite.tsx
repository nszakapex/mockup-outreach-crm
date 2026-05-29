'use client';

import type { ReactNode } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Coffee,
  HeartHandshake,
  MapPin,
  Megaphone,
  Music2,
  Navigation,
  Phone,
  Search,
  ShoppingBag,
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

type PhotoRole =
  | 'coffee'
  | 'pastry'
  | 'dish'
  | 'interior'
  | 'event'
  | 'privateDining'
  | 'catering'
  | 'mission'
  | 'truck'
  | 'service'
  | 'social';

type HomepageItem = {
  title: string;
  body: string;
  label?: string;
  photoRole: PhotoRole;
};

type IssueFix = {
  label: string;
  current: string;
  fix: string;
  severity: 'low' | 'medium' | 'high';
};

type VariantConfig = {
  navItems: string[];
  primaryCta: string;
  secondaryCta: string;
  eyebrow: string;
  fallbackHeadline: (businessName: string, city: string) => string;
  fallbackSubheadline: (businessName: string, location: string) => string;
  heroPhoto: PhotoRole;
  heroPhotoLabel: string;
  badges: string[];
  offers: HomepageItem[];
  storyTitle: (businessName: string) => string;
  storyBody: (context: SiteContext) => string;
  trustSignals: string[];
  conversionTitle: string;
  conversionBody: string;
  conversionSteps: string[];
  visitTitle: string;
  visitBody: string;
  contentTitle: string;
  contentIdeas: string[];
  localSearches: string[];
  issueFallbacks: IssueFix[];
  tone: 'coffee' | 'restaurant' | 'tavern' | 'luxury' | 'mission' | 'mobile' | 'service';
};

type SiteContext = {
  mockup: Mockup;
  businessName: string;
  niche: string;
  location: string;
  city: string;
  variant: MockupTemplateVariant;
  config: VariantConfig;
  rich: RichMockupData;
  audit?: PublicAudit | null;
  conceptNotes: string | null;
  headline: string;
  subheadline: string;
  primaryCta: string;
  navItems: string[];
  badges: string[];
  offers: HomepageItem[];
  trustSignals: string[];
  conversionSteps: string[];
  contentIdeas: string[];
  metaIdeas: string[];
  localSearches: string[];
  issueFixes: IssueFix[];
  visualDirection: string;
  mockupUrl: string;
};

export const MOCKUP_VISUAL_RULES = [
  'Website concept starts with a real business-site header and hero.',
  'Audit content is secondary and never replaces homepage content.',
  'Every page has photo-style placeholders that read as intentional image slots.',
  'Variant differences include section composition, not just color.',
  'Mobile must have no horizontal overflow at 320, 375, 414, and 768 pixels.',
] as const;

const VARIANT_CONFIG: Record<MockupTemplateVariant, VariantConfig> = {
  coffee_shop: {
    navItems: ['Menu', 'Order', 'Visit', 'Community', 'Loyalty'],
    primaryCta: 'See the menu',
    secondaryCta: 'Plan your visit',
    eyebrow: 'Neighborhood coffee homepage concept',
    fallbackHeadline: (businessName, city) => `${city}'s everyday coffee stop, made warmer for ${businessName}`,
    fallbackSubheadline: (_businessName, location) =>
      `A menu-first cafe homepage for ${location} guests looking for espresso, seasonal drinks, pastries, hours, and the fastest way to visit.`,
    heroPhoto: 'coffee',
    heroPhotoLabel: 'Coffee and pastry photo direction',
    badges: ['Espresso', 'Seasonal drinks', 'Pastries', 'Loyalty', 'Local cafe'],
    offers: [
      {
        title: 'Signature espresso drinks',
        body: 'A first-screen path to the drinks regulars already ask for.',
        label: 'Menu favorite',
        photoRole: 'coffee',
      },
      {
        title: 'Seasonal specialty lattes',
        body: 'A rotating feature block built for social launches and repeat visits.',
        label: 'Seasonal',
        photoRole: 'coffee',
      },
      {
        title: 'Baked goods and pastries',
        body: 'A visual pairing section that makes the coffee stop feel complete.',
        label: 'Pairing',
        photoRole: 'pastry',
      },
      {
        title: 'Loyalty rewards program',
        body: 'A simple signup prompt for people who already visit often.',
        label: 'Repeat visits',
        photoRole: 'social',
      },
    ],
    storyTitle: (businessName) => `${businessName} feels like a place before it feels like a menu.`,
    storyBody: () =>
      `Warm cafe details, featured drinks, hours, and a clear visit path give regulars and first-time guests a reason to settle in.`,
    trustSignals: ['Locally owned coffee stop', 'Seasonal drink rhythm', 'Community gathering place'],
    conversionTitle: 'Find the right cup before the counter.',
    conversionBody: 'The homepage becomes a small order planner: browse the menu, spot the seasonal drink, choose pickup or visit, then join loyalty.',
    conversionSteps: ['View menu', 'Choose a drink', 'Pick up or visit', 'Join loyalty'],
    visitTitle: 'Hours and location stay close to the craving.',
    visitBody: 'Coffee decisions happen fast. Address, hours, and the next action stay visible before visitors wander away.',
    contentTitle: 'Weekly drink launches get somewhere to land.',
    contentIdeas: ['seasonal drink reveal', 'barista pick', 'loyalty reminder', 'coffee and pastry pairing'],
    localSearches: ['coffee shop in {city}', 'best coffee {city}', 'espresso {city}', 'cafe near {city}'],
    issueFallbacks: [
      {
        label: 'Menu clarity',
        current: 'Menu, hours, and ordering are not bundled into one easy first screen.',
        fix: 'Lead with featured drinks, clear hours, and one menu CTA.',
        severity: 'high',
      },
      {
        label: 'Social path',
        current: 'Social content does not have a strong homepage destination.',
        fix: 'Turn seasonal drinks and community posts into homepage modules.',
        severity: 'medium',
      },
    ],
    tone: 'coffee',
  },
  restaurant: {
    navItems: ['Menu', 'Order', 'Reserve', 'Visit', 'Catering'],
    primaryCta: 'Plan your visit',
    secondaryCta: 'View menu',
    eyebrow: 'Restaurant homepage concept',
    fallbackHeadline: (businessName, city) => `${businessName} can help ${city} choose dinner faster`,
    fallbackSubheadline: (_businessName, location) =>
      `A food-forward homepage for ${location} guests comparing menu favorites, visit details, reservations, and easy ordering.`,
    heroPhoto: 'dish',
    heroPhotoLabel: 'Signature dish photo direction',
    badges: ['Menu highlights', 'Order', 'Reserve', 'Visit', 'Catering'],
    offers: [
      {
        title: 'Featured dishes',
        body: 'A visual preview of the food guests notice first.',
        label: 'Menu highlight',
        photoRole: 'dish',
      },
      {
        title: 'Find your order',
        body: 'Occasion-based cards for lunch, dinner, family meals, and takeout.',
        label: 'Order planner',
        photoRole: 'dish',
      },
      {
        title: 'Best time to visit',
        body: 'A practical module that helps guests choose when to come in.',
        label: 'Visit planner',
        photoRole: 'interior',
      },
      {
        title: 'Catering',
        body: 'A visible inquiry path for higher-value local events.',
        label: 'Events',
        photoRole: 'catering',
      },
    ],
    storyTitle: (businessName) => `${businessName} brings food, timing, and next steps into one flow.`,
    storyBody: () =>
      `Guests can scan the food, understand the occasion, and find the order or visit action while the appetite is still fresh.`,
    trustSignals: ['Local dining destination', 'Menu built for repeat visits', 'Visit details easy to find'],
    conversionTitle: 'Choose the meal by occasion.',
    conversionBody: 'Instead of making guests hunt through pages, the homepage routes them by appetite, timing, and next step.',
    conversionSteps: ['See menu', 'Choose occasion', 'Plan visit', 'Order or reserve'],
    visitTitle: 'Make the practical details impossible to miss.',
    visitBody: 'Address, hours, parking hints, and action buttons are treated like conversion content, not footer leftovers.',
    contentTitle: 'Food content leads back to a useful page.',
    contentIdeas: ['weekly dish feature', 'chef note', 'catering reminder', 'date-night post'],
    localSearches: ['restaurant in {city}', 'best lunch {city}', 'dinner near {city}', 'catering {city}'],
    issueFallbacks: [
      {
        label: 'Menu path',
        current: 'Menu highlights and primary actions are not clear enough on mobile.',
        fix: 'Use food-forward cards with order, reserve, and visit CTAs.',
        severity: 'high',
      },
    ],
    tone: 'restaurant',
  },
  bar_grill: {
    navItems: ['Menu', 'Happy Hour', 'Events', 'Order', 'Visit'],
    primaryCta: 'See tonight',
    secondaryCta: 'View menu',
    eyebrow: 'Bar and grill homepage concept',
    fallbackHeadline: (businessName, city) => `${businessName} gives ${city} a reason to come in tonight`,
    fallbackSubheadline: (_businessName, location) =>
      `An event-forward homepage for ${location} guests choosing food, drinks, happy hour, music, and a table now.`,
    heroPhoto: 'event',
    heroPhotoLabel: 'Happy hour and event photo direction',
    badges: ['Happy hour', 'Live music', 'Patio', 'Order', 'Events'],
    offers: [
      {
        title: 'Happy hour this week',
        body: 'A timely reason to visit now instead of later.',
        label: 'Tonight',
        photoRole: 'event',
      },
      {
        title: 'Live music and events',
        body: 'A calendar-style block that makes the room feel active.',
        label: 'Events',
        photoRole: 'event',
      },
      {
        title: 'Featured food and drinks',
        body: 'Menu previews built for quick decisions and group plans.',
        label: 'Menu',
        photoRole: 'dish',
      },
      {
        title: 'Order or waitlist',
        body: 'A practical path for guests who already know they are coming.',
        label: 'Action',
        photoRole: 'interior',
      },
    ],
    storyTitle: (businessName) => `${businessName} feels alive before the first scroll.`,
    storyBody: () =>
      `The homepage opens with what is happening, what to order, and why tonight is worth the trip.`,
    trustSignals: ['Live events and atmosphere', 'Regulars and group nights', 'Menu built for sharing'],
    conversionTitle: 'Tonight-first guest path.',
    conversionBody: 'Happy hour, events, food, and visit details work together so the homepage answers "why now?"',
    conversionSteps: ['See happy hour', 'View events', 'Choose food or drinks', 'Visit tonight'],
    visitTitle: 'Make the night easy to plan.',
    visitBody: 'The visit module combines timing, location, and event cues so guests can decide without checking multiple channels.',
    contentTitle: 'Events and specials become weekly campaigns.',
    contentIdeas: ['happy hour reminder', 'tap list post', 'live music reel', 'game-day promo'],
    localSearches: ['happy hour {city}', 'bar and grill {city}', 'live music {city}', 'patio drinks {city}'],
    issueFallbacks: [
      {
        label: 'Tonight signal',
        current: 'Guests do not immediately see what is happening tonight.',
        fix: 'Lead with happy hour, events, and a visit-now path.',
        severity: 'high',
      },
    ],
    tone: 'tavern',
  },
  premium_dining: {
    navItems: ['Menu', 'Reservations', 'Private Dining', 'Gift Cards', 'Awards'],
    primaryCta: 'Reserve your table',
    secondaryCta: 'View menu',
    eyebrow: 'Premium dining homepage concept',
    fallbackHeadline: (businessName, city) => `${businessName} can make ${city} dinner feel special sooner`,
    fallbackSubheadline: (_businessName, location) =>
      `A reservation-first homepage for ${location} guests planning date night, private dining, gift cards, and special occasions.`,
    heroPhoto: 'privateDining',
    heroPhotoLabel: 'Dining room atmosphere photo direction',
    badges: ['Reservations', 'Signature dishes', 'Gift cards', 'Private dining', 'Awards'],
    offers: [
      {
        title: 'Signature dishes',
        body: 'A refined food preview for high-intent guests.',
        label: 'Dining',
        photoRole: 'dish',
      },
      {
        title: 'Reservations',
        body: 'A dominant booking path repeated at natural decision points.',
        label: 'Book',
        photoRole: 'interior',
      },
      {
        title: 'Gift cards',
        body: 'A seasonal revenue path surfaced before the footer.',
        label: 'Gift',
        photoRole: 'privateDining',
      },
      {
        title: 'Private dining',
        body: 'A group inquiry module for events and higher-value bookings.',
        label: 'Groups',
        photoRole: 'privateDining',
      },
    ],
    storyTitle: (businessName) => `${businessName} leads with occasion, not navigation clutter.`,
    storyBody: () =>
      `Atmosphere, trust, giftable moments, and a clear reservation path make the first impression feel ready for a special night out.`,
    trustSignals: ['Special-occasion dining', 'Private dining available', 'Gift cards ready'],
    conversionTitle: 'Reservation-first path.',
    conversionBody: 'Guests see the atmosphere, understand the occasion, and get one obvious booking action before the page branches.',
    conversionSteps: ['Explore menu', 'Choose occasion', 'Review private dining', 'Reserve table'],
    visitTitle: 'Private dining and gift cards get real space.',
    visitBody: 'High-value secondary actions are treated like homepage moments, not buried utility links.',
    contentTitle: 'Date-night content can point to a stronger landing page.',
    contentIdeas: ['date-night menu story', 'chef feature', 'gift-card campaign', 'private dining post'],
    localSearches: ['fine dining {city}', 'best steakhouse {city}', 'private dining {city}', 'date night {city}'],
    issueFallbacks: [
      {
        label: 'Reservation path',
        current: 'Reservation intent competes with too many equal-weight actions.',
        fix: 'Make Reserve Your Table the dominant above-the-fold action.',
        severity: 'high',
      },
    ],
    tone: 'luxury',
  },
  nonprofit_cafe: {
    navItems: ['Mission', 'Menu', 'Donate', 'Volunteer', 'Visit'],
    primaryCta: 'Visit or support',
    secondaryCta: 'See the mission',
    eyebrow: 'Community cafe homepage concept',
    fallbackHeadline: (businessName, city) => `${businessName} can make ${city} part of the mission`,
    fallbackSubheadline: (_businessName, location) =>
      `A mission-first homepage for ${location} guests who need to understand the food, the community model, and how to help.`,
    heroPhoto: 'mission',
    heroPhotoLabel: 'Community impact photo direction',
    badges: ['Dine', 'Donate', 'Volunteer', 'Community', 'Visit'],
    offers: [
      {
        title: 'Dine',
        body: 'A warm path for guests who want to support by showing up.',
        label: 'Visit',
        photoRole: 'dish',
      },
      {
        title: 'Donate',
        body: 'A visible support path for people who believe in the mission.',
        label: 'Support',
        photoRole: 'mission',
      },
      {
        title: 'Volunteer',
        body: 'A simple participation module for community members.',
        label: 'Help',
        photoRole: 'mission',
      },
      {
        title: 'Community impact',
        body: 'A story section that explains why the model matters.',
        label: 'Impact',
        photoRole: 'social',
      },
    ],
    storyTitle: (businessName) => `${businessName} brings the mission into the first impression.`,
    storyBody: () =>
      `Food, purpose, donation, and volunteer paths sit together so people can understand the model and act on it quickly.`,
    trustSignals: ['Community-driven model', 'Volunteer participation', 'Local impact story'],
    conversionTitle: 'Dine, donate, or volunteer.',
    conversionBody: 'The homepage gives three equally clear forms of support while keeping visit details practical.',
    conversionSteps: ['Understand mission', 'See menu', 'Choose support path', 'Visit or donate'],
    visitTitle: 'Participation details belong near the top.',
    visitBody: 'Hours, location, donation, and volunteer paths are grouped so people can act on the moment they feel ready.',
    contentTitle: 'Impact stories become a repeatable content engine.',
    contentIdeas: ['volunteer story', 'community meal update', 'donation reminder', 'program spotlight'],
    localSearches: ['community cafe {city}', 'nonprofit cafe {city}', 'volunteer cafe {city}', 'donate food {city}'],
    issueFallbacks: [
      {
        label: 'Support path',
        current: 'Donation and volunteer paths are not obvious enough for new visitors.',
        fix: 'Place donate and volunteer CTAs beside the menu and mission story.',
        severity: 'high',
      },
    ],
    tone: 'mission',
  },
  food_truck: {
    navItems: ['Menu', 'Location', 'Catering', 'Events', 'Contact'],
    primaryCta: 'Find the truck',
    secondaryCta: 'Book catering',
    eyebrow: 'Mobile food homepage concept',
    fallbackHeadline: (businessName, city) => `${businessName} makes the next ${city} stop easy to find`,
    fallbackSubheadline: (_businessName, location) =>
      `A location-first homepage for ${location} customers who need the schedule, menu, catering, and event booking in seconds.`,
    heroPhoto: 'truck',
    heroPhotoLabel: 'Food truck location photo direction',
    badges: ['Weekly location', 'Menu', 'Catering', 'Events', 'Social updates'],
    offers: [
      {
        title: 'Weekly location',
        body: 'A schedule module that answers where to find the truck next.',
        label: 'Route',
        photoRole: 'truck',
      },
      {
        title: 'Catering',
        body: 'A direct inquiry path for offices, markets, and private events.',
        label: 'Book',
        photoRole: 'catering',
      },
      {
        title: 'Menu highlights',
        body: 'Quick food cards built for mobile decisions.',
        label: 'Menu',
        photoRole: 'dish',
      },
      {
        title: 'Event booking',
        body: 'A higher-value path with less friction than social DMs.',
        label: 'Events',
        photoRole: 'event',
      },
    ],
    storyTitle: (businessName) => `${businessName} puts location before decoration.`,
    storyBody: () =>
      `Location, menu, catering, and event booking stay close together for customers making a fast mobile decision.`,
    trustSignals: ['Weekly route updates', 'Event booking available', 'Mobile ordering energy'],
    conversionTitle: 'Location and catering first.',
    conversionBody: 'Mobile food customers need a fast answer, then a reason to book the truck for something bigger.',
    conversionSteps: ['Find location', 'Choose menu item', 'Check event schedule', 'Book catering'],
    visitTitle: 'Schedule, stops, and event booking stay together.',
    visitBody: 'The visit module acts more like a route board than a static footer.',
    contentTitle: 'Social posts can drive real location traffic.',
    contentIdeas: ['weekly route post', 'menu highlight reel', 'event-day reminder', 'catering push'],
    localSearches: ['food truck {city}', 'food truck catering {city}', 'mobile catering {city}', 'lunch truck {city}'],
    issueFallbacks: [
      {
        label: 'Location clarity',
        current: 'The next location or event path can be hard to find quickly.',
        fix: 'Make location, schedule, and catering CTAs the first visible actions.',
        severity: 'high',
      },
    ],
    tone: 'mobile',
  },
  local_service: {
    navItems: ['Services', 'Results', 'Areas', 'Reviews', 'Quote'],
    primaryCta: 'Request a quote',
    secondaryCta: 'View services',
    eyebrow: 'Local service homepage concept',
    fallbackHeadline: (businessName, city) => `${businessName} can turn ${city} searches into booked work`,
    fallbackSubheadline: (_businessName, location) =>
      `A proof-first service homepage for ${location} customers who need services, trust, areas served, and a fast quote path.`,
    heroPhoto: 'service',
    heroPhotoLabel: 'Before and after project photo direction',
    badges: ['Services', 'Proof', 'Reviews', 'Service area', 'Quote'],
    offers: [
      {
        title: 'Core services',
        body: 'Clear service cards mapped to customer intent.',
        label: 'Services',
        photoRole: 'service',
      },
      {
        title: 'Proof and results',
        body: 'Before and after evidence placed before the quote ask.',
        label: 'Proof',
        photoRole: 'service',
      },
      {
        title: 'Service areas',
        body: 'Local SEO sections that match how customers search.',
        label: 'Areas',
        photoRole: 'interior',
      },
      {
        title: 'Request quote',
        body: 'A short, visible path for high-intent visitors.',
        label: 'Action',
        photoRole: 'service',
      },
    ],
    storyTitle: (businessName) => `${businessName} proves trust before asking for the quote.`,
    storyBody: () =>
      `Services, proof, service area, and a quote action create a clear path for customers who are ready to book.`,
    trustSignals: ['Service area coverage', 'Estimate request path', 'Review and proof section'],
    conversionTitle: 'Proof first, quote second.',
    conversionBody: 'Visitors see what is offered, confirm the area, review proof, then request a quote without hunting.',
    conversionSteps: ['See services', 'Confirm area', 'Review proof', 'Request quote'],
    visitTitle: 'Service area SEO gets its own useful module.',
    visitBody: 'Location coverage becomes helpful content, not a tiny footer phrase.',
    contentTitle: 'Proof content becomes the growth engine.',
    contentIdeas: ['before and after post', 'seasonal checklist', 'review highlight', 'service area reminder'],
    localSearches: ['service provider {city}', 'request quote {city}', 'emergency service {city}', 'best service {city}'],
    issueFallbacks: [
      {
        label: 'Quote path',
        current: 'Visitors do not get a simple quote or booking path early enough.',
        fix: 'Make Request Quote the dominant hero and repeated mobile action.',
        severity: 'high',
      },
    ],
    tone: 'service',
  },
};

export function PremiumMockupSite({ mockup, prospect, audit }: PremiumMockupSiteProps) {
  const context = buildSiteContext(mockup, prospect, audit);

  return (
    <main className={`${styles.site} ${styles[`variant_${context.variant}`]} ${styles[`tone_${context.config.tone}`]}`}>
      <ConceptNotice context={context} />
      <WebsiteHeader context={context} />
      <WebsiteHero context={context} />
      <PrimaryConversion context={context} />
      <BrandStory context={context} />
      <ExperienceSection context={context} />
      <MenuOfferSection context={context} />
      <VisitSection context={context} />
      <GrowthSection context={context} />
      <OnlinePresenceSnapshot context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </main>
  );
}

function buildSiteContext(mockup: Mockup, prospect: PublicProspect | null, audit?: PublicAudit | null): SiteContext {
  const parsed = parseMockupConceptNotes(mockup.concept_notes);
  const rich = parsed.rich;
  const businessName = prospect?.business_name || mockup.title.replace(/\s+mockup.*$/i, '') || mockup.title;
  const niche = prospect?.niche || 'local business';
  const city = prospect?.city || 'your area';
  const location = [prospect?.city, prospect?.state].filter(Boolean).join(', ') || 'your area';
  const variant = getMockupTemplateVariant(niche);
  const config = VARIANT_CONFIG[variant];
  const headline = cleanText(mockup.hero_headline) || config.fallbackHeadline(businessName, city);
  const subheadline =
    cleanText(mockup.hero_subheadline) ||
    cleanText(audit?.conversion_opportunity) ||
    config.fallbackSubheadline(businessName, location);
  const primaryCta = cleanText(mockup.primary_cta) || config.primaryCta;
  const navItems = mergeText(rich.proposed_site_nav, config.navItems, [], 6);
  const richOffers = cleanRichList(rich.menu_or_offer_items);
  const offers = mergeOfferItems(richOffers, config.offers);
  const trustSignals = mergeText(rich.trust_signals, deriveTrustSignals(audit), config.trustSignals, 5);
  const conversionSteps = deriveConversionSteps(rich.cta_strategy, config.conversionSteps);
  const contentIdeas = mergeText(cleanRichList(rich.content_strategy_angle), rich.homepage_sections, config.contentIdeas, 5);
  const metaIdeas = mergeText(cleanRichList(rich.meta_ads_angle), [], [], 3);
  const localSearches = deriveLocalSearches(rich, config, city);
  const issueFixes = deriveIssueFixes(rich, audit, config);
  const visualDirection =
    cleanText(rich.visual_direction) ||
    cleanText(rich.brand_style_notes) ||
    cleanText(rich.inspiration_notes) ||
    cleanText(parsed.notes) ||
    config.heroPhotoLabel;

  return {
    mockup,
    businessName,
    niche,
    location,
    city,
    variant,
    config,
    rich,
    audit,
    conceptNotes: parsed.notes,
    headline,
    subheadline,
    primaryCta,
    navItems,
    badges: mergeText(config.badges, offers.map((offer) => offer.title), [], 5),
    offers,
    trustSignals,
    conversionSteps,
    contentIdeas,
    metaIdeas,
    localSearches,
    issueFixes,
    visualDirection,
    mockupUrl: buildPublicMockupUrl(mockup.slug),
  };
}

function ConceptNotice({ context }: { context: SiteContext }) {
  return (
    <div className={styles.conceptNotice}>
      <span>Website concept preview</span>
      <span>{context.businessName}</span>
      <span>{context.location}</span>
      <span>Prepared by Apex Marketing Group</span>
      <span>Visual concept, not final production website</span>
    </div>
  );
}

function WebsiteHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.header}>
      <a className={styles.brand} href="#home" aria-label={`${context.businessName} concept homepage`}>
        <span className={styles.logoMark}>{businessInitials(context.businessName)}</span>
        <span>
          <strong>{context.businessName}</strong>
          <small>{context.location}</small>
        </span>
      </a>
      <nav className={styles.nav} aria-label="Concept website navigation">
        {context.navItems.map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </nav>
      <a className={styles.headerCta} href="#primary-action">
        {context.primaryCta}
      </a>
    </header>
  );
}

function WebsiteHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.hero}>
      <div className={`${styles.heroImage} ${styles[`photo_${context.config.heroPhoto}`]}`}>
        <span>{context.config.heroPhotoLabel}</span>
      </div>
      <div className={styles.heroVeil} />
      <div className={styles.heroContent}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{context.config.eyebrow}</p>
          <h1>{context.headline}</h1>
          <p className={styles.heroLead}>{context.subheadline}</p>
          <div className={styles.heroBadges}>
            {context.badges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
          <div className={styles.heroActions}>
            <a className={styles.primaryButton} href="#primary-action">
              {context.primaryCta}
              <ArrowRight size={17} />
            </a>
            <a className={styles.secondaryButton} href="#visit">
              {context.config.secondaryCta}
            </a>
          </div>
          <p className={styles.addressLine}>
            <MapPin size={17} />
            {context.location}
          </p>
        </div>
        <aside className={styles.statusCard}>
          <IconByVariant variant={context.variant} />
          <div>
            <strong>{statusTitle(context)}</strong>
            <span>{statusBody(context)}</span>
            <small>{statusDetail(context)}</small>
          </div>
        </aside>
      </div>
    </section>
  );
}

function PrimaryConversion({ context }: { context: SiteContext }) {
  return (
    <section id="primary-action" className={styles.conversion}>
      <div className={styles.sectionIntro}>
        <p>{primaryPathLabel(context)}</p>
        <h2>{context.config.conversionTitle}</h2>
        <span>{context.config.conversionBody}</span>
      </div>
      <div className={styles.conversionSteps}>
        {context.conversionSteps.slice(0, 4).map((step, index) => (
          <article key={step}>
            <small>{String(index + 1).padStart(2, '0')}</small>
            <strong>{step}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function BrandStory({ context }: { context: SiteContext }) {
  return (
    <section className={styles.story}>
      <div className={styles.storyCopy}>
        <p>{storyLabel(context)}</p>
        <h2>{context.config.storyTitle(context.businessName)}</h2>
        <span>{siteStoryBody(context)}</span>
      </div>
      <div className={styles.trustCards}>
        {context.trustSignals.slice(0, 3).map((signal, index) => (
          <article key={signal}>
            <Star size={16} />
            <small>{['Proof', 'Local signal', 'Conversion cue'][index] || 'Trust'}</small>
            <strong>{signal}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function ExperienceSection({ context }: { context: SiteContext }) {
  const cards = context.offers.slice(0, 3);

  return (
    <section className={styles.experiences}>
      <div className={styles.sectionIntro}>
        <p>{experienceEyebrow(context)}</p>
        <h2>{experienceTitle(context)}</h2>
      </div>
      <div className={styles.experienceGrid}>
        {cards.map((item) => (
          <PhotoCard key={item.title} item={item} />
        ))}
      </div>
    </section>
  );
}

function MenuOfferSection({ context }: { context: SiteContext }) {
  return (
    <section id="menu" className={styles.menuSection}>
      <div className={styles.menuLead}>
        <p>{context.variant === 'local_service' ? 'Service highlights' : 'Menu highlights'}</p>
        <h2>{menuTitle(context)}</h2>
        <span>{menuLeadBody(context)}</span>
      </div>
      <div className={styles.menuGrid}>
        {context.offers.slice(0, 4).map((item) => (
          <article key={item.title} className={styles.menuCard}>
            <div className={`${styles.cardPhoto} ${styles[`photo_${item.photoRole}`]}`}>
              <span>{item.label || 'Featured'}</span>
            </div>
            <div>
              <small>{item.label || 'Featured'}</small>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function VisitSection({ context }: { context: SiteContext }) {
  return (
    <section id="visit" className={styles.visitSection}>
      <div className={styles.visitCopy}>
        <p>{context.variant === 'food_truck' ? 'Location schedule' : 'Plan your visit'}</p>
        <h2>{context.config.visitTitle}</h2>
        <span>{context.config.visitBody}</span>
        <div className={styles.visitActions}>
          <a className={styles.primaryButton} href="#walkthrough">
            {context.primaryCta}
            <ArrowRight size={17} />
          </a>
          <a className={styles.secondaryButton} href="#local-search">
            Why locals find it
          </a>
        </div>
      </div>
      <div className={styles.visitPanel}>
        <div>
          <MapPin size={20} />
          <strong>{context.location}</strong>
          <span>{visitHint(context)}</span>
        </div>
        <div>
          <CalendarDays size={20} />
          <strong>{bestTimeLabel(context)}</strong>
          <span>{bestTimeBody(context)}</span>
        </div>
        <div>
          <Phone size={20} />
          <strong>{contactLabel(context)}</strong>
          <span>Keep the next step visible on every screen size.</span>
        </div>
      </div>
    </section>
  );
}

function GrowthSection({ context }: { context: SiteContext }) {
  const ideas = mergeText(context.contentIdeas, context.metaIdeas, context.localSearches, 6);

  return (
    <section id="content" className={styles.growth}>
      <div className={styles.growthHeader}>
        <p>Content and local growth</p>
        <h2>{context.rich.content_strategy_angle || context.config.contentTitle}</h2>
      </div>
      <div className={styles.growthGrid}>
        {ideas.slice(0, 3).map((idea, index) => (
          <article key={idea}>
            {index === 0 ? <Megaphone size={18} /> : index === 1 ? <Search size={18} /> : <ShoppingBag size={18} />}
            <strong>{idea}</strong>
            <span>{growthBody(context, idea, index)}</span>
          </article>
        ))}
      </div>
      <div id="local-search" className={styles.searchStrip}>
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

function OnlinePresenceSnapshot({ context }: { context: SiteContext }) {
  const statuses = buildPresenceStatuses(context);

  return (
    <section className={styles.snapshot}>
      <div className={styles.snapshotHeader}>
        <p>Online presence snapshot</p>
        <h2>What this homepage direction fixes.</h2>
        {context.rich.original_site_url && (
          <a href={context.rich.original_site_url} target="_blank" rel="noopener noreferrer">
            Original site reviewed
          </a>
        )}
      </div>
      <div className={styles.snapshotGrid}>
        {statuses.map((status) => (
          <article key={status.label} data-severity={status.severity}>
            <small>{status.severity}</small>
            <h3>{status.label}</h3>
            <p>Current: {status.current}</p>
            <p>Fix: {status.fix}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FinalWalkthrough({ context }: { context: SiteContext }) {
  return (
    <section id="walkthrough" className={styles.walkthrough}>
      <div>
        <p>Walkthrough ready</p>
        <h2>Want a quick walkthrough of this concept?</h2>
        <span>
          This is a visual concept created to show direction, not a final production website. The next
          step would be reviewing how this homepage path could work for {context.businessName}.
        </span>
      </div>
      <a className={styles.primaryButton} href="mailto:nate@apexmarketing.ai?subject=Mockup Walkthrough Request">
        Schedule a walkthrough
        <ArrowRight size={17} />
      </a>
    </section>
  );
}

function WebsiteFooter({ context }: { context: SiteContext }) {
  return (
    <footer className={styles.footer}>
      <div>
        <strong>{context.businessName}</strong>
        <span>{context.location}</span>
      </div>
      <nav aria-label="Concept footer navigation">
        {context.navItems.slice(0, 5).map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </nav>
      <small>Visual concept by Apex Marketing Group</small>
    </footer>
  );
}

function PhotoCard({ item }: { item: HomepageItem }) {
  return (
    <article className={styles.photoCard}>
      <div className={`${styles.cardPhoto} ${styles[`photo_${item.photoRole}`]}`}>
        <span>{photoLabel(item.photoRole)}</span>
      </div>
      <div>
        <small>{item.label || 'Featured'}</small>
        <h3>{item.title}</h3>
        <p>{item.body}</p>
      </div>
    </article>
  );
}

function mergeOfferItems(titles: string[], fallback: HomepageItem[]) {
  if (titles.length === 0) return fallback;
  const roles = fallback.map((item) => item.photoRole);
  const labels = fallback.map((item) => item.label);

  return titles.slice(0, 6).map((title, index) => ({
    title,
    body: offerBody(title, fallback[index]?.body),
    label: labels[index] || 'Featured',
    photoRole: roles[index] || fallback[index % fallback.length]?.photoRole || 'dish',
  }));
}

function offerBody(title: string, fallback?: string) {
  const lower = title.toLowerCase();
  if (/espresso|latte|coffee|cold brew|drink/.test(lower)) {
    return 'A visual menu card that makes the first order feel obvious.';
  }
  if (/pastr|baked|breakfast|sandwich|salad|wrap/.test(lower)) {
    return 'A food-forward card for quick breakfast and lunch decisions.';
  }
  if (/cater|event|board room|private|rental/.test(lower)) {
    return 'A dedicated inquiry path for higher-value bookings and local events.';
  }
  if (/happy|music|special|weekly/.test(lower)) {
    return 'A timely homepage module that gives visitors a reason to come in this week.';
  }
  if (/gift|loyal|reward/.test(lower)) {
    return 'A repeat-visit and seasonal purchase path that belongs before the footer.';
  }
  if (/service|quote|repair|estimate/.test(lower)) {
    return 'A service card that routes high-intent visitors toward a quote request.';
  }
  return fallback || 'A homepage-ready feature that helps visitors choose faster.';
}

function deriveTrustSignals(audit?: PublicAudit | null) {
  const notes = `${audit?.audit_notes || ''} ${audit?.recommended_offer || ''} ${audit?.mockup_angle || ''}`;
  const signals: string[] = [];
  if (/4\.\d|rating|review|opentable|google/i.test(notes)) signals.push('Strong public review signal');
  if (/since|years|established|long-running|local/i.test(notes)) signals.push('Established local presence');
  if (/instagram|facebook|followers|social/i.test(notes)) signals.push('Active social proof to surface');
  if (/cater|private|event|board room|rental/i.test(notes)) signals.push('Event and group revenue path');
  if (/photo|photography|gallery|visual/i.test(notes)) signals.push('Photography leads the experience');
  return signals;
}

function deriveConversionSteps(ctaStrategy: string | null | undefined, fallback: string[]) {
  const steps = splitStrategyText(ctaStrategy).filter(isUsefulText);
  return steps.length >= 3 ? mergeText(steps, fallback, [], 4) : fallback;
}

function deriveLocalSearches(rich: RichMockupData, config: VariantConfig, city: string) {
  const fromRich = cleanRichList(rich.local_seo_angle).filter(isUsefulText);
  const fallback = config.localSearches.map((term) => term.replace(/\{city\}/g, city));
  return mergeText(fromRich, fallback, [], 4);
}

function deriveIssueFixes(rich: RichMockupData, audit: PublicAudit | null | undefined, config: VariantConfig) {
  const issues = mergeText(rich.website_issue_examples, cleanText(audit?.main_problem) ? [audit?.main_problem || ''] : [], [], 4);
  const derived = issues.map((issue, index) => issueToFix(issue, index));
  return mergeIssues(derived, config.issueFallbacks).slice(0, 5);
}

function buildPresenceStatuses(context: SiteContext) {
  const [first, second] = context.issueFixes;
  const currentSite = cleanText(context.rich.current_site_snapshot) || cleanText(context.audit?.main_problem);

  return [
    first,
    {
      label: 'Mobile conversion',
      current: currentSite || 'Mobile visitors need a shorter route to the main action.',
      fix: `Make "${context.primaryCta}" visible in the hero, nav, and visit section.`,
      severity: severityFromText(currentSite, 'high'),
    },
    {
      label: 'Local SEO',
      current: context.rich.local_seo_angle || `The site can match more ${context.city} search intent.`,
      fix: `Build real homepage sections around terms like "${context.localSearches[0]}".`,
      severity: 'medium',
    },
    {
      label: 'Content path',
      current: context.rich.content_strategy_angle || 'Social content is missing a stronger website destination.',
      fix: context.contentIdeas[0] || 'Create weekly homepage modules that social posts can point to.',
      severity: 'medium',
    },
    {
      label: 'CTA clarity',
      current: second?.current || 'The next step is not repeated with enough clarity.',
      fix: context.rich.cta_strategy || context.conversionSteps.join(' -> '),
      severity: second?.severity || 'high',
    },
  ].filter(Boolean) as IssueFix[];
}

function issueToFix(issue: string, index: number): IssueFix {
  const current = issue.trim().replace(/\.$/, '');
  const lower = current.toLowerCase();
  if (/404|broken|blank|empty|missing/.test(lower)) {
    return {
      label: 'Broken path',
      current,
      fix: 'Replace the dead end with a working homepage section and clear action.',
      severity: 'high',
    };
  }
  if (/menu|static image|jpg|not indexable/.test(lower)) {
    return {
      label: 'Menu visibility',
      current,
      fix: 'Turn menu content into readable cards that search engines and mobile visitors can use.',
      severity: 'high',
    };
  }
  if (/hour|location|map|contact/.test(lower)) {
    return {
      label: 'Visit details',
      current,
      fix: 'Keep hours, address, and contact paths in the homepage visit module.',
      severity: 'high',
    };
  }
  if (/social|instagram|facebook|photo/.test(lower)) {
    return {
      label: 'Social proof',
      current,
      fix: 'Make social and photo content part of the homepage story instead of a disconnected channel.',
      severity: 'medium',
    };
  }
  return {
    label: ['Website UX', 'CTA clarity', 'Content path', 'Trust proof'][index] || 'Website UX',
    current,
    fix: 'Turn the issue into a real homepage module with one obvious next action.',
    severity: severityFromText(current, 'medium'),
  };
}

function mergeText(primary?: string[], secondary?: string[], tertiary?: string[], limit = 5) {
  const seen = new Set<string>();
  return [...(primary || []), ...(secondary || []), ...(tertiary || [])]
    .map((item) => cleanText(item))
    .filter((item): item is string => Boolean(item && isUsefulText(item)))
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

function mergeIssues(primary: IssueFix[], secondary: IssueFix[]) {
  const seen = new Set<string>();
  return [...primary, ...secondary].filter((item) => {
    const key = item.label.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isUsefulText(value: string) {
  return value.trim().length > 0 && !/\[object Object\]/i.test(value);
}

function cleanText(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed || /\[object Object\]/i.test(trimmed)) return null;
  return trimmed;
}

function statusTitle(context: SiteContext) {
  if (context.variant === 'food_truck') return 'Route-first homepage';
  if (context.variant === 'local_service') return 'Quote path visible';
  if (context.variant === 'premium_dining') return 'Reservation path ready';
  if (context.variant === 'bar_grill') return "Tonight's reason visible";
  if (context.variant === 'nonprofit_cafe') return 'Mission and visit path';
  return 'Menu and hours up front';
}

function statusBody(context: SiteContext) {
  if (context.variant === 'food_truck') return 'Location, schedule, catering, and events stay together.';
  if (context.variant === 'local_service') return 'Services, proof, areas, and quote CTA stay connected.';
  if (context.variant === 'premium_dining') return 'Menu, occasion, and booking path stay above the fold.';
  if (context.variant === 'bar_grill') return 'Happy hour, events, and ordering are visible immediately.';
  if (context.variant === 'nonprofit_cafe') return 'Dine, donate, volunteer, and visit paths are clear.';
  return 'Featured items, visit details, and ordering are easy to find.';
}

function statusDetail(context: SiteContext) {
  if (context.variant === 'food_truck') return `Next stop and catering for ${context.city}`;
  if (context.variant === 'local_service') return `Service area: ${context.city} and nearby`;
  if (context.variant === 'premium_dining') return `Private dining, gifts, and reservations`;
  if (context.variant === 'bar_grill') return `Happy hour, events, and group nights`;
  if (context.variant === 'nonprofit_cafe') return `Visit, volunteer, or support the mission`;
  return `${context.city} menu, hours, and local favorites`;
}

function primaryPathLabel(context: SiteContext) {
  if (context.variant === 'food_truck') return 'Plan the stop';
  if (context.variant === 'local_service') return 'Book the work';
  if (context.variant === 'premium_dining') return 'Reserve the occasion';
  if (context.variant === 'bar_grill') return 'Plan tonight';
  if (context.variant === 'nonprofit_cafe') return 'Choose how to help';
  return 'Plan the visit';
}

function storyLabel(context: SiteContext) {
  if (context.variant === 'local_service') return 'Proof and promise';
  if (context.variant === 'nonprofit_cafe') return 'Mission and welcome';
  if (context.variant === 'food_truck') return 'Route and flavor';
  return 'Atmosphere and story';
}

function siteStoryBody(context: SiteContext) {
  const style = positiveVisualDirection(context.rich.brand_style_notes) || positiveVisualDirection(context.rich.visual_direction);
  const base = context.config.storyBody(context);
  if (!style) return base;
  return `${base} The visual direction leans into ${style.charAt(0).toLowerCase()}${style.slice(1)}`;
}

function positiveVisualDirection(value: string | null | undefined) {
  const clean = cleanText(value);
  if (!clean) return null;

  const friendly = clean
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence && !/\b(avoid|current|broken|generic|should|needs|not)\b/i.test(sentence))
    .slice(0, 2)
    .join(' ');

  return friendly || null;
}

function experienceEyebrow(context: SiteContext) {
  if (context.variant === 'local_service') return 'Service paths';
  if (context.variant === 'food_truck') return 'Route and booking';
  if (context.variant === 'nonprofit_cafe') return 'Ways to participate';
  return 'Featured experiences';
}

function experienceTitle(context: SiteContext) {
  if (context.variant === 'coffee_shop') return `A few reasons ${context.city} comes in for coffee.`;
  if (context.variant === 'premium_dining') return 'Occasions worth reserving for.';
  if (context.variant === 'bar_grill') return 'What makes tonight feel worth the trip.';
  if (context.variant === 'food_truck') return 'Find the stop, then book the truck.';
  if (context.variant === 'local_service') return 'Services organized around quote intent.';
  if (context.variant === 'nonprofit_cafe') return 'Eat, support, or show up to help.';
  return 'The homepage starts with what guests actually choose.';
}

function menuTitle(context: SiteContext) {
  if (context.variant === 'local_service') return 'Services presented like decisions, not a list.';
  if (context.variant === 'food_truck') return 'Menu highlights for the next stop.';
  if (context.variant === 'premium_dining') return 'Signature dishes and occasion paths.';
  if (context.variant === 'bar_grill') return 'Food, drinks, and weekly reasons to come in.';
  if (context.variant === 'coffee_shop') return 'Featured drinks, bites, and repeat-visit paths.';
  if (context.variant === 'nonprofit_cafe') return 'Food, support, and community access.';
  return 'Start with the signature choices guests notice first.';
}

function menuLeadBody(context: SiteContext) {
  const titles = context.offers
    .slice(0, 3)
    .map((offer) => offer.title)
    .join(', ');

  if (context.variant === 'local_service') {
    return `Core services like ${titles} are arranged around the quote decision instead of a long utility list.`;
  }
  if (context.variant === 'food_truck') {
    return `The menu preview pairs ${titles} with location and catering prompts for fast mobile visitors.`;
  }
  if (context.variant === 'nonprofit_cafe') {
    return `The page balances ${titles} so the food and the mission feel connected from the start.`;
  }
  return `The page leads with ${titles} so guests see real choices before they decide to order, reserve, or visit.`;
}

function visitHint(context: SiteContext) {
  if (context.variant === 'food_truck') return 'Show the next stop before the menu gets long.';
  if (context.variant === 'local_service') return 'Confirm service area before asking for the quote.';
  return 'Address, hours, and next step stay out of the footer maze.';
}

function bestTimeLabel(context: SiteContext) {
  if (context.variant === 'bar_grill') return 'Tonight or this weekend';
  if (context.variant === 'coffee_shop') return 'Morning, lunch, or afternoon';
  if (context.variant === 'premium_dining') return 'Date night or private dining';
  if (context.variant === 'food_truck') return 'Next stop or event';
  if (context.variant === 'local_service') return 'Book the first available slot';
  return 'Pick the visit window';
}

function bestTimeBody(context: SiteContext) {
  if (context.variant === 'bar_grill') return 'Give happy hour and events the same visibility as the menu.';
  if (context.variant === 'coffee_shop') return 'Help visitors choose the drink, the pickup, or the place to sit.';
  if (context.variant === 'premium_dining') return 'Route guests by occasion before they compare alternatives.';
  if (context.variant === 'food_truck') return 'Treat schedule updates like core homepage content.';
  if (context.variant === 'local_service') return 'Make proof and quote timing feel immediate.';
  return 'Make the practical details part of the decision.';
}

function contactLabel(context: SiteContext) {
  if (context.variant === 'local_service') return 'Quote request';
  if (context.variant === 'food_truck') return 'Catering inquiry';
  if (context.variant === 'nonprofit_cafe') return 'Support path';
  if (context.variant === 'premium_dining') return 'Reserve or inquire';
  return 'Order, reserve, or visit';
}

function growthBody(context: SiteContext, idea: string, index: number) {
  if (index === 0) return `Turn "${idea}" into a homepage destination instead of a one-off post.`;
  if (index === 1) return `Support local intent for ${context.city} with useful homepage content.`;
  return 'Give Meta ads and social posts a clear place to land.';
}

function navHref(item: string) {
  if (/menu|service/i.test(item)) return '#menu';
  if (/visit|location|hour|area|contact/i.test(item)) return '#visit';
  if (/event|happy|order|reserve|donate|volunteer|book|quote|cater/i.test(item)) return '#primary-action';
  if (/story|community|mission|review|award|result|loyal/i.test(item)) return '#content';
  return '#menu';
}

function severityFromText(value: string | null | undefined, fallback: IssueFix['severity']): IssueFix['severity'] {
  const lower = (value || '').toLowerCase();
  if (/404|broken|blank|empty|missing|hard|conflict|outdated|buried/.test(lower)) return 'high';
  if (/weak|could|generic|opportunity|off-site/.test(lower)) return 'medium';
  return fallback;
}

function photoLabel(role: PhotoRole) {
  const labels: Record<PhotoRole, string> = {
    coffee: 'Coffee and drink photo',
    pastry: 'Coffee and pastry photo',
    dish: 'Signature dish photo',
    interior: 'Interior atmosphere photo',
    event: 'Happy hour event photo',
    privateDining: 'Private dining photo',
    catering: 'Catering setup photo',
    mission: 'Community impact photo',
    truck: 'Location schedule photo',
    service: 'Project proof photo',
    social: 'Social content preview',
  };
  return labels[role];
}

function businessInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function IconByVariant({ variant }: { variant: MockupTemplateVariant }) {
  const icons: Record<MockupTemplateVariant, ReactNode> = {
    coffee_shop: <Coffee size={18} />,
    restaurant: <Utensils size={18} />,
    bar_grill: <Music2 size={18} />,
    premium_dining: <Sparkles size={18} />,
    nonprofit_cafe: <HeartHandshake size={18} />,
    food_truck: <Navigation size={18} />,
    local_service: <Wrench size={18} />,
  };
  return icons[variant];
}
