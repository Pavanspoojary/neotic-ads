/**
 * Test Utilities and Public Seam Dispatchers for SponsorSlot Integration Tests
 * File path: tests/test-utils.ts
 *
 * Imports directly from src/lib/ to eliminate self-certifying duplicate mocks.
 */

import {
  type IDatabaseRepository,
  InMemoryDatabaseRepository,
  getDb,
  resetInMemoryDb,
} from '../src/lib/db.ts';
import {
  calculateEscrowSplit,
  enrichWithUtm,
  sanitizeSvg,
  validateRentalRate,
} from '../src/lib/escrow.ts';
import {
  generateEmbedSnippet,
  generateHeadlessSnippet,
  generateIntegrationSnippets,
} from '../src/lib/snippets.ts';
import {
  Listing,
  InventorySlot,
  Sponsorship,
  ImpressionTelemetry,
  SlotType,
  SLOT_COPY_LIMITS,
  ListingCategory,
  AppType,
  VerificationSource,
  SponsorshipStatus,
  ListingFilters,
} from '../src/lib/types.ts';
import {
  SEED_LISTINGS,
  SEED_SLOTS,
  SEED_SPONSORSHIPS,
  generateSeedTelemetry,
} from '../src/lib/fixtures.ts';

// Re-export core contracts and domain utilities directly from production sources
export {
  InMemoryDatabaseRepository,
  getDb,
  resetInMemoryDb,
  calculateEscrowSplit,
  enrichWithUtm,
  sanitizeSvg,
  validateRentalRate,
  generateEmbedSnippet,
  generateHeadlessSnippet,
  generateIntegrationSnippets,
  SLOT_COPY_LIMITS,
  SEED_LISTINGS,
  SEED_SLOTS,
  SEED_SPONSORSHIPS,
  generateSeedTelemetry,
};
export type {
  IDatabaseRepository,
  Listing,
  InventorySlot,
  Sponsorship,
  ImpressionTelemetry,
  SlotType,
  ListingCategory,
  AppType,
  VerificationSource,
  SponsorshipStatus,
  ListingFilters,
};

// Alias InMemoryDatabase to the real InMemoryDatabaseRepository for backward compatibility
export const InMemoryDatabase = InMemoryDatabaseRepository;
export type InMemoryDatabase = InMemoryDatabaseRepository;

/**
 * Public Seam Dispatcher: GET /api/v1/slot/[id]
 * Queries the real database repository seam and returns edge delivery response.
 */
export async function dispatchGetSlot(slotId: string, db: IDatabaseRepository) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(slotId)) {
    return {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: { error: 'Invalid slot ID format', code: 'INVALID_PARAM' },
    };
  }

  const slot = await db.getSlotById(slotId);
  if (!slot) {
    return {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: { error: 'Slot not found', code: 'NOT_FOUND' },
    };
  }

  const listing = await db.getListingById(slot.listing_id);
  const activeSponsorship = await db.getActiveSponsorship(slot.id);

  const baseHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
    'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  };

  if (activeSponsorship) {
    return {
      status: 200,
      headers: baseHeaders,
      body: {
        active: true,
        status: 'sponsored',
        slot: {
          id: slot.id,
          name: slot.slot_name,
          type: slot.slot_type,
          listing_title: listing?.title || '',
          listing_slug: listing?.slug || '',
        },
        creative: {
          text: activeSponsorship.creative_text,
          target_url: activeSponsorship.creative_target_url,
          image_url: activeSponsorship.creative_image_url || null,
          badge_svg: null,
          disclaimer_text: 'Sponsored',
        },
        beacon: {
          endpoint: '/api/v1/telemetry/beacon',
          slot_id: slot.id,
        },
        fallback: false,
      },
    };
  }

  // Unfilled / expired fallback
  return {
    status: 200,
    headers: baseHeaders,
    body: {
      active: false,
      status: 'unfilled',
      slot: {
        id: slot.id,
        name: slot.slot_name,
        type: slot.slot_type,
        listing_title: listing?.title || '',
        listing_slug: listing?.slug || '',
      },
      creative: {
        text: 'Place your product here via SponsorSlot',
        target_url: `https://sponsorslot.dev/tools/${listing?.slug || 'explore'}?slot=${slot.id}&ref=unfilled_slot`,
        image_url: null,
        badge_svg: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z'/></svg>",
        disclaimer_text: 'SponsorSlot',
      },
      beacon: {
        endpoint: '/api/v1/telemetry/beacon',
        slot_id: slot.id,
      },
      fallback: true,
      monthly_price_cents: slot.monthly_price_cents,
    },
  };
}

