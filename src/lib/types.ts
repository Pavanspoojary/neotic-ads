/**
 * Domain Models and TypeScript Contracts for SponsorSlot
 * File path: src/lib/types.ts
 */

// ============================================================================
// Enums and Literal Unions
// ============================================================================

export type ListingCategory =
  | 'developer-tools'
  | 'productivity'
  | 'design'
  | 'utilities';

export type AppType =
  | 'web_app'
  | 'chrome_extension'
  | 'desktop_app';

export type SlotType =
  | 'header_pill'
  | 'empty_state'
  | 'footer_badge'
  | 'email_footer';

/**
 * Standardized maximum creative text character limits per slot format.
 */
export const SLOT_COPY_LIMITS: Record<SlotType, number> = {
  header_pill: 80,
  empty_state: 200,
  footer_badge: 60,
  email_footer: 120,
};

export type VerificationSource =
  | 'chrome_web_store'
  | 'plausible'
  | 'posthog'
  | 'ga4'
  | 'manual';

export type ListingStatus =
  | 'draft'
  | 'active'
  | 'paused';

export type SponsorshipStatus =
  | 'escrow_held'
  | 'active'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export type TelemetryEventType = 'impression' | 'click';

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Micro-SaaS, Chrome extension, or developer utility registered in the marketplace.
 */
export interface Listing {
  id: string; // UUID v4
  creator_id?: string; // UUID of creator user
  title: string;
  slug: string; // URL-safe unique slug
  description: string;
  category: ListingCategory;
  app_type: AppType;
  website_url: string;
  verified_dau: number; // Daily Active Users (500 - 25,000+)
  verification_source: VerificationSource;
  verification_identifier?: string; // Extension ID or domain
  verification_data?: Record<string, unknown>; // Parsed third-party verification stats
  status: ListingStatus;
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
}

/**
 * Standardized ad placement slot defined within a listing.
 */
export interface InventorySlot {
  id: string; // UUID v4
  listing_id: string; // Foreign key -> listings.id
  slot_name: string;
  slot_type: SlotType;
  monthly_price_cents: number; // Strictly 5,000 to 100,000 ($50.00 to $1,000.00)
  is_available: boolean; // True if slot is vacant and bookable
  max_sponsors: number; // Strictly 1 (single-tenant 30-day lease)
  guidelines?: string; // Creator rules for acceptable sponsors (max 1000 chars)
  created_at: string; // ISO 8601
  updated_at?: string; // ISO 8601
}

/**
 * 30-day sponsorship lease and creative reservation.
 */
export interface Sponsorship {
  id: string; // UUID v4
  slot_id: string; // Foreign key -> inventory_slots.id
  sponsor_name: string;
  sponsor_email: string;
  sponsor_id?: string; // Optional authenticated user UUID
  status: SponsorshipStatus;
  creative_text: string; // Max 80-200 chars depending on format
  creative_target_url: string; // Validated HTTPS destination URL with UTM params
  creative_image_url?: string; // Optional SVG/PNG logo asset URL
  start_date: string; // ISO date YYYY-MM-DD
  end_date: string; // ISO date YYYY-MM-DD (strictly start_date + 30 days)
  monthly_amount_cents: number; // Gross payment amount
  platform_fee_cents: number; // Exactly 15% platform take-rate (Math.round(amount * 0.15))
  creator_payout_cents: number; // Exactly 85% creator payout (amount - platform_fee_cents)
  stripe_payment_intent_id?: string;
  stripe_subscription_id?: string;
  created_at: string; // ISO 8601
  updated_at?: string; // ISO 8601
}

/**
 * Daily non-PII aggregate telemetry record.
 */
export interface ImpressionTelemetry {
  id?: string;
  slot_id: string; // Foreign key -> inventory_slots.id
  telemetry_date: string; // ISO date YYYY-MM-DD
  impressions_count: number;
  clicks_count: number;
  created_at?: string;
}

/**
 * Output of the 15%/85% escrow split calculation.
 */
export interface EscrowSplit {
  monthly_amount_cents: number;
  platform_fee_cents: number;
  creator_payout_cents: number;
  take_rate_percentage: number; // 15
}

// ============================================================================
// Input Types and DTOs (Data Transfer Objects)
// ============================================================================

export interface ListingFilters {
  category?: ListingCategory;
  app_type?: AppType;
  q?: string; // Search keyword against title and description
  min_dau?: number;
  max_price_cents?: number;
  available_only?: boolean;
  status?: ListingStatus;
  sort?: 'dau_desc' | 'dau_asc' | 'price_asc' | 'price_desc' | 'newest';
  limit?: number;
  offset?: number;
}

export interface CreateListingInput {
  id?: string;
  creator_id?: string;
  title: string;
  slug?: string;
  description: string;
  category: ListingCategory;
  app_type: AppType;
  website_url: string;
  verified_dau?: number;
  verification_source?: VerificationSource;
  verification_identifier?: string;
  verification_data?: Record<string, unknown>;
  status?: ListingStatus;
}

export interface CreateSlotInput {
  id?: string;
  listing_id: string;
  slot_name: string;
  slot_type: SlotType;
  monthly_price_cents: number;
  is_available?: boolean;
  max_sponsors?: number;
  guidelines?: string;
}

export interface CreateSponsorshipInput {
  id?: string;
  slot_id: string;
  sponsor_name: string;
  sponsor_email: string;
  sponsor_id?: string;
  creative_text: string;
  creative_target_url: string;
  creative_image_url?: string;
  start_date?: string; // ISO YYYY-MM-DD (defaults to today)
  monthly_amount_cents?: number; // Defaults to slot.monthly_price_cents
}

export interface SlotDeliveryPayload {
  active: boolean;
  slot_id: string;
  slot_type: SlotType;
  text: string;
  url: string;
  badge?: string | null;
  fallback: boolean;
  monthly_price_cents?: number;
  beacon: {
    endpoint: string;
    slot_id: string;
  };
}

export interface TelemetrySummary {
  slot_id: string;
  impressions_count: number;
  clicks_count: number;
  ctr_percentage: number;
  days: number;
}

export interface CreatorEarningsSummary {
  total_earnings_cents: number;
  mrr_cents: number;
  active_sponsorships_count: number;
  total_impressions_30d: number;
  total_clicks_30d: number;
  avg_ctr_percentage: number;
}

export interface AdvertiserCampaignSummary {
  campaign_id: string;
  slot_name: string;
  listing_title: string;
  slot_type: SlotType;
  status: SponsorshipStatus;
  start_date: string;
  end_date: string;
  days_remaining: number;
  monthly_amount_cents: number;
  impressions_count: number;
  clicks_count: number;
  ctr_percentage: number;
  effective_cpm: number;
  effective_cpc: number;
}
