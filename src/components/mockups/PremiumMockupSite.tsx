'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Car,
  Coffee,
  Dumbbell,
  Hammer,
  HeartHandshake,
  House,
  MapPin,
  Megaphone,
  Music2,
  Navigation,
  PawPrint,
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
  type MockupMediaAsset,
  type MockupVisualProfile,
  type RichMockupData,
} from '@/lib/mockup-rich-data';
import type { Audit, Mockup, Prospect } from '@/lib/types';
import {
  buildPublicMockupUrl,
  getMockupTemplateSelection,
  isFoodMockupTemplate,
  isServiceMockupTemplate,
  type MockupLayoutSignature,
  type MockupTemplateVariant,
} from '@/lib/mockup-templates';
import {
  getMockupDesignFamilySelection,
  getMockupLayoutRendererName,
  getMockupLayoutSectionPlan,
  getUsableMockupMediaAssets,
  selectHeroMediaAsset,
  type MockupDesignFamily,
  type MockupLayoutRendererName,
} from '@/lib/mockup-v2';
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
  | 'social'
  | 'project'
  | 'treatment'
  | 'vehicle'
  | 'pet'
  | 'fitness'
  | 'office';

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
  designFamily: MockupDesignFamily;
  designFamilyLabel: string;
  designFamilyReason: string;
  designFamilyInferred: boolean;
  layoutSignature: MockupLayoutSignature;
  designStyleKey: string | null;
  photoStrategy: string | null;
  visualProfile: MockupVisualProfile | null;
  mediaAssets: MockupMediaAsset[];
  heroAsset: MockupMediaAsset | null;
  galleryAssets: MockupMediaAsset[];
  layoutRendererName: MockupLayoutRendererName;
  sectionPlan: string[];
  themeStyle: CSSProperties;
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
  templateReason: string;
};

export const MOCKUP_VISUAL_RULES = [
  'Website concept starts with a real business-site header and hero.',
  'Audit content is secondary and never replaces homepage content.',
  'Every page has photo-style media areas that read as intentional image slots.',
  'Variant differences include section composition, not just color.',
  'Mobile must have no horizontal overflow at 320, 375, 414, and 768 pixels.',
] as const;

