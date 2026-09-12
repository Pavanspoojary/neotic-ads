/**
 * Adversarial Stress Harness: Marketplace Search, Filtering & Seam Concurrency
 * File path: tests/integration/marketplace-adversarial.test.ts
 *
 * Empirical verification suite for Requirement R1:
 * - Search query boundary attacks (whitespace, unicode, punctuation, uppercase/mixed case, long strings)
 * - Out-of-bounds DAU values (negative, non-numeric, extreme >1M)
 * - Strict enum validation (category, app_type, sort rejection with 400 Bad Request)
 * - Sorting stability & monotonicity (DAU asc/desc, price asc/desc)
 * - Availability filtering invariants (tools with 0 slots, tools with 100% booked slots)
 * - Concurrent reading and booking seam isolation
 */

import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryDatabaseRepository,
  setDb,
  getDb,
  resetInMemoryDb,
} from '../../src/lib/db.ts';
import { GET as getListingsRoute } from '../../src/app/api/listings/route.ts';
import { GET as getListingBySlugRoute } from '../../src/app/api/listings/[slug]/route.ts';
import {
  dispatchGetListings,
  dispatchGetListingBySlug,
  SEED_LISTINGS,
  SEED_SLOTS,
} from '../test-utils.ts';

describe('Adversarial Challenge: Marketplace Search, Filtering & Seam Concurrency', () => {
  let db: InMemoryDatabaseRepository;

  beforeEach(async () => {
    db = new InMemoryDatabaseRepository();
    await db.reset();
    setDb(db);
  });

  // ==========================================================================
  // Suite 1: Keyword Search Stress & Boundary Harness
  // ==========================================================================
  describe('Suite 1: Keyword Search Stress & Boundary Harness', () => {
    it('handles whitespace-only queries by ignoring filter and returning all active listings', async () => {
      const whitespaceQueries = ['   ', '\t', '\n', '  \t \n  '];
      for (const q of whitespaceQueries) {
        // HTTP route level
        const req = new Request(`http://localhost:3000/api/listings?q=${encodeURIComponent(q)}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 200, `Expected 200 for whitespace query "${q}"`);
        const data = await res.json();
        assert.equal(data.total, 7, `Whitespace query "${q}" should return all 7 active listings`);
        assert.equal(data.listings.length, 7);

        // Repository seam level
        const dbRes = await db.getListings({ q });
        assert.equal(dbRes.length, 7, `db.getListings({ q: "${q}" }) should return all 7 listings`);
      }
    });

    it('survives regex metacharacters, punctuation, and injection payloads without crashing', async () => {
      const adversarialQueries = [
        '.*+?^${}()|[]\\', // RegExp special metacharacters
        'JSON-Hero', // hyphens
        'TabMaster!', // exclamation mark
        '#1 dev tool', // hash / number sign
        'regex/forge', // slash
        '(developer)', // parentheses
        "' OR '1'='1", // SQL injection payload
        '<script>alert("xss")</script>', // XSS script tag
        '🔥', // unicode emoji
        'a'.repeat(2000), // 2000-char buffer attack
      ];

      for (const q of adversarialQueries) {
        const req = new Request(`http://localhost:3000/api/listings?q=${encodeURIComponent(q)}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 200, `Adversarial search "${q}" must not crash`);
        const data = await res.json();
        assert.ok(Array.isArray(data.listings));
        assert.equal(typeof data.total, 'number');
      }
    });

    it('performs case-insensitive search across title, description, and slug', async () => {
      const caseVariants = [
        { q: 'JSONHERO', expectedSlug: 'jsonhero-visualizer' },
        { q: 'jsonhero', expectedSlug: 'jsonhero-visualizer' },
        { q: 'JsonHero', expectedSlug: 'jsonhero-visualizer' },
        { q: 'TABMASTER', expectedSlug: 'tabmaster-pro' },
        { q: 'tabmaster', expectedSlug: 'tabmaster-pro' },
        { q: 'TabMaster', expectedSlug: 'tabmaster-pro' },
        { q: 'REGEX', expectedSlug: 'regex-forge' },
        { q: 'regexforge', expectedSlug: 'regex-forge' },
      ];

      for (const { q, expectedSlug } of caseVariants) {
        const req = new Request(`http://localhost:3000/api/listings?q=${encodeURIComponent(q)}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.total >= 1, `Query "${q}" should return at least 1 listing`);
        const found = data.listings.some((l: any) => l.slug === expectedSlug);
        assert.ok(found, `Query "${q}" should contain "${expectedSlug}"`);
      }
    });

    it('returns empty array with 200 OK for high-entropy non-matching keywords', async () => {
      const nonExistentQueries = [
        'zzzz_completely_impossible_keyword_9999',
        'crypto_metaverse_web3_nonexistent',
        '1234567890987654321',
      ];

      for (const q of nonExistentQueries) {
        const req = new Request(`http://localhost:3000/api/listings?q=${encodeURIComponent(q)}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.total, 0);
        assert.equal(data.listings.length, 0);
      }
    });
  });

  // ==========================================================================
  // Suite 2: DAU Range & Boundary Filtering
  // ==========================================================================
  describe('Suite 2: DAU Range & Boundary Filtering', () => {
    it('accepts min_dau = 0 as valid lower bound and returns all listings', async () => {
      const req = new Request('http://localhost:3000/api/listings?min_dau=0');
      const res = await getListingsRoute(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.total, 7);
      assert.equal(data.listings.length, 7);
    });

    it('rejects negative min_dau values with 400 Bad Request and structured error code', async () => {
      const negativeDaus = ['-1', '-500', '-999999'];
      for (const min_dau of negativeDaus) {
        const req = new Request(`http://localhost:3000/api/listings?min_dau=${min_dau}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 400, `Negative min_dau=${min_dau} must return 400`);
        const data = await res.json();
        assert.equal(data.code, 'INVALID_PARAM');
        assert.match(data.error, /non-negative integer/i);
      }
    });

    it('rejects non-numeric min_dau inputs with 400 Bad Request', async () => {
      const nonNumericDaus = ['abc', 'ten_thousand', 'NaN', 'undefined', 'null'];
      for (const min_dau of nonNumericDaus) {
        const req = new Request(`http://localhost:3000/api/listings?min_dau=${min_dau}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 400, `Non-numeric min_dau="${min_dau}" must return 400`);
        const data = await res.json();
        assert.equal(data.code, 'INVALID_PARAM');
      }
    });

    it('returns empty results for extreme out-of-bounds DAU values (> 1,000,000)', async () => {
      const extremeDaus = [100000, 1000000, 50000000];
      for (const min_dau of extremeDaus) {
        const req = new Request(`http://localhost:3000/api/listings?min_dau=${min_dau}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.total, 0, `min_dau=${min_dau} should return 0 results`);
        assert.equal(data.listings.length, 0);
      }
    });

    it('verifies exact boundary threshold inclusion and exclusion', async () => {
      // TabMaster has highest DAU: 18,900
      const atBoundaryReq = new Request('http://localhost:3000/api/listings?min_dau=18900');
      const atRes = await getListingsRoute(atBoundaryReq);
      const atData = await atRes.json();
      assert.equal(atData.total, 1);
      assert.equal(atData.listings[0].slug, 'tabmaster-pro');

      // 1 unit above highest DAU: 18,901
      const aboveBoundaryReq = new Request('http://localhost:3000/api/listings?min_dau=18901');
      const aboveRes = await getListingsRoute(aboveBoundaryReq);
      const aboveData = await aboveRes.json();
      assert.equal(aboveData.total, 0);

      // Presets verification:
      // 5,000 DAU: 6 tools (all except Markdown Digest at 3,900)
      const fiveK = await (await getListingsRoute(new Request('http://localhost:3000/api/listings?min_dau=5000'))).json();
      assert.equal(fiveK.total, 6);

      // 10,000 DAU: 3 tools (TabMaster 18.9k, RegexForge 15.8k, JSONHero 12.4k)
      const tenK = await (await getListingsRoute(new Request('http://localhost:3000/api/listings?min_dau=10000'))).json();
      assert.equal(tenK.total, 3);

      // 15,000 DAU: 2 tools (TabMaster 18.9k, RegexForge 15.8k)
      const fifteenK = await (await getListingsRoute(new Request('http://localhost:3000/api/listings?min_dau=15000'))).json();
      assert.equal(fifteenK.total, 2);
    });
  });

  // ==========================================================================
  // Suite 3: Enum Validation & Multi-Facet Filtering
  // ==========================================================================
  describe('Suite 3: Strict Enum Validation & Category/AppType Filtering', () => {
    it('strictly rejects non-existent category values with 400 Bad Request', async () => {
      const invalidCategories = ['finance', 'crypto', 'social', 'gaming', 'Developer-Tools', 'developer_tools'];
      for (const cat of invalidCategories) {
        const req = new Request(`http://localhost:3000/api/listings?category=${cat}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 400, `Category "${cat}" should be rejected with 400`);
        const data = await res.json();
        assert.equal(data.code, 'INVALID_CATEGORY');
        assert.match(data.error, /Invalid category/i);
      }
    });

    it('strictly rejects non-existent app_type values with 400 Bad Request', async () => {
      const invalidAppTypes = ['ios', 'android', 'mobile', 'chrome-extension', 'cli', 'WEB_APP'];
      for (const app of invalidAppTypes) {
        const req = new Request(`http://localhost:3000/api/listings?app_type=${app}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 400, `AppType "${app}" should be rejected with 400`);
        const data = await res.json();
        assert.equal(data.code, 'INVALID_APP_TYPE');
        assert.match(data.error, /Invalid app_type/i);
      }
    });

    it('strictly rejects invalid sort parameter values with 400 Bad Request', async () => {
      const invalidSorts = ['dau', 'price', 'clicks_desc', 'impressions_desc', 'random', 'popularity'];
      for (const sort of invalidSorts) {
        const req = new Request(`http://localhost:3000/api/listings?sort=${sort}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 400, `Sort "${sort}" should be rejected with 400`);
        const data = await res.json();
        assert.equal(data.code, 'INVALID_SORT');
        assert.match(data.error, /Invalid sort/i);
      }
    });

    it('verifies category exclusivity and partitions all 7 seed listings', async () => {
      const categories = ['developer-tools', 'productivity', 'design', 'utilities'] as const;
      let totalCountAcrossCategories = 0;

      for (const cat of categories) {
        const req = new Request(`http://localhost:3000/api/listings?category=${cat}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.total > 0, `Category ${cat} should have at least 1 listing`);
        totalCountAcrossCategories += data.total;

        for (const listing of data.listings) {
          assert.equal(listing.category, cat, `Listing ${listing.slug} must strictly match category ${cat}`);
        }
      }

      assert.equal(totalCountAcrossCategories, 7, 'Sum of listings across all categories must equal total seed count 7');
    });

    it('verifies app_type exclusivity and partitions all 7 seed listings', async () => {
      const appTypes = ['web_app', 'chrome_extension', 'desktop_app'] as const;
      let totalCountAcrossTypes = 0;

      for (const type of appTypes) {
        const req = new Request(`http://localhost:3000/api/listings?app_type=${type}`);
        const res = await getListingsRoute(req);
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.ok(data.total > 0, `App type ${type} should have at least 1 listing`);
        totalCountAcrossTypes += data.total;

        for (const listing of data.listings) {
          assert.equal(listing.app_type, type, `Listing ${listing.slug} must strictly match app_type ${type}`);
        }
      }

      assert.equal(totalCountAcrossTypes, 7, 'Sum of listings across all app types must equal total seed count 7');
    });
  });

  // ==========================================================================
  // Suite 4: Sorting Stability & Monotonicity
  // ==========================================================================
  describe('Suite 4: Sorting Stability & Monotonicity', () => {
    it('verifies monotonic descending order by verified DAU (dau_desc)', async () => {
      const req = new Request('http://localhost:3000/api/listings?sort=dau_desc');
      const res = await getListingsRoute(req);
      const data = await res.json();
      assert.equal(data.total, 7);

      for (let i = 0; i < data.listings.length - 1; i++) {
        const current = data.listings[i].verified_dau;
        const next = data.listings[i + 1].verified_dau;
        assert.ok(
          current >= next,
          `dau_desc violation at index ${i}: ${current} should be >= ${next}`
        );
      }
    });

    it('verifies monotonic ascending order by verified DAU (dau_asc)', async () => {
      const req = new Request('http://localhost:3000/api/listings?sort=dau_asc');
      const res = await getListingsRoute(req);
      const data = await res.json();
      assert.equal(data.total, 7);

      for (let i = 0; i < data.listings.length - 1; i++) {
        const current = data.listings[i].verified_dau;
        const next = data.listings[i + 1].verified_dau;
        assert.ok(
          current <= next,
          `dau_asc violation at index ${i}: ${current} should be <= ${next}`
        );
      }
    });

    it('verifies monotonic ascending order by starting price cents (price_asc)', async () => {
      const req = new Request('http://localhost:3000/api/listings?sort=price_asc');
      const res = await getListingsRoute(req);
      const data = await res.json();
      assert.equal(data.total, 7);

      for (let i = 0; i < data.listings.length - 1; i++) {
        const currentPrice = data.listings[i].starting_price_cents;
        const nextPrice = data.listings[i + 1].starting_price_cents;
        assert.ok(currentPrice !== null && nextPrice !== null);
        assert.ok(
          currentPrice <= nextPrice,
          `price_asc violation at index ${i}: ${currentPrice} should be <= ${nextPrice}`
        );
      }
    });

    it('evaluates price_desc sort behavior: asserts maxPrice monotonicity and documents starting_price_cents', async () => {
      const req = new Request('http://localhost:3000/api/listings?sort=price_desc');
      const res = await getListingsRoute(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.total, 7);

      // Verify that all listings returned have valid starting_price_cents
      for (const item of data.listings) {
        assert.ok(typeof item.starting_price_cents === 'number');
        assert.ok(item.starting_price_cents >= 5000 && item.starting_price_cents <= 100000);
      }

      // Precompute max slot price for each listing from SEED_SLOTS to verify sorting logic
      const slots = await db.getAllSlots();
      const maxPrices = data.listings.map((l: any) => {
        const toolSlots = slots.filter((s) => s.listing_id === l.id);
        return Math.max(...toolSlots.map((s) => s.monthly_price_cents), 0);
      });

      // Assert that max slot price is monotonically decreasing:
      for (let i = 0; i < maxPrices.length - 1; i++) {
        assert.ok(
          maxPrices[i] >= maxPrices[i + 1],
          `price_desc maxPrice violation at index ${i}: ${maxPrices[i]} should be >= ${maxPrices[i + 1]}`
        );
      }
    });
  });

  // ==========================================================================
  // Suite 5: Availability Filtering Invariants (available_only)
  // ==========================================================================
  describe('Suite 5: Availability Filtering Invariants (available_only)', () => {
    it('strictly guarantees all listings with available_only=true contain at least one vacant slot', async () => {
      const req = new Request('http://localhost:3000/api/listings?available_only=true');
      const res = await getListingsRoute(req);
      const data = await res.json();

      for (const item of data.listings) {
        assert.equal(item.has_available_slots, true);
        assert.ok(item.available_slots_count > 0, `Listing ${item.slug} must have >0 available slots`);
      }
    });

    it('dynamically excludes tools when all their slots become occupied via booking', async () => {
      // Find JSONHero listing and its vacant slot
      const listing = await db.getListingBySlug('jsonhero-visualizer');
      assert.ok(listing);
      const slots = await db.getSlotsByListingId(listing.id);
      const availableSlots = slots.filter((s) => s.is_available);
      assert.equal(availableSlots.length, 1, 'JSONHero has exactly 1 available slot in seed data (slot 2)');

      // Book that sole available slot
      const bookRes = await db.bookSlot({
        slot_id: availableSlots[0].id,
        sponsor_name: 'Test Sponsor',
        sponsor_email: 'test@sponsor.com',
        creative_text: 'Test creative text for JSONHero',
        creative_target_url: 'https://test.com',
      });
      assert.equal(bookRes.success, true);

      // Verify JSONHero now has 0 available slots in DB
      const updatedSlots = await db.getSlotsByListingId(listing.id);
      assert.equal(updatedSlots.filter((s) => s.is_available).length, 0);

      // Query listings without available_only: JSONHero is still listed, but has_available_slots is false
      const allRes = await (await getListingsRoute(new Request('http://localhost:3000/api/listings'))).json();
      const jsonHeroInAll = allRes.listings.find((l: any) => l.slug === 'jsonhero-visualizer');
      assert.ok(jsonHeroInAll);
      assert.equal(jsonHeroInAll.has_available_slots, false);
      assert.equal(jsonHeroInAll.available_slots_count, 0);

      // Query listings WITH available_only=true: JSONHero MUST BE EXCLUDED
      const availRes = await (await getListingsRoute(new Request('http://localhost:3000/api/listings?available_only=true'))).json();
      assert.equal(availRes.total, 6, 'Total available listings should drop from 7 to 6');
      const jsonHeroInAvail = availRes.listings.find((l: any) => l.slug === 'jsonhero-visualizer');
      assert.equal(jsonHeroInAvail, undefined, 'JSONHero must be excluded when all slots are occupied');
    });

    it('excludes listings with zero configured slots when available_only=true', async () => {
      // Create a listing with 0 slots
      const emptyTool = await db.createListing({
        title: 'Zero Slot Tool',
        description: 'Tool without any configured inventory slots',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://zeroslots.dev',
        verified_dau: 4000,
      });

      // Query without available_only: Zero Slot Tool is included
      const allRes = await (await getListingsRoute(new Request('http://localhost:3000/api/listings'))).json();
      assert.equal(allRes.total, 8);
      const foundInAll = allRes.listings.find((l: any) => l.id === emptyTool.id);
      assert.ok(foundInAll);
      assert.equal(foundInAll.slots_count, 0);
      assert.equal(foundInAll.available_slots_count, 0);
      assert.equal(foundInAll.has_available_slots, false);
      assert.equal(foundInAll.starting_price_cents, null);

      // Query WITH available_only=true: Zero Slot Tool MUST BE EXCLUDED
      const availRes = await (await getListingsRoute(new Request('http://localhost:3000/api/listings?available_only=true'))).json();
      assert.equal(availRes.total, 7);
      const foundInAvail = availRes.listings.find((l: any) => l.id === emptyTool.id);
      assert.equal(foundInAvail, undefined, 'Tool with 0 slots must never appear in available_only=true');
    });
  });

  // ==========================================================================
  // Suite 6: Detail Page API (GET /api/listings/[slug]) Stress
  // ==========================================================================
  describe('Suite 6: Detail Page API (GET /api/listings/[slug]) Stress', () => {
    it('returns 404 with structured error code for non-existent slugs', async () => {
      const nonExistentSlugs = [
        'ghost-app-12345',
        'non-existent-tool',
        '00000000-0000-0000-0000-000000000000',
      ];

      for (const slug of nonExistentSlugs) {
        const req = new Request(`http://localhost:3000/api/listings/${slug}`);
        const res = await getListingBySlugRoute(req, { params: { slug } });
        assert.equal(res.status, 404);
        const data = await res.json();
        assert.equal(data.code, 'NOT_FOUND');
        assert.equal(data.error, 'Listing not found');
      }
    });

    it('correctly handles case-insensitivity and URI decoding in slug parameter', async () => {
      const testCases = [
        { rawSlug: 'JSONHero-Visualizer', expectedSlug: 'jsonhero-visualizer' },
        { rawSlug: 'TabMaster-Pro', expectedSlug: 'tabmaster-pro' },
        { rawSlug: 'tabmaster-pro', expectedSlug: 'tabmaster-pro' },
        { rawSlug: 'regex-forge', expectedSlug: 'regex-forge' },
      ];

      for (const { rawSlug, expectedSlug } of testCases) {
        const req = new Request(`http://localhost:3000/api/listings/${encodeURIComponent(rawSlug)}`);
        const res = await getListingBySlugRoute(req, { params: { slug: rawSlug } });
        assert.equal(res.status, 200);
        const data = await res.json();
        assert.equal(data.listing.slug, expectedSlug);
        assert.ok(data.slots.length > 0);
        assert.ok(data.telemetry_summary);
      }
    });

    it('verifies 30-day telemetry aggregation calculations in detail response', async () => {
      const req = new Request('http://localhost:3000/api/listings/jsonhero-visualizer');
      const res = await getListingBySlugRoute(req, { params: { slug: 'jsonhero-visualizer' } });
      assert.equal(res.status, 200);
      const data = await res.json();

      const summary = data.telemetry_summary;
      assert.equal(summary.period_days, 30);
      assert.ok(summary.total_impressions > 0, 'Total impressions must be > 0');
      assert.ok(summary.total_clicks >= 0, 'Total clicks must be >= 0');
      assert.ok(!isNaN(summary.avg_ctr_percentage), 'avg_ctr_percentage must not be NaN');
      assert.ok(summary.avg_ctr_percentage >= 0 && summary.avg_ctr_percentage <= 100);

      // Verify mathematical sum across all slots
      let calculatedSumImpressions = 0;
      let calculatedSumClicks = 0;
      for (const slotSum of summary.slots) {
        calculatedSumImpressions += slotSum.impressions_count;
        calculatedSumClicks += slotSum.clicks_count;
        assert.ok(slotSum.clicks_count <= slotSum.impressions_count);
      }

      assert.equal(summary.total_impressions, calculatedSumImpressions);
      assert.equal(summary.total_clicks, calculatedSumClicks);
    });
  });

  // ==========================================================================
  // Suite 7: Concurrency & Seam Isolation Stress Test
  // ==========================================================================
  describe('Suite 7: Concurrency & Seam Isolation Stress Test', () => {
    it('executes 30 concurrent listing queries while simultaneous booking mutations occur', async () => {
      const vacantSlots = (await db.getAllSlots()).filter((s) => s.is_available);
      assert.ok(vacantSlots.length >= 3);

      // Create a mix of 30 concurrent read requests and 3 concurrent booking mutations
      const reads = Array.from({ length: 30 }, (_, i) => {
        const queryParams = [
          'sort=dau_desc',
          'category=developer-tools',
          'min_dau=5000',
          'available_only=true',
          'q=json',
          '',
        ][i % 6];
        const req = new Request(`http://localhost:3000/api/listings?${queryParams}`);
        return getListingsRoute(req);
      });

      const mutations = [
        db.bookSlot({
          slot_id: vacantSlots[0].id,
          sponsor_name: 'Concurrent Marketer A',
          sponsor_email: 'marketerA@test.com',
          creative_text: 'Ad copy A',
          creative_target_url: 'https://testA.com',
        }),
        db.bookSlot({
          slot_id: vacantSlots[1].id,
          sponsor_name: 'Concurrent Marketer B',
          sponsor_email: 'marketerB@test.com',
          creative_text: 'Ad copy B',
          creative_target_url: 'https://testB.com',
        }),
      ];

      // Fire all in parallel
      const [readResults, mutationResults] = await Promise.all([
        Promise.all(reads),
        Promise.all(mutations),
      ]);

      // Assert all reads completed successfully with 200 OK
      for (const r of readResults) {
        assert.equal(r.status, 200);
        const json = await r.json();
        assert.ok(Array.isArray(json.listings));
      }

      // Assert both mutations completed
      assert.equal(mutationResults[0].success, true);
      assert.equal(mutationResults[1].success, true);
    });
  });
});
