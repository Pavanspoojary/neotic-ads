# SponsorSlot Test Infrastructure & Quality Assurance Specification (TEST_INFRA.md)

## 1. Test Philosophy & Principles

SponsorSlot is a flat-rate in-app micro-sponsorship marketplace and edge delivery platform connecting high-engagement micro-tools with context-driven B2B advertisers. The testing infrastructure adheres to the following core tenets:

1. **Opaque-Box Testing**: Tests verify observable behavior at public seams (HTTP REST endpoints, client SDK DOM outputs, database repository queries, and mathematical financial invariants). Tests do not couple to private classes, internal helper routines, or implementation file structures. Refactoring internal logic will never break tests as long as the public interface contract holds.
2. **Requirement-Driven Expected Outputs**: Expected outputs for all assertions are derived directly from authoritative requirements (`ORIGINAL_REQUEST.md`, `PROJECT.md`, and mathematical domain invariants), never by re-implementing or mimicking speculative code.
3. **Ponytail Senior Engineering Adherence**:
   - **Standard Library First**: Test execution leverages Node.js's native test runner (`node:test`) and assertion library (`node:assert/strict`) with native TypeScript support (`--experimental-strip-types`). No heavy third-party runners, mocking plugins, or bloated test harnesses are required.
   - **Deterministic, Zero-Network Seams**: In-memory repository stores provide sub-millisecond, hermetic test execution without relying on live Supabase network round-trips or live payment gateway sandbox flakiness.
4. **Adversarial & Boundary Verification**: Testing explicitly targets malicious payloads (XSS in SVG uploads, script tags in creative copy), numerical boundaries ($50.00 to $1,000.00/mo, odd cents, zero penny loss), concurrency races (simultaneous slot bookings), and network edge conditions (malformed UUIDs, non-PII beacon ingestion).

---

## 2. 4-Tier Test Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │   Tier 4: Real-World Application Scenarios   │
                                  │  - End-to-end Publisher Journey (M2->M3->M5) │
                                  │  - End-to-end Advertiser Journey (M2->M4->M5)│
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                  ┌──────────────────────┴───────────────────────┐
                                  │  Tier 3: Cross-Feature Pairwise Interactions │
                                  │  - Listing -> Slot -> Booking -> Delivery    │
                                  │  - Edge Delivery -> Telemetry -> Dashboard   │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                  ┌──────────────────────┴───────────────────────┐
                                  │     Tier 2: Boundary & Corner Case Tests     │
                                  │  - Pricing ($50-$1,000), Odd Cents Math      │
                                  │  - SVG XSS Sanitization, Concurrent Mutex    │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                  ┌──────────────────────┴───────────────────────┐
                                  │        Tier 1: Feature Unit & Seam Tests     │
                                  │  - 40 Features in PROJECT.md (>= 5 tests/ea) │
                                  │  - Escrow Math, Delivery API, Telemetry API  │
                                  └──────────────────────────────────────────────┘
