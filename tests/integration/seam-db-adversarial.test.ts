import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  InMemoryDatabaseRepository,
  getDb,
  resetInMemoryDb,
} from '../../src/lib/db.ts';
import {
  SEED_LISTINGS,
  SEED_SLOTS,
  SEED_SPONSORSHIPS,
  generateSeedTelemetry,
} from '../../src/lib/fixtures.ts';
import fs from 'node:fs';
import path from 'node:path';

describe('Adversarial Stress Test: Seam Database Repository (src/lib/db.ts)', () => {
  let db: InMemoryDatabaseRepository;

  beforeEach(async () => {
    await resetInMemoryDb();
    db = getDb() as InMemoryDatabaseRepository;
  });

  // ==========================================================================
  // 1. Concurrent Slot Booking (50 Concurrent Attempts)
  // ==========================================================================
  describe('1. Concurrent Slot Booking Mutex Race Conditions', () => {
    it('simulates 50 concurrent booking attempts for the same available slot: exactly 1 succeeds, 49 fail with conflict', async () => {
      // Find a known vacant slot from SEED_SLOTS
      const vacantSlot = (await db.getAllSlots()).find((s) => s.is_available);
      assert.ok(vacantSlot, 'Must have at least one vacant slot available for testing');
      const slotId = vacantSlot.id;

      // Prepare 50 simultaneous booking requests
      const concurrentAttempts = 50;
      const bookingPromises = Array.from({ length: concurrentAttempts }, (_, i) => {
        return db.createSponsorship({
          slot_id: slotId,
          sponsor_name: `Concurrent Sponsor #${i}`,
          sponsor_email: `sponsor${i}@example.com`,
          sponsor_id: `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
          creative_text: `Test Creative for Sponsor #${i}`,
          creative_target_url: `https://sponsor${i}.com?ref=ad`,
          start_date: '2026-09-15',
        });
      });

      // Fire all 50 in parallel
      const results = await Promise.allSettled(bookingPromises);

      const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
      const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];

      // Assertion: Exactly 1 succeeds, 49 rejected
      assert.equal(
        fulfilled.length,
        1,
        `Expected exactly 1 booking to succeed under 50 concurrent attempts, but got ${fulfilled.length}`
      );
      assert.equal(
        rejected.length,
        49,
        `Expected exactly 49 bookings to be rejected, but got ${rejected.length}`
      );

      // Verify rejection reasons are conflict errors
      for (const rej of rejected) {
        assert.match(
          rej.reason.message,
          /currently occupied and unavailable for booking/i,
          'Rejected bookings must receive slot occupied/unavailable error'
        );
      }

      // Verify database state: slot is now unavailable
      const slotAfter = await db.getSlotById(slotId);
      assert.equal(slotAfter?.is_available, false, 'Slot must be marked unavailable in repository');

      // Verify database state: exactly 1 sponsorship was recorded for this slot
      const sponsorships = await db.getSponsorshipsBySlotId(slotId);
      assert.equal(sponsorships.length, 1, 'Only 1 sponsorship record should exist for this slot');
      assert.equal(sponsorships[0].id, fulfilled[0].value.id);
    });

    it('rejects subsequent bookings immediately once a slot is occupied', async () => {
      const vacantSlot = (await db.getAllSlots()).find((s) => s.is_available);
      assert.ok(vacantSlot);

      // Successfully book
      await db.createSponsorship({
        slot_id: vacantSlot.id,
        sponsor_name: 'First Sponsor',
        sponsor_email: 'first@sponsor.com',
        creative_text: 'First sponsor creative',
        creative_target_url: 'https://first.com',
      });

      // Second attempt must reject
      await assert.rejects(
        async () => {
          await db.createSponsorship({
            slot_id: vacantSlot.id,
            sponsor_name: 'Second Sponsor',
            sponsor_email: 'second@sponsor.com',
            creative_text: 'Second sponsor creative',
            creative_target_url: 'https://second.com',
          });
        },
        {
          name: 'Error',
          message: new RegExp(`Slot ${vacantSlot.id} is currently occupied and unavailable for booking`),
        }
      );
    });
  });

  // ==========================================================================
  // 2. Rapid Telemetry Beacon Ingestion (1,000 Concurrent Increments)
  // ==========================================================================
  describe('2. Rapid Telemetry Beacon Ingestion Concurrency', () => {
    it('simulates 1,000 rapid concurrent impression (700) and click (300) increments with zero race lost updates', async () => {
      // Use a vacant slot to have a clean initial baseline
      const slots = await db.getAllSlots();
      const testSlot = slots[0];
      const today = new Date().toISOString().split('T')[0];

      // Get initial telemetry counts for today if any
      const initialTelemetries = await db.getTelemetry(testSlot.id, 1);
      const initialToday = initialTelemetries.find((t) => t.telemetry_date === today);
      const initialImpressions = initialToday?.impressions_count ?? 0;
      const initialClicks = initialToday?.clicks_count ?? 0;

      const totalImpressionsToAdd = 700;
      const totalClicksToAdd = 300;
      const totalEvents = totalImpressionsToAdd + totalClicksToAdd; // 1,000

      // Build 1,000 concurrent promises intermixing impressions and clicks
      const events: ('impression' | 'click')[] = [];
      for (let i = 0; i < totalImpressionsToAdd; i++) events.push('impression');
      for (let i = 0; i < totalClicksToAdd; i++) events.push('click');

      // Shuffle deterministically
      for (let i = events.length - 1; i > 0; i--) {
        const j = (i * 37 + 13) % (i + 1);
        [events[i], events[j]] = [events[j], events[i]];
      }

      const startTime = performance.now();

      // Fire 1,000 concurrent increments via Promise.all
      const incrementPromises = events.map((ev) => db.incrementTelemetry(testSlot.id, ev));
      const results = await Promise.all(incrementPromises);

      const durationMs = performance.now() - startTime;

      assert.equal(results.length, totalEvents, 'All 1,000 operations must complete');

      // Query final telemetry from DB
      const finalTelemetries = await db.getTelemetry(testSlot.id, 1);
      const finalToday = finalTelemetries.find((t) => t.telemetry_date === today);
      assert.ok(finalToday, 'Telemetry record must exist for today');

      const expectedImpressions = initialImpressions + totalImpressionsToAdd;
      const expectedClicks = initialClicks + totalClicksToAdd;

      assert.equal(
        finalToday.impressions_count,
        expectedImpressions,
        `Lost update detected! Expected ${expectedImpressions} impressions, but got ${finalToday.impressions_count}`
      );
      assert.equal(
        finalToday.clicks_count,
        expectedClicks,
        `Lost update detected! Expected ${expectedClicks} clicks, but got ${finalToday.clicks_count}`
      );

      // Verify performance SLA: 1,000 in-memory operations should take under 500ms
      assert.ok(
        durationMs < 500,
        `1,000 increments took ${durationMs.toFixed(2)}ms (expected < 500ms)`
      );
    });

    it('rejects increments for non-existent slot IDs', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      await assert.rejects(
        async () => {
          await db.incrementTelemetry(nonExistentId, 'impression');
        },
        {
          name: 'Error',
          message: `Slot not found: ${nonExistentId}`,
        }
      );
    });
  });

  // ==========================================================================
  // 3. Malformed Input Handling & Security Boundaries
  // ==========================================================================
  describe('3. Malformed Input Handling & Boundary Attacks', () => {
    it('handles non-existent or adversarial slug lookups gracefully', async () => {
      const adversarialSlugs = [
        'non-existent-slug-xyz',
        '../../../etc/passwd',
        '<script>alert(1)</script>',
        '-- DROP TABLE listings; --',
        'JSONHERO-VISUALIZER', // case insensitivity check
        '   jsonhero-visualizer   ', // whitespace trim check
        '🌟-emoji-slug-🔥',
        'a'.repeat(2000), // long string buffer attack
      ];

      for (const slug of adversarialSlugs) {
        const result = await db.getListingBySlug(slug);
        if (slug.toLowerCase().trim() === 'jsonhero-visualizer') {
          assert.ok(result, `Should match case/whitespace normalized slug: ${slug}`);
        } else {
          assert.equal(result, null, `Adversarial slug should return null: ${slug}`);
        }
      }
    });

    it('survives extreme search filter queries without unhandled exceptions', async () => {
      const extremeQueries = [
        { q: '.*+?^${}()|[]\\' }, // regex metacharacters
        { q: "' OR '1'='1" }, // SQL injection attempt
        { q: '<img src=x onerror=alert(1)>' }, // XSS attempt
        { q: 'a'.repeat(5000) }, // very long query string
        { min_dau: -99999 }, // negative DAU
        { min_dau: 999999999 }, // impossible DAU
        { min_dau: NaN },
        { max_price_cents: -5000 },
        { max_price_cents: 0 },
        { max_price_cents: 99999999 },
        { limit: 0 },
        { limit: -10 },
        { offset: 999999 },
        { sort: 'invalid_sort' as any },
        { category: 'non_existent_category' as any },
      ];

      for (const query of extremeQueries) {
        const res = await db.getListings(query);
        assert.ok(Array.isArray(res), `Query ${JSON.stringify(query)} must return an array without throwing`);
      }
    });

    it('enforces financial bounds ($50.00 to $1,000.00) when creating slots', async () => {
      const listing = (await db.getListings())[0];
      assert.ok(listing);

      const invalidPrices = [
        4999, // $49.99 (below minimum 5000)
        100001, // $1000.01 (above maximum 100000)
        0,
        -5000,
        5000.5, // non-integer cent
        NaN,
      ];

      for (const price of invalidPrices) {
        await assert.rejects(
          async () => {
            await db.createSlot({
              listing_id: listing.id,
              slot_name: 'Invalid Price Slot',
              slot_type: 'header_pill',
              monthly_price_cents: price,
            });
          },
          /Monthly rate|Monthly price|Monthly rental rate/
        );
      }
    });

    it('rejects slot creation with non-existent listing ID', async () => {
      const nonExistentListingId = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
      await assert.rejects(
        async () => {
          await db.createSlot({
            listing_id: nonExistentListingId,
            slot_name: 'Orphan Slot',
            slot_type: 'header_pill',
            monthly_price_cents: 25000,
          });
        },
        {
          name: 'Error',
          message: `Listing not found with ID: ${nonExistentListingId}`,
        }
      );
    });

    it('auto-generates unique slugs on listing creation collisions', async () => {
      const baseTitle = 'Unique App Name Collision Test';
      const listing1 = await db.createListing({
        title: baseTitle,
        description: 'First app',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://example.com/app1',
      });
      assert.equal(listing1.slug, 'unique-app-name-collision-test');

      const listing2 = await db.createListing({
        title: baseTitle,
        description: 'Second app with identical title',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://example.com/app2',
      });
      assert.equal(listing2.slug, 'unique-app-name-collision-test-2');

      const listing3 = await db.createListing({
        title: baseTitle,
        description: 'Third app with identical title',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://example.com/app3',
      });
      assert.equal(listing3.slug, 'unique-app-name-collision-test-3');
    });
  });

  // ==========================================================================
  // 4. Seed Fixture Integrity & Cross-Backend Parity Audit
  // ==========================================================================
  describe('4. Seed Fixture Integrity & Cross-Backend Parity Audit', () => {
    it('verifies SEED_LISTINGS in src/lib/fixtures.ts against requirements', () => {
      console.log(`[Audit] SEED_LISTINGS count: ${SEED_LISTINGS.length}`);
      // Check required fields for each listing
      for (const l of SEED_LISTINGS) {
        assert.ok(l.id, 'Listing must have id');
        assert.ok(l.title, 'Listing must have title');
        assert.ok(l.slug, 'Listing must have slug');
        assert.ok(l.category, 'Listing must have category');
        assert.ok(l.app_type, 'Listing must have app_type');
        assert.ok(l.website_url.startsWith('https://'), 'Listing website must be https');
        assert.ok(l.verified_dau >= 0, 'DAU must be >= 0');
        assert.ok(['draft', 'active', 'paused'].includes(l.status), 'Status must be valid');
      }
    });

    it('verifies SEED_SLOTS in src/lib/fixtures.ts against requirements', () => {
      console.log(`[Audit] SEED_SLOTS count: ${SEED_SLOTS.length}`);
      const validListingIds = new Set(SEED_LISTINGS.map((l) => l.id));

      for (const s of SEED_SLOTS) {
        assert.ok(s.id, 'Slot must have id');
        assert.ok(validListingIds.has(s.listing_id), `Slot ${s.id} references non-existent listing ${s.listing_id}`);
        assert.ok(s.slot_name, 'Slot must have slot_name');
        assert.ok(
          ['header_pill', 'empty_state', 'footer_badge', 'email_footer'].includes(s.slot_type),
          'Slot must have valid slot_type'
        );
        assert.ok(
          s.monthly_price_cents >= 5000 && s.monthly_price_cents <= 100000,
          `Slot price ${s.monthly_price_cents} out of bounds ($50-$1,000)`
        );
        assert.equal(typeof s.is_available, 'boolean', 'is_available must be boolean');
      }
    });

    it('verifies SEED_SPONSORSHIPS in src/lib/fixtures.ts', () => {
      console.log(`[Audit] SEED_SPONSORSHIPS count: ${SEED_SPONSORSHIPS.length}`);
      const validSlotIds = new Set(SEED_SLOTS.map((s) => s.id));

      for (const sp of SEED_SPONSORSHIPS) {
        assert.ok(sp.id, 'Sponsorship must have id');
        assert.ok(validSlotIds.has(sp.slot_id), `Sponsorship ${sp.id} references non-existent slot ${sp.slot_id}`);
        assert.ok(sp.sponsor_name, 'Sponsorship must have sponsor_name');
        assert.ok(sp.sponsor_email, 'Sponsorship must have sponsor_email');
        assert.ok(
          sp.platform_fee_cents + sp.creator_payout_cents === sp.monthly_amount_cents,
          'platform_fee_cents + creator_payout_cents must exactly equal monthly_amount_cents'
        );
        assert.equal(
          sp.platform_fee_cents,
          Math.round(sp.monthly_amount_cents * 0.15),
          'Platform fee must be exactly 15%'
        );
      }
    });

    it('verifies generateSeedTelemetry() output structure', () => {
      const telemetry = generateSeedTelemetry();
      console.log(`[Audit] generateSeedTelemetry count: ${telemetry.length}`);
      assert.ok(telemetry.length > 0, 'Telemetry fixtures must not be empty');

      const validSlotIds = new Set(SEED_SLOTS.map((s) => s.id));
      for (const t of telemetry) {
        assert.ok(validSlotIds.has(t.slot_id), `Telemetry references invalid slot ${t.slot_id}`);
        assert.match(t.telemetry_date, /^\d{4}-\d{2}-\d{2}$/, 'telemetry_date must be YYYY-MM-DD');
        assert.ok(t.impressions_count >= 0, 'impressions_count must be >= 0');
        assert.ok(t.clicks_count >= 0, 'clicks_count must be >= 0');
        assert.ok(
          t.clicks_count <= t.impressions_count,
          `Clicks (${t.clicks_count}) cannot exceed impressions (${t.impressions_count})`
        );
      }
    });

    it('audits discrepancy between supabase/seed.sql and src/lib/fixtures.ts', () => {
      // Read supabase/seed.sql
      const seedSqlPath = path.resolve(process.cwd(), 'supabase/seed.sql');
      const seedSqlContent = fs.readFileSync(seedSqlPath, 'utf8');

      // Count listings in seed.sql: matching UUID pattern '10000000-0000-0000-0000-00000000000X'
      const sqlListings = seedSqlContent.match(/10000000-0000-0000-0000-00000000000\d/g) || [];
      const uniqueSqlListings = new Set(sqlListings);

      // Count slots in seed.sql: matching '20000000-0000-0000-0000-\d+'
      const sqlSlots = seedSqlContent.match(/20000000-0000-0000-0000-\d+/g) || [];
      const uniqueSqlSlots = new Set(sqlSlots);

      // Count sponsorships in seed.sql: matching '30000000-0000-0000-0000-\d+'
      const sqlSponsorships = seedSqlContent.match(/30000000-0000-0000-0000-\d+/g) || [];
      const uniqueSqlSponsorships = new Set(sqlSponsorships);

      console.log(`[Parity Check] SQL Seed has:`);
      console.log(`  - Unique Listings: ${uniqueSqlListings.size}`);
      console.log(`  - Unique Slots: ${uniqueSqlSlots.size}`);
      console.log(`  - Unique Sponsorships: ${uniqueSqlSponsorships.size}`);
      console.log(`[Parity Check] TypeScript Fixtures has:`);
      console.log(`  - Listings: ${SEED_LISTINGS.length}`);
      console.log(`  - Slots: ${SEED_SLOTS.length}`);
      console.log(`  - Sponsorships: ${SEED_SPONSORSHIPS.length}`);

      // Verify counts match the seed.sql specification (7 listings, 18 slots, 10 sponsorships)
      assert.equal(SEED_LISTINGS.length, 7, 'SEED_LISTINGS must have exactly 7 listings matching seed.sql');
      assert.equal(SEED_SLOTS.length, 18, 'SEED_SLOTS must have exactly 18 slots matching seed.sql');
      assert.equal(SEED_SPONSORSHIPS.length, 10, 'SEED_SPONSORSHIPS must have exactly 10 sponsorships matching seed.sql');

      // Verify UUID schema consistency
      const fixturesListingIds = SEED_LISTINGS.map((l) => l.id);
      const uuidParityMatch = fixturesListingIds.every((id) => uniqueSqlListings.has(id));
      assert.equal(uuidParityMatch, true, 'All TypeScript fixture UUIDs must match PostgreSQL seed.sql sequential UUIDs');
    });
  });

  // ==========================================================================
  // 5. Schema Contract & Check Constraint Parity (In-Memory vs DDL)
  // ==========================================================================
  describe('5. Schema Contract & Check Constraint Parity (In-Memory vs DDL)', () => {
    it('checks whether In-Memory repository enforces DDL constraints on listings', async () => {
      // DDL requires: title trimmed > 0, website_url ~ '^https://', verified_dau >= 0
      await assert.rejects(
        () =>
          db.createListing({
            title: '   ',
            description: 'Whitespace title test',
            category: 'developer-tools',
            app_type: 'web_app',
            website_url: 'https://secure.com',
            verified_dau: 100,
          }),
        /title cannot be empty/i
      );

      await assert.rejects(
        () =>
          db.createListing({
            title: 'Insecure URL App',
            description: 'Insecure URL test',
            category: 'developer-tools',
            app_type: 'web_app',
            website_url: 'http://insecure.com',
            verified_dau: 100,
          }),
        /website_url must be a valid secure URL starting with https:\/\//i
      );

      await assert.rejects(
        () =>
          db.createListing({
            title: 'Negative DAU App',
            description: 'Negative DAU test',
            category: 'developer-tools',
            app_type: 'web_app',
            website_url: 'https://secure.com',
            verified_dau: -50,
          }),
        /verified_dau must be greater than or equal to 0/i
      );
    });

    it('checks whether incrementTelemetry prevents clicks exceeding impressions (enforcing DDL chk_clicks_leq_impressions)', async () => {
      // Create fresh slot for test
      const listings = await db.getListings();
      const newSlot = await db.createSlot({
        listing_id: listings[0].id,
        slot_name: 'Telemetry Parity Test Slot',
        slot_type: 'footer_badge',
        monthly_price_cents: 10000,
      });

      // Increment click FIRST with zero impressions must reject
      await assert.rejects(
        () => db.incrementTelemetry(newSlot.id, 'click'),
        /Clicks count cannot exceed impressions count/i
      );
    });

    it('checks whether createSponsorship validates email format and https target_url', async () => {
      const vacantSlot = (await db.getAllSlots()).find((s) => s.is_available);
      assert.ok(vacantSlot);

      await assert.rejects(
        () =>
          db.createSponsorship({
            slot_id: vacantSlot.id,
            sponsor_name: 'Insecure Sponsor',
            sponsor_email: 'not-an-email',
            creative_text: 'Insecure ad',
            creative_target_url: 'https://valid.com',
          }),
        /email must be a valid email address/i
      );

      await assert.rejects(
        () =>
          db.createSponsorship({
            slot_id: vacantSlot.id,
            sponsor_name: 'Insecure Sponsor',
            sponsor_email: 'sponsor@valid.com',
            creative_text: 'Insecure ad',
            creative_target_url: 'javascript:alert(1)',
          }),
        /target URL must start with https:\/\//i
      );
    });
  });
});