/**
 * Public Seam Dispatcher: POST /api/v1/telemetry/beacon
 * Receives impression and click telemetry and updates repository.
 */
export async function dispatchPostBeacon(
  rawBody: string | Record<string, unknown>,
  contentType: string,
  db: IDatabaseRepository
) {
  let parsed: Record<string, unknown>;
  try {
    if (typeof rawBody === 'string') {
      parsed = JSON.parse(rawBody);
    } else {
      parsed = rawBody;
    }
  } catch {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: { error: 'Malformed payload' },
    };
  }

  const { slot_id, event } = parsed;
  if (!slot_id || typeof slot_id !== 'string') {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: { error: 'Missing or invalid slot_id' },
    };
  }

  if (event !== 'impression' && event !== 'click') {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: { error: "Invalid event type. Expected 'impression' or 'click'" },
    };
  }

  const slot = await db.getSlotById(slot_id);
  if (!slot) {
    return {
      status: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: { error: 'Slot not found' },
    };
  }

  try {
    const updated = await db.incrementTelemetry(slot_id, event);
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: {
        success: true,
        impressions_count: updated.impressions_count,
        clicks_count: updated.clicks_count,
      },
    };
  } catch (err: any) {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: { error: err.message },
    };
  }
}

/**
 * Public Seam Dispatcher: GET /api/listings
 * Calls db.getListings with provided filters and enriches with slot metadata.
 */
export async function dispatchGetListings(
  query: ListingFilters,
  db: IDatabaseRepository
) {
  const listings = await db.getListings(query);
  const allSlots = await db.getAllSlots();

  const slotsMap = new Map<string, typeof allSlots>();
  for (const slot of allSlots) {
    const group = slotsMap.get(slot.listing_id) || [];
    group.push(slot);
    slotsMap.set(slot.listing_id, group);
  }

  const enrichedListings = listings.map((listing) => {
    const toolSlots = slotsMap.get(listing.id) || [];
    const available = toolSlots.filter((s) => s.is_available);
    const startingPrice =
      toolSlots.length > 0
        ? Math.min(...toolSlots.map((s) => s.monthly_price_cents))
        : null;

    return {
      ...listing,
      slots_count: toolSlots.length,
      available_slots_count: available.length,
      has_available_slots: available.length > 0,
      starting_price_cents: startingPrice,
    };
  });

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      listings: enrichedListings,
      total: enrichedListings.length,
    },
  };
}

/**
 * Public Seam Dispatcher: GET /api/listings/[slug]
 * Fetches listing by slug, associated slots, and 30-day telemetry summary.
 */
export async function dispatchGetListingBySlug(
  slug: string,
  db: IDatabaseRepository
) {
  const normalizedSlug = slug ? decodeURIComponent(slug).toLowerCase().trim() : '';
  const listing = await db.getListingBySlug(normalizedSlug);

  if (!listing) {
    return {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
      body: { error: 'Listing not found', code: 'NOT_FOUND' },
    };
  }

  const slots = await db.getSlotsByListingId(listing.id);
  const telemetryPromises = slots.map(async (slot) => {
    const records = await db.getTelemetry(slot.id, 30);
    const slotImpressions = records.reduce((sum, r) => sum + r.impressions_count, 0);
    const slotClicks = records.reduce((sum, r) => sum + r.clicks_count, 0);
    const slotCtr = slotImpressions > 0 ? Number(((slotClicks / slotImpressions) * 100).toFixed(2)) : 0;

    return {
      slotWithTelemetry: {
        ...slot,
        telemetry_30d: { impressions_count: slotImpressions, clicks_count: slotClicks, ctr_percentage: slotCtr },
      },
      summary: {
        slot_id: slot.id,
        impressions_count: slotImpressions,
        clicks_count: slotClicks,
        ctr_percentage: slotCtr,
        days: 30,
      },
    };
  });

  const telemetryData = await Promise.all(telemetryPromises);
  const totalImpressions = telemetryData.reduce((sum, d) => sum + d.summary.impressions_count, 0);
  const totalClicks = telemetryData.reduce((sum, d) => sum + d.summary.clicks_count, 0);
  const avgCtr = totalImpressions > 0 ? Number(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0;

  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: {
      listing,
      slots: telemetryData.map((d) => d.slotWithTelemetry),
      telemetry_summary: {
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        avg_ctr_percentage: avgCtr,
        period_days: 30,
        slots: telemetryData.map((d) => d.summary),
      },
    },
  };
}

