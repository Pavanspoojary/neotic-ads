/**
 * REST API Endpoint: GET /api/listings/[slug]
 * File path: src/app/api/listings/[slug]/route.ts
 *
 * Fetches a single listing by its unique slug, including its associated inventory slots
 * and aggregated 30-day telemetry metrics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import {
  Listing,
  InventorySlot,
  TelemetrySummary,
} from '../../../../lib/types';

export const dynamic = 'force-dynamic';

export interface SlotWithTelemetry extends InventorySlot {
  telemetry_30d: {
    impressions_count: number;
    clicks_count: number;
    ctr_percentage: number;
  };
}

export interface ListingDetailResponse {
  listing: Listing;
  slots: SlotWithTelemetry[];
  telemetry_summary: {
    total_impressions: number;
    total_clicks: number;
    avg_ctr_percentage: number;
    period_days: number;
    slots: TelemetrySummary[];
  };
}

export async function GET(
  _request: NextRequest | Request,
  context: { params: { slug?: string } | Promise<{ slug?: string }> }
) {
  try {
    const rawParams = context.params;
    const resolvedParams = rawParams instanceof Promise ? await rawParams : rawParams;
    const slug = resolvedParams?.slug ? decodeURIComponent(resolvedParams.slug).toLowerCase().trim() : undefined;

    if (!slug) {
      return NextResponse.json(
        { error: 'Listing slug is required', code: 'INVALID_PARAM' },
        { status: 400 }
      );
    }

    const db = getDb();
    const listing = await db.getListingBySlug(slug);

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch all slots associated with this listing
    const slots = await db.getSlotsByListingId(listing.id);

    // Fetch 30-day telemetry for each slot in parallel
    const telemetryPromises = slots.map(async (slot) => {
      const records = await db.getTelemetry(slot.id, 30);
      const slotImpressions = records.reduce((sum, r) => sum + r.impressions_count, 0);
      const slotClicks = records.reduce((sum, r) => sum + r.clicks_count, 0);
      const slotCtr =
        slotImpressions > 0
          ? Number(((slotClicks / slotImpressions) * 100).toFixed(2))
          : 0;

      const summary: TelemetrySummary = {
        slot_id: slot.id,
        impressions_count: slotImpressions,
        clicks_count: slotClicks,
        ctr_percentage: slotCtr,
        days: 30,
      };

      const slotWithTelemetry: SlotWithTelemetry = {
        ...slot,
        telemetry_30d: {
          impressions_count: slotImpressions,
          clicks_count: slotClicks,
          ctr_percentage: slotCtr,
        },
      };

      return { slotWithTelemetry, summary };
    });

    const telemetryData = await Promise.all(telemetryPromises);

    const enrichedSlots = telemetryData.map((d) => d.slotWithTelemetry);
    const slotSummaries = telemetryData.map((d) => d.summary);

    const totalImpressions = slotSummaries.reduce((sum, s) => sum + s.impressions_count, 0);
    const totalClicks = slotSummaries.reduce((sum, s) => sum + s.clicks_count, 0);
    const avgCtr =
      totalImpressions > 0
        ? Number(((totalClicks / totalImpressions) * 100).toFixed(2))
        : 0;

    const responsePayload: ListingDetailResponse = {
      listing,
      slots: enrichedSlots,
      telemetry_summary: {
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        avg_ctr_percentage: avgCtr,
        period_days: 30,
        slots: slotSummaries,
      },
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
    console.error('[GET /api/listings/[slug]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
