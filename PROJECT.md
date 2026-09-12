# Project: SponsorSlot

## Architecture
SponsorSlot is a programmatic and flat-rate in-app micro-sponsorship registry and marketplace connecting high-engagement micro-tools (developer dev-tools, Chrome extensions, utilities with 500–25k DAU) with context-driven B2B advertisers seeking native, non-intrusive placements on 30-day terms.

### Key Architectural Layers
1. **Presentation Layer (Next.js App Router)**:
   - Modern React Server Components (RSC) and Client Components with Tailwind CSS.
   - Public Marketplace Directory (`/`), Tool Details (`/tools/[slug]`), Creator Portal (`/creator`), Advertiser Booking Checkout (`/sponsor/[slotId]`), and Telemetry Analytics Dashboards (`/dashboard`).
2. **Edge Delivery & Embed SDK Layer**:
   - High-throughput headless JSON API (`/api/v1/slot/[id]`) with HTTP cache headers, CORS, and sub-50ms latency profile.
   - Standalone client SDK (`/embed.js`) rendering native ad formats (`header_pill`, `empty_state`, `footer_badge`, `email_footer`) into host DOM using Shadow DOM isolation (`attachShadow({ mode: 'open' })`) to prevent host stylesheet clashes.
   - Unfilled slot fallback referral badges (`⚡ Place your product here via SponsorSlot`).
   - Telemetry beacon endpoint (`/api/v1/telemetry/beacon`) for atomic zero-PII daily impression and click counting.
3. **Domain & Billing Engine**:
   - Strict 30-day recurring terms with exact integer-cent escrow calculation: 15% platform take-rate, 85% creator payout allocation (`platform_fee_cents + creator_payout_cents === monthly_amount_cents`).
   - Slot rental rates bounded strictly between $50.00 and $1,000.00/month (5,000 to 100,000 cents).
4. **Data Access Layer Seam (`lib/db.ts`)**:
   - Strongly-typed repository interface querying Supabase/PostgreSQL (`https://vbipkwlpubecsswmbeom.supabase.co`) with Row Level Security (RLS) in production, with an in-memory repository store for rapid, deterministic, zero-network-flakiness automated tests.

---

