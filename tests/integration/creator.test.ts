/**
 * Integration Test Suite: Creator Portal REST Endpoints & Inventory Slot Management (R2)
 * File path: tests/integration/creator.test.ts
 *
 * Implements 4-Tier Test Architecture:
 *   Tier 1: Core Feature Verification (Onboarding, Slot CRUD across all 4 formats, Snippets)
 *   Tier 2: Boundary & Corner Cases (Slug collision 409, Regex, $50-$1000 boundaries, Guidelines limit)
 *   Tier 3: Seam Consistency & Cross-Feature Integration (Marketplace & Delivery sync)
 *   Tier 4: Real-World Publisher Scenario (Complete Chrome Extension Creator Journey)
 */

import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryDatabaseRepository } from '../../src/lib/db.ts';
import {
  dispatchPostListing,
  dispatchPostSlot,
  dispatchGetSlots,
  dispatchGetListings,
  dispatchGetSlot,
  generateEmbedSnippet,
  generateHeadlessSnippet,
  generateIntegrationSnippets,
} from '../test-utils.ts';
import { calculateEscrowSplit } from '../../src/lib/escrow.ts';

describe('Integration: Creator Portal REST Endpoints & DB Seam (R2)', () => {
  let db: InMemoryDatabaseRepository;

  beforeEach(async () => {
    db = new InMemoryDatabaseRepository();
    await db.reset();
  });

  // ==========================================================================
  // Tier 1: Core Feature Verification
  // ==========================================================================
  describe('Tier 1: Core Feature Verification (Onboarding & Slot CRUD)', () => {
    it('successfully creates a new listing with valid fields and returns 201', async () => {
      const payload = {
        title: 'QueryLens Profiler',
        description: 'Instant SQL & GraphQL latency visualizer for developers',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://querylens.dev',
        verified_dau: 8500,
        verification_source: 'plausible',
      };

      const res = await dispatchPostListing(payload, db);

      assert.equal(res.status, 201);
      assert.ok(res.body.id, 'Must generate UUID');
      assert.equal(res.body.title, 'QueryLens Profiler');
      assert.equal(res.body.slug, 'querylens-profiler', 'Must auto-generate kebab-case slug');
      assert.equal(res.body.verified_dau, 8500);
      assert.equal(res.body.status, 'active');

      // Verify persistence in repository seam
      const persisted = await db.getListingById(res.body.id);
      assert.ok(persisted);
      assert.equal(persisted.title, 'QueryLens Profiler');
    });

    it('creates listing with manual slug override', async () => {
      const payload = {
        title: 'Custom Slug Tool',
        slug: 'custom-short-slug',
        description: 'Testing manual slug override',
        category: 'productivity',
        app_type: 'web_app',
        website_url: 'https://customslug.dev',
      };

      const res = await dispatchPostListing(payload, db);
      assert.equal(res.status, 201);
      assert.equal(res.body.slug, 'custom-short-slug');

      const persisted = await db.getListingBySlug('custom-short-slug');
      assert.ok(persisted);
      assert.equal(persisted.title, 'Custom Slug Tool');
    });

    it('creates standardized inventory slots across all 4 supported formats', async () => {
      // 1. Create parent listing
      const listingRes = await dispatchPostListing(
        {
          title: 'DockerFlow Desktop',
          category: 'utilities',
          app_type: 'desktop_app',
          website_url: 'https://dockerflow.app',
          verified_dau: 4200,
        },
        db
      );
      assert.equal(listingRes.status, 201);
      const listingId = listingRes.body.id;

      // 2. Create header_pill slot ($150.00 = 15,000 cents)
      const pillRes = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'App Header Pill',
          slot_type: 'header_pill',
          monthly_price_cents: 15000,
          guidelines: 'DevOps and cloud infrastructure tools only.',
        },
        db
      );
      assert.equal(pillRes.status, 201);
      assert.equal(pillRes.body.slot_type, 'header_pill');
      assert.equal(pillRes.body.monthly_price_cents, 15000);
      assert.equal(pillRes.body.is_available, true);
      assert.equal(pillRes.body.max_sponsors, 1);

      // 3. Create empty_state slot ($350.00 = 35,000 cents)
      const emptyRes = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'Container Empty State',
          slot_type: 'empty_state',
          monthly_price_cents: 35000,
        },
        db
      );
      assert.equal(emptyRes.status, 201);
      assert.equal(emptyRes.body.slot_type, 'empty_state');

      // 4. Create footer_badge slot ($80.00 = 8,000 cents)
      const footerRes = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'Main Window Footer',
          slot_type: 'footer_badge',
          monthly_price_cents: 8000,
        },
        db
      );
      assert.equal(footerRes.status, 201);
      assert.equal(footerRes.body.slot_type, 'footer_badge');

      // 5. Create email_footer slot ($120.00 = 12,000 cents)
      const emailRes = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'Release Notes Email Footer',
          slot_type: 'email_footer',
          monthly_price_cents: 12000,
        },
        db
      );
      assert.equal(emailRes.status, 201);
      assert.equal(emailRes.body.slot_type, 'email_footer');

      // 6. Verify GET /api/slots returns all 4 slots
      const getSlotsRes = await dispatchGetSlots(listingId, db);
      assert.equal(getSlotsRes.status, 200);
      assert.equal(getSlotsRes.body.total, 4);
      assert.equal(getSlotsRes.body.slots.length, 4);
    });

    it('generates accurate embed and headless API snippets for slots', async () => {
      const slotId = '20000000-0000-0000-0000-000000000001';
      const embed = generateEmbedSnippet(slotId);
      assert.equal(embed.containerId, `sponsorslot-${slotId}`);
      assert.ok(embed.html.includes(`id="sponsorslot-${slotId}"`));
      assert.ok(embed.html.includes('https://sponsorslot.dev/embed.js'));
      assert.ok(embed.html.includes(`data-slot-id="${slotId}"`));
      assert.ok(embed.html.includes('async'));

      const headless = generateHeadlessSnippet(slotId);
      assert.ok(headless.fetchCode.includes(`/api/v1/slot/${slotId}`));
      assert.ok(headless.curlCommand.includes(`curl -X GET "https://sponsorslot.dev/api/v1/slot/${slotId}"`));

      const unified = generateIntegrationSnippets(slotId);
      assert.ok(unified.embedScript.includes(`data-slot-id="${slotId}"`));
      assert.ok(unified.embedHtml.includes(`id="sponsorslot-${slotId}"`));
      assert.ok(unified.fetchSnippet.includes(`/api/v1/slot/${slotId}`));
      assert.ok(unified.reactSnippet.includes('SponsorSlotBanner'));
    });
  });

  // ==========================================================================
  // Tier 2: Boundary & Corner Cases
  // ==========================================================================
  describe('Tier 2: Boundary & Corner Cases (Validation & Status Codes)', () => {
    it('returns 409 Conflict when creating listing with duplicate slug (explicit or auto-generated)', async () => {
      // Existing seed slug is 'jsonhero-visualizer'
      const duplicateExplicit = await dispatchPostListing(
        {
          title: 'Different Title',
          slug: 'jsonhero-visualizer',
          category: 'developer-tools',
          app_type: 'web_app',
          website_url: 'https://other.dev',
        },
        db
      );
      assert.equal(duplicateExplicit.status, 409);
      assert.equal(duplicateExplicit.body.code, 'SLUG_CONFLICT');

      // Collision via auto-generated title
      const duplicateAuto = await dispatchPostListing(
        {
          title: 'JSONHero Visualizer', // auto-generates 'jsonhero-visualizer'
          category: 'developer-tools',
          app_type: 'web_app',
          website_url: 'https://other.dev',
        },
        db
      );
      assert.equal(duplicateAuto.status, 409);
      assert.equal(duplicateAuto.body.code, 'SLUG_CONFLICT');
    });

    it('rejects missing or invalid listing fields with 400', async () => {
      // Missing title
      const noTitle = await dispatchPostListing(
        { category: 'developer-tools', app_type: 'web_app', website_url: 'https://test.dev' },
        db
      );
      assert.equal(noTitle.status, 400);
      assert.equal(noTitle.body.code, 'MISSING_TITLE');

      // Invalid category
      const badCat = await dispatchPostListing(
        { title: 'Bad Cat Tool', category: 'crypto-casino', app_type: 'web_app', website_url: 'https://test.dev' },
        db
      );
      assert.equal(badCat.status, 400);
      assert.equal(badCat.body.code, 'INVALID_CATEGORY');

      // Invalid app_type
      const badAppType = await dispatchPostListing(
        { title: 'Bad App Type', category: 'utilities', app_type: 'smartwatch_app', website_url: 'https://test.dev' },
        db
      );
      assert.equal(badAppType.status, 400);
      assert.equal(badAppType.body.code, 'INVALID_APP_TYPE');

      // Invalid website URL (not starting with https:// or http://)
      const badUrl = await dispatchPostListing(
        { title: 'Bad URL Tool', category: 'utilities', app_type: 'web_app', website_url: 'ftp://ftp.test.dev' },
        db
      );
      assert.equal(badUrl.status, 400);
      assert.equal(badUrl.body.code, 'INVALID_URL');

      // Invalid verified DAU (< 0)
      const negDau = await dispatchPostListing(
        { title: 'Neg DAU', category: 'utilities', app_type: 'web_app', website_url: 'https://test.dev', verified_dau: -50 },
        db
      );
      assert.equal(negDau.status, 400);
      assert.equal(negDau.body.code, 'INVALID_DAU');
    });

    it('validates slug format strictly against kebab-case regex', async () => {
      const invalidSlugs = [
        'Uppercase-Slug',
        'slug with spaces',
        'slug--double-dash',
        '-leading-dash',
        'trailing-dash-',
        'special_char!slug',
        'underscores_not_allowed',
      ];

      for (const slug of invalidSlugs) {
        const res = await dispatchPostListing(
          {
            title: 'Test App',
            slug,
            category: 'utilities',
            app_type: 'web_app',
            website_url: 'https://example.com',
          },
          db
        );
        assert.equal(res.status, 400, `Slug '${slug}' should be rejected with 400`);
        assert.equal(res.body.code, 'INVALID_SLUG_FORMAT');
      }
    });

    it('enforces rental rate boundaries: $49 rejected, $50 accepted, $1,000 accepted, $1,001 rejected', async () => {
      const listingRes = await dispatchPostListing(
        {
          title: 'Rate Boundary App',
          category: 'utilities',
          app_type: 'web_app',
          website_url: 'https://example.com',
        },
        db
      );
      const listingId = listingRes.body.id;

      // Rate below minimum ($49.99 = 4,999 cents) -> REJECTED 400
      const belowMin = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'Below Min Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 4999,
        },
        db
      );
      assert.equal(belowMin.status, 400);
      assert.equal(belowMin.body.code, 'INVALID_RENTAL_RATE');

      // Rate exactly at minimum boundary ($50.00 = 5,000 cents) -> ACCEPTED 201
      const atMin = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'At Min Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 5000,
        },
        db
      );
      assert.equal(atMin.status, 201);
      assert.equal(atMin.body.monthly_price_cents, 5000);

      // Rate exactly at maximum boundary ($1,000.00 = 100,000 cents) -> ACCEPTED 201
      const atMax = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'At Max Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 100000,
        },
        db
      );
      assert.equal(atMax.status, 201);
      assert.equal(atMax.body.monthly_price_cents, 100000);

      // Rate above maximum boundary ($1,000.01 = 100,001 cents) -> REJECTED 400
      const aboveMax = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'Above Max Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 100001,
        },
        db
      );
      assert.equal(aboveMax.status, 400);
      assert.equal(aboveMax.body.code, 'INVALID_RENTAL_RATE');
    });

    it('enforces sponsor guidelines length limit of 1000 characters', async () => {
      const listingRes = await dispatchPostListing(
        {
          title: 'Guidelines App',
          category: 'design',
          app_type: 'web_app',
          website_url: 'https://example.com',
        },
        db
      );
      const listingId = listingRes.body.id;

      // Exactly 1,000 characters -> ACCEPTED
      const okGuidelines = 'A'.repeat(1000);
      const okRes = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'Guidelines OK',
          slot_type: 'header_pill',
          monthly_price_cents: 10000,
          guidelines: okGuidelines,
        },
        db
      );
      assert.equal(okRes.status, 201);

      // 1,001 characters -> REJECTED 400
      const tooLongGuidelines = 'A'.repeat(1001);
      const errRes = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'Guidelines Too Long',
          slot_type: 'header_pill',
          monthly_price_cents: 10000,
          guidelines: tooLongGuidelines,
        },
        db
      );
      assert.equal(errRes.status, 400);
      assert.equal(errRes.body.code, 'GUIDELINES_TOO_LONG');
    });

    it('rejects slot creation if listing_id does not exist with 404', async () => {
      const nonExistentId = '99999999-9999-9999-9999-999999999999';
      const res = await dispatchPostSlot(
        {
          listing_id: nonExistentId,
          slot_name: 'Ghost Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 15000,
        },
        db
      );
      assert.equal(res.status, 404);
      assert.equal(res.body.code, 'NOT_FOUND');
    });

    it('rejects slot creation with missing slot_name or invalid slot_type with 400', async () => {
      const listingRes = await dispatchPostListing(
        {
          title: 'App For Bad Slot Type',
          category: 'productivity',
          app_type: 'web_app',
          website_url: 'https://example.com',
        },
        db
      );
      const listingId = listingRes.body.id;

      const noName = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: '',
          slot_type: 'header_pill',
          monthly_price_cents: 20000,
        },
        db
      );
      assert.equal(noName.status, 400);
      assert.equal(noName.body.code, 'MISSING_SLOT_NAME');

      const badType = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'Illegal Popup',
          slot_type: 'popup_modal' as any,
          monthly_price_cents: 20000,
        },
        db
      );
      assert.equal(badType.status, 400);
      assert.equal(badType.body.code, 'INVALID_SLOT_TYPE');
    });

    it('rejects GET /api/slots with missing or malformed listing_id', async () => {
      const missingRes = await dispatchGetSlots('', db);
      assert.equal(missingRes.status, 400);
      assert.equal(missingRes.body.code, 'MISSING_LISTING_ID');

      const malformedRes = await dispatchGetSlots('not-a-uuid', db);
      assert.equal(malformedRes.status, 400);
      assert.equal(malformedRes.body.code, 'INVALID_UUID');

      const notFoundRes = await dispatchGetSlots('00000000-0000-0000-0000-000000000000', db);
      assert.equal(notFoundRes.status, 404);
      assert.equal(notFoundRes.body.code, 'NOT_FOUND');
    });
  });

  // ==========================================================================
  // Tier 3: Seam Consistency & Cross-Feature Integration
  // ==========================================================================
  describe('Tier 3: Seam Consistency & Cross-Feature Integration', () => {
    it('integrates listing creation with public marketplace discovery and slot delivery fallback', async () => {
      // 1. Create a new listing
      const listingRes = await dispatchPostListing(
        {
          title: 'ApiDoc Express',
          category: 'developer-tools',
          app_type: 'web_app',
          website_url: 'https://apidoc.dev',
          verified_dau: 16500,
        },
        db
      );
      assert.equal(listingRes.status, 201);
      const listing = listingRes.body;

      // 2. Verify listing is discoverable via GET /api/listings
      const directoryRes = await dispatchGetListings({ category: 'developer-tools', q: 'ApiDoc' }, db);
      assert.equal(directoryRes.status, 200);
      assert.ok(directoryRes.body.listings.some((l: any) => l.slug === 'apidoc-express'));

      // 3. Add an available slot
      const slotRes = await dispatchPostSlot(
        {
          listing_id: listing.id,
          slot_name: 'Docs Header',
          slot_type: 'header_pill',
          monthly_price_cents: 25000,
        },
        db
      );
      assert.equal(slotRes.status, 201);
      const slot = slotRes.body;

      // 4. Verify edge delivery API serves unfilled fallback referral badge for new slot
      const deliveryRes = await dispatchGetSlot(slot.id, db);
      assert.equal(deliveryRes.status, 200);
      assert.equal(deliveryRes.body.active, false);
      assert.equal(deliveryRes.body.fallback, true);
      assert.ok(deliveryRes.body.creative.text.includes('Place your product here via SponsorSlot'));
      assert.ok(deliveryRes.body.creative.target_url.includes('apidoc-express'));
    });
  });

  // ==========================================================================
  // Tier 4: Real-World Creator Onboarding Scenario
  // ==========================================================================
  describe('Tier 4: Real-World Creator Onboarding Scenario', () => {
    it('simulates complete Chrome extension publisher onboarding journey', async () => {
      // Step 1: Register Chrome Extension listing with verified Chrome Web Store stats
      const createListingRes = await dispatchPostListing(
        {
          title: 'CodeSniper Chrome Extension',
          description: 'Instantly inspect regex and JSON in browser tabs',
          category: 'developer-tools',
          app_type: 'chrome_extension',
          website_url: 'https://chrome.google.com/webstore/detail/codesniper',
          verified_dau: 14500,
          verification_source: 'chrome_web_store',
          verification_identifier: 'kmbjojmglgncplkjjckjebpbfb',
        },
        db
      );
      assert.equal(createListingRes.status, 201);
      const listing = createListingRes.body;
      assert.equal(listing.slug, 'codesniper-chrome-extension');

      // Step 2: Configure Header Pill ($200/mo) and Footer Badge ($75/mo)
      const headerSlotRes = await dispatchPostSlot(
        {
          listing_id: listing.id,
          slot_name: 'Popup Header Pill',
          slot_type: 'header_pill',
          monthly_price_cents: 20000,
          guidelines: 'B2B SaaS, dev-tools, and engineering productivity only.',
        },
        db
      );
      assert.equal(headerSlotRes.status, 201);
      const headerSlot = headerSlotRes.body;

      const footerSlotRes = await dispatchPostSlot(
        {
          listing_id: listing.id,
          slot_name: 'Extension Footer Badge',
          slot_type: 'footer_badge',
          monthly_price_cents: 7500,
          guidelines: 'Clean logos, no flashing animations.',
        },
        db
      );
      assert.equal(footerSlotRes.status, 201);
      const footerSlot = footerSlotRes.body;

      // Step 3: Validate financial escrow calculations for both slots
      const headerSplit = calculateEscrowSplit(headerSlot.monthly_price_cents);
      assert.equal(headerSplit.platform_fee_cents, 3000, '$30.00 platform fee (15%)');
      assert.equal(headerSplit.creator_payout_cents, 17000, '$170.00 creator net (85%)');

      const footerSplit = calculateEscrowSplit(footerSlot.monthly_price_cents);
      assert.equal(footerSplit.platform_fee_cents, 1125, '$11.25 platform fee (15%)');
      assert.equal(footerSplit.creator_payout_cents, 6375, '$63.75 creator net (85%)');

      // Step 4: Retrieve and verify integration snippets for extension integration
      const snippets = generateIntegrationSnippets(headerSlot.id);
      assert.ok(snippets.fetchSnippet.includes(headerSlot.id));
      assert.ok(snippets.embedScript.includes(headerSlot.id));

      // Step 5: Query slots via GET /api/slots?listing_id=...
      const slotsRes = await dispatchGetSlots(listing.id, db);
      assert.equal(slotsRes.status, 200);
      assert.equal(slotsRes.body.total, 2);

      // Step 6: Verify edge delivery fallback reflects created slots
      const deliveryRes = await dispatchGetSlot(headerSlot.id, db);
      assert.equal(deliveryRes.status, 200);
      assert.equal(deliveryRes.body.fallback, true);
      assert.equal(deliveryRes.body.monthly_price_cents, 20000);
    });
  });
});
