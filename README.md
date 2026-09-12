# SponsorSlot (Neotic Ads)

> **Programmatic Flat-Rate In-App Micro-Sponsorship Registry & Edge Delivery Marketplace**

Connect high-engagement developer utilities, Chrome extensions, and developer tools (500–25k DAU) with context-driven B2B advertisers on flat-rate 30-day terms. Zero intermediary ad brokers, native responsive formats, and guaranteed 85% creator payouts.

🌐 **Live Production Deployment**: [https://neotic-ads.vercel.app](https://neotic-ads.vercel.app)  
📦 **GitHub Repository**: [https://github.com/Pavanspoojary/neotic-ads](https://github.com/Pavanspoojary/neotic-ads)

---

## Key Features

- **Capterra / G2-Inspired Marketplace Directory**:
  - Responsive 3-column software card layout.
  - Review sentiment breakdown progress bar (Positive / Neutral / Negative).
  - Star ratings, user count badges, format tags, and verified DAU counters.
  - Category filtering with solid blue underline tab switching and search.
  - Available slots filtering and sort by traffic/pricing.

- **Standardized In-App Inventory Units**:
  - **`header_pill`** (Max 80 chars): Compact pill badge in navigation or extension toolbars.
  - **`empty_state`** (Max 200 chars): 300x150 native card rendered during zero-data states.
  - **`footer_badge`** (Max 60 chars): High-trust partner attribution link in footers.
  - **`email_footer`** (Max 120 chars): Single footer line in notification digests or export notices.

- **Advertiser Self-Serve Booking & Escrow Core**:
  - Live interactive rendering preview of creative across all 4 formats.
  - Transparent 30-day billing invariant:
    $$\text{Platform Take Rate} = 15\%$$
    $$\text{Creator Net Payout} = 85\%$$
  - Exact penny conservation with zero penny leakage across all cent amounts.

- **High-Throughput Edge Delivery API**:
  - `GET /api/v1/slot/[id]` delivers cached JSON creative payload with sub-50ms response profile.
  - Global CORS (`*`) and public edge caching headers (`s-maxage=300, stale-while-revalidate=600`).
  - Strict Chrome Extension Manifest V3 compliance (declarative JSON, zero remote script execution).
  - Unfilled / vacant slots automatically fall back to viral self-serve referral badges (`⚡ Place your product here via SponsorSlot`).

- **Zero-PII Telemetry Engine**:
  - `POST /api/v1/telemetry/beacon` ingests impression and click pings via `navigator.sendBeacon` and JSON.
  - Atomic aggregation into daily counters per slot `(slot_id, telemetry_date)` without storing IP or user identifiers.

- **Zero-Dependency Embed SDK**:
  - `public/embed.js` provides drop-in native widget injection with scoped styles, viewability detection via `IntersectionObserver`, and automatic click dispatch.

- **Dual-Backend Seam Database Layer**:
  - Production Supabase Cloud PostgreSQL with Row Level Security (RLS) policies and triggers.
  - Deterministic in-memory fixture store for offline development, lightning-fast automated testing, and resilient static site generation (SSG) fallback.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS, Lucide Icons
- **Database**: PostgreSQL (Supabase) with Row-Level Security (RLS)
- **Testing**: Native Node.js Test Runner (`node:test`, `node:assert/strict`) via `tsx`
- **Hosting**: Vercel Edge Network

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/Pavanspoojary/neotic-ads.git
cd neotic-ads
npm install
```

### 2. Configure Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 3. Run Database Migrations

Apply the production migration from `supabase/migrations/20260911000000_init_sponsorslot.sql` in your Supabase SQL Editor, or seed demo fixtures with `supabase/seed.sql`.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Tests

Run the complete test suite (214 tests across 68 suites with 0 failures):

```bash
npm test
```

Typecheck the codebase:

```bash
npx tsc --noEmit
```

Build for production:

```bash
npm run build
```

---

## API Reference

### Edge Creative Delivery
```http
GET /api/v1/slot/:slotId
```
Returns active sponsored creative or fallback CTA:
```json
{
  "active": true,
  "status": "sponsored",
  "fallback": false,
  "slot": {
    "id": "20000000-0000-0000-0000-000000000001",
    "name": "Dashboard Header Bar Pill",
    "type": "header_pill",
    "listing_title": "JSONHero Visualizer",
    "listing_slug": "jsonhero-visualizer"
  },
  "creative": {
    "text": "Real-time Next.js application logs & exception tracing with LogFast",
    "target_url": "https://logfast.io?utm_source=sponsorslot",
    "image_url": "https://cdn.sponsorslot.com/creatives/logfast-logo.svg",
    "disclaimer_text": "Sponsored"
  },
  "beacon": {
    "endpoint": "/api/v1/telemetry/beacon",
    "slot_id": "20000000-0000-0000-0000-000000000001"
  }
}
```

### Telemetry Ingestion
```http
POST /api/v1/telemetry/beacon
Content-Type: application/json (or text/plain for sendBeacon)

{
  "slot_id": "20000000-0000-0000-0000-000000000001",
  "event": "impression"
}
```

---

## License

MIT © [SponsorSlot / Neotic Ads](https://github.com/Pavanspoojary/neotic-ads)