const VARIANT_CONFIG: Record<MockupTemplateVariant, VariantConfig> = {
  home_service: {
    navItems: ['Services', 'Proof', 'Service Area', 'Reviews', 'Request Quote'],
    primaryCta: 'Request quote',
    secondaryCta: 'See services',
    eyebrow: 'Home service website concept',
    fallbackHeadline: (businessName, city) => `${businessName} can make ${city} service calls easier to start`,
    fallbackSubheadline: (_businessName, location) =>
      `A service-first homepage for ${location} customers who need fast service options, proof, service area clarity, and a quote or call path.`,
    heroPhoto: 'service',
    heroPhotoLabel: 'Service call and result proof direction',
    badges: ['Service requests', 'Local proof', 'Reviews', 'Service area', 'Quote path'],
    offers: [
      {
        title: 'Priority service requests',
        body: 'A direct path for urgent calls, same-day needs, and high-intent quote requests.',
        label: 'Request',
        photoRole: 'service',
      },
      {
        title: 'Core service categories',
        body: 'Service cards organized around what customers are trying to fix or schedule.',
        label: 'Services',
        photoRole: 'project',
      },
      {
        title: 'Before and after proof',
        body: 'Result photos and review snippets placed before the quote decision.',
        label: 'Proof',
        photoRole: 'project',
      },
      {
        title: 'Service area clarity',
        body: 'A practical local coverage section that confirms the customer is in range.',
        label: 'Areas',
        photoRole: 'service',
      },
    ],
    storyTitle: (businessName) => `${businessName} leads with the service path, not a generic brochure.`,
    storyBody: () =>
      `Services, proof, location coverage, and quote prompts are arranged around the way homeowners decide who to call.`,
    trustSignals: ['Local service coverage', 'Review proof near the CTA', 'Fast quote or call path'],
    conversionTitle: 'A fast route from problem to request.',
    conversionBody: 'Visitors can identify the service, see proof, confirm the service area, then request help without sorting through unrelated content.',
    conversionSteps: ['Choose service', 'Review proof', 'Confirm area', 'Request quote'],
    visitTitle: 'Service area and contact details support the quote.',
    visitBody: 'Coverage, availability, and contact options are treated like conversion content instead of footer details.',
    contentTitle: 'Service proof becomes repeatable local content.',
    contentIdeas: ['before and after result', 'seasonal service reminder', 'review highlight', 'service area post'],
    localSearches: ['home service {city}', 'same day service {city}', 'service quote {city}', 'local repair {city}'],
    issueFallbacks: [
      {
        label: 'Quote path',
        current: 'Visitors do not get a clear quote or call path early enough.',
        fix: 'Lead with services, proof, service area, and a repeated quote CTA.',
        severity: 'high',
      },
    ],
    tone: 'service',
  },
  contractor: {
    navItems: ['Projects', 'Services', 'Process', 'Reviews', 'Get Estimate'],
    primaryCta: 'Get estimate',
    secondaryCta: 'View projects',
    eyebrow: 'Contractor website concept',
    fallbackHeadline: (businessName, city) => `${businessName} can show ${city} project proof before the estimate ask`,
    fallbackSubheadline: (_businessName, location) =>
      `A project-proof contractor homepage for ${location} homeowners comparing scope, past work, reviews, service area, and estimate steps.`,
    heroPhoto: 'project',
    heroPhotoLabel: 'Project gallery and before-after direction',
    badges: ['Project proof', 'Estimate path', 'Scope cards', 'Reviews', 'Service area'],
    offers: [
      {
        title: 'Recent project gallery',
        body: 'A proof-first section for finished work, before-and-after moments, and scope examples.',
        label: 'Projects',
        photoRole: 'project',
      },
      {
        title: 'Services and scope',
        body: 'Cards that separate project types so homeowners can choose the right estimate path.',
        label: 'Services',
        photoRole: 'service',
      },
      {
        title: 'Estimate path',
        body: 'A short sequence that explains what happens after a homeowner reaches out.',
        label: 'Quote',
        photoRole: 'office',
      },
      {
        title: 'Reviews and trust',
        body: 'Local trust signals placed near the project proof instead of buried near the footer.',
        label: 'Proof',
        photoRole: 'project',
      },
    ],
    storyTitle: (businessName) => `${businessName} can let the work sell before the form appears.`,
    storyBody: () =>
      `The page opens with visible projects, clear service scope, estimate expectations, and review proof for homeowners making a larger decision.`,
    trustSignals: ['Project gallery before the form', 'Clear estimate process', 'Local homeowner proof'],
    conversionTitle: 'Project proof first, estimate second.',
    conversionBody: 'A contractor lead can see relevant work, understand scope, learn the process, and request an estimate from one focused path.',
    conversionSteps: ['See projects', 'Choose scope', 'Review process', 'Get estimate'],
    visitTitle: 'Service area and project fit stay visible.',
    visitBody: 'The concept confirms location coverage, explains estimate timing, and keeps project types easy to compare.',
    contentTitle: 'Project proof becomes the local growth engine.',
    contentIdeas: ['recent project story', 'before and after carousel', 'estimate process post', 'service area proof'],
    localSearches: ['contractor {city}', 'remodeling contractor {city}', 'get estimate {city}', 'project gallery {city}'],
    issueFallbacks: [
      {
        label: 'Project proof',
        current: 'Project examples are not strong enough before the estimate request.',
        fix: 'Move project gallery, scope cards, and reviews into the first decision path.',
        severity: 'high',
      },
    ],
    tone: 'service',
  },
  medical_aesthetics: {
    navItems: ['Treatments', 'Providers', 'What To Expect', 'Reviews', 'Book Consultation'],
    primaryCta: 'Book consultation',
    secondaryCta: 'View treatments',
    eyebrow: 'Medical aesthetics website concept',
    fallbackHeadline: (businessName, city) => `${businessName} can make ${city} consultations feel clearer and more trustworthy`,
    fallbackSubheadline: (_businessName, location) =>
      `A conservative consultation-first homepage for ${location} clients comparing treatments, provider trust, expectations, reviews, and booking steps.`,
    heroPhoto: 'treatment',
    heroPhotoLabel: 'Treatment room and provider trust direction',
    badges: ['Treatments', 'Provider trust', 'Consultation', 'Reviews', 'Booking'],
    offers: [
      {
        title: 'Treatment overview',
        body: 'Treatment cards explain options without unsupported claims or overpromising outcomes.',
        label: 'Treatments',
        photoRole: 'treatment',
      },
      {
        title: 'Consultation expectations',
        body: 'A calm section that explains how new clients start and what happens next.',
        label: 'Consult',
        photoRole: 'office',
      },
      {
        title: 'Provider trust',
        body: 'Team, training, and local credibility are surfaced before the booking CTA.',
        label: 'Trust',
        photoRole: 'treatment',
      },
      {
        title: 'Reviews and comfort cues',
        body: 'Testimonials and experience notes support confidence without making medical guarantees.',
        label: 'Proof',
        photoRole: 'office',
      },
    ],
    storyTitle: (businessName) => `${businessName} can build trust before asking for the consultation.`,
    storyBody: () =>
      `Treatments, provider credibility, what-to-expect content, and a booking CTA are arranged with careful, compliant language.`,
    trustSignals: ['Provider-first trust section', 'Clear consultation expectations', 'Review proof without unsupported claims'],
    conversionTitle: 'A clear consultation path.',
    conversionBody: 'Clients can review treatments, understand what to expect, see provider trust, and book a consultation with less uncertainty.',
    conversionSteps: ['Explore treatments', 'Meet provider', 'Know what to expect', 'Book consultation'],
    visitTitle: 'Booking details stay calm and clear.',
    visitBody: 'Location, consultation expectations, and contact options are presented as reassurance, not pressure.',
    contentTitle: 'Education content supports consultation intent.',
    contentIdeas: ['treatment education post', 'provider introduction', 'consultation FAQ', 'review highlight'],
    localSearches: ['med spa {city}', 'aesthetics {city}', 'facial treatment {city}', 'consultation {city}'],
    issueFallbacks: [
      {
        label: 'Consultation trust',
        current: 'Treatment interest is not supported by enough provider trust before booking.',
        fix: 'Lead with treatments, provider credibility, expectations, and a conservative booking CTA.',
        severity: 'high',
      },
    ],
    tone: 'luxury',
  },
  auto_service: {
    navItems: ['Services', 'Before/After', 'Packages', 'Reviews', 'Book Detail'],
    primaryCta: 'Book detail',
    secondaryCta: 'Compare packages',
    eyebrow: 'Auto service website concept',
    fallbackHeadline: (businessName, city) => `${businessName} can turn ${city} vehicle transformations into bookings`,
    fallbackSubheadline: (_businessName, location) =>
      `A transformation-first homepage for ${location} drivers comparing services, before-and-after proof, packages, reviews, and booking steps.`,
    heroPhoto: 'vehicle',
    heroPhotoLabel: 'Vehicle transformation photo direction',
    badges: ['Before/after', 'Packages', 'Booking', 'Reviews', 'Service area'],
    offers: [
      {
        title: 'Before and after results',
        body: 'Transformation proof gives visitors a reason to choose the service before comparing price.',
        label: 'Results',
        photoRole: 'vehicle',
      },
      {
        title: 'Packages and services',
        body: 'Package cards help drivers choose the right level of service without confusion.',
        label: 'Packages',
        photoRole: 'service',
      },
      {
        title: 'Detailing process',
        body: 'A simple process section explains drop-off, mobile service, timing, and care steps.',
        label: 'Process',
        photoRole: 'vehicle',
      },
      {
        title: 'Reviews and local proof',
        body: 'Trust signals sit beside the booking path so proof and action stay connected.',
        label: 'Reviews',
        photoRole: 'office',
      },
    ],
    storyTitle: (businessName) => `${businessName} can make the result obvious before the booking decision.`,
    storyBody: () =>
      `Before-and-after proof, package clarity, process expectations, and reviews work together for drivers choosing a detail or coating.`,
    trustSignals: ['Transformation proof', 'Package clarity', 'Local booking path'],
    conversionTitle: 'Show the result, then the package.',
    conversionBody: 'Visitors see transformations, compare services, understand the process, and book the detail from one focused path.',
    conversionSteps: ['See results', 'Compare packages', 'Review process', 'Book detail'],
    visitTitle: 'Booking and service area stay close to the packages.',
    visitBody: 'Location, availability, and booking cues are placed where drivers are already comparing services.',
    contentTitle: 'Transformation proof can feed every channel.',
    contentIdeas: ['before and after reel', 'package explainer', 'ceramic coating FAQ', 'review highlight'],
    localSearches: ['auto detailing {city}', 'ceramic coating {city}', 'mobile detail {city}', 'car wash {city}'],
    issueFallbacks: [
      {
        label: 'Package clarity',
        current: 'Service packages are not easy enough to compare before booking.',
        fix: 'Pair before-and-after proof with package cards and one booking CTA.',
        severity: 'high',
      },
    ],
    tone: 'mobile',
  },
  pet_service: {
    navItems: ['Services', 'Grooming', 'Reviews', 'Location', 'Book Appointment'],
    primaryCta: 'Book appointment',
    secondaryCta: 'View grooming services',
    eyebrow: 'Pet service website concept',
    fallbackHeadline: (businessName, city) => `${businessName} can make ${city} grooming appointments feel easy and trusted`,
    fallbackSubheadline: (_businessName, location) =>
      `A warm booking-first homepage for ${location} pet owners comparing grooming services, safety cues, happy-pet proof, location, and appointment steps.`,
    heroPhoto: 'pet',
    heroPhotoLabel: 'Happy pet grooming proof direction',
    badges: ['Grooming', 'Safety', 'Reviews', 'Location', 'Appointments'],
    offers: [
      {
        title: 'Grooming services',
        body: 'Service cards make baths, trims, add-ons, and appointment types easy to choose.',
        label: 'Grooming',
        photoRole: 'pet',
      },
      {
        title: 'Trust and safety',
        body: 'Experience, handling style, and pet comfort cues sit before the booking ask.',
        label: 'Safety',
        photoRole: 'office',
      },
      {
        title: 'Happy-pet proof',
        body: 'Before-and-after or finished-groom photos create confidence for new pet owners.',
        label: 'Proof',
        photoRole: 'pet',
      },
      {
        title: 'Location and contact',
        body: 'Hours, service area, and booking instructions stay simple and visible.',
        label: 'Book',
        photoRole: 'service',
      },
    ],
    storyTitle: (businessName) => `${businessName} can make grooming feel safe before asking for the appointment.`,
    storyBody: () =>
      `Grooming services, comfort cues, happy-pet proof, location details, and a booking CTA create a warmer decision path for pet owners.`,
    trustSignals: ['Comfort-focused grooming path', 'Happy-pet proof', 'Clear appointment CTA'],
    conversionTitle: 'A warmer path from service to appointment.',
    conversionBody: 'Pet owners can choose the grooming service, see safety and proof cues, confirm location, and book without a restaurant-style flow.',
    conversionSteps: ['Choose grooming service', 'Review safety cues', 'See proof', 'Book appointment'],
    visitTitle: 'Location, hours, and booking details stay together.',
    visitBody: 'The concept keeps practical appointment details close to the services pet owners are considering.',
    contentTitle: 'Finished grooms become trust-building content.',
    contentIdeas: ['happy-pet photo', 'grooming package spotlight', 'comfort and safety post', 'appointment reminder'],
    localSearches: ['pet grooming {city}', 'dog grooming {city}', 'mobile grooming {city}', 'pet groomer {city}'],
    issueFallbacks: [
      {
        label: 'Booking confidence',
        current: 'The appointment path does not show enough grooming proof and trust before the ask.',
        fix: 'Lead with grooming services, safety cues, happy-pet proof, and a booking CTA.',
        severity: 'high',
      },
    ],
    tone: 'mission',
  },
  fitness_studio: {
    navItems: ['Classes', 'Schedule', 'Coaches', 'Community', 'Start Trial'],
    primaryCta: 'Start trial',
    secondaryCta: 'View schedule',
    eyebrow: 'Fitness studio website concept',
    fallbackHeadline: (businessName, city) => `${businessName} can make ${city} feel ready to try the first class`,
    fallbackSubheadline: (_businessName, location) =>
      `A community-first studio homepage for ${location} members comparing classes, schedules, coaches, proof, and an intro offer.`,
    heroPhoto: 'fitness',
    heroPhotoLabel: 'Class atmosphere and community direction',
    badges: ['Classes', 'Schedule', 'Coaches', 'Community', 'Trial'],
    offers: [
      {
        title: 'Classes and programs',
        body: 'Program cards help new members understand the best first class or training path.',
        label: 'Classes',
        photoRole: 'fitness',
      },
      {
        title: 'Schedule and intro offer',
        body: 'The schedule is paired with a simple trial or booking CTA.',
        label: 'Schedule',
        photoRole: 'office',
      },
      {
        title: 'Coach trust',
        body: 'Trainer experience and member support cues appear before the trial decision.',
        label: 'Coaches',
        photoRole: 'fitness',
      },
      {
        title: 'Community proof',
        body: 'Member stories and atmosphere help the studio feel welcoming.',
        label: 'Community',
        photoRole: 'social',
      },
    ],
    storyTitle: (businessName) => `${businessName} can make the first class feel less intimidating.`,
    storyBody: () =>
      `Classes, coach trust, schedule clarity, community proof, and a trial CTA are organized around a new member's first decision.`,
    trustSignals: ['Coach-led program clarity', 'Community proof', 'Intro offer path'],
    conversionTitle: 'Class fit before trial sign-up.',
    conversionBody: 'Visitors can understand the programs, see the schedule, trust the coaches, and start a trial without guessing.',
    conversionSteps: ['Choose class', 'Check schedule', 'Meet coaches', 'Start trial'],
    visitTitle: 'Schedule and studio details support the first visit.',
    visitBody: 'Location, intro offer, and schedule cues stay close to the classes people are evaluating.',
    contentTitle: 'Community content becomes a trial path.',
    contentIdeas: ['class highlight', 'coach tip', 'member story', 'trial offer reminder'],
    localSearches: ['fitness studio {city}', 'personal training {city}', 'yoga studio {city}', 'pilates {city}'],
    issueFallbacks: [
      {
        label: 'Trial path',
        current: 'Classes and schedule are not connected to a clear first-trial CTA.',
        fix: 'Pair class cards, schedule cues, coach trust, and a Start Trial action.',
        severity: 'high',
      },
    ],
    tone: 'service',
  },
  professional_service: {
    navItems: ['Services', 'About', 'Proof', 'Process', 'Contact'],
    primaryCta: 'Request consultation',
    secondaryCta: 'View services',
    eyebrow: 'Professional service website concept',
    fallbackHeadline: (businessName, city) => `${businessName} can make ${city} expertise easier to understand`,
    fallbackSubheadline: (_businessName, location) =>
      `An expertise-first homepage for ${location} clients comparing services, credentials, proof, process, and a consultation path.`,
    heroPhoto: 'office',
    heroPhotoLabel: 'Professional trust and consultation direction',
    badges: ['Services', 'Expertise', 'Proof', 'Process', 'Consultation'],
    offers: [
      {
        title: 'Service clarity',
        body: 'Service cards explain who each offer is for and when to inquire.',
        label: 'Services',
        photoRole: 'office',
      },
      {
        title: 'Expertise and trust',
        body: 'Credentials, team context, and client proof are surfaced before the contact ask.',
        label: 'Trust',
        photoRole: 'service',
      },
      {
        title: 'Consultation path',
        body: 'A simple first-step section explains what happens after someone reaches out.',
        label: 'Process',
        photoRole: 'office',
      },
      {
        title: 'Proof and testimonials',
        body: 'Reviews or outcomes support confidence without cluttering the first screen.',
        label: 'Proof',
        photoRole: 'social',
      },
    ],
    storyTitle: (businessName) => `${businessName} can clarify expertise before the contact form.`,
    storyBody: () =>
      `Services, credentials, proof, process, and a consultation CTA create a professional path for higher-trust decisions.`,
    trustSignals: ['Expertise before contact', 'Clear process', 'Proof near consultation CTA'],
    conversionTitle: 'Clarity before consultation.',
    conversionBody: 'Prospects can understand services, trust the expertise, review the process, and request a consultation from one path.',
    conversionSteps: ['Review services', 'Check expertise', 'Understand process', 'Request consultation'],
    visitTitle: 'Contact details support the consultation path.',
    visitBody: 'Location, availability, and inquiry details stay connected to services and process expectations.',
    contentTitle: 'Expertise content supports inquiry quality.',
    contentIdeas: ['service explainer', 'client question answer', 'process overview', 'testimonial highlight'],
    localSearches: ['professional service {city}', 'consultant {city}', 'advisor {city}', 'consultation {city}'],
    issueFallbacks: [
      {
        label: 'Service clarity',
        current: 'Prospects do not get a clear services-and-process path before contacting.',
        fix: 'Lead with service clarity, expertise proof, process, and a consultation CTA.',
        severity: 'high',
      },
    ],
    tone: 'service',
  },
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
    <main
      className={`${styles.site} ${styles[`variant_${context.variant}`]} ${styles[`tone_${context.config.tone}`]} ${styles[`layout_${context.layoutSignature}`]}`}
      style={context.themeStyle}
      data-layout-renderer={context.layoutRendererName}
      data-design-family={context.designFamily}
    >
      <LayoutRenderer context={context} />
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
  const selection = getMockupTemplateSelection({
    businessName,
    niche,
    fields: rich as Record<string, unknown>,
    text: [audit?.main_problem, audit?.conversion_opportunity, audit?.recommended_offer, audit?.mockup_angle, audit?.audit_notes],
  });
  const variant = selection.variant;
  const config = VARIANT_CONFIG[variant];
  const layoutSignature = selection.layoutSignature;
  const designFamilySelection = getMockupDesignFamilySelection({
    rich,
    template: selection,
    niche,
    businessName,
  });
  const layoutRendererName = getMockupLayoutRendererName(layoutSignature, variant, designFamilySelection.family);
  const visualProfile = rich.visual_profile || inferVisualProfile(variant, layoutSignature, rich, config);
  const mediaAssets = getUsableMockupMediaAssets(rich);
  const heroAsset = selectHeroMediaAsset(mediaAssets);
  const galleryAssets = prioritizeGalleryAssets(mediaAssets, heroAsset);
  const designStyleKey = cleanText(rich.design_style_key) || cleanText(visualProfile?.design_style_key) || layoutSignature;
  const photoStrategy =
    cleanText(rich.photo_strategy) || cleanText(visualProfile?.photo_strategy) || buildFallbackPhotoStrategy(variant, heroAsset);
  const headline = publicHeroCopy(cleanText(mockup.hero_headline)) || config.fallbackHeadline(businessName, city);
  const subheadline =
    publicHeroCopy(cleanText(mockup.hero_subheadline)) ||
    publicHeroCopy(cleanText(audit?.conversion_opportunity)) ||
    config.fallbackSubheadline(businessName, location);
  const primaryCta = cleanText(mockup.primary_cta) || config.primaryCta;
  const navItems = filterNavItemsForVariant(mergeText(rich.proposed_site_nav, config.navItems, [], 6), variant);
  const richOffers = cleanRichList(rich.menu_or_offer_items);
  const offers = mergeOfferItems(richOffers, config.offers, variant);
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
  const sectionPlan = getMockupLayoutSectionPlan({
    signature: layoutSignature,
    variant,
    designFamily: designFamilySelection.family,
    hasGallery: galleryAssets.length > 0,
    hasSnapshot: Boolean(rich.current_site_snapshot),
  });

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
    designFamily: designFamilySelection.family,
    designFamilyLabel: designFamilySelection.label,
    designFamilyReason: designFamilySelection.reason,
    designFamilyInferred: designFamilySelection.inferred,
    layoutSignature,
    layoutRendererName,
    designStyleKey,
    photoStrategy,
    visualProfile,
    mediaAssets,
    heroAsset,
    galleryAssets,
    sectionPlan,
    themeStyle: buildThemeStyle(visualProfile),
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
    templateReason: selection.reason,
  };
}