## Feature Inventory

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Next.js App Router Scaffolding | Next.js 14/15 project structure with TypeScript, Tailwind CSS, and strict lint/build configs | M1 | survey_1, R6 |
| 2 | PostgreSQL DDL & Migrations | Database schema with tables, enums, check constraints, foreign keys, and indexes | M1 | survey_1, survey_2, survey_3 |
| 3 | Seam Database Layer (`lib/db.ts`) | Unified database interface supporting Supabase and in-memory test store | M1 | survey_1, R6 |
| 4 | Financial Escrow Logic (`lib/escrow.ts`) | Integer-cent 15% platform fee and 85% creator payout calculations with zero penny leakage | M1 | survey_2, survey_3, R3 |
| 5 | Database Seed Fixtures | Realistic seed data for developer tools, Chrome extensions, inventory slots, and telemetry | M1 | survey_1 |
| 6 | Public Marketplace Grid | Responsive grid showcasing verified micro-SaaS and Chrome extension listings | M2 | survey_2, R1 |
| 7 | Category Filtering | Multi-facet filtering by category (`developer-tools`, `productivity`, `design`, `utilities`) | M2 | survey_2, R1 |
| 8 | App Type Filtering | Filtering by app architecture (`web_app`, `chrome_extension`, `desktop_app`) | M2 | survey_2, R1 |
| 9 | Keyword Search | Case-insensitive title and description search across listings | M2 | survey_2, R1 |
| 10 | DAU Range & Sorting | Filter by minimum DAU and sort by DAU (desc/asc) or monthly price | M2 | survey_2, R1 |
| 11 | Availability Filter | Toggle to filter for tools with currently vacant, rentable slots | M2 | survey_2, R1 |
| 12 | Tool Detail Page (`/tools/[slug]`) | Comprehensive detail page showing tool overview, verified DAU, website, and slots | M2 | survey_2, R1 |
| 13 | Inventory Slot Showcase | Display of active inventory slots with format badges, rental rates, and live availability | M2 | survey_2, R1 |
| 14 | Historical Telemetry Display | Visual display of 30-day impressions, clicks, and CTR per slot on detail page | M2 | survey_2, R1 |
| 15 | Creator Listing Onboarding | Onboarding form for tool creators to register applications with metadata | M3 | survey_2, R2 |
| 16 | Slug Generation & Validation | Auto-generated slug with kebab-case normalization and uniqueness check | M3 | survey_2, R2 |
| 17 | Standardized Slot Configuration | Creator UI to configure slots with allowed types (`header_pill`, `empty_state`, `footer_badge`, `email_footer`) | M3 | survey_2, R2 |
| 18 | Rental Rate Validation ($50–$1,000/mo) | Client & server validation enforcing rental rates between 5,000 and 100,000 cents | M3 | survey_2, R2 |
| 19 | Sponsor Guidelines Definition | Creator-defined rules and guidelines for acceptable sponsor verticals | M3 | survey_2, R2 |
| 20 | Traffic Verification Badges | Configuration and display of verification sources (Chrome Web Store, GA4, Plausible, manual) | M3 | survey_2, R2, R5 |
| 21 | Integration Snippet Generator | Copyable code generator for Headless JSON API (`fetch`) and `<script src="embed.js">` | M3 | survey_2, R2, R4 |
| 22 | Advertiser Booking Checkout (`/sponsor/[slotId]`) | Self-serve booking interface displaying slot terms, rate, and sponsor guidelines | M4 | survey_2, R3 |
| 23 | Creative Asset Submission | Form accepting creative text, target destination URL, and optional SVG logo | M4 | survey_2, R3 |
| 24 | Target URL Security & UTM Enrichment | Automatic URL validation (HTTPS) and UTM campaign parameter appending | M4 | survey_2, R3 |
| 25 | SVG Sanitization | Sanitization of SVG logo assets to eliminate stored XSS vectors | M4 | survey_2, R3 |
| 26 | Live Slot Mock Previews | Interactive real-time previews for all 4 slot formats in mock app contexts | M4 | survey_2, R3 |
| 27 | 30-Day Escrow Reservation | Atomic database reservation holding slot in escrow and marking it occupied | M4 | survey_2, R3 |
| 28 | Headless Slot Delivery API (`/api/v1/slot/[id]`) | Sub-50ms JSON endpoint delivering active creative or fallback CTA | M5 | survey_3, R4 |
| 29 | Edge Caching & CORS Headers | Public caching headers (`s-maxage=300`, `stale-while-revalidate=600`) and open CORS | M5 | survey_3, R4 |
| 30 | Manifest V3 Compliance | Pure declarative JSON creative payloads without remote executable scripts | M5 | survey_3, R4 |
| 31 | Embed Client SDK (`public/embed.js`) | Zero-dependency client script injecting native responsive ads into host DOM | M5 | survey_3, R4 |
| 32 | Shadow DOM Style Encapsulation | Encapsulating ad styles using Shadow DOM to eliminate stylesheet conflicts | M5 | survey_3, R4 |
| 33 | Unfilled Slot Fallback Referral Badge | Automatic viral fallback rendering `⚡ Place your product here via SponsorSlot` | M5 | survey_3, R4 |
| 34 | Telemetry Beacon Endpoint (`/api/v1/telemetry/beacon`) | Endpoint receiving impression/click pings without storing PII | M5 | survey_3, R4 |
| 35 | Atomic PostgreSQL Telemetry Upsert | High-throughput atomic upsert on conflict `(slot_id, telemetry_date)` | M5 | survey_3, R4 |
| 36 | Creator Earnings Dashboard (`/dashboard`) | Dashboard showing active sponsorships, monthly gross revenue, and 85% net payouts | M6 | survey_2, survey_3, R5 |
| 37 | Advertiser Campaign Dashboard (`/dashboard`) | Dashboard showing active campaigns, daily impressions, daily clicks, and CTR | M6 | survey_2, survey_3, R5 |
| 38 | Chrome Web Store Verification API | Endpoint/helper syncing Chrome Web Store active users and ratings | M6 | survey_2, survey_3, R5 |
| 39 | Automated Integration Test Suite (Tiers 1-4) | Comprehensive test suite verifying all public seams, API contracts, and calculations | M7 | survey_1, survey_3, R6 |
| 40 | Adversarial Hardening (Tier 5) | Adversarial test coverage for edge cases, concurrency, and security | M7 | survey_3, R6 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core Foundations, Schema & Seam DB | Next.js App Router scaffold, Tailwind, TypeScript contracts, PostgreSQL DDL/migrations, `lib/db.ts` seam, `lib/escrow.ts`, seed fixtures | none | DONE |
| M2 | Marketplace Discovery & Public Directory (R1) | Marketplace grid, search, category/app_type filters, DAU sorting, `/tools/[slug]` detail page, slot showcase, live availability | M1 | DONE |
| M3 | Creator Portal & Inventory Slot Management (R2) | Creator onboarding (`/creator`), listing CRUD, standardized slot CRUD (4 formats), $50-$1,000/mo validation, guidelines, verification badges, snippet generator | M1 | IN_PROGRESS |
| M4 | Advertiser Creative Booking & Escrow Core (R3) | Advertiser booking (`/sponsor/[slotId]`), creative assets submission, live mock previews across all 4 formats, 30-day escrow hold, 15%/85% fee math | M1 | PLANNED |
| M5 | Edge Delivery API & Embeddable Client SDK (R4) | Sub-50ms `/api/v1/slot/[id]` endpoint, CORS/caching, `public/embed.js` with Shadow DOM, unfilled fallback referral badge, atomic `/api/v1/telemetry/beacon` | M1 | PLANNED |
| M6 | Telemetry Analytics & Verification Dashboards (R5) | Creator & advertiser dashboards (`/dashboard`), CTR & telemetry aggregation, Chrome Web Store sync helper/API | M2, M3, M4, M5 | PLANNED |
| M7 | Final Milestone: 100% E2E Test Suite Pass & Adversarial Hardening | Pass 100% of E2E tests (Tiers 1-4), Tier 5 adversarial coverage hardening, zero type errors (`tsc --noEmit`), zero mock placeholders | M2, M3, M4, M5, M6 | PLANNED |

