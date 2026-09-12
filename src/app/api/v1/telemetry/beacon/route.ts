/**
 * REST API Endpoint: /api/v1/telemetry/beacon
 * File path: src/app/api/v1/telemetry/beacon/route.ts
 *
 * Telemetry Beacon Ingestion Engine for SponsorSlot:
 * - Ingests anonymous impression and click beacons from web applications and Chrome extensions.
 * - Supports both application/json and text/plain (navigator.sendBeacon).
 * - Guarantees zero PII collection (no IP addresses, user agents, or cookie storage).
 * - Aggregates counts per (slot_id, timestamp) atomically.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(request: NextRequest | Request) {
  let body: any;

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('text/plain') || contentType.includes('application/x-www-form-urlencoded')) {
      const rawText = await request.text();
      body = JSON.parse(rawText);
    } else {
      body = await request.json();
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload', code: 'INVALID_PAYLOAD' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { error: 'Payload must be an object', code: 'INVALID_PAYLOAD' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const slotId = typeof body.slot_id === 'string' ? body.slot_id.trim() : '';
  if (!slotId) {
    return NextResponse.json(
      { error: 'slot_id is required', code: 'MISSING_SLOT_ID' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  if (!UUID_REGEX.test(slotId)) {
    return NextResponse.json(
      { error: 'Invalid slot_id format', code: 'INVALID_UUID' },
      { status: 400, headers: CORS_HEADERS }
    );
  }

  const event = body.event;
  if (event !== 'impression' && event !== 'click') {
    return NextResponse.json(
      { error: "event must be either 'impression' or 'click'", code: 'INVALID_EVENT' },
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

  // Atomically increment telemetry daily counter
  const result = await db.incrementTelemetry(slotId, event);

  return NextResponse.json(
    {
      success: true,
      slot_id: slotId,
      event,
      impressions_count: result.impressions_count,
      clicks_count: result.clicks_count,
    },
    { status: 200, headers: CORS_HEADERS }
  );
}
