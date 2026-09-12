/**
 * REST API Endpoint: /api/v1/slot/[id]
 * File path: src/app/api/v1/slot/[id]/route.ts
 *
 * Edge creative delivery engine for SponsorSlot:
 * - Ultra-low latency creative resolution for in-app software and Chrome extensions (Manifest V3 compliant).
 * - Serves active creative metadata or viral self-serve referral fallback CTA.
 * - Sets edge caching headers and global CORS headers for cross-origin host apps.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const EDGE_CACHE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
  ...CORS_HEADERS,
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(
  request: NextRequest | Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const resolvedParams = await Promise.resolve(params);
  const slotId = resolvedParams?.id?.trim();

  if (!slotId || !UUID_REGEX.test(slotId)) {
    return NextResponse.json(
      { error: 'Invalid slot ID format', code: 'INVALID_PARAM' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const db = getDb();
  const slot = await db.getSlotById(slotId);

  if (!slot) {
    return NextResponse.json(
      { error: 'Slot not found', code: 'NOT_FOUND' },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const listing = await db.getListingById(slot.listing_id);
  const activeSponsorship = await db.getActiveSponsorship(slot.id);

  if (activeSponsorship) {
    return new NextResponse(
      JSON.stringify({
        active: true,
        status: 'sponsored',
        fallback: false,
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
      }),
      {
        status: 200,
        headers: EDGE_CACHE_HEADERS,
      }
    );
  }

  // Unfilled / Vacant slot fallback (Viral Growth Engine)
  return new NextResponse(
    JSON.stringify({
      active: false,
      status: 'unfilled',
      fallback: true,
      slot: {
        id: slot.id,
        name: slot.slot_name,
        type: slot.slot_type,
        listing_title: listing?.title || '',
        listing_slug: listing?.slug || '',
      },
      creative: {
        text: 'Place your product here via SponsorSlot',
        target_url: `https://sponsorslot.com/sponsor/${slot.id}?ref=unfilled_slot`,
        image_url: null,
        badge_svg: null,
        disclaimer_text: 'Sponsor This Spot',
      },
      beacon: {
        endpoint: '/api/v1/telemetry/beacon',
        slot_id: slot.id,
      },
    }),
    {
      status: 200,
      headers: EDGE_CACHE_HEADERS,
    }
  );
}