---

## Interface Contracts

### Domain Models (`lib/types.ts`)
```typescript
export type ListingCategory = 'developer-tools' | 'productivity' | 'design' | 'utilities';
export type AppType = 'web_app' | 'chrome_extension' | 'desktop_app';
export type SlotType = 'header_pill' | 'empty_state' | 'footer_badge' | 'email_footer';
export type VerificationSource = 'chrome_web_store' | 'plausible' | 'posthog' | 'ga4' | 'manual';
export type SponsorshipStatus = 'escrow_held' | 'active' | 'completed' | 'disputed' | 'cancelled';

export interface Listing {
  id: string;
  creator_id?: string;
  title: string;
  slug: string;
  description: string;
  category: ListingCategory;
  app_type: AppType;
  website_url: string;
  verified_dau: number;
  verification_source: VerificationSource;
  status: 'draft' | 'active' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface InventorySlot {
  id: string;
  listing_id: string;
  slot_name: string;
  slot_type: SlotType;
  monthly_price_cents: number; // 5000 to 100000 ($50 to $1,000)
  is_available: boolean;
  max_sponsors: number;
  guidelines?: string;
  created_at: string;
}

export interface Sponsorship {
  id: string;
  slot_id: string;
  sponsor_name: string;
  sponsor_email: string;
  status: SponsorshipStatus;
  creative_text: string;
  creative_target_url: string;
  creative_image_url?: string;
  start_date: string;
  end_date: string;
  monthly_amount_cents: number;
  platform_fee_cents: number; // exactly Math.round(monthly_amount_cents * 0.15)
  creator_payout_cents: number; // monthly_amount_cents - platform_fee_cents
  created_at: string;
}

export interface ImpressionTelemetry {
  id: string;
  slot_id: string;
  telemetry_date: string;
  impressions_count: number;
  clicks_count: number;
}
```

