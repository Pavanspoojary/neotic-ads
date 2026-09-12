# System Overview & Deep Module Architecture

## 1. Overview & Purpose
SponsorSlot is a programmatic and flat-rate in-app micro-sponsorship registry and marketplace connecting high-engagement micro-tools (developer tools, Chrome extensions, web utilities with 500–25k DAU) with context-driven B2B advertisers seeking native, non-intrusive placements on automated 30-day terms.

## 2. Invariants & Public Seams
- **Framework**: Next.js 14 App Router with React Server Components (RSC) and strict TypeScript.
- **Data Seam**: Dual-backend [`DatabaseRepository`](/src/lib/db.ts) abstracting Supabase PostgreSQL and offline in-memory persistence.
- **Design Standard**: Anti-vibe-coding production standard; zero empty stubs or mock-only UI components.

## 3. Subsystem Architecture
```
[ Advertisers ]                     [ Creators ]
       │                                  │
       ▼                                  ▼
[ /sponsor/[slotId] ]              [ /creator ]
       │                                  │
       └──────────────┬───────────────────┘
                      ▼
            [ Next.js App Router ]
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
[ Edge Delivery API ]      [ Seam Database (db.ts) ]
( /api/v1/slot/[id] )               │
        │              ┌────────────┴────────────┐
        ▼              ▼                         ▼
  [ embed.js /    [ Supabase Cloud ]      [ In-Memory Store ]
   Chrome MV3 ]   (Postgres + RLS)        (Deterministic Tests)
```

## 4. Verification & Testing
- Automated test suite: `tests/integration/routes.test.ts`
- Adversarial tests: `tests/adversarial/db_repository.test.ts`
- Live production endpoint: [https://neotic-ads.vercel.app](https://neotic-ads.vercel.app)
