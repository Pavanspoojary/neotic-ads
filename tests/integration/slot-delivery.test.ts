import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryDatabaseRepository } from '../../src/lib/db.ts';
import { dispatchGetSlot } from '../test-utils.ts';

describe('Integration: Edge Slot Delivery API (GET /api/v1/slot/[id])', () => {
  let db: InMemoryDatabaseRepository;
  const activeSlotId = '20000000-0000-0000-0000-000000000001'; // JSONHero Header Pill (Active sponsorship by LogFast)
  const unfilledSlotId = '20000000-0000-0000-0000-000000000002'; // JSONHero Empty Canvas (Vacant)

  beforeEach(async () => {
    db = new InMemoryDatabaseRepository();
    await db.reset();
  });

  // Tier 1: Core Feature Verification
  describe('Tier 1: Active & Unfilled Slot Delivery Contracts', () => {
    it('serves active sponsored creative with 200 OK and complete creative metadata', async () => {
      const res = await dispatchGetSlot(activeSlotId, db);

      assert.equal(res.status, 200);
      assert.equal(res.body.active, true);
      assert.equal(res.body.fallback, false);
      assert.equal(res.body.status, 'sponsored');
      assert.ok(res.body.creative.text.includes('LogFast'));
      assert.ok(res.body.creative.target_url.startsWith('https://logfast.io'));
      assert.equal(res.body.slot.type, 'header_pill');
      assert.equal(res.body.beacon.endpoint, '/api/v1/telemetry/beacon');
      assert.equal(res.body.beacon.slot_id, activeSlotId);
    });

    it('serves unfilled slot with 200 OK and viral self-serve referral fallback CTA', async () => {
      const res = await dispatchGetSlot(unfilledSlotId, db);

      assert.equal(res.status, 200);
      assert.equal(res.body.active, false);
      assert.equal(res.body.fallback, true);
      assert.equal(res.body.status, 'unfilled');
      assert.ok(res.body.creative.text.includes('Place your product here via SponsorSlot'));
      assert.ok(res.body.creative.target_url.includes('ref=unfilled_slot'));
      assert.ok(res.body.creative.target_url.includes(unfilledSlotId));
      assert.equal(res.body.beacon.endpoint, '/api/v1/telemetry/beacon');
    });

    it('includes public edge caching headers with stale-while-revalidate', async () => {
      const res = await dispatchGetSlot(activeSlotId, db);

      const cacheControl = res.headers['Cache-Control'];
      assert.ok(cacheControl, 'Cache-Control header must be present');
      assert.ok(cacheControl.includes('public'), 'Must be marked public');
      assert.ok(cacheControl.includes('s-maxage=300'), 'Must specify s-maxage=300');
      assert.ok(cacheControl.includes('stale-while-revalidate=600'), 'Must allow stale-while-revalidate');
    });

    it('sets global CORS headers allowing cross-origin web and extension access', async () => {
      const res = await dispatchGetSlot(activeSlotId, db);

      assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
    });

    it('specifies application/json; charset=utf-8 Content-Type', async () => {
      const res = await dispatchGetSlot(activeSlotId, db);

      assert.ok(res.headers['Content-Type'].includes('application/json'));
    });
  });

  // Tier 2: Boundary & Corner Cases
  describe('Tier 2: Error Boundaries, Malformed Inputs & Manifest V3 Compliance', () => {
    it('returns 404 Not Found for non-existent slot UUID', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      const res = await dispatchGetSlot(nonExistentUuid, db);

      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Slot not found');
      assert.equal(res.body.code, 'NOT_FOUND');
    });

    it('returns 400 Bad Request for malformed non-UUID identifiers', async () => {
      const badIds = ['invalid-id', '12345', 'c7a82b20', "'; DROP TABLE inventory_slots; --"];
      for (const badId of badIds) {
        const res = await dispatchGetSlot(badId, db);
        assert.equal(res.status, 400, `Expected 400 for bad id: ${badId}`);
        assert.equal(res.body.error, 'Invalid slot ID format');
      }
    });

    it('automatically falls back to referral CTA when sponsorship status is completed', async () => {
      const sp = await db.getActiveSponsorship(activeSlotId);
      assert.ok(sp, 'Must have active sponsorship initially');
      await db.updateSponsorshipStatus(sp.id, 'completed');

      const res = await dispatchGetSlot(activeSlotId, db);
      assert.equal(res.status, 200);
      assert.equal(res.body.active, false);
      assert.equal(res.body.fallback, true);
      assert.ok(res.body.creative.text.includes('Place your product here'));
    });

    it('guarantees Manifest V3 compliance with declarative JSON and zero remote script strings', async () => {
      const res = await dispatchGetSlot(activeSlotId, db);
      const jsonString = JSON.stringify(res.body);

      assert.ok(!jsonString.includes('<script>'), 'Payload must not contain script tags');
      assert.ok(!jsonString.includes('javascript:'), 'Payload must not contain javascript: protocol');
      assert.ok(!jsonString.includes('eval('), 'Payload must not contain eval');
    });
  });

  // Tier 3: Cross-Feature Integration
  describe('Tier 3: Listing Metadata & Beacon Alignment', () => {
    it('seamlessly joins parent listing title and slug with slot payload', async () => {
      const res = await dispatchGetSlot(activeSlotId, db);

      assert.equal(res.body.slot.listing_title, 'JSONHero Visualizer');
      assert.equal(res.body.slot.listing_slug, 'jsonhero-visualizer');
    });
  });
});
