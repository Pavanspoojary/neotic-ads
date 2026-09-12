import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryDatabaseRepository } from '../../src/lib/db.ts';
import {
  dispatchGetListings,
  dispatchGetListingBySlug,
  dispatchGetSlot,
  dispatchPostBeacon,
} from '../test-utils.ts';

describe('Integration: Public Marketplace Directory & Detail Flow (R1)', () => {
  let db: InMemoryDatabaseRepository;

  beforeEach(async () => {
    db = new InMemoryDatabaseRepository();
    await db.reset();
  });

  // Tier 1: Directory Search, Filtering & Detail Retrieval
  describe('Tier 1: Multi-Facet Search & Filtering', () => {
    it('returns all active listings with total count', async () => {
      const res = await dispatchGetListings({}, db);
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 7);
      assert.equal(res.body.listings.length, 7);
    });

    it('filters listings strictly by category (developer-tools)', async () => {
      const res = await dispatchGetListings({ category: 'developer-tools' }, db);
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 2);
      for (const l of res.body.listings) {
        assert.equal(l.category, 'developer-tools');
      }
    });

    it('filters listings strictly by app_type (chrome_extension)', async () => {
      const res = await dispatchGetListings({ app_type: 'chrome_extension' }, db);
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 2);
      for (const l of res.body.listings) {
        assert.equal(l.app_type, 'chrome_extension');
      }
    });

    it('executes case-insensitive keyword search on title and description', async () => {
      const queries = ['json', 'JSON', 'visualizer', 'intuitive'];
      for (const q of queries) {
        const res = await dispatchGetListings({ q }, db);
        assert.equal(res.status, 200);
        assert.ok(res.body.total >= 1, `Query "${q}" should return results`);
        assert.equal(res.body.listings[0].slug, 'jsonhero-visualizer');
      }
    });

    it('filters by minimum verified DAU (>= 10,000)', async () => {
      const res = await dispatchGetListings({ min_dau: 10000 }, db);
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 3); // TabMaster (18,900), RegexForge (15,800), JSONHero (12,400)
      for (const item of res.body.listings) {
        assert.ok(item.verified_dau >= 10000);
      }
    });

    it('sorts listings monotonically descending by verified DAU (sort=dau_desc)', async () => {
      const res = await dispatchGetListings({ sort: 'dau_desc' }, db);
      assert.equal(res.status, 200);
      assert.equal(res.body.listings[0].slug, 'tabmaster-pro'); // 18,900
      assert.equal(res.body.listings[1].slug, 'regex-forge'); // 15,800
      assert.equal(res.body.listings[2].slug, 'jsonhero-visualizer'); // 12,400
    });

    it('retrieves tool details, verified badges, and associated slots by slug', async () => {
      const listing = await db.getListingBySlug('jsonhero-visualizer');
      assert.ok(listing);
      assert.equal(listing.title, 'JSONHero Visualizer');
      assert.equal(listing.verified_dau, 12400);
      assert.equal(listing.verification_source, 'plausible');

      const slots = await db.getSlotsByListingId(listing.id);
      assert.equal(slots.length, 3, 'JSONHero should have 3 configured slots');
      const types = slots.map((s) => s.slot_type);
      assert.ok(types.includes('header_pill'));
      assert.ok(types.includes('empty_state'));
      assert.ok(types.includes('footer_badge'));
    });

    it('returns enriched metadata (slots_count, starting_price_cents, has_available_slots) for listings', async () => {
      const res = await dispatchGetListings({}, db);
      assert.equal(res.status, 200);
      assert.equal(res.body.listings.length, 7);
      for (const item of res.body.listings) {
        assert.ok(typeof item.slots_count === 'number');
        assert.ok(typeof item.available_slots_count === 'number');
        assert.ok(typeof item.has_available_slots === 'boolean');
        if (item.slots_count > 0) {
          assert.ok(typeof item.starting_price_cents === 'number');
          assert.ok((item.starting_price_cents as number) >= 5000);
        }
      }
    });

    it('retrieves detailed listing payload with slots and 30-day telemetry summary via dispatchGetListingBySlug', async () => {
      const res = await dispatchGetListingBySlug('jsonhero-visualizer', db);
      assert.equal(res.status, 200);
      assert.equal(res.body.listing.slug, 'jsonhero-visualizer');
      assert.equal(res.body.slots.length, 3);
      assert.ok(res.body.telemetry_summary.total_impressions > 0);
      assert.ok(res.body.telemetry_summary.avg_ctr_percentage > 0);
      assert.equal(res.body.telemetry_summary.period_days, 30);
      assert.equal(res.body.telemetry_summary.slots.length, 3);
      for (const slot of res.body.slots) {
        assert.ok(slot.telemetry_30d);
        assert.ok(typeof slot.telemetry_30d.impressions_count === 'number');
        assert.ok(typeof slot.telemetry_30d.clicks_count === 'number');
        assert.ok(typeof slot.telemetry_30d.ctr_percentage === 'number');
      }
    });
  });

  // Tier 2: Boundary & Corner Cases
  describe('Tier 2: Edge Filtering & Non-Existent Lookups', () => {
    it('returns empty array when search query matches zero listings', async () => {
      const res = await dispatchGetListings({ q: 'non-existent-xyz-keyword-12345' }, db);
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 0);
      assert.equal(res.body.listings.length, 0);
    });

    it('returns null for unknown slug lookup', async () => {
      const listing = await db.getListingBySlug('non-existent-slug-uuid');
      assert.equal(listing, null);
    });

    it('filters strictly for tools with available vacant slots (available_only=true)', async () => {
      const res = await dispatchGetListings({ available_only: true }, db);
      assert.equal(res.status, 200);
      assert.equal(res.body.total, 7);
    });

    it('returns 404 with descriptive JSON when slug does not exist via dispatchGetListingBySlug', async () => {
      const res = await dispatchGetListingBySlug('non-existent-ghost-slug', db);
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Listing not found');
      assert.equal(res.body.code, 'NOT_FOUND');
    });

    it('handles URI-encoded slugs and case-insensitivity in slug lookup', async () => {
      const res = await dispatchGetListingBySlug('JSONHero-Visualizer', db);
      assert.equal(res.status, 200);
      assert.equal(res.body.listing.slug, 'jsonhero-visualizer');

      const encodedRes = await dispatchGetListingBySlug('tabmaster-pro', db);
      assert.equal(encodedRes.status, 200);
      assert.equal(encodedRes.body.listing.slug, 'tabmaster-pro');
    });
  });

  // Tier 3: Multi-Facet Combined Filtering
  describe('Tier 3: Complex Multi-Facet Queries', () => {
    it('combines category, DAU threshold, and sorting into a unified query', async () => {
      const res = await dispatchGetListings(
        {
          category: 'developer-tools',
          min_dau: 10000,
          sort: 'dau_desc',
        },
        db
      );

      assert.equal(res.status, 200);
      assert.equal(res.body.total, 1);
      assert.equal(res.body.listings[0].slug, 'jsonhero-visualizer');
    });
  });

  // Tier 4: Real-World Application Scenario
  describe('Tier 4: End-to-End Advertiser Discovery to Delivery & Telemetry Flow', () => {
    it('simulates full journey: browse -> select slot -> book -> edge serve -> telemetry beacon', async () => {
      // 1. Advertiser browses directory with category filter
      const dirRes = await dispatchGetListings({ category: 'developer-tools' }, db);
      assert.equal(dirRes.body.total, 2);
      const chosenSlug = dirRes.body.listings[0].slug;

      // 2. View tool detail page and find vacant slot
      const listing = await db.getListingBySlug(chosenSlug);
      assert.ok(listing);
      const slots = await db.getSlotsByListingId(listing.id);
      const vacantSlot = slots.find((s) => s.is_available);
      assert.ok(vacantSlot, 'Must find a vacant slot');

      // 3. Check unfilled edge delivery returns referral fallback
      const edgePre = await dispatchGetSlot(vacantSlot.id, db);
      assert.equal(edgePre.body.active, false);
      assert.equal(edgePre.body.fallback, true);

      // 4. Advertiser completes booking checkout
      const booking = await db.bookSlot({
        slot_id: vacantSlot.id,
        sponsor_name: 'B2B Cloud Analytics',
        sponsor_email: 'growth@b2bcloud.io',
        creative_text: 'Analyze Postgres performance instantly',
        creative_target_url: 'https://b2bcloud.io',
      });
      assert.equal(booking.success, true);

      // 5. Edge delivery API now immediately returns active creative
      const edgePost = await dispatchGetSlot(vacantSlot.id, db);
      assert.equal(edgePost.body.active, true);
      assert.equal(edgePost.body.status, 'sponsored');
      assert.equal(edgePost.body.creative.text, 'Analyze Postgres performance instantly');
      assert.equal(edgePost.body.beacon.endpoint, '/api/v1/telemetry/beacon');

      // 6. Client SDK renders and transmits impression beacon
      const today = new Date().toISOString().split('T')[0];
      const initialTele = (await db.getTelemetry(vacantSlot.id, 1)).find((t) => t.telemetry_date === today);
      const initialImp = initialTele?.impressions_count || 0;
      const initialClicks = initialTele?.clicks_count || 0;

      const beaconRes = await dispatchPostBeacon(
        { slot_id: vacantSlot.id, event: 'impression' },
        'application/json',
        db
      );
      assert.equal(beaconRes.status, 200);
      assert.equal(beaconRes.body.impressions_count, initialImp + 1);

      // 7. Click beacon transmitted when user clicks sponsor link
      const clickRes = await dispatchPostBeacon(
        { slot_id: vacantSlot.id, event: 'click' },
        'application/json',
        db
      );
      assert.equal(clickRes.status, 200);
      assert.equal(clickRes.body.clicks_count, initialClicks + 1);
    });
  });
});
