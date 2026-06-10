# Apex V2 Social + Website Batch Rules

These rules apply to every Apex public website mockup batch across every niche. Do not treat public mockup quality as an auto-detail-only issue.

## Public Mockup Standard

A selected prospect must be good enough for Apex to send a public website concept and public social/content audit to a real business owner. If the agent cannot create a credible personalized concept for that business, reject the prospect or use inline brief mode instead.

Public mockup modes:

- `public_mockup`
- `link_plus_summary`

Inline Apex briefs are not public mockups and are not blocked by the public mockup gate.

## Required Fields

Every selected Apex public mockup record must include:

- `approved_archetype`
- `personalization_score` >= 85
- `design_family`
- `layout_signature`
- `visual_profile`
- `media_assets`
- `proof_assets`
- `gallery_assets`
- `visual_direction`
- `brand_tone`
- `hero_mode`
- `image_treatment`
- `cta_style`
- `proof_style`
- `palette_direction`
- `typography_direction`
- `photo_strategy`
- `section_priority`
- specific `website_issue_examples`
- specific `social_audit`
- specific `content_plan`

## Approved Archetypes

Only these `approved_archetype` values may be used:

- `premium_service_landing`: home services, local services, HVAC, plumbing, electrical, cleaning, pressure washing, garage doors, windows/doors.
- `proof_first_contractor`: contractors, remodelers, roofing, siding, concrete, landscaping, hardscaping, deck builders, fencing, flooring contractors.
- `transformation_showcase`: auto detail, ceramic coating, tint, salons where transformation proof matters, fitness transformations when appropriate.
- `clean_clinic_conversion`: med spas, aesthetics, dental, orthodontics, wellness clinics.
- `warm_local_booking`: pet grooming, local appointment services, family-friendly service businesses, warmth-led salons/barbershops.
- `hospitality_experience`: restaurants, cafes, event spaces, hospitality businesses only.
- `professional_trust_page`: professional services, studios, consultants, photographers, local B2B services.
- `fitness_energy_page`: gyms, fitness studios, pilates/yoga, personal training.

Do not use arbitrary `design_family`, `layout_signature`, or `template_variant` choices to bypass the archetype quality standard.

## Hard Reject Rules

Reject or mark not outreach-ready if any are true:

- `approved_archetype` is missing or invalid.
- `personalization_score` is below 85.
- Fewer than 3 specific `website_issue_examples`.
- Hero headline is generic, awkward, all-caps stacked, or could apply to almost any business.
- Proposed nav, homepage sections, offer items, trust signals, CTA strategy, or visual direction are generic.
- Media assets are empty without a strong fallback reason.
- Social audit or content plan is generic.
- Email promises `[Mockup Link]` but the mockup data is thin.
- Non-food businesses use food/hospitality labels.
- Public email appears guessed instead of publicly sourced.
- Record could apply to any business in the same niche.

## Banned Copy

Do not use these patterns in public mockups:

- "Make the result easier to trust"
- "Make the [service] easier to trust fast"
- "Premium services for your lifestyle"
- "High-quality services you can trust"
- "Your trusted local experts"
- "Transform your experience"
- "Elevate your brand"
- "Boost your online presence"
- "Modern solutions"
- "Professional services for every need"
- "Experience the difference"

Use specific alternatives tied to the business, offer, proof, and CTA path.

## Niche Standards

Auto detail, tint, ceramic coating:

- Required: package/booking path, result/proof section, process section, reviews/trust, `Book Detail` or equivalent CTA, controlled premium typography.
- Reject giant awkward headlines and concepts without packages/process/results.

Contractors, remodelers, roofing, landscaping:

- Required: project proof, estimate path, service/scope cards, process, reviews/trust, service area, project gallery or proof plan.
- Reject generic "quality work" concepts.

Med spa, dental, aesthetics:

- Required: treatment clarity, provider/trust section, consultation CTA, what-to-expect, reviews/proof, compliant language.
- Reject hype, unsupported claims, flaw language, and generic luxury templates.

Pet grooming:

- Required: grooming services, booking CTA, safety/trust, location/hours, happy-pet proof or media strategy.
- Reject restaurant/hospitality framing.

Fitness:

- Required: class/program cards, coach/community proof, start trial or book class CTA, transformation/lifestyle proof.
- Reject generic motivation pages.

Professional services:

- Required: service clarity, process, authority/proof, consult/contact CTA, restrained premium layout.
- Reject vague "solutions" language.

Home services:

- Required: services, proof/reviews, service area, get quote/call CTA, process/what-to-expect.
- Reject concepts without immediate service clarity or service-area proof.

Restaurants/hospitality:

- Only use food/hospitality labels for true food, venue, or hospitality prospects.
- Required: reservation/visit/menu/occasion clarity, social proof, event/private dining flow if relevant.

## Batch Distribution

For every 10 selected records:

- No more than 3 should use the same `approved_archetype` unless justified.
- No more than 3 should use the same `design_family` unless justified.
- No more than 3 should use the same `layout_signature` unless justified.

For 20 selected records:

- No more than 4 should use the same `approved_archetype`.
- No more than 4 should use the same `design_family`.
- No more than 4 should use the same `layout_signature`.

## Selection Rule

A prospect is not selected if the agent cannot create both:

- a credible personalized public website concept
- a credible personalized public social/content audit

When public mockup quality is thin, use inline brief mode for volume instead of forcing a public mockup.
