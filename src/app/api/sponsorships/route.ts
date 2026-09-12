/**
 * REST API Endpoint: /api/sponsorships
 * File path: src/app/api/sponsorships/route.ts
 *
 * Handles advertiser self-serve slot booking, 30-day escrow calculation,
 * and sponsorship listing queries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { enrichWithUtm, sanitizeSvg } from '../../../lib/escrow';
import { SLOT_COPY_LIMITS } from '../../../lib/types';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest | Request) {
  const { searchParams } = new URL(request.url);
  const slotId = searchParams.get('slot_id');
  const db = getDb();

  if (slotId) {
    if (!UUID_REGEX.test(slotId)) {
      return NextResponse.json(
        { error: 'Invalid slot_id format', code: 'INVALID_UUID' },
        { status: 400 }
      );
    }
    const sponsorships = await db.getSponsorshipsBySlotId(slotId);
    return NextResponse.json({ sponsorships }, { status: 200 });
  }

  // If no slot_id specified, return active sponsorship or all for the current user
  return NextResponse.json(
    { error: 'slot_id query parameter is required', code: 'MISSING_PARAM' },
    { status: 400 }
  );
}

export async function POST(request: NextRequest | Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload', code: 'INVALID_PAYLOAD' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Request body must be an object', code: 'INVALID_BODY' },
      { status: 400 }
    );
  }

  const slotId = typeof body.slot_id === 'string' ? body.slot_id.trim() : '';
  const sponsorName = typeof body.sponsor_name === 'string' ? body.sponsor_name.trim() : '';
  const sponsorEmail = typeof body.sponsor_email === 'string' ? body.sponsor_email.trim() : '';
  const creativeText = typeof body.creative_text === 'string' ? body.creative_text.trim() : '';
  let creativeTargetUrl = typeof body.creative_target_url === 'string' ? body.creative_target_url.trim() : '';
  let creativeImageUrl = typeof body.creative_image_url === 'string' ? body.creative_image_url.trim() : undefined;

  // 1. Validate slot_id
  if (!slotId || !UUID_REGEX.test(slotId)) {
    return NextResponse.json(
      { error: 'Valid slot_id is required', code: 'INVALID_SLOT_ID' },
      { status: 400 }
    );
  }

  // 2. Validate sponsor details
  if (!sponsorName) {
    return NextResponse.json(
      { error: 'sponsor_name is required', code: 'MISSING_SPONSOR_NAME' },
      { status: 400 }
    );
  }
  if (!sponsorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sponsorEmail)) {
    return NextResponse.json(
      { error: 'A valid sponsor_email is required', code: 'INVALID_EMAIL' },
      { status: 400 }
    );
  }

  // 3. Validate creative text
  if (!creativeText) {
    return NextResponse.json(
      { error: 'creative_text is required', code: 'MISSING_CREATIVE_TEXT' },
      { status: 400 }
    );
  }

  const db = getDb();
  const slot = await db.getSlotById(slotId);
  if (!slot) {
    return NextResponse.json(
      { error: 'Slot not found', code: 'NOT_FOUND' },
      { status: 404 }
    );
  }

  const listing = await db.getListingById(slot.listing_id);

  // 4. Validate and enrich URL
  if (!creativeTargetUrl.startsWith('https://')) {
    return NextResponse.json(
      { error: 'creative_target_url must be a secure HTTPS URL', code: 'INVALID_TARGET_URL' },
      { status: 400 }
    );
  }
  // Auto-enrich with UTM tags for tracking
  creativeTargetUrl = enrichWithUtm(creativeTargetUrl, slot.slot_type, listing?.slug || 'sponsorslot');

  if (!slot.is_available) {
    return NextResponse.json(
      { error: 'This slot is currently leased or unavailable', code: 'SLOT_UNAVAILABLE' },
      { status: 409 }
    );
  }

  const maxChars = SLOT_COPY_LIMITS[slot.slot_type] || 80;
  if (creativeText.length > maxChars) {
    return NextResponse.json(
      {
        error: `Creative text exceeds maximum allowed length of ${maxChars} characters for ${slot.slot_type}`,
        code: 'COPY_TOO_LONG',
        max_characters: maxChars,
      },
      { status: 400 }
    );
  }

  // Execute booking and escrow hold
  const bookingResult = await (db as any).bookSlot({
    slot_id: slotId,
    sponsor_name: sponsorName,
    sponsor_email: sponsorEmail,
    creative_text: creativeText,
    creative_target_url: creativeTargetUrl,
    creative_image_url: creativeImageUrl,
  });

  if (!bookingResult.success) {
    return NextResponse.json(
      { error: bookingResult.error || 'Failed to complete booking', code: 'BOOKING_FAILED' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      sponsorship: bookingResult.sponsorship,
      message: 'Sponsorship successfully booked. 30-day escrow initiated.',
    },
    { status: 201 }
  );
}
