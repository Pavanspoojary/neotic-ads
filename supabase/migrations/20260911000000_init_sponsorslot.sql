-- ============================================================================
-- Migration: 20260911000000_init_sponsorslot.sql
-- Description: SponsorSlot Initial Production Database Schema
-- Author: SponsorSlot Engineering Team (M1 Explorer 2)
-- Date: 2026-09-11
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS (Created idempotently)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_category') THEN
        CREATE TYPE listing_category AS ENUM ('developer-tools', 'productivity', 'design', 'utilities');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_type') THEN
        CREATE TYPE app_type AS ENUM ('web_app', 'chrome_extension', 'desktop_app');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_source') THEN
        CREATE TYPE verification_source AS ENUM ('chrome_web_store', 'plausible', 'posthog', 'ga4', 'manual');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
        CREATE TYPE listing_status AS ENUM ('draft', 'active', 'paused');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_type') THEN
        CREATE TYPE slot_type AS ENUM ('header_pill', 'empty_state', 'footer_badge', 'email_footer');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sponsorship_status') THEN
        CREATE TYPE sponsorship_status AS ENUM ('escrow_held', 'active', 'completed', 'disputed', 'cancelled');
    END IF;
END $$;

-- 3. TABLES

-- Table 1: listings (Applications, Tools, and Chrome Extensions)
CREATE TABLE IF NOT EXISTS listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    title VARCHAR(120) NOT NULL CHECK (char_length(trim(title)) >= 2),
    slug VARCHAR(120) UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
    description TEXT CHECK (char_length(description) <= 1000),
    category listing_category NOT NULL,
    app_type app_type NOT NULL,
    website_url TEXT NOT NULL CHECK (website_url ~ '^https?://'),
    verified_dau INTEGER NOT NULL DEFAULT 0 CHECK (verified_dau >= 0),
    verification_source verification_source NOT NULL DEFAULT 'manual',
    verification_identifier VARCHAR(150),
    verification_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status listing_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: inventory_slots (Standardized In-App Ad Units)
CREATE TABLE IF NOT EXISTS inventory_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    slot_name VARCHAR(100) NOT NULL CHECK (char_length(trim(slot_name)) >= 2),
    slot_type slot_type NOT NULL,
    monthly_price_cents INTEGER NOT NULL CHECK (monthly_price_cents >= 5000 AND monthly_price_cents <= 100000),
    is_available BOOLEAN NOT NULL DEFAULT true,
    max_sponsors INTEGER NOT NULL DEFAULT 1 CHECK (max_sponsors = 1),
    guidelines TEXT CHECK (char_length(guidelines) <= 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: sponsorships (Escrow Reservations, Creatives & Billing Engine)
CREATE TABLE IF NOT EXISTS sponsorships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES inventory_slots(id) ON DELETE CASCADE,
    sponsor_id UUID NOT NULL,
    sponsor_name VARCHAR(120) NOT NULL DEFAULT 'Sponsor',
    sponsor_email VARCHAR(255) NOT NULL CHECK (sponsor_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    status sponsorship_status NOT NULL DEFAULT 'escrow_held',
    creative_text VARCHAR(255) NOT NULL CHECK (char_length(trim(creative_text)) > 0),
    creative_target_url TEXT NOT NULL CHECK (creative_target_url ~ '^https://'),
    creative_image_url TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL CHECK (end_date >= start_date),
    monthly_amount_cents INTEGER NOT NULL CHECK (monthly_amount_cents >= 5000 AND monthly_amount_cents <= 100000),
    platform_fee_cents INTEGER NOT NULL CHECK (platform_fee_cents >= 0),
    creator_payout_cents INTEGER NOT NULL CHECK (creator_payout_cents >= 0),
    stripe_payment_intent_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_sponsorship_fee_split CHECK (platform_fee_cents + creator_payout_cents = monthly_amount_cents),
    CONSTRAINT chk_sponsorship_take_rate CHECK (platform_fee_cents = ROUND(monthly_amount_cents * 0.15))
);

-- Table 4: impression_telemetry (Daily Zero-PII Aggregated Counters)
CREATE TABLE IF NOT EXISTS impression_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES inventory_slots(id) ON DELETE CASCADE,
    telemetry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    impressions_count INTEGER NOT NULL DEFAULT 0 CHECK (impressions_count >= 0),
    clicks_count INTEGER NOT NULL DEFAULT 0 CHECK (clicks_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_telemetry_slot_date UNIQUE (slot_id, telemetry_date),
    CONSTRAINT chk_clicks_leq_impressions CHECK (clicks_count <= impressions_count)
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_verified_dau ON listings(verified_dau DESC);
CREATE INDEX IF NOT EXISTS idx_listings_creator_id ON listings(creator_id);

CREATE INDEX IF NOT EXISTS idx_inventory_slots_listing_id ON inventory_slots(listing_id);
CREATE INDEX IF NOT EXISTS idx_inventory_slots_is_available ON inventory_slots(is_available);
CREATE INDEX IF NOT EXISTS idx_inventory_slots_slot_type ON inventory_slots(slot_type);

CREATE INDEX IF NOT EXISTS idx_sponsorships_slot_id ON sponsorships(slot_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_sponsor_id ON sponsorships(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships(status);
CREATE INDEX IF NOT EXISTS idx_sponsorships_dates ON sponsorships(start_date, end_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sponsorships_slot_active ON sponsorships (slot_id) WHERE status IN ('active', 'escrow_held');

CREATE INDEX IF NOT EXISTS idx_impression_telemetry_slot_date ON impression_telemetry(slot_id, telemetry_date DESC);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;
ALTER TABLE impression_telemetry ENABLE ROW LEVEL SECURITY;

-- Listings RLS Policies
CREATE POLICY "Public can view active listings"
    ON listings FOR SELECT
    USING (status = 'active');

CREATE POLICY "Creators can view own listings"
    ON listings FOR SELECT
    TO authenticated
    USING (creator_id = auth.uid());

CREATE POLICY "Creators can insert own listings"
    ON listings FOR INSERT
    TO authenticated
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update own listings"
    ON listings FOR UPDATE
    TO authenticated
    USING (creator_id = auth.uid())
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can delete own listings"
    ON listings FOR DELETE
    TO authenticated
    USING (creator_id = auth.uid());

CREATE POLICY "Service role has full access to listings"
    ON listings FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Inventory Slots RLS Policies
CREATE POLICY "Public can view slots for active listings"
    ON inventory_slots FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM listings
            WHERE listings.id = inventory_slots.listing_id
            AND listings.status = 'active'
        )
    );

CREATE POLICY "Creators can manage own inventory slots"
    ON inventory_slots FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM listings
            WHERE listings.id = inventory_slots.listing_id
            AND listings.creator_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM listings
            WHERE listings.id = inventory_slots.listing_id
            AND listings.creator_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to slots"
    ON inventory_slots FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Sponsorships RLS Policies
CREATE POLICY "Public can read active creative for edge delivery"
    ON sponsorships FOR SELECT
    USING (status = 'active');

CREATE POLICY "Sponsors can view own sponsorships"
    ON sponsorships FOR SELECT
    TO authenticated
    USING (sponsor_id = auth.uid());

CREATE POLICY "Sponsors can create sponsorships"
    ON sponsorships FOR INSERT
    TO authenticated
    WITH CHECK (sponsor_id = auth.uid());

CREATE POLICY "Creators can view sponsorships for their slots"
    ON sponsorships FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM inventory_slots
            JOIN listings ON inventory_slots.listing_id = listings.id
            WHERE inventory_slots.id = sponsorships.slot_id
            AND listings.creator_id = auth.uid()
        )
    );

CREATE POLICY "Service role has full access to sponsorships"
    ON sponsorships FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Impression Telemetry RLS Policies
CREATE POLICY "Public can view telemetry for active listings"
    ON impression_telemetry FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM inventory_slots
            JOIN listings ON inventory_slots.listing_id = listings.id
            WHERE inventory_slots.id = impression_telemetry.slot_id
            AND listings.status = 'active'
        )
    );