function LayoutRenderer({ context }: { context: SiteContext }) {
  if (context.layoutRendererName === 'PetCareBookingLayout') return <PetCareBookingLayout context={context} />;
  if (context.layoutRendererName === 'RestaurantExperienceLayout') return <RestaurantExperienceLayout context={context} />;
  if (context.layoutRendererName === 'ContractorProjectBoardLayout') return <ContractorProjectBoardLayout context={context} />;
  if (context.layoutRendererName === 'AutoDetailShowcaseLayout') return <AutoDetailShowcaseLayout context={context} />;
  if (context.layoutRendererName === 'DarkPremiumTransformLayout') return <DarkPremiumTransformLayout context={context} />;
  if (context.layoutRendererName === 'CleanClinicTrustLayout') return <CleanClinicTrustLayout context={context} />;
  if (context.layoutRendererName === 'LuxuryServicePageLayout') return <LuxuryServicePageLayout context={context} />;
  if (context.layoutRendererName === 'FitnessEnergyLandingLayout') return <FitnessEnergyLandingLayout context={context} />;
  if (context.layoutRendererName === 'ProfessionalTrustPageLayout') return <ProfessionalTrustPageLayout context={context} />;
  if (context.layoutRendererName === 'WarmLocalStoryLayout') return <WarmLocalStoryLayout context={context} />;
  if (context.layoutRendererName === 'SplitProofHeroLayout') return <SplitProofHeroLayout context={context} />;
  if (context.layoutRendererName === 'EditorialServiceGridLayout') return <EditorialServiceGridLayout context={context} />;
  if (context.layoutRendererName === 'ImmersivePhotoHeroLayout') return <ImmersivePhotoHeroLayout context={context} />;
  return <LocalServiceFallbackLayout context={context} />;
}

function PetCareBookingLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <LayoutNotice context={context} />
      <PetCareHeader context={context} />
      <PetBookingHero context={context} />
      <MenuOfferSection context={context} />
      <BrandStory context={context} />
      <PetBookingStrip context={context} />
      <ProjectGallerySection context={context} />
      <VisitSection context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function RestaurantExperienceLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <RestaurantHeader context={context} />
      <RestaurantExperienceHero context={context} />
      <BrandStory context={context} />
      <MenuOfferSection context={context} />
      <VisitSection context={context} />
      <ProjectGallerySection context={context} />
      <GrowthSection context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function ContractorProjectBoardLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <LayoutNotice context={context} />
      <ContractorHeader context={context} />
      <ContractorProjectHero context={context} />
      <ProjectProofBand context={context} />
      <MenuOfferSection context={context} />
      <PrimaryConversion context={context} />
      <BrandStory context={context} />
      <VisitSection context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function AutoDetailShowcaseLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <AutoShowroomHeader context={context} />
      <AutoShowcaseHero context={context} />
      <AutoTransformationStrip context={context} />
      <MenuOfferSection context={context} />
      <ProjectGallerySection context={context} />
      <PrimaryConversion context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function DarkPremiumTransformLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <AutoShowroomHeader context={context} />
      <AutoShowcaseHero context={context} />
      <AutoTransformationStrip context={context} />
      <ProjectGallerySection context={context} />
      <MenuOfferSection context={context} />
      <BrandStory context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function CleanClinicTrustLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <LayoutNotice context={context} />
      <ClinicHeader context={context} />
      <ClinicConsultationHero context={context} />
      <MenuOfferSection context={context} />
      <ClinicTrustPanel context={context} />
      <PrimaryConversion context={context} />
      <VisitSection context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function LuxuryServicePageLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <LayoutNotice context={context} />
      <ClinicHeader context={context} />
      <LuxuryServiceHero context={context} />
      <MenuOfferSection context={context} />
      <BrandStory context={context} />
      <PrimaryConversion context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function FitnessEnergyLandingLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <FitnessHeader context={context} />
      <FitnessEnergyHero context={context} />
      <MenuOfferSection context={context} />
      <PrimaryConversion context={context} />
      <BrandStory context={context} />
      <VisitSection context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function ProfessionalTrustPageLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <ProfessionalHeader context={context} />
      <ProfessionalTrustHero context={context} />
      <MenuOfferSection context={context} />
      <PrimaryConversion context={context} />
      <BrandStory context={context} />
      {context.rich.current_site_snapshot && <OnlinePresenceSnapshot context={context} />}
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function WarmLocalStoryLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <LayoutNotice context={context} />
      <WarmStoryHeader context={context} />
      <WarmStoryHero context={context} />
      <BrandStory context={context} />
      <MenuOfferSection context={context} />
      <VisitSection context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function SplitProofHeroLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <LayoutNotice context={context} />
      <SplitProofHeader context={context} />
      <SplitProofHero context={context} />
      <ProjectProofBand context={context} />
      <MenuOfferSection context={context} />
      <PrimaryConversion context={context} />
      <VisitSection context={context} />
      {context.rich.current_site_snapshot && <OnlinePresenceSnapshot context={context} />}
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function EditorialServiceGridLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <ServiceIndexHeader context={context} />
      <EditorialServiceGridHero context={context} />
      <MenuOfferSection context={context} />
      <BrandStory context={context} />
      <GrowthSection context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function ImmersivePhotoHeroLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <ImmersiveHeader context={context} />
      <WebsiteHero context={context} />
      <PrimaryConversion context={context} />
      <ExperienceSection context={context} />
      <ProjectGallerySection context={context} />
      <VisitSection context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function LocalServiceFallbackLayout({ context }: { context: SiteContext }) {
  return (
    <>
      <LayoutNotice context={context} />
      <ServiceIndexHeader context={context} />
      <ServiceFirstHero context={context} />
      <BrandStory context={context} />
      <MenuOfferSection context={context} />
      <PrimaryConversion context={context} />
      <VisitSection context={context} />
      <FinalWalkthrough context={context} />
      <WebsiteFooter context={context} />
    </>
  );
}

function LayoutNotice({ context }: { context: SiteContext }) {
  return (
    <div className={styles.layoutNotice}>
      <strong>Website concept by Apex</strong>
      <span>{context.businessName}</span>
      <small>Prepared by Apex Marketing Group</small>
    </div>
  );
}

function PetCareHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.petHeader}>
      <a href="#home" className={styles.petBrand} aria-label={`${context.businessName} concept homepage`}>
        <span className={styles.logoMark}>{businessInitials(context.businessName)}</span>
        <strong>{context.businessName}</strong>
      </a>
      <nav aria-label="Pet care concept navigation">
        {context.navItems.slice(0, 4).map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </nav>
      <a className={styles.petHeaderCta} href="#primary-action">
        {context.primaryCta}
      </a>
    </header>
  );
}

function RestaurantHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.restaurantHeader}>
      <div>
        <small>Website concept by Apex</small>
        <a href="#home">{context.businessName}</a>
      </div>
      <nav aria-label="Hospitality concept navigation">
        {context.navItems.slice(0, 5).map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </nav>
      <a href="#primary-action">{context.primaryCta}</a>
    </header>
  );
}

function ContractorHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.contractorHeader}>
      <a href="#home" aria-label={`${context.businessName} concept homepage`}>
        <span>{businessInitials(context.businessName)}</span>
        <strong>{context.businessName}</strong>
      </a>
      <nav aria-label="Contractor concept navigation">
        {context.navItems.slice(0, 5).map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </nav>
      <div>
        <small>{context.city}</small>
        <a href="#primary-action">{context.primaryCta}</a>
      </div>
    </header>
  );
}

function AutoShowroomHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.autoHeader}>
      <a href="#home" aria-label={`${context.businessName} concept homepage`}>
        <strong>{context.businessName}</strong>
        <span>{context.city} finish studio</span>
      </a>
      <nav aria-label="Auto detail concept navigation">
        {context.navItems.slice(0, 4).map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </nav>
      <a href="#primary-action">{context.primaryCta}</a>
    </header>
  );
}

function ClinicHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.clinicHeader}>
      <a href="#home" aria-label={`${context.businessName} concept homepage`}>
        <strong>{context.businessName}</strong>
        <span>{context.location}</span>
      </a>
      <nav aria-label="Clinic concept navigation">
        {context.navItems.slice(0, 4).map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </nav>
      <a href="#primary-action">{context.primaryCta}</a>
    </header>
  );
}

function FitnessHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.fitnessHeader}>
      <a href="#home">{context.businessName}</a>
      <div>
        {context.navItems.slice(0, 4).map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </div>
      <a href="#primary-action">{context.primaryCta}</a>
    </header>
  );
}

function ProfessionalHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.professionalHeader}>
      <a href="#home">
        <strong>{context.businessName}</strong>
        <span>{context.niche}</span>
      </a>
      <nav aria-label="Professional service concept navigation">
        {context.navItems.slice(0, 5).map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </nav>
    </header>
  );
}

function WarmStoryHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.warmStoryHeader}>
      <a href="#home">{context.businessName}</a>
      <span>{context.visualProfile?.brand_mood || context.location}</span>
      <a href="#primary-action">{context.primaryCta}</a>
    </header>
  );
}

function SplitProofHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.splitProofHeader}>
      <a href="#home">{context.businessName}</a>
      <nav aria-label="Proof concept navigation">
        {context.navItems.slice(0, 4).map((item) => (
          <a key={item} href={navHref(item)}>
            {item}
          </a>
        ))}
      </nav>
      <a href="#primary-action">{context.primaryCta}</a>
    </header>
  );
}

function ServiceIndexHeader({ context }: { context: SiteContext }) {
  return (
    <header className={styles.serviceIndexHeader}>
      <a href="#home">{context.businessName}</a>
      <div>
        <span>{context.location}</span>
        <a href="#primary-action">{context.primaryCta}</a>
      </div>
    </header>
  );
}

function ImmersiveHeader({ context }: { context: SiteContext }) {
  return (
    <>
      <LayoutNotice context={context} />
      <header className={styles.immersiveHeader}>
        <a href="#home">{context.businessName}</a>
        <nav aria-label="Immersive concept navigation">
          {context.navItems.slice(0, 5).map((item) => (
            <a key={item} href={navHref(item)}>
              {item}
            </a>
          ))}
        </nav>
      </header>
    </>
  );
}

function PetBookingHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.petHero}>
      <div className={styles.petHeroCopy}>
        <p>{context.visualProfile?.brand_mood || 'Comfort-first grooming'}</p>
        <h1>{context.headline}</h1>
        <span>{context.subheadline}</span>
      </div>
      <div className={styles.petPhotoCollage}>
        <LayoutMedia context={context} index={0} fallbackRole="pet" label="Grooming comfort visual" />
        <LayoutMedia context={context} index={1} fallbackRole="pet" label="Happy-pet proof card" />
        <LayoutMedia context={context} index={2} fallbackRole="office" label="Appointment trust cue" />
      </div>
      <aside className={styles.petAppointmentCard} id="primary-action">
        <small>Appointment path</small>
        <strong>{context.primaryCta}</strong>
        <span>{context.conversionSteps.slice(0, 3).join(' -> ')}</span>
        <a href="#visit">{context.primaryCta}</a>
      </aside>
    </section>
  );
}

function RestaurantExperienceHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.restaurantHero}>
      <LayoutMedia context={context} index={0} fallbackRole="interior" label="Dining room atmosphere" />
      <div className={styles.restaurantHeroCopy}>
        <p>Reservations, menu, and atmosphere</p>
        <h1>{context.headline}</h1>
        <span>{context.subheadline}</span>
        <div>
          <a href="#primary-action">{context.primaryCta}</a>
          <a href="#menu">{context.config.secondaryCta}</a>
        </div>
      </div>
    </section>
  );
}

function ContractorProjectHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.contractorHero}>
      <div className={styles.contractorHeroCopy}>
        <p>{context.city} project direction</p>
        <h1>{context.headline}</h1>
        <span>{context.subheadline}</span>
        <a href="#primary-action">{context.primaryCta}</a>
      </div>
      <div className={styles.projectBoard}>
        {context.offers.slice(0, 4).map((offer, index) => (
          <article key={offer.title}>
            <LayoutMedia context={context} index={index} fallbackRole={offer.photoRole} label={offer.label || offer.title} />
            <strong>{offer.title}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function AutoShowcaseHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.autoHero}>
      <div className={styles.autoHeroMedia}>
        <LayoutMedia context={context} index={0} fallbackRole="vehicle" label={context.photoStrategy || 'Transformation visual'} />
      </div>
      <div className={styles.autoHeroCopy}>
        <small>Finish-first booking path</small>
        <h1>{context.headline}</h1>
        <p>{context.subheadline}</p>
        <div>
          {context.badges.slice(0, 4).map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
        <a href="#primary-action">{context.primaryCta}</a>
      </div>
    </section>
  );
}

function ClinicConsultationHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.clinicHero}>
      <div className={styles.clinicHeroCopy}>
        <p>Consultation-first path</p>
        <h1>{context.headline}</h1>
        <span>{context.subheadline}</span>
        <a href="#primary-action">{context.primaryCta}</a>
      </div>
      <aside className={styles.clinicTrustCard}>
        <LayoutMedia context={context} index={0} fallbackRole="treatment" label="Treatment-room or provider visual" />
        <strong>{context.trustSignals[0] || 'Provider trust before booking'}</strong>
        <span>{context.visualProfile?.trust_style || 'Trust and expectations stay close to the consultation CTA.'}</span>
      </aside>
    </section>
  );
}

function LuxuryServiceHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.luxuryServiceHero}>
      <p>{displayEyebrow(context)}</p>
      <h1>{context.headline}</h1>
      <span>{context.subheadline}</span>
      <LayoutMedia context={context} index={0} fallbackRole={context.config.heroPhoto} label={context.photoStrategy || context.config.heroPhotoLabel} />
      <a href="#primary-action">{context.primaryCta}</a>
    </section>
  );
}

function FitnessEnergyHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.fitnessHero}>
      <div className={styles.fitnessHeroCopy}>
        <small>First-class path</small>
        <h1>{context.headline}</h1>
        <p>{context.subheadline}</p>
        <a href="#primary-action">{context.primaryCta}</a>
      </div>
      <div className={styles.fitnessProgramStack}>
        {context.offers.slice(0, 3).map((offer, index) => (
          <article key={offer.title}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <strong>{offer.title}</strong>
            <LayoutMedia context={context} index={index} fallbackRole="fitness" label={offer.label || 'Program visual'} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ProfessionalTrustHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.professionalHero}>
      <div>
        <p>{displayEyebrow(context)}</p>
        <h1>{context.headline}</h1>
        <span>{context.subheadline}</span>
      </div>
      <aside id="primary-action">
        <strong>{primaryPathLabel(context)}</strong>
        {context.conversionSteps.slice(0, 4).map((step) => (
          <span key={step}>{step}</span>
        ))}
        <a href="#walkthrough">{context.primaryCta}</a>
      </aside>
    </section>
  );
}

function WarmStoryHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.warmStoryHero}>
      <LayoutMedia context={context} index={0} fallbackRole={context.config.heroPhoto} label={context.photoStrategy || context.config.heroPhotoLabel} />
      <div>
        <p>{displayEyebrow(context)}</p>
        <h1>{context.headline}</h1>
        <span>{context.subheadline}</span>
        <a href="#primary-action">{context.primaryCta}</a>
      </div>
    </section>
  );
}

function SplitProofHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.splitHero}>
      <div className={styles.splitHeroProof}>
        <LayoutMedia context={context} index={0} fallbackRole={context.config.heroPhoto} label={context.photoStrategy || 'Primary proof visual'} />
        <div>
          {context.trustSignals.slice(0, 2).map((signal) => (
            <strong key={signal}>{signal}</strong>
          ))}
        </div>
      </div>
      <div className={styles.splitHeroCopy}>
        <p>{displayEyebrow(context)}</p>
        <h1>{context.headline}</h1>
        <span>{context.subheadline}</span>
        <a href="#primary-action">{context.primaryCta}</a>
      </div>
    </section>
  );
}

function EditorialServiceGridHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.editorialGridHero}>
      <div>
        <p>Services and proof</p>
        <h1>{context.headline}</h1>
      </div>
      <span>{context.subheadline}</span>
      <div>
        {context.offers.slice(0, 4).map((offer) => (
          <a key={offer.title} href="#menu">
            {offer.title}
          </a>
        ))}
      </div>
    </section>
  );
}

function ServiceFirstHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.serviceFirstHero}>
      <div>
        <p>{displayEyebrow(context)}</p>
        <h1>{context.headline}</h1>
        <span>{context.subheadline}</span>
      </div>
      <div id="primary-action">
        {context.conversionSteps.slice(0, 4).map((step) => (
          <article key={step}>
            <strong>{step}</strong>
          </article>
        ))}
        <a href="#visit">{context.primaryCta}</a>
      </div>
    </section>
  );
}

function PetBookingStrip({ context }: { context: SiteContext }) {
  return (
    <section className={styles.petBookingStrip}>
      {context.conversionSteps.slice(0, 4).map((step, index) => (
        <article key={step}>
          <small>{String(index + 1).padStart(2, '0')}</small>
          <strong>{step}</strong>
        </article>
      ))}
    </section>
  );
}

function ProjectProofBand({ context }: { context: SiteContext }) {
  return (
    <section className={styles.projectProofBand}>
      <div>
        <p>{galleryEyebrow(context)}</p>
        <h2>{galleryTitle(context)}</h2>
      </div>
      {context.offers.slice(0, 3).map((offer, index) => (
        <article key={offer.title}>
          <LayoutMedia context={context} index={index} fallbackRole={offer.photoRole} label={offer.label || offer.title} />
          <strong>{offer.title}</strong>
          <span>{offer.body}</span>
        </article>
      ))}
    </section>
  );
}

function AutoTransformationStrip({ context }: { context: SiteContext }) {
  return (
    <section id="primary-action" className={styles.autoTransformationStrip}>
      {context.offers.slice(0, 3).map((offer, index) => (
        <article key={offer.title}>
          <small>{offer.label || 'Package'}</small>
          <strong>{offer.title}</strong>
          <span>{context.conversionSteps[index] || offer.body}</span>
        </article>
      ))}
      <a href="#walkthrough">{context.primaryCta}</a>
    </section>
  );
}

function ClinicTrustPanel({ context }: { context: SiteContext }) {
  return (
    <section className={styles.clinicTrustPanel}>
      <div>
        <p>{storyLabel(context)}</p>
        <h2>{context.visualProfile?.trust_style || context.config.storyTitle(context.businessName)}</h2>
      </div>
      {context.trustSignals.slice(0, 3).map((signal) => (
        <article key={signal}>
          <Star size={16} />
          <strong>{signal}</strong>
        </article>
      ))}
    </section>
  );
}