const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_CATEGORIES = new Set(['developer-tools', 'productivity', 'design', 'utilities']);
const VALID_APP_TYPES = new Set(['web_app', 'chrome_extension', 'desktop_app']);
const VALID_VERIFICATION_SOURCES = new Set(['chrome_web_store', 'plausible', 'posthog', 'ga4', 'manual']);
const VALID_SLOT_TYPES = new Set(['header_pill', 'empty_state', 'footer_badge', 'email_footer']);

/**
 * Public Seam Dispatcher: POST /api/listings
 */
export async function dispatchPostListing(
  body: Record<string, unknown> | string,
  db: IDatabaseRepository
) {
  let parsed: any;
  try {
    parsed = typeof body === 'string' ? JSON.parse(body) : body;
  } catch {
    return { status: 400, body: { error: 'Invalid JSON payload in request body', code: 'INVALID_JSON' } };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { status: 400, body: { error: 'Request body must be a JSON object', code: 'INVALID_BODY' } };
  }

  const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
  if (!title) {
    return { status: 400, body: { error: 'Title is required and cannot be empty', code: 'MISSING_TITLE' } };
  }

  if (!parsed.category || !VALID_CATEGORIES.has(parsed.category)) {
    return { status: 400, body: { error: `Invalid category: '${parsed.category}'`, code: 'INVALID_CATEGORY' } };
  }

  if (!parsed.app_type || !VALID_APP_TYPES.has(parsed.app_type)) {
    return { status: 400, body: { error: `Invalid app_type: '${parsed.app_type}'`, code: 'INVALID_APP_TYPE' } };
  }

  let websiteUrl = typeof parsed.website_url === 'string' ? parsed.website_url.trim() : '';
  if (!websiteUrl || (!websiteUrl.startsWith('https://') && !websiteUrl.startsWith('http://'))) {
    return { status: 400, body: { error: 'Website URL must start with http:// or https://', code: 'INVALID_URL' } };
  }
  if (websiteUrl.startsWith('http://')) {
    websiteUrl = websiteUrl.replace(/^http:\/\//, 'https://');
  }

  let verifiedDau = 0;
  if (parsed.verified_dau !== undefined && parsed.verified_dau !== null) {
    const dau = Number(parsed.verified_dau);
    if (isNaN(dau) || !Number.isInteger(dau) || dau < 0) {
      return { status: 400, body: { error: 'verified_dau must be a non-negative integer', code: 'INVALID_DAU' } };
    }
    verifiedDau = dau;
  }

  const verificationSource = parsed.verification_source || 'manual';
  if (!VALID_VERIFICATION_SOURCES.has(verificationSource)) {
    return { status: 400, body: { error: 'Invalid verification_source', code: 'INVALID_VERIFICATION_SOURCE' } };
  }

  let finalSlug: string;
  if (typeof parsed.slug === 'string' && parsed.slug.trim().length > 0) {
    const providedSlug = parsed.slug.trim();
    if (!KEBAB_CASE_REGEX.test(providedSlug)) {
      return { status: 400, body: { error: 'Invalid slug format', code: 'INVALID_SLUG_FORMAT' } };
    }
    finalSlug = providedSlug;
  } else {
    finalSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!finalSlug || !KEBAB_CASE_REGEX.test(finalSlug)) {
      return { status: 400, body: { error: 'Failed to generate valid slug', code: 'INVALID_SLUG_FORMAT' } };
    }
  }

  // Uniqueness check: query db.getListingBySlug(slug) -> 409 Conflict
  const existing = await db.getListingBySlug(finalSlug);
  if (existing) {
    return { status: 409, body: { error: 'Slug already in use', code: 'SLUG_CONFLICT' } };
  }

  const listing = await db.createListing({
    title,
    slug: finalSlug,
    description: typeof parsed.description === 'string' ? parsed.description.trim() : '',
    category: parsed.category,
    app_type: parsed.app_type,
    website_url: websiteUrl,
    verified_dau: verifiedDau,
    verification_source: verificationSource as VerificationSource,
    verification_identifier: parsed.verification_identifier,
    verification_data: parsed.verification_data,
    status: parsed.status || 'active',
  });

  return {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
    body: { ...listing, listing },
  };
}

