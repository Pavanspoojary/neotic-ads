/**
 * REST API Endpoint: /api/slots
 * File path: src/app/api/slots/route.ts
 *
 * Provides POST (create inventory slot with rental rate boundaries and copy limits)
 * and GET (query slots for a listing) handlers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { SlotType, InventorySlot } from '../../../lib/types';
import { validateRentalRate } from '../../../lib/escrow';

export const dynamic = 'force-dynamic';

const VALID_SLOT_TYPES = new Set<SlotType>([
  'header_pill',
  'empty_state',
  'footer_badge',
  'email_footer',
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    // 1. listing_id validation
    const listingId = typeof body.listing_id === 'string' ? body.listing_id.trim() : '';
    if (!listingId) {
      return NextResponse.json(
        { error: 'listing_id is required', code: 'MISSING_LISTING_ID' },
        { status: 400 }
      );
    }
    if (!UUID_REGEX.test(listingId)) {
      return NextResponse.json(
        { error: 'listing_id must be a valid UUID format', code: 'INVALID_UUID' },
        { status: 400 }
      );
    }

    const db = getDb();
    const listing = await db.getListingById(listingId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // 2. slot_name validation
    const slotName = typeof body.slot_name === 'string' ? body.slot_name.trim() : '';
    if (!slotName) {
      return NextResponse.json(
        { error: 'Slot name is required and cannot be empty', code: 'MISSING_SLOT_NAME' },
        { status: 400 }
      );
    }

    // 3. slot_type validation
    if (!body.slot_type || !VALID_SLOT_TYPES.has(body.slot_type)) {
      return NextResponse.json(
        {
          error: `Invalid slot_type: '${body.slot_type}'. Allowed values: ${Array.from(VALID_SLOT_TYPES).join(', ')}`,
          code: 'INVALID_SLOT_TYPE',
        },
        { status: 400 }
      );
    }

    // 4. monthly_price_cents rate boundary validation ($50 to $1,000 / mo)
    const rateValidation = validateRentalRate(body.monthly_price_cents);
    if (!rateValidation.valid) {
      return NextResponse.json(
        {
          error: 'Monthly rate must be between $50.00 and $1,000.00 (5,000 to 100,000 cents)',
          code: 'INVALID_RENTAL_RATE',
        },
        { status: 400 }
      );
    }

    // 5. guidelines validation (max 1000 chars)
    if (body.guidelines !== undefined && body.guidelines !== null) {
      if (typeof body.guidelines !== 'string') {
        return NextResponse.json(
          { error: 'guidelines must be a string', code: 'INVALID_GUIDELINES' },
          { status: 400 }
        );
      }
      if (body.guidelines.length > 1000) {
        return NextResponse.json(
          { error: 'Guidelines cannot exceed 1000 characters', code: 'GUIDELINES_TOO_LONG' },
          { status: 400 }
        );
      }
    }

    // 6. Persist slot via DB Seam
    const newSlot = await db.createSlot({
      listing_id: listingId,
      slot_name: slotName,
      slot_type: body.slot_type,
      monthly_price_cents: body.monthly_price_cents,
      is_available: body.is_available !== undefined ? Boolean(body.is_available) : true,
      guidelines: typeof body.guidelines === 'string' ? body.guidelines.trim() : undefined,
    });

    return NextResponse.json(
      {
        ...newSlot,
        slot: newSlot,
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
    console.error('[POST /api/slots] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest | Request) {
  try {
    const url = new URL(request.url);
    const listingId = url.searchParams.get('listing_id');

    if (!listingId || listingId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Missing required query parameter: listing_id', code: 'MISSING_LISTING_ID' },
        { status: 400 }
      );
    }

    const trimmedId = listingId.trim();
    if (!UUID_REGEX.test(trimmedId)) {
      return NextResponse.json(
        { error: 'listing_id must be a valid UUID format', code: 'INVALID_UUID' },
        { status: 400 }
      );
    }

    const db = getDb();
    const listing = await db.getListingById(trimmedId);
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const slots = await db.getSlotsByListingId(trimmedId);

    return NextResponse.json(
      { slots, total: slots.length },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('[GET /api/slots] Error:', error);
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
