/**
 * Milestone 3 Empirical Challenger Stress Test Suite
 * File path: tests/integration/m3_challenger_stress.test.ts
 *
 * Adversarial and empirical verification of Requirement R2:
 * 1. Slug auto-generation & normalization (unicode, accents, spaces, special chars)
 * 2. Slug format validation (kebab-case regex, uppercase rejection)
 * 3. Slug conflict rejection (409 Conflict with SLUG_CONFLICT)
 * 4. Input validation (title, category, app_type, verification_source)
 * 5. Website URL security & validation (https enforcement, scheme upgrade, attack vectors)
 * 6. DAU boundary values (0, negative, float, extreme, invalid strings)
 * 7. Slot management boundaries ($50-$1,000, 1000-char guidelines, UUID validation)
 * 8. Direct HTTP route invocation (Next.js Request / Response parity)
 * 9. Client-side normalization parity vs backend
 * 10. Snippet generator security & integrity
 */

import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { getDb, resetInMemoryDb } from '../../src/lib/db.ts';
import { POST as postListingRoute, GET as getListingsRoute, OPTIONS as optionsListingsRoute } from '../../src/app/api/listings/route.ts';
import { POST as postSlotRoute, GET as getSlotsRoute, OPTIONS as optionsSlotsRoute } from '../../src/app/api/slots/route.ts';
import { normalizeSlug } from '../../src/components/ListingForm.tsx';
import {
  generateEmbedSnippet,
  generateHeadlessSnippet,
  generateIntegrationSnippets,
} from '../../src/lib/snippets.ts';
import {
  dispatchPostListing,
  dispatchPostSlot,
  dispatchGetSlots,
} from '../test-utils.ts';