CREATE POLICY "Anyone can record telemetry pings"
    ON impression_telemetry FOR INSERT
    WITH CHECK (true);

-- Direct UPDATE is restricted to service_role; edge increments execute via increment_slot_telemetry RPC

CREATE POLICY "Service role has full access to telemetry"
    ON impression_telemetry FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_listings_updated_at ON listings;
CREATE TRIGGER trg_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_inventory_slots_updated_at ON inventory_slots;
CREATE TRIGGER trg_inventory_slots_updated_at
    BEFORE UPDATE ON inventory_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_sponsorships_updated_at ON sponsorships;
CREATE TRIGGER trg_sponsorships_updated_at
    BEFORE UPDATE ON sponsorships
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trg_impression_telemetry_updated_at ON impression_telemetry;
CREATE TRIGGER trg_impression_telemetry_updated_at
    BEFORE UPDATE ON impression_telemetry
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 7. ATOMIC TELEMETRY INCREMENT RPC FUNCTION
CREATE OR REPLACE FUNCTION increment_slot_telemetry(
    p_slot_id UUID,
    p_date DATE,
    p_event TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_impressions INTEGER;
    v_clicks INTEGER;
BEGIN
    IF p_event NOT IN ('impression', 'click') THEN
        RAISE EXCEPTION 'Invalid telemetry event: %', p_event;
    END IF;

    INSERT INTO impression_telemetry (slot_id, telemetry_date, impressions_count, clicks_count)
    VALUES (
        p_slot_id,
        p_date,
        CASE WHEN p_event = 'impression' THEN 1 ELSE 0 END,
        CASE WHEN p_event = 'click' THEN 1 ELSE 0 END
    )
    ON CONFLICT (slot_id, telemetry_date)
    DO UPDATE SET
        impressions_count = impression_telemetry.impressions_count + (CASE WHEN p_event = 'impression' THEN 1 ELSE 0 END),
        clicks_count = impression_telemetry.clicks_count + (CASE WHEN p_event = 'click' THEN 1 ELSE 0 END),
        updated_at = NOW()
    RETURNING impressions_count, clicks_count INTO v_impressions, v_clicks;

    RETURN jsonb_build_object(
        'impressions_count', v_impressions,
        'clicks_count', v_clicks
    );
END;
$$;

GRANT EXECUTE ON FUNCTION increment_slot_telemetry(UUID, DATE, TEXT) TO anon, authenticated, service_role;