```

### Tier 1: Core Feature Verification
Validates the fundamental contract of every feature in isolation. Each feature has at least 5 dedicated unit or seam tests verifying its primary happy path, expected HTTP status codes, output schema conformity, and standard error handling.

### Tier 2: Boundary & Corner Cases
Targets boundary conditions and edge cases:
- **Price Bounds**: Exactly $50.00 (5,000 cents) and $1,000.00 (100,000 cents); rejection of 4,999 cents and 100,001 cents.
- **Penny Leakage**: Invariant `platform_fee_cents + creator_payout_cents === monthly_amount_cents` tested across tricky roundings ($99.99, $79.99, $149.95, and 5,000 consecutive cent amounts).
- **String Lengths & Enums**: Max lengths for `header_pill` (80 chars), `empty_state` (200 chars), `footer_badge` (60 chars), `email_footer` (120 chars); rejection of invalid slot enums.
- **Security & XSS**: SVG logo uploads with embedded `<script>`, `onload`, `javascript:` URI vectors; target URL sanitization (forcing HTTPS).
- **Concurrency & Locking**: Double-booking race conditions where two simultaneous transactions attempt to reserve the same vacant slot.

### Tier 3: Cross-Feature Combinations
Validates interaction points between interconnected subsystems:
- **Flow A (Catalog to Booking)**: Creator onboarding -> Listing publication -> Inventory slot creation -> Public directory indexing -> Search & Category filtering -> Tool detail page retrieval.
- **Flow B (Booking to Edge Delivery)**: Available slot checkout -> Escrow hold -> 30-day term reservation -> Edge delivery API switches from unfilled fallback badge to sponsored creative -> embed.js injects creative with Shadow DOM encapsulation.
- **Flow C (Delivery to Analytics)**: Creative rendered in client -> Telemetry beacon fired -> Atomic PostgreSQL daily upsert -> Creator dashboard aggregate MRR & CTR updated -> Advertiser dashboard daily delivery updated.

### Tier 4: Real-World Application Scenarios
Simulates realistic end-to-end user journeys:
- **Scenario 1 (Chrome Extension Publisher)**: A developer registers a 12,500 DAU Chrome extension ("TabMaster"), links Chrome Web Store verification, defines a `header_pill` slot ($150/mo), copies the embed snippet, observes the fallback referral badge, receives an advertiser booking, and monitors net 85% payouts and impressions on the creator dashboard.
- **Scenario 2 (B2B SaaS Advertiser)**: A marketer searches the directory for "developer-tools" with >5,000 DAU, selects an available `empty_state` slot, inputs creative copy and HTTPS destination URL, tests the live mock preview, executes 30-day escrow hold, observes active delivery via the JSON API, triggers beacon telemetry, and checks live CTR on the advertiser dashboard.

---

## 3. Feature Inventory Coverage Matrix (All 40 Features)

| # | Feature Name | Milestone | Tier 1 Unit / Seam Tests | Tier 2 Boundary Tests | Tier 3 Interaction Pairs | Tier 4 User Scenario |
|---|--------------|-----------|--------------------------|-----------------------|--------------------------|----------------------|
| 1 | Next.js App Router Scaffolding | M1 | Route resolution, layout rendering, RSC vs Client headers, static assets | Path traversal attempts, malformed URL encodings | Page routing to API handlers | Clean initial navigation flow |
| 2 | PostgreSQL DDL & Migrations | M1 | Schema tables exist, columns, types, primary keys, foreign keys | Check constraints ($50-$1,000), cascade rules | Entity relation joins (listing -> slots -> telemetry) | Fresh DB schema bootstrap |
| 3 | Seam Database Layer (`lib/db.ts`) | M1 | Repository CRUD, memory store adapter, Supabase adapter parity | Null params, SQL injection safety, empty result sets | Repository integration with route handlers | Multi-tenant query isolation |
| 4 | Financial Escrow Logic (`lib/escrow.ts`) | M1 | 15% platform fee, 85% creator payout, mathematical sum balance | $50.00 min, $1,000.00 max, 4999 & 100001 rejection, odd cents | Escrow split injected into sponsorship record | Advertiser payment breakdown |
| 5 | Database Seed Fixtures | M1 | Seed loader integrity, default dev-tools, slots, sample telemetry | Seed duplicate idempotency, missing foreign key handling | Directory search over seed fixtures | Initial demo environment boot |
| 6 | Public Marketplace Grid | M2 | Directory grid render, card fields, title, slug, verified DAU | Empty catalog state, 100+ listings pagination | Grid query from in-memory database | Visitor explores marketplace |
| 7 | Category Filtering | M2 | Multi-category filter (`developer-tools`, `productivity`, etc.) | Invalid category param, multiple category combinations | Category filter with price sorting | Niche category discovery |
| 8 | App Type Filtering | M2 | App type filter (`web_app`, `chrome_extension`, `desktop_app`) | Unrecognized app type string, null app type | App type filter combined with DAU filter | Chrome extension advertiser search |
| 9 | Keyword Search | M2 | Case-insensitive title and description keyword search | Special regex characters, whitespace, empty query string | Search combined with category filter | Advertiser searches "linter" |
| 10 | DAU Range & Sorting | M2 | `min_dau` threshold filter, sorting by DAU desc/asc, price asc/desc | Negative DAU input, extreme DAU (1,000,000+), tie-breakers | DAU filter combined with keyword search | Marketer finds high-traffic tools |
| 11 | Availability Filter | M2 | `available_only=true` filter returning tools with vacant slots | Tools with 0 slots, tools with 100% occupied slots | Availability toggle dynamically updating results | Advertiser seeking instant booking |
| 12 | Tool Detail Page (`/tools/[slug]`) | M2 | Slug lookup, profile metadata, website link, slot inventory list | Non-existent slug (404), draft listing slug hidden | Slug route calling listing repository | Public listing viewer |
| 13 | Inventory Slot Showcase | M2 | Slot card render, format badges, pricing, availability indicator | Slot without guidelines, multi-slot rendering order | Detail page rendering live slot cards | Advertiser choosing slot format |
| 14 | Historical Telemetry Display | M2 | 30-day aggregate impressions, clicks, calculated CTR render | Zero impressions (0% CTR, no NaN), missing historical dates | Detail page querying telemetry table | Advertiser inspecting engagement |
| 15 | Creator Listing Onboarding | M3 | POST `/api/creator/listings` validation, field mapping | Missing title, invalid website URL, description > 500 chars | Onboarding form creating database record | Tool creator registers first app |
| 16 | Slug Generation & Validation | M3 | Auto-kebab normalization (`"My Cool App!" -> "my-cool-app"`) | Special characters, accents, collision resolution (`-2`) | Listing creation with slug generation | Unique slug URL generation |
| 17 | Standardized Slot Configuration | M3 | CRUD for `header_pill`, `empty_state`, `footer_badge`, `email_footer` | Invalid slot type enum, duplicate slot names | Slot creation linked to parent listing | Creator configures inventory |
| 18 | Rental Rate Validation ($50–$1,000) | M3 | Validation of 5,000 to 100,000 cents | 4,999 cents rejected, 100,001 cents rejected, float rejected | Slot rate persisted and checked in checkout | Rate enforcement across workflows |
| 19 | Sponsor Guidelines Definition | M3 | Free-text guidelines persistence (max 1000 chars) | Text > 1000 chars rejected, HTML tags escaped | Guidelines displayed on booking checkout | Creator sets acceptable verticals |
| 20 | Traffic Verification Badges | M3 | Badge metadata rendering (`chrome_web_store`, `ga4`, `plausible`) | Missing verification ID, unverified fallback | Verification badge displayed on tool card | Trust signal display to sponsors |
| 21 | Integration Snippet Generator | M3 | Snippet generator output for Headless API and `<script embed.js>` | Invalid slot ID input, special chars in slot name | Snippet generated from real slot ID | Creator copies integration tag |
| 22 | Advertiser Booking Checkout | M4 | Checkout screen data load, slot rate, guidelines, terms summary | Invalid slot ID (404), already booked slot (409) | Checkout screen receiving slot state | Advertiser arrives at checkout |
| 23 | Creative Asset Submission | M4 | Copy text submission, target destination URL submission | Empty copy, copy whitespace trimming, invalid URL format | Form payload passed to escrow hold | Advertiser configures creative |
| 24 | Target URL Security & UTM Enrichment | M4 | HTTPS validation, UTM param appending (`utm_source`, `utm_medium`) | `javascript:`, `http://`, existing query params preserved | Target URL enriched before saving | Safe destination routing |
| 25 | SVG Sanitization | M4 | Cleans SVG assets, allows safe paths/shapes | Rejects `<script>`, `onload`, `xlink:href="javascript:..."` | Sanitized SVG saved to sponsorship record | Safe advertiser logo rendering |
| 26 | Live Slot Mock Previews | M4 | Reactive mock preview across all 4 formats with live inputs | Empty input placeholders, light/dark theme switching | Form state updating preview component | Advertiser reviews live mockup |
| 27 | 30-Day Escrow Reservation | M4 | Atomic booking insert, `status='escrow_held'`, slot marked occupied | Double-booking race condition mutex check | Checkout completion triggering edge delivery | Advertiser secures 30-day lease |
| 28 | Headless Slot Delivery API | M5 | `GET /api/v1/slot/[id]` returns active creative payload | Non-existent UUID (404), malformed ID string (400) | Edge API reading from sponsorship store | Host app queries active ad |
| 29 | Edge Caching & CORS Headers | M5 | `Cache-Control: s-maxage=300`, `Access-Control-Allow-Origin: *` | OPTIONS preflight request (204), HEAD request | Browser and Chrome extension fetches | Sub-50ms low-latency delivery |
| 30 | Manifest V3 Compliance | M5 | Declarative JSON schema only, zero executable script/eval | JSON response parsing without script evaluation | Extension content script consumption | Secure Chrome extension ad |
| 31 | Embed Client SDK (`embed.js`) | M5 | Client script fetching slot and injecting native template | Network failure handling, missing slot attribute | embed.js calling `/api/v1/slot/[id]` | Web utility zero-code install |
| 32 | Shadow DOM Style Encapsulation | M5 | Shadow root creation (`attachShadow`), internal style isolation | Aggressive host global CSS resets (`* { all: unset }`) | embed.js rendering into host document | Conflict-free ad display |
| 33 | Unfilled Slot Fallback Referral Badge | M5 | Unfilled slot returns fallback viral CTA payload | Expired sponsorship falls back to viral badge | Fallback CTA clicked -> directs to checkout | Viral self-serve growth loop |
| 34 | Telemetry Beacon Endpoint | M5 | `POST /api/v1/telemetry/beacon` accepts impression & click | Unsupported event string (400), malformed payload | Beacon fired by client SDK | Impression/click recorded |
| 35 | Atomic PostgreSQL Telemetry Upsert | M5 | Upsert on conflict `(slot_id, timestamp)` increments counters | 100 rapid concurrent pings on same day | Beacon API calling telemetry repository | Real-time counter updates |
| 36 | Creator Earnings Dashboard | M6 | Aggregates gross revenue, 85% net payout, active sponsorships | $0 earnings empty state, multiple active sponsorships | Dashboard querying sponsorships table | Creator tracks monthly income |
| 37 | Advertiser Campaign Dashboard | M6 | Aggregates active campaigns, impressions, clicks, CTR | Division by zero safety (0 clicks / 0 imp -> 0.0%) | Dashboard querying telemetry table | Advertiser tracks ROI/CTR |
| 38 | Chrome Web Store Verification API | M6 | Extension user count and rating sync parser | Invalid extension ID, rate-limit fallback | CWS sync updating listing `verified_dau` | Automated publisher verification |
| 39 | Automated Integration Test Suite | M7 | Full test suite execution across Tiers 1-4 | Automated regression verification across all seams | Multi-module end-to-end assertions | Continuous quality gate pass |
| 40 | Adversarial Hardening | M7 | Fuzz testing, malformed headers, extreme concurrency, XSS payloads | Malicious input injection vectors, SQL injection attempts | Security and robustness validation | Production readiness sign-off |

