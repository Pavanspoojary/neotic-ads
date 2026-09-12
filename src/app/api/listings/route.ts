/**
 * REST API Endpoint: /api/listings
 * File path: src/app/api/listings/route.ts
 *
 * Provides GET (multi-facet directory search and filtering)
 * and POST (tool onboarding registration with slug normalization and conflict checking).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import {
  ListingFilters,
  ListingCategory,
  AppType,
  Listing,
  VerificationSource,
  ListingStatus,
} from '../../../lib/types';

export const dynamic = 'force-dynamic';

export interface EnrichedListing extends Listing {
  slots_count: number;
  available_slots_count: number;
  has_available_slots: boolean;
  starting_price_cents: number | null;
}

export interface ListingsResponse {
  listings: EnrichedListing[];
  total: number;
}

const VALID_CATEGORIES: Set<string> = new Set<ListingCategory>([
  'developer-tools',
  'productivity',
  'design',
  'utilities',
]);

const VALID_APP_TYPES: Set<string> = new Set<AppType>([
  'web_app',
  'chrome_extension',
  'desktop_app',
]);

const VALID_VERIFICATION_SOURCES: Set<string> = new Set<VerificationSource>([
  'chrome_web_store',
  'plausible',
  'posthog',
  'ga4',
  'manual',
]);

const VALID_SORTS = new Set([
  'dau_desc',
  'dau_asc',
  'price_asc',
  'price_desc',
  'newest',
]);

const KEBAB_CASE_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(request: NextRequest | Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // 1. Category filter
    const categoryParam = searchParams.get('category');
    if (categoryParam && !VALID_CATEGORIES.has(categoryParam)) {
      return NextResponse.json(
        {
          error: `Invalid category: '${categoryParam}'. Allowed values: ${Array.from(VALID_CATEGORIES).join(', ')}`,
          code: 'INVALID_CATEGORY',
        },
        { status: 400 }
      );
    }

    // 2. App type filter
    const appTypeParam = searchParams.get('app_type');
    if (appTypeParam && !VALID_APP_TYPES.has(appTypeParam)) {
      return NextResponse.json(
        {
          error: `Invalid app_type: '${appTypeParam}'. Allowed values: ${Array.from(VALID_APP_TYPES).join(', ')}`,
          code: 'INVALID_APP_TYPE',
        },
        { status: 400 }
      );
    }

    // 3. Keyword search (supports 'search' or 'q')
    const qParam = searchParams.get('search') || searchParams.get('q') || undefined;

    // 4. Minimum DAU
    const minDauParam = searchParams.get('min_dau');
    let minDau: number | undefined;
    if (minDauParam !== null) {
      const parsed = parseInt(minDauParam, 10);
      if (isNaN(parsed) || parsed < 0) {
        return NextResponse.json(
          { error: 'min_dau must be a non-negative integer', code: 'INVALID_PARAM' },
          { status: 400 }
        );
      }
      minDau = parsed;
    }

    // 5. Sorting (supports 'sort_by' or 'sort')
    const sortParam = searchParams.get('sort_by') || searchParams.get('sort') || 'dau_desc';
    if (sortParam && !VALID_SORTS.has(sortParam)) {
      return NextResponse.json(
        {
          error: `Invalid sort: '${sortParam}'. Allowed values: ${Array.from(VALID_SORTS).join(', ')}`,
          code: 'INVALID_SORT',
        },
        { status: 400 }
      );
    }

    // 6. Available only flag
    const availParam = searchParams.get('available_only');
    const availableOnly =
      availParam !== null
        ? availParam === 'true' || availParam === '1' || availParam === 'yes'
        : undefined;

    // 7. Max price filter
    const maxPriceParam = searchParams.get('max_price_cents');
    let maxPriceCents: number | undefined;
    if (maxPriceParam !== null) {
      const parsed = parseInt(maxPriceParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        maxPriceCents = parsed;
      }
    }

    // Construct database query filters
    const filters: ListingFilters = {
      category: categoryParam as ListingCategory | undefined,
      app_type: appTypeParam as AppType | undefined,
      q: qParam?.trim(),
      min_dau: minDau,
      max_price_cents: maxPriceCents,
      available_only: availableOnly,
      sort: sortParam as any,
      status: 'active',
    };

    const db = getDb();
    const [rawListings, allSlots] = await Promise.all([
      db.getListings(filters),
      db.getAllSlots(),
    ]);

    // Index slots by listing_id for fast O(1) enrichment
    const slotsMap = new Map<string, typeof allSlots>();
    for (const slot of allSlots) {
      const group = slotsMap.get(slot.listing_id) || [];
      group.push(slot);
      slotsMap.set(slot.listing_id, group);
    }

    const enrichedListings: EnrichedListing[] = rawListings.map((listing) => {
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

    const responsePayload: ListingsResponse = {
      listings: enrichedListings,
      total: enrichedListings.length,
    };

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('[GET /api/listings] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest | Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Request body must be a JSON object', code: 'INVALID_BODY' },
        { status: 400 }
      );
    }

    // 1. Title validation
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required and cannot be empty', code: 'MISSING_TITLE' },
        { status: 400 }
      );
    }

    // 2. Category validation
    if (!body.category || !VALID_CATEGORIES.has(body.category)) {
      return NextResponse.json(
        {
          error: `Invalid category: '${body.category}'. Allowed values: ${Array.from(VALID_CATEGORIES).join(', ')}`,
          code: 'INVALID_CATEGORY',
        },
        { status: 400 }
      );
    }

    // 3. App type validation
    if (!body.app_type || !VALID_APP_TYPES.has(body.app_type)) {
      return NextResponse.json(
        {
          error: `Invalid app_type: '${body.app_type}'. Allowed values: ${Array.from(VALID_APP_TYPES).join(', ')}`,
          code: 'INVALID_APP_TYPE',
        },
        { status: 400 }
      );
    }

    // 4. Website URL validation (must start with http:// or https://, upgraded to https://)
    let websiteUrl = typeof body.website_url === 'string' ? body.website_url.trim() : '';
    if (!websiteUrl || (!websiteUrl.startsWith('https://') && !websiteUrl.startsWith('http://'))) {
      return NextResponse.json(
        { error: 'Website URL must be a valid URL starting with https:// or http://', code: 'INVALID_URL' },
        { status: 400 }
      );
    }
    if (websiteUrl.startsWith('http://')) {
      websiteUrl = websiteUrl.replace(/^http:\/\//, 'https://');
    }

    // 5. Verified DAU validation (non-negative integer)
    let verifiedDau = 0;
    if (body.verified_dau !== undefined && body.verified_dau !== null) {
      const dau = Number(body.verified_dau);
      if (isNaN(dau) || !Number.isInteger(dau) || dau < 0) {
        return NextResponse.json(
          { error: 'verified_dau must be a non-negative integer', code: 'INVALID_DAU' },
          { status: 400 }
        );
      }
      verifiedDau = dau;
    }

    // 6. Verification source validation
    const verificationSource = body.verification_source || 'manual';
    if (!VALID_VERIFICATION_SOURCES.has(verificationSource)) {
      return NextResponse.json(
        {
          error: `Invalid verification_source: '${body.verification_source}'. Allowed values: ${Array.from(VALID_VERIFICATION_SOURCES).join(', ')}`,
          code: 'INVALID_VERIFICATION_SOURCE',
        },
        { status: 400 }
      );
    }

    // 7. Slug handling & kebab-case format validation
    let finalSlug: string;
    if (typeof body.slug === 'string' && body.slug.trim().length > 0) {
      const providedSlug = body.slug.trim();
      if (!KEBAB_CASE_REGEX.test(providedSlug)) {
        return NextResponse.json(
          {
            error: 'Slug must be valid kebab-case consisting of lowercase alphanumeric characters separated by single hyphens',
            code: 'INVALID_SLUG_FORMAT',
          },
          { status: 400 }
        );
      }
      finalSlug = providedSlug;
    } else {
      // Auto-generate slug from title
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (!finalSlug || !KEBAB_CASE_REGEX.test(finalSlug)) {
        return NextResponse.json(
          {
            error: 'Failed to generate a valid kebab-case slug from title',
            code: 'INVALID_SLUG_FORMAT',
          },
          { status: 400 }
        );
      }
    }

    // 8. Uniqueness check (409 Conflict)
    const db = getDb();
    const existing = await db.getListingBySlug(finalSlug);
    if (existing) {
      return NextResponse.json(
        {
          error: 'Slug already in use',
          code: 'SLUG_CONFLICT',
        },
        { status: 409 }
      );
    }

    // 9. Persist to DB Seam
    const newListing = await db.createListing({
      title,
      slug: finalSlug,
      description: typeof body.description === 'string' ? body.description.trim() : '',
      category: body.category,
      app_type: body.app_type,
      website_url: websiteUrl,
      verified_dau: verifiedDau,
      verification_source: verificationSource as VerificationSource,
      verification_identifier: typeof body.verification_identifier === 'string' ? body.verification_identifier.trim() : undefined,
      verification_data: body.verification_data && typeof body.verification_data === 'object' ? body.verification_data : undefined,
      status: (body.status as ListingStatus) || 'active',
    });

    return NextResponse.json(
      {
        ...newListing,
        listing: newListing,
      },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    console.error('[POST /api/listings] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