function WebsiteHero({ context }: { context: SiteContext }) {
  return (
    <section id="home" className={styles.hero}>
      <div className={`${styles.heroImage} ${styles[`photo_${context.config.heroPhoto}`]}`}>
        {context.heroAsset && <SafeImage asset={context.heroAsset} className={styles.realImage} priority />}
        {publicMediaCaption(context.heroAsset, context.config.heroPhotoLabel) && (
          <span>{publicMediaCaption(context.heroAsset, context.config.heroPhotoLabel)}</span>
        )}
      </div>
      <div className={styles.heroVeil} />
      <div className={styles.heroContent}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{displayEyebrow(context)}</p>
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
  const assets = context.galleryAssets.slice(0, 3);

  return (
    <section className={styles.experiences}>
      <div className={styles.sectionIntro}>
        <p>{experienceEyebrow(context)}</p>
        <h2>{experienceTitle(context)}</h2>
      </div>
      <div className={styles.experienceGrid}>
        {cards.map((item, index) => (
          <PhotoCard key={item.title} item={item} asset={assets[index]} />
        ))}
      </div>
    </section>
  );
}

function ProjectGallerySection({ context }: { context: SiteContext }) {
  const assets = context.galleryAssets.slice(0, 6);
  if (assets.length === 0) return null;

  return (
    <section className={styles.gallerySection}>
      <div className={styles.galleryHeader}>
        <p>{galleryEyebrow(context)}</p>
        <h2>{galleryTitle(context)}</h2>
        <span>{galleryLeadText(context)}</span>
      </div>
      <div className={styles.galleryGrid}>
        {assets.map((asset, index) => (
          <article key={asset.image_url} className={styles.galleryCard} data-size={index === 0 ? 'large' : 'standard'}>
            <MediaFrame asset={asset} fallbackRole={context.config.heroPhoto} label={galleryCardFallback(context)} />
            <div>
              <small>{publicSourceLabel(asset, context)}</small>
              <strong>{publicMediaText(asset, galleryCardFallback(context))}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function MenuOfferSection({ context }: { context: SiteContext }) {
  const assets = context.galleryAssets.slice(2, 6);

  return (
    <section id="menu" className={styles.menuSection}>
      <div className={styles.menuLead}>
        <p>{offerSectionEyebrow(context)}</p>
        <h2>{menuTitle(context)}</h2>
        <span>{menuLeadBody(context)}</span>
      </div>
      <div className={styles.menuGrid}>
        {context.offers.slice(0, 4).map((item, index) => (
          <article key={item.title} className={styles.menuCard}>
            <MediaFrame asset={assets[index]} fallbackRole={item.photoRole} label={item.label || 'Featured'} />
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
        <p>{visitSectionEyebrow(context)}</p>
        <h2>{context.config.visitTitle}</h2>
        <span>{publicHeroCopy(context.config.visitBody) || context.config.visitBody}</span>
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
        <h2>Want a quick walkthrough of this homepage?</h2>
        <span>
          This preview shows a practical homepage direction for {context.businessName}. The next step
          would be reviewing the sections, photos, and conversion path together.
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
      <small>Prepared by Apex Marketing Group</small>
    </footer>
  );
}

function LayoutMedia({
  context,
  index,
  fallbackRole,
  label,
}: {
  context: SiteContext;
  index: number;
  fallbackRole: PhotoRole;
  label: string;
}) {
  const asset = mediaAssetAt(context, index);
  const caption = publicMediaCaption(asset, label);
  return (
    <div className={`${styles.layoutMedia} ${styles[`photo_${fallbackRole}`]} ${asset ? styles.hasRealMedia : ''}`}>
      {asset && <SafeImage asset={asset} className={styles.realImage} />}
      {caption && <span>{caption}</span>}
    </div>
  );
}

function PhotoCard({ item, asset }: { item: HomepageItem; asset?: MockupMediaAsset }) {
  return (
    <article className={styles.photoCard}>
      <MediaFrame asset={asset} fallbackRole={item.photoRole} label={photoLabel(item.photoRole)} />
      <div>
        <small>{item.label || 'Featured'}</small>
        <h3>{item.title}</h3>
        <p>{item.body}</p>
      </div>
    </article>
  );
}

function MediaFrame({
  asset,
  fallbackRole,
  label,
}: {
  asset?: MockupMediaAsset | null;
  fallbackRole: PhotoRole;
  label: string;
}) {
  const caption = publicMediaCaption(asset, label);
  return (
    <div className={`${styles.cardPhoto} ${styles[`photo_${fallbackRole}`]} ${asset ? styles.hasRealMedia : ''}`}>
      {asset && <SafeImage asset={asset} className={styles.realImage} />}
      {caption && <span>{caption}</span>}
    </div>
  );
}

function SafeImage({
  asset,
  className,
  priority = false,
}: {
  asset: MockupMediaAsset;
  className: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={asset.image_url}
      alt={publicImageAlt(asset)}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={(event) => {
        event.currentTarget.dataset.failed = 'true';
        event.currentTarget.removeAttribute('src');
      }}
    />
  );
}

function mediaAssetAt(context: SiteContext, index: number) {
  const assets = [context.heroAsset, ...context.galleryAssets].filter((asset): asset is MockupMediaAsset => Boolean(asset));
  return assets[index] || null;
}

function prioritizeGalleryAssets(assets: MockupMediaAsset[], heroAsset: MockupMediaAsset | null) {
  const heroUrl = heroAsset?.image_url;
  const ordered = [
    ...assets.filter((asset) => asset.type === 'project' || asset.type === 'proof'),
    ...assets.filter((asset) => asset.type === 'service' || asset.type === 'process'),
    ...assets.filter((asset) => asset.type === 'team' || asset.type === 'exterior' || asset.type === 'atmosphere'),
    ...assets.filter((asset) => asset.type === 'gallery' || asset.type === 'hero'),
  ].filter((asset) => asset.image_url !== heroUrl);

  const seen = new Set<string>();
  return ordered.filter((asset) => {
    const key = asset.image_url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferVisualProfile(
  variant: MockupTemplateVariant,
  layoutSignature: MockupLayoutSignature,
  rich: RichMockupData,
  config: VariantConfig
): MockupVisualProfile {
  const moodByVariant: Record<MockupTemplateVariant, string> = {
    home_service: 'helpful, direct, service-area confident',
    contractor: 'grounded, durable, proof-heavy local contractor',
    medical_aesthetics: 'calm, premium, clinical trust',
    auto_service: 'dark, precise, transformation-forward',
    pet_service: 'warm, friendly, safety-first pet care',
    fitness_studio: 'energetic, community-driven, coach-led',
    professional_service: 'clean, credible, consultation-first',
    local_service: 'local, practical, appointment-ready',
    coffee_shop: 'warm, editorial, neighborhood hospitality',
    restaurant: 'photo-forward, occasion-led hospitality',
    bar_grill: 'social, energetic, event-forward hospitality',
    premium_dining: 'refined, atmospheric, reservation-led',
    nonprofit_cafe: 'warm, community-centered, mission-aware',
    food_truck: 'mobile, route-first, high-energy food service',
  };

  return {
    brand_mood: positiveVisualDirection(rich.visual_direction) || moodByVariant[variant],
    brand_tone: cleanText(rich.brand_tone) || positiveVisualDirection(rich.visual_direction) || moodByVariant[variant],
    design_family: cleanText(rich.design_family),
    design_style_key: cleanText(rich.design_style_key) || layoutSignature,
    color_palette: null,
    typography_mood:
      cleanText(rich.typography_direction) ||
      (config.tone === 'luxury' ? 'editorial serif with calm service copy' : 'confident display type with readable service copy'),
    layout_signature: layoutSignature,
    hero_mode: cleanText(rich.hero_mode),
    image_treatment: cleanText(rich.image_treatment),
    proof_style: cleanText(rich.proof_style),
    palette_direction: cleanText(rich.palette_direction),
    typography_direction: cleanText(rich.typography_direction),
    photo_strategy: cleanText(rich.photo_strategy) || buildFallbackPhotoStrategy(variant, null),
    ui_personality: layoutSignature.replace(/_/g, ' '),
    trust_style: isServiceMockupTemplate(variant) ? 'proof before CTA' : 'atmosphere and proof near the action',
    cta_style: config.primaryCta,
  };
}

function buildThemeStyle(profile: MockupVisualProfile | null): CSSProperties {
  const palette = profile?.color_palette;
  const style: CSSProperties & Record<string, string> = {};
  if (!palette) return style;

  const tokenMap: Array<[keyof NonNullable<MockupVisualProfile['color_palette']>, string]> = [
    ['primary', '--site-hero-a'],
    ['secondary', '--site-hero-b'],
    ['accent', '--site-amber'],
    ['background', '--site-cream'],
    ['text', '--site-ink'],
  ];

  for (const [key, token] of tokenMap) {
    const value = palette[key];
    if (value && isSafeCssColor(value)) style[token] = value;
  }

  return style;
}

function isSafeCssColor(value: string) {
  return /^(#[0-9a-f]{3,8}|oklch\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|rgb\([^)]+\)|rgba\([^)]+\)|[a-z]+)$/i.test(
    value.trim()
  );
}

function buildFallbackPhotoStrategy(variant: MockupTemplateVariant, heroAsset: MockupMediaAsset | null) {
  if (heroAsset?.source_type && heroAsset.source_type !== 'fallback') {
    return 'Business imagery anchors the page, with proof and process cards supporting each next step.';
  }
  if (variant === 'contractor') return 'Recent project photos, scope cues, and estimate confidence stay connected.';
  if (variant === 'auto_service') return 'Transformation photos, shine details, and package cards make the booking path concrete.';
  if (variant === 'medical_aesthetics') return 'Calm provider imagery and expectation-setting copy make the consultation path feel clear.';
  if (variant === 'pet_service') return 'Warm pet and grooming proof help visitors feel comfortable booking.';
  if (variant === 'fitness_studio') return 'Class energy, coach presence, and community proof make the first visit easy to picture.';
  if (isServiceMockupTemplate(variant)) return 'Service proof, team cues, and next steps stay visible as visitors compare options.';
  return 'Food, atmosphere, and visit details help guests decide where to go next.';
}

function filterNavItemsForVariant(items: string[], variant: MockupTemplateVariant) {
  if (isFoodMockupTemplate(variant)) return items;
  return items.filter((item) => !isFoodOnlyOffer(item) && !/reservation|happy hour|catering|gift card|order/i.test(item));
}

function galleryEyebrow(context: SiteContext) {
  if (context.variant === 'contractor') return 'Project proof';
  if (context.variant === 'auto_service') return 'Transformation proof';
  if (context.variant === 'medical_aesthetics') return 'Experience and trust';
  if (context.variant === 'pet_service') return 'Grooming proof';
  if (context.variant === 'fitness_studio') return 'Studio energy';
  if (isServiceMockupTemplate(context.variant)) return 'Proof gallery';
  return 'Photo-led first impression';
}

function galleryTitle(context: SiteContext) {
  if (context.variant === 'contractor') return 'Let recent work carry the first impression.';
  if (context.variant === 'auto_service') return 'Show the finish before asking people to book.';
  if (context.variant === 'medical_aesthetics') return 'Use real clinic cues without overpromising outcomes.';
  if (context.variant === 'pet_service') return 'Make comfort and care visible before the appointment.';
  if (context.variant === 'fitness_studio') return 'Make the first class easy to picture.';
  if (isServiceMockupTemplate(context.variant)) return 'Use real proof where visitors make the call decision.';
  return 'Use actual atmosphere before the guest compares options.';
}

function galleryCardFallback(context: SiteContext) {
  if (context.variant === 'contractor') return 'Recent project proof';
  if (context.variant === 'auto_service') return 'Result proof';
  if (context.variant === 'medical_aesthetics') return 'Clinic trust cue';
  if (context.variant === 'pet_service') return 'Pet care proof';
  if (context.variant === 'fitness_studio') return 'Class or coach proof';
  return 'Public visual proof';
}

function displayEyebrow(context: SiteContext) {
  return publicHeroCopy(context.visualProfile?.brand_mood) || publicHeroCopy(context.config.eyebrow) || 'Website preview';
}

function publicHeroCopy(value: string | null | undefined) {
  if (!value) return null;
  const cleaned = value
    .replace(/\bwebsite\s+concept\b/gi, 'homepage')
    .replace(/\bhomepage\s+concept\b/gi, 'homepage')
    .replace(/\bpage\s+concept\b/gi, 'page')
    .replace(/\bvisual\s+concept\b/gi, 'preview')
    .replace(/\bconcept\s+preview\b/gi, 'preview')
    .replace(/\bconcept\b/gi, 'homepage')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned || null;
}

function galleryLeadText(context: SiteContext) {
  const safeStrategy = publicText(context.photoStrategy);
  if (safeStrategy) return safeStrategy;
  if (context.variant === 'contractor') return 'Recent work, scope, and estimate confidence stay close together.';
  if (context.variant === 'auto_service') return 'Finish proof, packages, and booking details support the decision.';
  if (context.variant === 'medical_aesthetics') return 'Treatment interest is paired with provider trust and clear expectations.';
  if (context.variant === 'pet_service') return 'Comfort, grooming services, and appointment trust stay close together.';
  if (context.variant === 'fitness_studio') return 'Class energy, program fit, and trial action stay easy to scan.';
  if (isFoodMockupTemplate(context.variant)) return 'Atmosphere, menu highlights, and visit details support the reservation path.';
  return 'Service proof and next steps stay visible before the final call to action.';
}

function publicSourceLabel(asset: MockupMediaAsset, context: SiteContext) {
  if (asset.source_type && asset.source_type !== 'fallback') return asset.source_type.replace(/_/g, ' ');
  if (context.variant === 'pet_service') return 'Grooming proof';
  if (context.variant === 'contractor') return 'Project proof';
  if (context.variant === 'auto_service') return 'Result proof';
  if (context.variant === 'medical_aesthetics') return 'Trust cue';
  if (context.variant === 'fitness_studio') return 'Studio proof';
  if (isFoodMockupTemplate(context.variant)) return 'Atmosphere';
  return 'Proof';
}

function publicMediaText(asset: MockupMediaAsset | null | undefined, fallback: string) {
  return publicText(asset?.usage_note) || publicText(asset?.alt) || fallback;
}

function publicMediaCaption(asset: MockupMediaAsset | null | undefined, fallback: string) {
  if (!asset || asset.source_type === 'fallback') return null;
  return publicText(asset.usage_note) || publicText(asset.alt) || publicText(fallback);
}

function publicImageAlt(asset: MockupMediaAsset) {
  return publicText(asset.alt) || publicText(asset.usage_note) || '';
}

function publicText(value: string | null | undefined) {
  if (!value) return null;
  if (/\bfallback\b|\bplaceholder\b|\breplace\b|\bmedia\s+confidence\b/i.test(value)) return null;
  const cleaned = value
    .replace(/\bfallback\b/gi, '')
    .replace(/\bplaceholder\b/gi, '')
    .replace(/\bconcept\s+visual\b/gi, '')
    .replace(/\bvisual\s+concept\b/gi, '')
    .replace(/\bconcept\b/gi, '')
    .replace(/\breplace\b[^.]*$/gi, '')
    .replace(/\breplace\s+(with\s+)?(public\s+)?(photos?|images?)\b/gi, '')
    .replace(/\bmedia\s+confidence\b/gi, '')
    .replace(/\bconfidence\b/gi, '')
    .replace(/\bwhen available\b/gi, '')
    .replace(/\bonly\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .trim();

  if (!cleaned || /fallback|placeholder|concept visual|replace image|media confidence/i.test(cleaned)) return null;
  return cleaned;
}

function mergeOfferItems(titles: string[], fallback: HomepageItem[], variant: MockupTemplateVariant) {
  const usableTitles = isFoodMockupTemplate(variant) ? titles : titles.filter((title) => !isFoodOnlyOffer(title));
  if (usableTitles.length === 0) return fallback;
  const roles = fallback.map((item) => item.photoRole);
  const labels = fallback.map((item) => item.label);

  return usableTitles.slice(0, 6).map((title, index) => ({
    title,
    body: offerBody(title, fallback[index]?.body, variant),
    label: labels[index] || 'Featured',
    photoRole: roles[index] || fallback[index % fallback.length]?.photoRole || 'dish',
  }));
}

function offerBody(title: string, fallback: string | undefined, variant: MockupTemplateVariant) {
  const lower = title.toLowerCase();
  if (isServiceMockupTemplate(variant)) {
    if (/project|gallery|before|after|result|portfolio/.test(lower)) {
      return 'A proof card that shows real outcomes before asking for the next step.';
    }
    if (/treatment|facial|skin|botox|filler|laser|inject/.test(lower)) {
      return 'A treatment card framed around education, expectations, and booking clarity.';
    }
    if (/groom|bath|trim|pet|dog/.test(lower)) {
      return 'A grooming card that helps pet owners choose an appointment type with confidence.';
    }
    if (/package|detail|coating|wash|vehicle|car/.test(lower)) {
      return 'A package card that pairs transformation proof with an easy booking path.';
    }
    if (/class|training|coach|schedule|trial/.test(lower)) {
      return 'A program card that connects class fit, schedule, and first-step CTA.';
    }
    if (/service|quote|repair|estimate|consult|appointment|book/.test(lower)) {
      return 'A service card that routes high-intent visitors toward the right request path.';
    }
    return fallback || 'A service-business section that helps visitors choose the next step faster.';
  }
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

function isFoodOnlyOffer(title: string) {
  return /\b(menu|dish|dishes|order|reservation|reserve|happy hour|catering|gift card|appetizer|lunch|dinner|drink|beer|wine|cocktail)\b/i.test(
    title
  );
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
  if (context.variant === 'contractor') return 'Project proof visible';
  if (context.variant === 'home_service') return 'Service request path ready';
  if (context.variant === 'medical_aesthetics') return 'Consultation trust path';
  if (context.variant === 'auto_service') return 'Transformation proof visible';
  if (context.variant === 'pet_service') return 'Grooming booking path';
  if (context.variant === 'fitness_studio') return 'Trial path visible';
  if (context.variant === 'professional_service') return 'Expertise path clear';
  if (context.variant === 'food_truck') return 'Route-first homepage';
  if (context.variant === 'local_service') return 'Quote path visible';
  if (context.variant === 'premium_dining') return 'Reservation path ready';
  if (context.variant === 'bar_grill') return "Tonight's reason visible";
  if (context.variant === 'nonprofit_cafe') return 'Mission and visit path';
  return 'Menu and hours up front';
}

function statusBody(context: SiteContext) {
  if (context.variant === 'contractor') return 'Projects, services, process, reviews, and estimate CTA stay connected.';
  if (context.variant === 'home_service') return 'Services, proof, service area, reviews, and quote CTA stay connected.';
  if (context.variant === 'medical_aesthetics') return 'Treatments, provider trust, expectations, and consultation booking stay connected.';
  if (context.variant === 'auto_service') return 'Before-and-after proof, packages, process, and booking stay connected.';
  if (context.variant === 'pet_service') return 'Grooming services, safety cues, proof, location, and booking stay connected.';
  if (context.variant === 'fitness_studio') return 'Classes, schedule, coaches, community, and intro offer stay connected.';
  if (context.variant === 'professional_service') return 'Services, expertise, proof, process, and contact path stay connected.';
  if (context.variant === 'food_truck') return 'Location, schedule, catering, and events stay together.';
  if (context.variant === 'local_service') return 'Services, proof, areas, and quote CTA stay connected.';
  if (context.variant === 'premium_dining') return 'Menu, occasion, and booking path stay above the fold.';
  if (context.variant === 'bar_grill') return 'Happy hour, events, and ordering are visible immediately.';
  if (context.variant === 'nonprofit_cafe') return 'Dine, donate, volunteer, and visit paths are clear.';
  return 'Featured items, visit details, and ordering are easy to find.';
}

function statusDetail(context: SiteContext) {
  if (context.variant === 'contractor') return `Project fit and estimate path for ${context.city}`;
  if (context.variant === 'home_service') return `Service area and quote path for ${context.city}`;
  if (context.variant === 'medical_aesthetics') return `Treatments and consultation path for ${context.city}`;
  if (context.variant === 'auto_service') return `Packages and booking for ${context.city}`;
  if (context.variant === 'pet_service') return `Grooming appointments for ${context.city}`;
  if (context.variant === 'fitness_studio') return `Classes and trial path for ${context.city}`;
  if (context.variant === 'professional_service') return `Consultation path for ${context.city}`;
  if (context.variant === 'food_truck') return `Next stop and catering for ${context.city}`;
  if (context.variant === 'local_service') return `Service area: ${context.city} and nearby`;
  if (context.variant === 'premium_dining') return `Private dining, gifts, and reservations`;
  if (context.variant === 'bar_grill') return `Happy hour, events, and group nights`;
  if (context.variant === 'nonprofit_cafe') return `Visit, volunteer, or support the mission`;
  return `${context.city} menu, hours, and local favorites`;
}

function primaryPathLabel(context: SiteContext) {
  if (context.variant === 'contractor') return 'Estimate path';
  if (context.variant === 'home_service') return 'Service request path';
  if (context.variant === 'medical_aesthetics') return 'Consultation path';
  if (context.variant === 'auto_service') return 'Booking path';
  if (context.variant === 'pet_service') return 'Appointment path';
  if (context.variant === 'fitness_studio') return 'Trial path';
  if (context.variant === 'professional_service') return 'Inquiry path';
  if (context.variant === 'food_truck') return 'Plan the stop';
  if (context.variant === 'local_service') return 'Book the work';
  if (context.variant === 'premium_dining') return 'Reserve the occasion';
  if (context.variant === 'bar_grill') return 'Plan tonight';
  if (context.variant === 'nonprofit_cafe') return 'Choose how to help';
  return 'Plan the visit';
}

function storyLabel(context: SiteContext) {
  if (context.variant === 'contractor') return 'Projects and trust';
  if (context.variant === 'home_service') return 'Service proof';
  if (context.variant === 'medical_aesthetics') return 'Provider trust';
  if (context.variant === 'auto_service') return 'Results and process';
  if (context.variant === 'pet_service') return 'Safety and comfort';
  if (context.variant === 'fitness_studio') return 'Coaches and community';
  if (context.variant === 'professional_service') return 'Expertise and process';
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
  if (context.variant === 'contractor') return 'Project proof';
  if (context.variant === 'home_service') return 'Service paths';
  if (context.variant === 'medical_aesthetics') return 'Treatments and trust';
  if (context.variant === 'auto_service') return 'Before and after';
  if (context.variant === 'pet_service') return 'Grooming path';
  if (context.variant === 'fitness_studio') return 'Classes and community';
  if (context.variant === 'professional_service') return 'Service clarity';
  if (context.variant === 'local_service') return 'Service paths';
  if (context.variant === 'food_truck') return 'Route and booking';
  if (context.variant === 'nonprofit_cafe') return 'Ways to participate';
  return 'Featured experiences';
}

function experienceTitle(context: SiteContext) {
  if (context.variant === 'contractor') return 'Projects, scope, and proof arranged for estimate intent.';
  if (context.variant === 'home_service') return 'Service choices organized around the reason someone is calling.';
  if (context.variant === 'medical_aesthetics') return 'Treatments framed with trust and consultation clarity.';
  if (context.variant === 'auto_service') return 'Results and packages that make booking easier.';
  if (context.variant === 'pet_service') return 'Grooming services with comfort and proof up front.';
  if (context.variant === 'fitness_studio') return 'Classes, schedule, and coaches built for the first trial.';
  if (context.variant === 'professional_service') return 'Services and expertise made easy to compare.';
  if (context.variant === 'coffee_shop') return `A few reasons ${context.city} comes in for coffee.`;
  if (context.variant === 'premium_dining') return 'Occasions worth reserving for.';
  if (context.variant === 'bar_grill') return 'What makes tonight feel worth the trip.';
  if (context.variant === 'food_truck') return 'Find the stop, then book the truck.';
  if (context.variant === 'local_service') return 'Services organized around quote intent.';
  if (context.variant === 'nonprofit_cafe') return 'Eat, support, or show up to help.';
  return 'The homepage starts with what guests actually choose.';
}

function offerSectionEyebrow(context: SiteContext) {
  if (context.variant === 'contractor') return 'Services and project types';
  if (context.variant === 'home_service') return 'Service cards';
  if (context.variant === 'medical_aesthetics') return 'Treatment cards';
  if (context.variant === 'auto_service') return 'Packages and services';
  if (context.variant === 'pet_service') return 'Grooming services';
  if (context.variant === 'fitness_studio') return 'Classes and programs';
  if (context.variant === 'professional_service') return 'Service clarity';
  if (context.variant === 'local_service') return 'Service highlights';
  return 'Menu highlights';
}

function menuTitle(context: SiteContext) {
  if (context.variant === 'contractor') return 'Project types and service scope, not a generic list.';
  if (context.variant === 'home_service') return 'Services presented around the quote or call decision.';
  if (context.variant === 'medical_aesthetics') return 'Treatment options explained with trust and restraint.';
  if (context.variant === 'auto_service') return 'Packages paired with transformation proof.';
  if (context.variant === 'pet_service') return 'Grooming options and booking cues in one place.';
  if (context.variant === 'fitness_studio') return 'Classes and intro paths built for new members.';
  if (context.variant === 'professional_service') return 'Services, proof, and inquiry fit made clear.';
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

  if (isServiceMockupTemplate(context.variant)) {
    return `Core options like ${titles} are framed as service, appointment, proof, or estimate decisions instead of generic cards.`;
  }
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

function visitSectionEyebrow(context: SiteContext) {
  if (context.variant === 'contractor') return 'Service area and estimate';
  if (context.variant === 'home_service') return 'Service area and contact';
  if (context.variant === 'medical_aesthetics') return 'Location and consultation';
  if (context.variant === 'auto_service') return 'Booking and service area';
  if (context.variant === 'pet_service') return 'Location and appointments';
  if (context.variant === 'fitness_studio') return 'Schedule and first visit';
  if (context.variant === 'professional_service') return 'Contact and consultation';
  if (context.variant === 'local_service') return 'Service area';
  if (context.variant === 'food_truck') return 'Location schedule';
  return 'Plan your visit';
}

function visitHint(context: SiteContext) {
  if (context.variant === 'contractor') return 'Confirm fit before asking for project details.';
  if (context.variant === 'home_service') return 'Confirm coverage before the quote request.';
  if (context.variant === 'medical_aesthetics') return 'Make consultation location and booking feel clear.';
  if (context.variant === 'auto_service') return 'Show service area before package comparison gets long.';
  if (context.variant === 'pet_service') return 'Keep appointment details close to grooming services.';
  if (context.variant === 'fitness_studio') return 'Make the first visit easy to picture.';
  if (context.variant === 'professional_service') return 'Clarify how to start the inquiry.';
  if (context.variant === 'food_truck') return 'Show the next stop before the menu gets long.';
  if (context.variant === 'local_service') return 'Confirm service area before asking for the quote.';
  return 'Address, hours, and next step stay out of the footer maze.';
}

function bestTimeLabel(context: SiteContext) {
  if (context.variant === 'contractor') return 'Estimate timing';
  if (context.variant === 'home_service') return 'Next available window';
  if (context.variant === 'medical_aesthetics') return 'Consultation timing';
  if (context.variant === 'auto_service') return 'Booking window';
  if (context.variant === 'pet_service') return 'Appointment availability';
  if (context.variant === 'fitness_studio') return 'First class or intro';
  if (context.variant === 'professional_service') return 'Consultation availability';
  if (context.variant === 'bar_grill') return 'Tonight or this weekend';
  if (context.variant === 'coffee_shop') return 'Morning, lunch, or afternoon';
  if (context.variant === 'premium_dining') return 'Date night or private dining';
  if (context.variant === 'food_truck') return 'Next stop or event';
  if (context.variant === 'local_service') return 'Book the first available slot';
  return 'Pick the visit window';
}

function bestTimeBody(context: SiteContext) {
  if (context.variant === 'contractor') return 'Explain what happens after the estimate request.';
  if (context.variant === 'home_service') return 'Pair availability with proof and a simple quote CTA.';
  if (context.variant === 'medical_aesthetics') return 'Keep expectations calm before the booking step.';
  if (context.variant === 'auto_service') return 'Connect package choice to an easy booking action.';
  if (context.variant === 'pet_service') return 'Make grooming availability and contact details easy to find.';
  if (context.variant === 'fitness_studio') return 'Connect the schedule to the lowest-friction first visit.';
  if (context.variant === 'professional_service') return 'Explain the inquiry step before asking for contact.';
  if (context.variant === 'bar_grill') return 'Give happy hour and events the same visibility as the menu.';
  if (context.variant === 'coffee_shop') return 'Help visitors choose the drink, the pickup, or the place to sit.';
  if (context.variant === 'premium_dining') return 'Route guests by occasion before they compare alternatives.';
  if (context.variant === 'food_truck') return 'Treat schedule updates like core homepage content.';
  if (context.variant === 'local_service') return 'Make proof and quote timing feel immediate.';
  return 'Make the practical details part of the decision.';
}

function contactLabel(context: SiteContext) {
  if (context.variant === 'contractor') return 'Estimate request';
  if (context.variant === 'home_service') return 'Quote or call';
  if (context.variant === 'medical_aesthetics') return 'Book consultation';
  if (context.variant === 'auto_service') return 'Book detail';
  if (context.variant === 'pet_service') return 'Book appointment';
  if (context.variant === 'fitness_studio') return 'Start trial';
  if (context.variant === 'professional_service') return 'Request consultation';
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
  if (/menu|service|treatment|class|project|package|grooming/i.test(item)) return '#menu';
  if (/visit|location|hour|area|contact|schedule/i.test(item)) return '#visit';
  if (/event|happy|order|reserve|donate|volunteer|book|quote|estimate|consultation|trial|cater/i.test(item)) {
    return '#primary-action';
  }
  if (/story|community|mission|review|award|result|loyal|proof|provider|coach|about|process/i.test(item)) return '#content';
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
    project: 'Project and before-after proof',
    treatment: 'Treatment and provider trust photo',
    vehicle: 'Vehicle transformation photo',
    pet: 'Happy pet grooming photo',
    fitness: 'Class and community photo',
    office: 'Consultation and process photo',
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
    home_service: <House size={18} />,
    contractor: <Hammer size={18} />,
    medical_aesthetics: <Sparkles size={18} />,
    auto_service: <Car size={18} />,
    pet_service: <PawPrint size={18} />,
    fitness_studio: <Dumbbell size={18} />,
    professional_service: <BriefcaseBusiness size={18} />,
    local_service: <Wrench size={18} />,
    coffee_shop: <Coffee size={18} />,
    restaurant: <Utensils size={18} />,
    bar_grill: <Music2 size={18} />,
    premium_dining: <Sparkles size={18} />,
    nonprofit_cafe: <HeartHandshake size={18} />,
    food_truck: <Navigation size={18} />,
  };
  return icons[variant];
}