---

## 4. Test Execution & Runner Architecture

### 4.1 Test Runner Commands

The test suite is executable via standard command-line interfaces:

```bash
# 1. Native Node.js Test Runner (Zero-dependency, fastest, native TypeScript)
node --experimental-strip-types --test tests/**/*.test.ts

# 2. Package.json Script (Once project scaffold is complete)
npm test

# 3. Targeted Test File Execution
node --experimental-strip-types --test tests/unit/escrow.test.ts
node --experimental-strip-types --test tests/integration/slot-delivery.test.ts
node --experimental-strip-types --test tests/integration/telemetry-beacon.test.ts
node --experimental-strip-types --test tests/integration/booking-escrow.test.ts
node --experimental-strip-types --test tests/integration/marketplace.test.ts

# 4. Optional Vitest Runner (When dependencies installed)
npx vitest run
```

### 4.2 Test File Directory Layout

```
/Users/pavanspoojary/Developer/Neotic ads/
├── TEST_INFRA.md                          # Comprehensive test specification & 4-tier matrix
└── tests/
    ├── test-utils.ts                      # Repository seams, test fixtures, contract oracles
    ├── unit/
    │   ├── escrow.test.ts                 # Tier 1 & Tier 2: 15%/85% math, boundaries, 0 penny loss
    │   └── slot-types.test.ts             # Tier 1 & Tier 2: Slot format constraints, copy limits
    └── integration/
        ├── slot-delivery.test.ts          # Tier 1, 2, 3: Headless API, caching, CORS, fallback CTA
        ├── telemetry-beacon.test.ts       # Tier 1, 2, 3: Non-PII ingestion, atomic upsert, counters
        ├── booking-escrow.test.ts         # Tier 1, 2, 3: Booking flow, mutex, UTM enrichment, SVG XSS
        └── marketplace.test.ts            # Tier 1, 2, 3, 4: Search, filtering, DAU sort, detail page
```

---

## 5. Quality Thresholds & Production SLAs

| Dimension | Quality Gate / SLA Threshold | Enforcement Mechanism |
|-----------|------------------------------|-----------------------|
| **Edge Slot Delivery Latency** | Sub-50ms response profile (`< 50ms`) | In-memory cache + HTTP cache headers (`s-maxage=300`) |
| **Telemetry Ingestion Latency** | Sub-15ms execution (`< 15ms`) | Non-blocking atomic upsert (`ON CONFLICT DO UPDATE`) |
| **Financial Math Precision** | Exactly 100% integer cent balance (0 penny leakage) | Invariant: `platform_fee + creator_payout === total` across 100% of price points |
| **Price Bounds** | Strictly $50.00 to $1,000.00/mo (5,000 to 100,000 cents) | DB check constraint & application schema validator |
| **Security & Privacy** | 0 PII stored in telemetry; 0 XSS script tags in SVGs | SVG sanitizer & zero-PII schema (`slot_id`, `timestamp`, `counts`) |
| **TypeScript Type Soundness** | 0 type errors (`tsc --noEmit` exits with code 0) | Strict TypeScript compiler configuration |
| **Test Suite Coverage** | 100% of 40 features covered by >= 5 tests per core feature | Continuous integration test suite execution |
