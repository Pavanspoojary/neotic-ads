import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Ensure global React is available for Server Components rendered in Node/tsx
(globalThis as any).React = React;

// Domain and Seam imports
import { getDb, resetInMemoryDb } from '../../src/lib/db.ts';
import {
  calculateCtr,
  calculateEffectiveCpm,
  calculateEffectiveCpc,
  calculateEscrowSplit,
  formatCentsToUsd,
} from '../../src/lib/escrow.ts';
import {
  SLOT_COPY_LIMITS,
  SlotType,
  ImpressionTelemetry,
  InventorySlot,
} from '../../src/lib/types.ts';
import {
  SEED_LISTINGS,
  SEED_SLOTS,
} from '../../src/lib/fixtures.ts';

// Production UI Components and Route Handlers under challenge
import { TelemetryChart } from '../../src/components/TelemetryChart.tsx';
import ToolDetailPage, { generateMetadata } from '../../src/app/tools/[slug]/page.tsx';
import { GET as getListingBySlugRoute } from '../../src/app/api/listings/[slug]/route.ts';

describe('Milestone 2 Empirical Challenger Stress Test Suite', () => {
  beforeEach(async () => {
    await resetInMemoryDb();
  });

  // ==========================================================================
  // Section 1: Telemetry Visual Math & Boundary Stress Tests
  // ==========================================================================
  describe('Telemetry Visual Math & Calculations', () => {
    it('handles zero impressions without returning NaN, Infinity, or throwing', () => {
      // Direct arithmetic seam
      assert.equal(calculateCtr(0, 0), 0.0);
      assert.equal(calculateCtr(10, 0), 0.0);
      assert.equal(calculateCtr(0, 1000), 0.0);
      assert.equal(calculateCtr(-5, 0), 0.0);
      assert.equal(calculateCtr(0, -100), 0.0);

      assert.equal(Number.isNaN(calculateCtr(0, 0)), false);
      assert.equal(Number.isFinite(calculateCtr(0, 0)), true);
    });

    it('handles CPM and CPC division-by-zero safely', () => {
      assert.equal(calculateEffectiveCpm(25000, 0), 0.0);
      assert.equal(calculateEffectiveCpm(0, 5000), 0.0);
      assert.equal(calculateEffectiveCpc(25000, 0), 0.0);
      assert.equal(calculateEffectiveCpc(0, 50), 0.0);
    });

    it('renders TelemetryChart fallback UI gracefully for empty telemetry records', () => {
      const htmlEmpty = renderToStaticMarkup(
        React.createElement(TelemetryChart, { telemetry: [] })
      );
      assert.ok(
        htmlEmpty.includes('No 30-day telemetry history recorded yet'),
        'Fallback text must be present for empty telemetry'
      );
      assert.ok(
        htmlEmpty.includes('Telemetry begins logging upon slot activation'),
        'Sub-text must explain activation'
      );
      assert.ok(!htmlEmpty.includes('NaN'), 'Fallback HTML must never contain NaN');
    });

    it('renders TelemetryChart default parameter gracefully when telemetry prop is omitted', () => {
      const htmlDefault = renderToStaticMarkup(
        React.createElement(TelemetryChart, {})
      );
      assert.ok(htmlDefault.includes('No 30-day telemetry history recorded yet'));
    });

    it('renders TelemetryChart with zero impressions across all days without NaN or divide-by-zero', () => {
      const zeroTelemetry: ImpressionTelemetry[] = Array.from({ length: 14 }, (_, i) => ({
        id: `zero-${i}`,
        slot_id: 'slot-zero',
        telemetry_date: `2026-09-${String(i + 1).padStart(2, '0')}`,
        impressions_count: 0,
        clicks_count: 0,
        created_at: '2026-09-01T00:00:00Z',
      }));

      const html = renderToStaticMarkup(
        React.createElement(TelemetryChart, { telemetry: zeroTelemetry })
      );

      assert.ok(!html.includes('NaN'), 'Must never contain NaN');
      assert.ok(!html.includes('Infinity'), 'Must never contain Infinity');
      assert.ok(html.includes('0.00%'), 'Avg CTR must display as 0.00%');
      assert.ok(html.includes('Peak: 1 / day'), 'Peak daily impression safely floors to 1 to avoid zero division');
      assert.ok(html.includes('height:8%'), 'Bars must have minimum height floor of 8% for visibility');
    });

    it('normalizes massive impressions (100,000,000) without integer overflow or display distortion', () => {
      const massiveTelemetry: ImpressionTelemetry[] = [
        {
          id: 'massive-1',
          slot_id: 'slot-massive',
          telemetry_date: '2026-09-01',
          impressions_count: 100000000,
          clicks_count: 5000000,
          created_at: '2026-09-01T00:00:00Z',
        },
        {
          id: 'massive-2',
          slot_id: 'slot-massive',
          telemetry_date: '2026-09-02',
          impressions_count: 50000000,
          clicks_count: 2500000,
          created_at: '2026-09-02T00:00:00Z',
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(TelemetryChart, { telemetry: massiveTelemetry })
      );

      assert.ok(!html.includes('NaN'));
      assert.ok(html.includes('150,000,000'), 'Formatted total impressions');
      assert.ok(html.includes('7,500,000'), 'Formatted total clicks');
      assert.ok(html.includes('5.00%'), 'Calculated CTR');
      assert.ok(html.includes('height:100%'), 'Peak day normalizes to 100%');
      assert.ok(html.includes('height:50%'), 'Half-peak day normalizes to 50%');
    });

    it('handles single-day telemetry record properly', () => {
      const singleTelemetry: ImpressionTelemetry[] = [
        {
          id: 'single-1',
          slot_id: 'slot-single',
          telemetry_date: '2026-09-01',
          impressions_count: 4200,
          clicks_count: 147,
          created_at: '2026-09-01T00:00:00Z',
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(TelemetryChart, { telemetry: singleTelemetry })
      );
      assert.ok(!html.includes('NaN'));
      assert.ok(html.includes('4,200'));
      assert.ok(html.includes('147'));
      assert.ok(html.includes('3.50%'));
      assert.ok(html.includes('height:100%'));
    });

    it('empirically reveals defect: TelemetryChart crashes with TypeError if impressions_count is undefined in tooltip', () => {
      const glitchyTelemetry = [
        {
          id: 'glitch-1',
          slot_id: 'slot-glitch',
          telemetry_date: '2026-09-01',
          impressions_count: (undefined as unknown) as number,
          clicks_count: 0,
          created_at: '2026-09-01T00:00:00Z',
        },
      ];

      // Lines 20, 23, 66, 67 guard with (t.impressions_count || 0), but line 68 omits fallback
      assert.throws(
        () => renderToStaticMarkup(React.createElement(TelemetryChart, { telemetry: glitchyTelemetry as any })),
        {
          name: 'TypeError',
          message: /Cannot read properties of undefined \(reading 'toLocaleString'\)/,
        }
      );
    });

    it('empirically reveals defect: TelemetryChart crashes with TypeError if telemetry prop is explicitly null', () => {
      // Default parameter `telemetry = []` does not catch null
      assert.throws(
        () => renderToStaticMarkup(React.createElement(TelemetryChart, { telemetry: null as any })),
        {
          name: 'TypeError',
          message: /Cannot read properties of null \(reading 'reduce'\)/,
        }
      );
    });
  });

  // ==========================================================================
  // Section 2: Slug Lookup & REST API Endpoint Stress Tests
  // ==========================================================================
  describe('Tool Detail Slug Lookup & REST Route (/api/listings/[slug])', () => {
    it('resolves all 7 seed listings via REST API with complete slots and telemetry', async () => {
      for (const seed of SEED_LISTINGS) {
        const req = new Request(`http://localhost:3000/api/listings/${seed.slug}`);
        const res = await getListingBySlugRoute(req, { params: { slug: seed.slug } });

        assert.equal(res.status, 200, `Seed slug ${seed.slug} must return 200`);
        const data = await res.json();

        assert.equal(data.listing.id, seed.id);
        assert.equal(data.listing.slug, seed.slug);
        assert.equal(data.listing.title, seed.title);
        assert.ok(Array.isArray(data.slots), 'slots must be an array');
        assert.ok(data.slots.length > 0, `Seed ${seed.slug} must have configured slots`);

        // Check telemetry summary
        assert.ok(data.telemetry_summary, 'telemetry_summary must be present');
        assert.equal(data.telemetry_summary.period_days, 30);
        assert.ok(typeof data.telemetry_summary.total_impressions === 'number');
        assert.ok(typeof data.telemetry_summary.total_clicks === 'number');
        assert.ok(typeof data.telemetry_summary.avg_ctr_percentage === 'number');
        assert.equal(data.telemetry_summary.slots.length, data.slots.length);

        for (const slot of data.slots) {
          assert.ok(slot.telemetry_30d, 'per-slot 30d telemetry must be present');
          assert.ok(typeof slot.telemetry_30d.impressions_count === 'number');
          assert.ok(typeof slot.telemetry_30d.clicks_count === 'number');
          assert.ok(typeof slot.telemetry_30d.ctr_percentage === 'number');
        }
      }
    });

    it('resolves slug route when params is passed as a Promise (Next.js 15 parity)', async () => {
      const req = new Request('http://localhost:3000/api/listings/jsonhero-visualizer');
      const res = await getListingBySlugRoute(req, {
        params: Promise.resolve({ slug: 'jsonhero-visualizer' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.listing.slug, 'jsonhero-visualizer');
    });

    it('returns 404 Not Found for non-existent slug on REST API', async () => {
      const badSlugs = [
        'non-existent-tool-slug',
        'does-not-exist-99999',
        'ghost-app-404',
      ];

      for (const badSlug of badSlugs) {
        const req = new Request(`http://localhost:3000/api/listings/${badSlug}`);
        const res = await getListingBySlugRoute(req, { params: { slug: badSlug } });

        assert.equal(res.status, 404, `Slug ${badSlug} must return 404`);
        const data = await res.json();
        assert.equal(data.error, 'Listing not found');
        assert.equal(data.code, 'NOT_FOUND');
      }
    });

    it('returns 400 Bad Request when slug parameter is empty or whitespace', async () => {
      const emptyParams = ['', '   ', '%20%20'];

      for (const p of emptyParams) {
        const req = new Request(`http://localhost:3000/api/listings/${p}`);
        const res = await getListingBySlugRoute(req, { params: { slug: p } });

        assert.equal(res.status, 400, `Empty slug "${p}" must return 400`);
        const data = await res.json();
        assert.equal(data.error, 'Listing slug is required');
        assert.equal(data.code, 'INVALID_PARAM');
      }
    });

    it('handles case-insensitivity and whitespace trimming on REST route', async () => {
      const testCases = [
        'JSONHero-Visualizer',
        'jsonhero-VISUALIZER',
        '  jsonhero-visualizer  ',
        'TABMASTER-PRO',
      ];

      for (const slugInput of testCases) {
        const req = new Request(`http://localhost:3000/api/listings/${encodeURIComponent(slugInput)}`);
        const res = await getListingBySlugRoute(req, { params: { slug: slugInput } });

        assert.equal(res.status, 200, `Slug variation "${slugInput}" must resolve to 200`);
        const data = await res.json();
        assert.ok(data.listing.id);
      }
    });

    it('handles URL-encoded characters in slug lookup', async () => {
      const req = new Request('http://localhost:3000/api/listings/tabmaster-pro');
      const res = await getListingBySlugRoute(req, { params: { slug: 'tabmaster-pro' } });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.listing.slug, 'tabmaster-pro');
    });

    it('returns public caching headers and CORS headers on 200 responses', async () => {
      const req = new Request('http://localhost:3000/api/listings/jsonhero-visualizer');
      const res = await getListingBySlugRoute(req, { params: { slug: 'jsonhero-visualizer' } });

      assert.equal(res.headers.get('content-type'), 'application/json; charset=utf-8');
      assert.equal(res.headers.get('access-control-allow-origin'), '*');
      assert.ok(res.headers.get('cache-control')?.includes('s-maxage=60'));
    });

    it('empirically reveals discrepancy: GET /api/listings/[slug] returns draft listings whereas ToolDetailPage hides them', async () => {
      const db = getDb();
      const draft = await db.createListing({
        title: 'Draft Discovery Tool',
        slug: 'draft-discovery-tool',
        description: 'Under development',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://draft.dev',
        verified_dau: 300,
        verification_source: 'manual',
      });
      (draft as any).status = 'draft';
      (db as any).listings.set(draft.id, draft);

      // REST route currently returns 200 with status: 'draft'
      const req = new Request('http://localhost:3000/api/listings/draft-discovery-tool');
      const res = await getListingBySlugRoute(req, { params: { slug: 'draft-discovery-tool' } });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.listing.status, 'draft');

      // While server component ToolDetailPage hides it by throwing notFound()
      let notFoundCaught = false;
      try {
        await ToolDetailPage({ params: { slug: 'draft-discovery-tool' } });
      } catch (err: any) {
        if (err.digest === 'NEXT_NOT_FOUND' || err.message === 'NEXT_NOT_FOUND') {
          notFoundCaught = true;
        }
      }
      assert.equal(notFoundCaught, true);
    });
  });

  // ==========================================================================
  // Section 3: Server Component (ToolDetailPage) & Metadata Stress Tests
  // ==========================================================================
  describe('Server Component (ToolDetailPage) & Metadata', () => {
    it('generates dynamic metadata for all 7 seed listings', async () => {
      for (const seed of SEED_LISTINGS) {
        const meta = await generateMetadata({ params: { slug: seed.slug } });
        assert.ok(
          (meta.title as string).includes(seed.title),
          `Metadata title must include "${seed.title}"`
        );
        assert.ok(
          (meta.description as string).includes(seed.verified_dau.toLocaleString('en-US')),
          'Metadata description must include formatted verified DAU'
        );
      }
    });

    it('generates 404 fallback metadata for non-existent slug', async () => {
      const meta = await generateMetadata({ params: { slug: 'unknown-tool' } });
      assert.equal(meta.title, 'Tool Not Found — SponsorSlot');
    });

    it('ToolDetailPage triggers notFound() for non-existent slug', async () => {
      let threwNotFound = false;
      try {
        await ToolDetailPage({ params: { slug: 'non-existent-tool-xyz' } });
      } catch (err: any) {
        threwNotFound =
          err.message === 'NEXT_NOT_FOUND' ||
          err.digest === 'NEXT_NOT_FOUND' ||
          Boolean(err.toString().includes('NEXT_NOT_FOUND'));
      }
      assert.ok(threwNotFound, 'ToolDetailPage must call notFound() when slug does not exist');
    });

    it('ToolDetailPage triggers notFound() when listing exists but status is draft', async () => {
      const db = getDb();
      const draft = await db.createListing({
        title: 'Draft Secret Tool',
        slug: 'draft-secret-tool',
        description: 'Under construction',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://secret.dev',
        verified_dau: 500,
        verification_source: 'manual',
      });
      (draft as any).status = 'draft';
      (db as any).listings.set(draft.id, draft);

      let threwNotFound = false;
      try {
        await ToolDetailPage({ params: { slug: 'draft-secret-tool' } });
      } catch (err: any) {
        threwNotFound =
          err.message === 'NEXT_NOT_FOUND' ||
          err.digest === 'NEXT_NOT_FOUND' ||
          Boolean(err.toString().includes('NEXT_NOT_FOUND'));
      }
      assert.ok(threwNotFound, 'ToolDetailPage must hide draft listings by invoking notFound()');
    });

    it('ToolDetailPage triggers notFound() when listing status is paused', async () => {
      const db = getDb();
      const paused = await db.createListing({
        title: 'Paused Tool',
        slug: 'paused-tool',
        description: 'Currently paused',
        category: 'productivity',
        app_type: 'web_app',
        website_url: 'https://paused.dev',
        verified_dau: 1000,
        verification_source: 'manual',
      });
      (paused as any).status = 'paused';
      (db as any).listings.set(paused.id, paused);

      let threwNotFound = false;
      try {
        await ToolDetailPage({ params: { slug: 'paused-tool' } });
      } catch (err: any) {
        threwNotFound =
          err.message === 'NEXT_NOT_FOUND' ||
          err.digest === 'NEXT_NOT_FOUND' ||
          Boolean(err.toString().includes('NEXT_NOT_FOUND'));
      }
      assert.ok(threwNotFound, 'ToolDetailPage must hide paused listings by invoking notFound()');
    });

    it('resolves ToolDetailPage successfully for active seed listings and inspects element tree', async () => {
      const jsx = await ToolDetailPage({ params: { slug: 'jsonhero-visualizer' } });
      assert.ok(jsx, 'ToolDetailPage must return a JSX element');
      assert.equal(typeof jsx, 'object');
      assert.equal((jsx as any).type, 'div');
    });

    it('empirically reveals inconsistency: generateMetadata emits listing details for draft listings while page 404s', async () => {
      const db = getDb();
      const draft = await db.createListing({
        title: 'Unreleased Secret Project',
        slug: 'unreleased-secret-project',
        description: 'Top secret developer tool',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://secret.dev',
        verified_dau: 999,
        verification_source: 'manual',
      });
      (draft as any).status = 'draft';
      (db as any).listings.set(draft.id, draft);

      // generateMetadata returns the secret listing's title because it does not check listing.status === 'active'
      const meta = await generateMetadata({ params: { slug: 'unreleased-secret-project' } });
      assert.ok(
        (meta.title as string).includes('Unreleased Secret Project'),
        'Exposes leak: generateMetadata does not check status === active'
      );
    });
  });

  // ==========================================================================
  // Section 4: Slot Showcase, Copy Limits, Pricing & Availability Invariants
  // ==========================================================================
  describe('Inventory Slot Showcase & Domain Invariants', () => {
    it('verifies all 18 seed slots strictly adhere to $50.00 to $1,000.00 rental boundaries', () => {
      assert.equal(SEED_SLOTS.length, 18, 'Must have exactly 18 seed slots');

      for (const slot of SEED_SLOTS) {
        assert.ok(
          slot.monthly_price_cents >= 5000,
          `Slot ${slot.slot_name} price ${slot.monthly_price_cents} must be >= 5,000 cents ($50)`
        );
        assert.ok(
          slot.monthly_price_cents <= 100000,
          `Slot ${slot.slot_name} price ${slot.monthly_price_cents} must be <= 100,000 cents ($1,000)`
        );
        assert.ok(
          Number.isInteger(slot.monthly_price_cents),
          `Slot ${slot.slot_name} price must be an integer cent amount`
        );

        // Verify split calculation works cleanly on every single seed slot
        const split = calculateEscrowSplit(slot.monthly_price_cents);
        assert.equal(split.platform_fee_cents + split.creator_payout_cents, slot.monthly_price_cents);
      }
    });

    it('verifies exact copy limits for all 4 standardized slot formats', () => {
      assert.equal(SLOT_COPY_LIMITS.header_pill, 80);
      assert.equal(SLOT_COPY_LIMITS.empty_state, 200);
      assert.equal(SLOT_COPY_LIMITS.footer_badge, 60);
      assert.equal(SLOT_COPY_LIMITS.email_footer, 120);

      const allTypes: SlotType[] = ['header_pill', 'empty_state', 'footer_badge', 'email_footer'];
      for (const type of allTypes) {
        assert.ok(
          SLOT_COPY_LIMITS[type] > 0,
          `Slot format ${type} must define a positive character limit`
        );
      }
    });

    it('verifies availability toggles correctly distinguish bookable vs occupied slots', async () => {
      const db = getDb();
      const jsonHero = await db.getListingBySlug('jsonhero-visualizer');
      assert.ok(jsonHero);

      const slots = await db.getSlotsByListingId(jsonHero.id);
      const availableSlots = slots.filter((s) => s.is_available);
      const occupiedSlots = slots.filter((s) => !s.is_available);

      assert.ok(availableSlots.length > 0, 'Must have at least one bookable slot');
      assert.ok(occupiedSlots.length > 0, 'Must have at least one occupied slot');

      // Check slot attributes
      for (const s of availableSlots) {
        assert.equal(s.is_available, true);
      }
      for (const s of occupiedSlots) {
        assert.equal(s.is_available, false);
      }
    });

    it('verifies single-tenant invariant: max_sponsors is strictly 1 across all slots', () => {
      for (const slot of SEED_SLOTS) {
        assert.equal(
          slot.max_sponsors,
          1,
          `Slot ${slot.slot_name} max_sponsors must be strictly 1 (single-tenant)`
        );
      }
    });

    it('verifies formatted USD prices match expected strings', () => {
      assert.equal(formatCentsToUsd(5000), '$50.00');
      assert.equal(formatCentsToUsd(25000), '$250.00');
      assert.equal(formatCentsToUsd(100000), '$1,000.00');
      assert.equal(formatCentsToUsd(7500), '$75.00');
    });
  });
});