// Helper to construct native Next.js/Web API Request for direct route testing
function createJsonRequest(url: string, method: string, body?: any): Request {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe('Milestone 3 Empirical Challenger Stress Suite: Creator Portal & Slugs', () => {
  beforeEach(async () => {
    await resetInMemoryDb();
  });

  // ==========================================================================
  // Section 1: Slug Auto-Generation & Normalization Stress
  // ==========================================================================
  describe('1. Slug Auto-Generation & Normalization', () => {
    it('normalizes spaces, uppercase, and punctuation into kebab-case', async () => {
      const db = getDb();
      const payload = {
        title: 'Super Cool WebTool 2.0! (Beta Edition)',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://supercool.dev',
      };

      const res = await dispatchPostListing(payload, db);
      assert.equal(res.status, 201);
      assert.equal(res.body.slug, 'super-cool-webtool-2-0-beta-edition');

      const persisted = await db.getListingBySlug('super-cool-webtool-2-0-beta-edition');
      assert.ok(persisted);
    });

    it('trims leading, trailing, and repeated hyphens in auto-generation', async () => {
      const db = getDb();
      const payload = {
        title: '---Leading and Trailing---Hyphens---',
        category: 'utilities',
        app_type: 'web_app',
        website_url: 'https://hyphen.dev',
      };

      const res = await dispatchPostListing(payload, db);
      assert.equal(res.status, 201);
      assert.equal(res.body.slug, 'leading-and-trailing-hyphens');
    });

    it('rejects listing creation when title contains ONLY special characters / emojis (no alphanumeric chars)', async () => {
      const db = getDb();
      const payload = {
        title: '🔥🔥🔥 🎉✨🚀',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://fire.dev',
      };

      const res = await dispatchPostListing(payload, db);
      assert.equal(res.status, 400);
      assert.equal(res.body.code, 'INVALID_SLUG_FORMAT');
    });

    it('verifies client normalizeSlug matches backend slug generation logic', () => {
      const testCases = [
        { input: 'My Cool App', expected: 'my-cool-app' },
        { input: '  JSON Parser & Linter v2  ', expected: 'json-parser-linter-v2' },
        { input: '---Trim---Hyphens---', expected: 'trim-hyphens' },
        { input: 'Special@#$Characters*&^Here', expected: 'special-characters-here' },
        { input: 'already-kebab-case', expected: 'already-kebab-case' },
      ];

      for (const { input, expected } of testCases) {
        const clientNormalized = normalizeSlug(input);
        const backendNormalized = input
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        assert.equal(clientNormalized, expected);
        assert.equal(backendNormalized, expected);
        assert.equal(clientNormalized, backendNormalized);
      }
    });
  });

  // ==========================================================================
  // Section 2: Slug Validation & Uppercase Rejection
  // ==========================================================================
  describe('2. Explicit Slug Validation & Uppercase Rejection', () => {
    it('strictly rejects manually provided slugs with uppercase characters (400 INVALID_SLUG_FORMAT)', async () => {
      const db = getDb();
      const uppercaseSlugs = ['MyApp', 'my-App', 'MY-APP', 'TabMaster-Pro'];

      for (const slug of uppercaseSlugs) {
        const res = await dispatchPostListing(
          {
            title: 'Valid Title',
            slug,
            category: 'developer-tools',
            app_type: 'web_app',
            website_url: 'https://valid.dev',
          },
          db
        );
        assert.equal(res.status, 400, `Expected uppercase slug '${slug}' to be rejected`);
        assert.equal(res.body.code, 'INVALID_SLUG_FORMAT');
      }
    });

    it('strictly rejects invalid slug structures (double hyphens, leading/trailing hyphens, symbols)', async () => {
      const db = getDb();
      const malformedSlugs = [
        '-starts-with-hyphen',
        'ends-with-hyphen-',
        'double--hyphen',
        'triple---hyphen',
        'spaces in slug',
        'underscores_not_allowed',
        'dots.not.allowed',
        'unicode-ñ-accent',
        'special!@#chars',
      ];

      for (const slug of malformedSlugs) {
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
        assert.equal(res.status, 400, `Expected invalid slug '${slug}' to return 400`);
        assert.equal(res.body.code, 'INVALID_SLUG_FORMAT');
      }
    });

    it('accepts perfectly valid alphanumeric kebab-case slugs', async () => {
      const db = getDb();
      const validSlugs = ['a', 'tool123', 'my-tool', 'tool-1-beta-2'];

      for (const slug of validSlugs) {
        const res = await dispatchPostListing(
          {
            title: `Tool for ${slug}`,
            slug,
            category: 'productivity',
            app_type: 'web_app',
            website_url: 'https://example.com',
          },
          db
        );
        assert.equal(res.status, 201, `Expected valid slug '${slug}' to return 201`);
        assert.equal(res.body.slug, slug);
      }
    });
  });

  // ==========================================================================
  // Section 3: Slug Conflict Rejection (409 Conflict with SLUG_CONFLICT)
  // ==========================================================================
  describe('3. Slug Conflict Rejection (409 Conflict with SLUG_CONFLICT)', () => {
    it('returns 409 Conflict when explicitly requesting an existing slug', async () => {
      const db = getDb();
      // 'jsonhero-visualizer' is in seed
      const res = await dispatchPostListing(
        {
          title: 'JSON Hero Clone',
          slug: 'jsonhero-visualizer',
          category: 'developer-tools',
          app_type: 'web_app',
          website_url: 'https://clone.dev',
        },
        db
      );

      assert.equal(res.status, 409);
      assert.equal(res.body.code, 'SLUG_CONFLICT');
      assert.ok(res.body.error.toLowerCase().includes('already in use') || res.body.error.toLowerCase().includes('conflict'));
    });

    it('returns 409 Conflict when auto-generated slug collides with existing slug', async () => {
      const db = getDb();
      // 'tabmaster-pro' is in seed -> title "TabMaster Pro" auto-generates 'tabmaster-pro'
      const res = await dispatchPostListing(
        {
          title: 'TabMaster Pro',
          category: 'developer-tools',
          app_type: 'web_app',
          website_url: 'https://tabmaster.dev',
        },
        db
      );

      assert.equal(res.status, 409);
      assert.equal(res.body.code, 'SLUG_CONFLICT');
    });

    it('returns 409 on sequential duplicate creation and does NOT mutate DB', async () => {
      const db = getDb();
      // Create first listing
      const res1 = await dispatchPostListing(
        {
          title: 'Unique Dev Tool',
          slug: 'unique-dev-tool',
          category: 'developer-tools',
          app_type: 'web_app',
          website_url: 'https://uniquedev.dev',
        },
        db
      );
      assert.equal(res1.status, 201);

      // Attempt to create second listing with same slug
      const res2 = await dispatchPostListing(
        {
          title: 'Different Title But Same Slug',
          slug: 'unique-dev-tool',
          category: 'productivity',
          app_type: 'web_app',
          website_url: 'https://other.dev',
        },
        db
      );
      assert.equal(res2.status, 409);
      assert.equal(res2.body.code, 'SLUG_CONFLICT');

      // Verify original listing remains untouched
      const original = await db.getListingBySlug('unique-dev-tool');
      assert.ok(original);
      assert.equal(original.title, 'Unique Dev Tool');
    });
  });

  // ==========================================================================
  // Section 4: Missing & Invalid Field Rejections
  // ==========================================================================
  describe('4. Missing & Invalid Field Rejections', () => {
    it('rejects missing or empty title (400 MISSING_TITLE)', async () => {
      const db = getDb();
      const emptyTitles = ['', '   ', null, undefined];

      for (const title of emptyTitles) {
        const res = await dispatchPostListing(
          {
            title: title as any,
            category: 'developer-tools',
            app_type: 'web_app',
            website_url: 'https://test.dev',
          },
          db
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'MISSING_TITLE');
      }
    });

    it('rejects invalid categories (400 INVALID_CATEGORY)', async () => {
      const db = getDb();
      const badCategories = ['crypto', 'gambling', 'social-media', 'random', '', 123];

      for (const category of badCategories) {
        const res = await dispatchPostListing(
          {
            title: 'Category Test',
            category: category as any,
            app_type: 'web_app',
            website_url: 'https://test.dev',
          },
          db
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'INVALID_CATEGORY');
      }
    });

    it('rejects invalid app types (400 INVALID_APP_TYPE)', async () => {
      const db = getDb();
      const badAppTypes = ['ios_app', 'android_app', 'smartwatch', 'smart_tv', '', null];

      for (const app_type of badAppTypes) {
        const res = await dispatchPostListing(
          {
            title: 'App Type Test',
            category: 'utilities',
            app_type: app_type as any,
            website_url: 'https://test.dev',
          },
          db
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'INVALID_APP_TYPE');
      }
    });

    it('rejects invalid verification sources (400 INVALID_VERIFICATION_SOURCE)', async () => {
      const db = getDb();
      const badSources = ['twitter_verified', 'facebook', 'self_asserted', 'faker'];

      for (const source of badSources) {
        const res = await dispatchPostListing(
          {
            title: 'Verification Source Test',
            category: 'utilities',
            app_type: 'web_app',
            website_url: 'https://test.dev',
            verification_source: source as any,
          },
          db
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'INVALID_VERIFICATION_SOURCE');
      }
    });
  });

  // ==========================================================================
  // Section 5: Website URL Security & Validation
  // ==========================================================================
  describe('5. Website URL Security & Validation', () => {
    it('rejects insecure javascript: URI attack vectors (400 INVALID_URL)', async () => {
      const db = getDb();
      const dangerousUrls = [
        'javascript:alert(document.cookie)',
        'javascript:/*--></title></style></textarea></script>alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:msgbox(1)',
        'file:///etc/passwd',
        'ftp://files.example.com',
      ];

      for (const website_url of dangerousUrls) {
        const res = await dispatchPostListing(
          {
            title: 'XSS Attack App',
            category: 'utilities',
            app_type: 'web_app',
            website_url,
          },
          db
        );
        assert.equal(res.status, 400, `Expected dangerous URL '${website_url}' to be rejected`);
        assert.equal(res.body.code, 'INVALID_URL');
      }
    });

    it('rejects non-URL strings or empty URL (400 INVALID_URL)', async () => {
      const db = getDb();
      const invalidUrls = ['', '   ', 'not-a-valid-url', 'httpx://bad.com', 'localhost:3000'];

      for (const website_url of invalidUrls) {
        const res = await dispatchPostListing(
          {
            title: 'Invalid URL App',
            category: 'utilities',
            app_type: 'web_app',
            website_url,
          },
          db
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'INVALID_URL');
      }
    });

    it('upgrades http:// URLs to secure https://', async () => {
      const db = getDb();
      const res = await dispatchPostListing(
        {
          title: 'HTTP Upgrade App',
          category: 'utilities',
          app_type: 'web_app',
          website_url: 'http://insecure-source.dev/tool',
        },
        db
      );

      assert.equal(res.status, 201);
      assert.equal(res.body.website_url, 'https://insecure-source.dev/tool');

      const persisted = await db.getListingById(res.body.id);
      assert.equal(persisted?.website_url, 'https://insecure-source.dev/tool');
    });

    it('preserves valid https:// URLs with subdomains, paths, and query parameters', async () => {
      const db = getDb();
      const testUrl = 'https://chromewebstore.google.com/detail/tabmaster/kmbjojmglgncplkjjckjebpbfb?hl=en';
      const res = await dispatchPostListing(
        {
          title: 'Store Listing App',
          category: 'productivity',
          app_type: 'chrome_extension',
          website_url: testUrl,
        },
        db
      );

      assert.equal(res.status, 201);
      assert.equal(res.body.website_url, testUrl);
    });
  });

  // ==========================================================================
  // Section 6: DAU Boundary Values
  // ==========================================================================
  describe('6. DAU Boundary Values', () => {
    it('accepts 0 DAU for newly launched applications', async () => {
      const db = getDb();
      const res = await dispatchPostListing(
        {
          title: 'Brand New Launch',
          category: 'developer-tools',
          app_type: 'web_app',
          website_url: 'https://brandnew.dev',
          verified_dau: 0,
        },
        db
      );

      assert.equal(res.status, 201);
      assert.equal(res.body.verified_dau, 0);
    });

    it('defaults verified_dau to 0 when omitted or null', async () => {
      const db = getDb();
      const res = await dispatchPostListing(
        {
          title: 'Omitted DAU Tool',
          category: 'productivity',
          app_type: 'web_app',
          website_url: 'https://omitted.dev',
        },
        db
      );

      assert.equal(res.status, 201);
      assert.equal(res.body.verified_dau, 0);
    });

    it('rejects negative DAU values (400 INVALID_DAU)', async () => {
      const db = getDb();
      const negativeValues = [-1, -100, -999999];

      for (const dau of negativeValues) {
        const res = await dispatchPostListing(
          {
            title: 'Negative DAU Tool',
            category: 'utilities',
            app_type: 'web_app',
            website_url: 'https://example.com',
            verified_dau: dau,
          },
          db
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'INVALID_DAU');
      }
    });

    it('rejects non-integer / floating-point DAU values (400 INVALID_DAU)', async () => {
      const db = getDb();
      const floatValues = [10.5, 0.1, 999.99];

      for (const dau of floatValues) {
        const res = await dispatchPostListing(
          {
            title: 'Float DAU Tool',
            category: 'utilities',
            app_type: 'web_app',
            website_url: 'https://example.com',
            verified_dau: dau,
          },
          db
        );
        assert.equal(res.status, 400);
        assert.equal(res.body.code, 'INVALID_DAU');
      }
    });

    it('handles large audience DAU values correctly', async () => {
      const db = getDb();
      const res = await dispatchPostListing(
        {
          title: 'High Scale App',
          category: 'developer-tools',
          app_type: 'web_app',
          website_url: 'https://highscale.dev',
          verified_dau: 500000,
        },
        db
      );

      assert.equal(res.status, 201);
      assert.equal(res.body.verified_dau, 500000);
    });
  });

  // ==========================================================================
  // Section 7: Inventory Slot Management Boundaries ($50-$1,000 & Guidelines)
  // ==========================================================================
  describe('7. Inventory Slot Management Boundaries', () => {
    it('strictly enforces monthly_price_cents range ($50.00 to $1,000.00)', async () => {
      const db = getDb();
      const listingRes = await dispatchPostListing(
        {
          title: 'Pricing Boundary App',
          category: 'utilities',
          app_type: 'web_app',
          website_url: 'https://example.com',
        },
        db
      );
      const listingId = listingRes.body.id;

      // Reject $49.99 (4,999 cents)
      const below = await dispatchPostSlot(
        { listing_id: listingId, slot_name: 'Slot Below', slot_type: 'header_pill', monthly_price_cents: 4999 },
        db
      );
      assert.equal(below.status, 400);
      assert.equal(below.body.code, 'INVALID_RENTAL_RATE');

      // Accept $50.00 (5,000 cents)
      const min = await dispatchPostSlot(
        { listing_id: listingId, slot_name: 'Slot Min', slot_type: 'header_pill', monthly_price_cents: 5000 },
        db
      );
      assert.equal(min.status, 201);

      // Accept $1,000.00 (100,000 cents)
      const max = await dispatchPostSlot(
        { listing_id: listingId, slot_name: 'Slot Max', slot_type: 'header_pill', monthly_price_cents: 100000 },
        db
      );
      assert.equal(max.status, 201);

      // Reject $1,000.01 (100,001 cents)
      const above = await dispatchPostSlot(
        { listing_id: listingId, slot_name: 'Slot Above', slot_type: 'header_pill', monthly_price_cents: 100001 },
        db
      );
      assert.equal(above.status, 400);
      assert.equal(above.body.code, 'INVALID_RENTAL_RATE');

      // Reject float cents (5000.5)
      const floatRate = await dispatchPostSlot(
        { listing_id: listingId, slot_name: 'Slot Float', slot_type: 'header_pill', monthly_price_cents: 5000.5 },
        db
      );
      assert.equal(floatRate.status, 400);
      assert.equal(floatRate.body.code, 'INVALID_RENTAL_RATE');
    });

    it('strictly enforces guidelines length limit of 1000 characters', async () => {
      const db = getDb();
      const listingRes = await dispatchPostListing(
        {
          title: 'Guidelines Boundary App',
          category: 'design',
          app_type: 'web_app',
          website_url: 'https://example.com',
        },
        db
      );
      const listingId = listingRes.body.id;

      // Exactly 1000 chars -> OK
      const res1000 = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'Slot 1000 Chars',
          slot_type: 'empty_state',
          monthly_price_cents: 15000,
          guidelines: 'X'.repeat(1000),
        },
        db
      );
      assert.equal(res1000.status, 201);

      // 1001 chars -> REJECTED
      const res1001 = await dispatchPostSlot(
        {
          listing_id: listingId,
          slot_name: 'Slot 1001 Chars',
          slot_type: 'empty_state',
          monthly_price_cents: 15000,
          guidelines: 'X'.repeat(1001),
        },
        db
      );
      assert.equal(res1001.status, 400);
      assert.equal(res1001.body.code, 'GUIDELINES_TOO_LONG');
    });

    it('rejects slot creation with invalid listing UUID or non-existent listing', async () => {
      const db = getDb();

      // Invalid UUID format
      const badUuid = await dispatchPostSlot(
        { listing_id: '123-not-a-uuid', slot_name: 'Slot', slot_type: 'header_pill', monthly_price_cents: 10000 },
        db
      );
      assert.equal(badUuid.status, 400);
      assert.equal(badUuid.body.code, 'INVALID_UUID');

      // Valid UUID format but non-existent
      const nonExistent = await dispatchPostSlot(
        {
          listing_id: 'a0000000-0000-0000-0000-000000000000',
          slot_name: 'Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 10000,
        },
        db
      );
      assert.equal(nonExistent.status, 404);
      assert.equal(nonExistent.body.code, 'NOT_FOUND');
    });
  });

  // ==========================================================================
  // Section 8: Direct Next.js HTTP Route Handler Execution
  // ==========================================================================
  describe('8. Direct Next.js HTTP Route Handlers (POST/GET/OPTIONS)', () => {
    it('executes POST /api/listings directly with Next.js Request and returns 201', async () => {
      const req = createJsonRequest('http://localhost:3000/api/listings', 'POST', {
        title: 'Direct Route Tool',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://directroute.dev',
        verified_dau: 3200,
      });

      const response = await postListingRoute(req);
      assert.equal(response.status, 201);
      const data = await response.json();
      assert.equal(data.title, 'Direct Route Tool');
      assert.equal(data.slug, 'direct-route-tool');
      assert.equal(data.verified_dau, 3200);
    });

    it('executes POST /api/listings directly and returns 409 on duplicate slug', async () => {
      const req1 = createJsonRequest('http://localhost:3000/api/listings', 'POST', {
        title: 'Duplicate Direct Tool',
        slug: 'direct-dup-slug',
        category: 'developer-tools',
        app_type: 'web_app',
        website_url: 'https://direct1.dev',
      });
      const res1 = await postListingRoute(req1);
      assert.equal(res1.status, 201);

      const req2 = createJsonRequest('http://localhost:3000/api/listings', 'POST', {
        title: 'Duplicate Direct Tool 2',
        slug: 'direct-dup-slug',
        category: 'productivity',
        app_type: 'web_app',
        website_url: 'https://direct2.dev',
      });
      const res2 = await postListingRoute(req2);
      assert.equal(res2.status, 409);
      const data2 = await res2.json();
      assert.equal(data2.code, 'SLUG_CONFLICT');
    });

    it('handles malformed JSON body in POST /api/listings directly', async () => {
      const req = new Request('http://localhost:3000/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid_json: true',
      });

      const response = await postListingRoute(req);
      assert.equal(response.status, 400);
      const data = await response.json();
      assert.equal(data.code, 'INVALID_JSON');
    });

    it('executes OPTIONS /api/listings for CORS preflight', async () => {
      const response = await optionsListingsRoute();
      assert.equal(response.status, 204);
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
      assert.ok(response.headers.get('Access-Control-Allow-Methods')?.includes('POST'));
    });

    it('executes POST /api/slots and GET /api/slots directly with Next.js Request', async () => {
      // First create listing
      const listingReq = createJsonRequest('http://localhost:3000/api/listings', 'POST', {
        title: 'Slots Direct Route App',
        category: 'utilities',
        app_type: 'web_app',
        website_url: 'https://slotsroute.dev',
      });
      const listingRes = await postListingRoute(listingReq);
      const listingData = await listingRes.json();
      const listingId = listingData.id;

      // POST slot
      const slotReq = createJsonRequest('http://localhost:3000/api/slots', 'POST', {
        listing_id: listingId,
        slot_name: 'Top Header Pill',
        slot_type: 'header_pill',
        monthly_price_cents: 20000,
        guidelines: 'Strictly B2B dev tools.',
      });
      const slotRes = await postSlotRoute(slotReq);
      assert.equal(slotRes.status, 201);
      const slotData = await slotRes.json();
      assert.equal(slotData.slot_type, 'header_pill');
      assert.equal(slotData.monthly_price_cents, 20000);

      // GET slots
      const getReq = new Request(`http://localhost:3000/api/slots?listing_id=${listingId}`, {
        method: 'GET',
      });
      const getRes = await getSlotsRoute(getReq);
      assert.equal(getRes.status, 200);
      const getData = await getRes.json();
      assert.equal(getData.total, 1);
      assert.equal(getData.slots[0].slot_name, 'Top Header Pill');
    });

    it('executes OPTIONS /api/slots for CORS preflight', async () => {
      const response = await optionsSlotsRoute();
      assert.equal(response.status, 204);
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
    });
  });

  // ==========================================================================
  // Section 9: Integration Snippets Generator Integrity & Clean Output
  // ==========================================================================
  describe('9. Integration Snippets Generator Integrity', () => {
    it('generates consistent, well-formed HTML, JS, and React snippets', () => {
      const slotId = '30000000-0000-0000-0000-000000000001';
      const snippets = generateIntegrationSnippets(slotId, { baseUrl: 'https://custom.sponsorslot.dev' });

      // Embed script checks
      assert.ok(snippets.embedScript.includes('https://custom.sponsorslot.dev/embed.js'));
      assert.ok(snippets.embedScript.includes(`data-slot-id="${slotId}"`));
      assert.ok(snippets.embedScript.includes('async'));

      // Embed HTML checks
      assert.ok(snippets.embedHtml.includes(`id="sponsorslot-${slotId}"`));
      assert.ok(snippets.embedHtml.includes(`data-sponsorslot-id="${slotId}"`));

      // Headless fetch checks
      assert.ok(snippets.fetchSnippet.includes(`https://custom.sponsorslot.dev/api/v1/slot/${slotId}`));
      assert.ok(snippets.fetchSnippet.includes('/api/v1/telemetry/beacon'));

      // React component checks
      assert.ok(snippets.reactSnippet.includes('export function SponsorSlotBanner()'));
      assert.ok(snippets.reactSnippet.includes(`https://custom.sponsorslot.dev/api/v1/slot/${slotId}`));
    });

    it('generates headless cURL command and fetch code', () => {
      const slotId = '40000000-0000-0000-0000-000000000002';
      const headless = generateHeadlessSnippet(slotId);

      assert.equal(headless.curlCommand, `curl -X GET "https://sponsorslot.dev/api/v1/slot/${slotId}" -H "Accept: application/json"`);
      assert.ok(headless.fetchCode.includes('revalidate: 300'));
      assert.ok(headless.fetchCode.includes('sendBeacon'));
    });
  });
});
