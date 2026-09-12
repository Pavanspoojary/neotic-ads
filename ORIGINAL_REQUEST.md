# Original User Request

## Initial Request — 2026-09-11T15:39:54Z

SponsorSlot is a programmatic and flat-rate in-app micro-sponsorship registry and marketplace that connects high-engagement micro-tools (developer dev-tools, Chrome extensions, utilities with 500–25k DAU) with context-driven B2B advertisers seeking native, non-intrusive in-app placements on automated 30-day terms.

Working directory: /Users/pavanspoojary/Developer/Neotic ads
Integrity mode: development

## Requirements

### R1. Marketplace Discovery & Public Directory
Searchable and filterable marketplace directory showcasing verified micro-SaaS and Chrome extension listings by category (developer-tools, productivity, design, utilities), verified DAU, and slot price. Dedicated public listing pages (`/tools/[slug]`) display active inventory slots, historical telemetry, and real-time availability.

### R2. Creator Portal & Inventory Slot Management
Complete listing onboarding for tool creators to register their applications, define standardized inventory slots (`header_pill`, `empty_state`, `footer_badge`, `email_footer`), set monthly rental rates ($50–$1,000/mo), establish sponsor guidelines, and configure traffic verification badges (Chrome Web Store, GA4/Plausible).

### R3. Advertiser Creative Booking & Escrow Billing Engine
Advertiser self-serve checkout and campaign management: advertisers select available slots, submit creative assets (display copy, target destination URL, SVG badge/logo), preview live rendering in native mock contexts, and execute 30-day recurring escrow holds with automated 15% platform fee deduction and creator payout scheduling.

### R4. Edge Delivery API & Embeddable Client SDK
High-throughput, low-latency creative delivery engine:
1. Headless JSON API (`/api/v1/slot/[id]`) for modern micro-SaaS and Chrome extensions (Manifest V3 compliant).
2. Plug-and-play script (`embed.js`) for zero-code web utilities rendering native responsive ad formats.
3. Telemetry beacon endpoint (`/api/v1/telemetry/beacon`) to record verified daily impressions and clicks without storing PII.
4. Native fallback states displaying viral self-serve referral badges (`⚡ Place your product here via SponsorSlot`).

### R5. Telemetry Analytics & Verification Badges
Comprehensive reporting dashboards for both creators (earnings, active sponsorships, live telemetry) and advertisers (CTR, impressions, campaign status), backed by verifiable traffic indicators (Chrome Web Store API sync, analytics telemetry).

### R6. Production Engineering & Ponytail Adherence
Production-grade Next.js App Router application with TypeScript, Tailwind CSS, PostgreSQL/Supabase data model with Row Level Security (RLS) policies, clean modular architecture, and zero speculative bloat.

## Acceptance Criteria

### Marketplace & Directory
- [ ] Public directory renders responsive search, category filtering, and DAU range sorting.
- [ ] Detail page (`/tools/[slug]`) accurately reflects listing metadata, inventory slots, and live availability.

### Creator & Advertiser Workflows
- [ ] Creators can create and manage listings and customize inventory slots with pricing.
- [ ] Advertisers can configure creatives, see live mock previews across all 4 slot formats, and submit sponsorships.
- [ ] Billing calculation accurately executes 15% platform take rate and 85% creator payout allocations.

### Edge Delivery & Telemetry
- [ ] GET `/api/v1/slot/[id]` returns cached JSON creative payload with sub-50ms response profile.
- [ ] `embed.js` successfully renders native pill, empty state, and footer formats into DOM without stylesheet conflicts.
- [ ] Unfilled slots automatically fall back to the self-serve CTA badge with referral tracking.
- [ ] Telemetry beacons correctly increment impression and click counters in PostgreSQL.

### Quality & Verification
- [ ] Automated integration test suite runs and passes (testing slot delivery, booking calculation, telemetry ingestion, and listing retrieval).
- [ ] TypeScript compiles cleanly with zero type errors (`tsc --noEmit`).
- [ ] Zero mock placeholders or broken vibe-coded stubs; all interactive flows persist and execute real application logic.