/**
 * Public Seam Dispatcher: POST /api/slots
 */
export async function dispatchPostSlot(
  body: Record<string, unknown> | string,
  db: IDatabaseRepository
) {
  let parsed: any;
  try {
    parsed = typeof body === 'string' ? JSON.parse(body) : body;
  } catch {
    return { status: 400, body: { error: 'Invalid JSON payload in request body', code: 'INVALID_JSON' } };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { status: 400, body: { error: 'Request body must be a JSON object', code: 'INVALID_BODY' } };
  }

  const listingId = typeof parsed.listing_id === 'string' ? parsed.listing_id.trim() : '';
  if (!listingId) {
    return { status: 400, body: { error: 'listing_id is required', code: 'MISSING_LISTING_ID' } };
  }
  if (!UUID_REGEX.test(listingId)) {
    return { status: 400, body: { error: 'listing_id must be a valid UUID format', code: 'INVALID_UUID' } };
  }

  const listing = await db.getListingById(listingId);
  if (!listing) {
    return { status: 404, body: { error: 'Listing not found', code: 'NOT_FOUND' } };
  }

  const slotName = typeof parsed.slot_name === 'string' ? parsed.slot_name.trim() : '';
  if (!slotName) {
    return { status: 400, body: { error: 'Slot name is required and cannot be empty', code: 'MISSING_SLOT_NAME' } };
  }

  if (!parsed.slot_type || !VALID_SLOT_TYPES.has(parsed.slot_type)) {
    return { status: 400, body: { error: 'Invalid slot_type', code: 'INVALID_SLOT_TYPE' } };
  }

  const rateValidation = validateRentalRate(parsed.monthly_price_cents);
  if (!rateValidation.valid) {
    return {
      status: 400,
      body: {
        error: 'Monthly rate must be between $50.00 and $1,000.00 (5,000 to 100,000 cents)',
        code: 'INVALID_RENTAL_RATE',
      },
    };
  }

  if (parsed.guidelines !== undefined && parsed.guidelines !== null) {
    if (typeof parsed.guidelines !== 'string') {
      return { status: 400, body: { error: 'guidelines must be a string', code: 'INVALID_GUIDELINES' } };
    }
    if (parsed.guidelines.length > 1000) {
      return { status: 400, body: { error: 'Guidelines cannot exceed 1000 characters', code: 'GUIDELINES_TOO_LONG' } };
    }
  }

  const slot = await db.createSlot({
    listing_id: listingId,
    slot_name: slotName,
    slot_type: parsed.slot_type,
    monthly_price_cents: parsed.monthly_price_cents,
    is_available: parsed.is_available !== undefined ? Boolean(parsed.is_available) : true,
    guidelines: typeof parsed.guidelines === 'string' ? parsed.guidelines.trim() : undefined,
  });

  return {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
    body: { ...slot, slot },
  };
}

/**
 * Public Seam Dispatcher: GET /api/slots
 */
export async function dispatchGetSlots(
  listingId: string | null | undefined,
  db: IDatabaseRepository
) {
  if (!listingId || listingId.trim().length === 0) {
    return { status: 400, body: { error: 'Missing required query parameter: listing_id', code: 'MISSING_LISTING_ID' } };
  }

  const trimmedId = listingId.trim();
  if (!UUID_REGEX.test(trimmedId)) {
    return { status: 400, body: { error: 'listing_id must be a valid UUID format', code: 'INVALID_UUID' } };
  }

  const listing = await db.getListingById(trimmedId);
  if (!listing) {
    return { status: 404, body: { error: 'Listing not found', code: 'NOT_FOUND' } };
  }

  const slots = await db.getSlotsByListingId(trimmedId);
  return {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: { slots, total: slots.length },
  };
}