### Escrow Core Contract (`lib/escrow.ts`)
```typescript
export interface EscrowSplit {
  monthly_amount_cents: number;
  platform_fee_cents: number;
  creator_payout_cents: number;
  take_rate_percentage: number;
}

export function calculateEscrowSplit(amountCents: number): EscrowSplit {
  if (amountCents < 5000 || amountCents > 100000) {
    throw new Error('Monthly rate must be between $50.00 and $1,000.00 (5,000 to 100,000 cents)');
  }
  const platform_fee_cents = Math.round(amountCents * 0.15);
  const creator_payout_cents = amountCents - platform_fee_cents;
  return {
    monthly_amount_cents: amountCents,
    platform_fee_cents,
    creator_payout_cents,
    take_rate_percentage: 15,
  };
}
```

### Edge Delivery API Contract (`GET /api/v1/slot/[id]`)
- **Status 200 OK**:
```json
{
  "active": true,
  "slot_id": "uuid",
  "slot_type": "header_pill",
  "text": "Monitor your Next.js apps with LogFast",
  "url": "https://logfast.io?utm_source=sponsorslot&utm_medium=header_pill",
  "badge": "https://example.com/badge.svg",
  "fallback": false,
  "beacon": {
    "endpoint": "/api/v1/telemetry/beacon",
    "slot_id": "uuid"
  }
}
```
- **Fallback 200 OK (Unfilled)**:
```json
{
  "active": false,
  "slot_id": "uuid",
  "slot_type": "header_pill",
  "text": "⚡ Place your product here via SponsorSlot",
  "url": "https://sponsorslot.dev/tools/slug?slot=uuid&ref=unfilled_slot",
  "fallback": true,
  "monthly_price_cents": 15000,
  "beacon": {
    "endpoint": "/api/v1/telemetry/beacon",
    "slot_id": "uuid"
  }
}
```

---

## Code Layout
```
/Users/pavanspoojary/Developer/Neotic ads/
├── package.json
├── tsconfig.json
├── next.config.mjs
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── embed.js
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── tools/[slug]/page.tsx
│   │   ├── creator/page.tsx
│   │   ├── sponsor/[slotId]/page.tsx
│   │   ├── dashboard/page.tsx
│   │   └── api/
│   │       ├── v1/slot/[id]/route.ts
│   │       ├── v1/telemetry/beacon/route.ts
│   │       ├── listings/route.ts
│   │       ├── slots/route.ts
│   │       └── sponsorships/route.ts
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── MarketplaceGrid.tsx
│   │   ├── SlotPreviewMock.tsx
│   │   ├── VerificationBadge.tsx
│   │   ├── EscrowBreakdown.tsx
│   │   └── TelemetryChart.tsx
│   └── lib/
│       ├── types.ts
│       ├── db.ts
│       ├── supabase.ts
│       ├── escrow.ts
│       └── verification.ts
├── supabase/
│   ├── migrations/
│   │   └── 20260911000000_init_sponsorslot.sql
│   └── seed.sql
└── tests/
    ├── unit/
    │   ├── escrow.test.ts
    │   └── slot-types.test.ts
    ├── integration/
    │   ├── slot-delivery.test.ts
    │   ├── telemetry-beacon.test.ts
    │   ├── booking-escrow.test.ts
    │   └── marketplace.test.ts
    └── test-utils.ts
```
