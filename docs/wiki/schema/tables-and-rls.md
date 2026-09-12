# Database Schema & Row Level Security (RLS)

## 1. Overview & Purpose
SponsorSlot uses Supabase PostgreSQL with strict typed schemas, foreign keys, CHECK constraints, and Row Level Security (RLS) policies.

## 2. Core Tables
Source: [`supabase/migrations/20260911000000_init_sponsorslot.sql`](/supabase/migrations/20260911000000_init_sponsorslot.sql)

### `listings`
Represents registered micro-tools, developer utilities, and Chrome extensions.
- Primary Key: `id UUID`
- Key Columns: `slug`, `title`, `tagline`, `category`, `dau_verified_count`, `rating`
- Constraint: `chk_listings_dau_nonnegative (dau_verified_count >= 0)`

### `inventory_slots`
Ad placements offered by tool creators across 4 standardized formats.
- Format ENUM: `slot_type IN ('header_pill', 'empty_state', 'footer_badge', 'email_footer')`
- Pricing: `monthly_price_cents` (enforced between 5000 and 100000 cents)
- Availability: `is_available BOOLEAN`

### `sponsorships`
Active or scheduled 30-day advertiser booking contracts.
- Financials: `amount_cents`, `platform_fee_cents`, `creator_payout_cents`
- Terms: `starts_at`, `ends_at`, `status IN ('pending', 'active', 'completed', 'cancelled')`
- Creative: `creative_text`, `target_url`, `image_url`

### `impression_telemetry`
Aggregated non-PII impression and click counts bucketed daily.
- Unique Constraint: `(slot_id, timestamp)`
- Counter Safety: `CHECK (clicks_count <= impressions_count)`

## 3. RLS Security Policies
- Public Read: `listings`, `inventory_slots`, `impression_telemetry` are readable by all clients.
- Authenticated Mutations: Only verified creators can modify inventory slots or claim payouts.
- Service Role Access: Automated billing and edge telemetry aggregation bypass RLS safely via service keys.

## 4. Verification & Testing
- Database migration audit: `tests/adversarial/db_repository.test.ts`
