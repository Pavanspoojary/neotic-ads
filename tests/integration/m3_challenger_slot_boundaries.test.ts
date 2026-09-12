/**
 * Empirical Challenger Test Suite: Slot Format Constraints & Rental Rate Boundaries (M3)
 * File path: tests/integration/m3_challenger_slot_boundaries.test.ts
 *
 * Adversarially stress-tests:
 *   1. Rental rate boundaries ($49 rejected, $50 accepted, $1,000 accepted, $1,001 rejected with INVALID_RENTAL_RATE)
 *      alongside negative, float, non-numeric, and extreme values.
 *   2. All 4 standardized slot formats (header_pill, empty_state, footer_badge, email_footer)
 *      and strict rejection of non-existent/invalid formats with INVALID_SLOT_TYPE.
 *   3. Format copy limits (80, 200, 60, 120 chars) across types and components.
 *   4. Sponsor guidelines length (1,000 chars accepted, 1,001 chars rejected with GUIDELINES_TOO_LONG).
 *   5. Integration snippet generator (HTML script tag with correct slot ID, embed.js path, shadow DOM container, fetch URL).
 *   6. Route handler direct invocation vs public seam dispatcher consistency.
 */

import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Ensure global React is available in Node/tsx environment
(globalThis as any).React = React;

// Seam and domain imports
import { getDb, resetInMemoryDb, InMemoryDatabaseRepository } from '../../src/lib/db.ts';
import {
  calculateEscrowSplit,
  validateRentalRate,
  MIN_MONTHLY_PRICE_CENTS,
  MAX_MONTHLY_PRICE_CENTS,
} from '../../src/lib/escrow.ts';
import {
  SLOT_COPY_LIMITS,
  SlotType,
  InventorySlot,
} from '../../src/lib/types.ts';
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

// Direct Next.js App Router API Route Handlers
import { POST as postSlotRoute, GET as getSlotsRoute } from '../../src/app/api/slots/route.ts';

// UI Components under challenge
import { SlotManager, STANDARDIZED_SLOT_FORMATS } from '../../src/components/SlotManager.tsx';
import { SnippetGenerator } from '../../src/components/SnippetGenerator.tsx';

describe('Milestone 3 Challenger 2: Slot Format Constraints & Rental Rate Boundaries', () => {
  let db: InMemoryDatabaseRepository;
  const testListingId = '10000000-0000-0000-0000-000000000001'; // JSONHero Visualizer in fixtures

  beforeEach(async () => {
    await resetInMemoryDb();
    db = new InMemoryDatabaseRepository();
    await db.reset();
  });

  // ==========================================================================
  // Section 1: Rental Rate Boundaries ($50 to $1,000/mo = 5,000 to 100,000 cents)
  // ==========================================================================
  describe('1. Rental Rate Boundaries & Stress Tests', () => {
    it('strictly rejects 4,999 cents ($49.99) with 400 Bad Request and INVALID_RENTAL_RATE on both route handler and seam', async () => {
      // 1. Direct Next.js Route Handler invocation
      const req = new Request('http://localhost:3000/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: testListingId,
          slot_name: 'Header Pill Sub-Min',
          slot_type: 'header_pill',
          monthly_price_cents: 4999,
        }),
      });
      const routeRes = await postSlotRoute(req);
      assert.equal(routeRes.status, 400, 'Direct route handler must return 400 for 4,999 cents');
      const routeBody = await routeRes.json();
      assert.equal(routeBody.code, 'INVALID_RENTAL_RATE');
      assert.ok(routeBody.error.includes('Monthly rate must be between $50.00 and $1,000.00'));

      // 2. Seam Dispatcher invocation
      const seamRes = await dispatchPostSlot(
        {
          listing_id: testListingId,
          slot_name: 'Header Pill Sub-Min',
          slot_type: 'header_pill',
          monthly_price_cents: 4999,
        },
        db
      );
      assert.equal(seamRes.status, 400, 'Seam dispatcher must return 400 for 4,999 cents');
      assert.equal(seamRes.body.code, 'INVALID_RENTAL_RATE');

      // 3. Domain validator unit check
      const validation = validateRentalRate(4999);
      assert.equal(validation.valid, false);
      assert.ok(validation.error?.includes('cannot be less than $50.00'));
    });

    it('accepts 5,000 cents ($50.00) boundary with 201 Created on both route handler and seam', async () => {
      // 1. Direct Next.js Route Handler invocation
      const req = new Request('http://localhost:3000/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: testListingId,
          slot_name: 'Min Boundary Pill',
          slot_type: 'header_pill',
          monthly_price_cents: 5000,
        }),
      });
      const routeRes = await postSlotRoute(req);
      assert.equal(routeRes.status, 201, 'Direct route handler must return 201 for 5,000 cents');
      const routeBody = await routeRes.json();
      assert.equal(routeBody.monthly_price_cents, 5000);
      assert.equal(routeBody.is_available, true);

      // 2. Seam Dispatcher invocation
      const seamRes = await dispatchPostSlot(
        {
          listing_id: testListingId,
          slot_name: 'Min Boundary Seam Pill',
          slot_type: 'header_pill',
          monthly_price_cents: 5000,
        },
        db
      );
      assert.equal(seamRes.status, 201, 'Seam dispatcher must return 201 for 5,000 cents');
      assert.equal(seamRes.body.monthly_price_cents, 5000);

      // 3. Domain validator unit check
      const validation = validateRentalRate(5000);
      assert.equal(validation.valid, true);
    });

    it('accepts 100,000 cents ($1,000.00) boundary with 201 Created on both route handler and seam', async () => {
      // 1. Direct Next.js Route Handler invocation
      const req = new Request('http://localhost:3000/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: testListingId,
          slot_name: 'Max Boundary Pill',
          slot_type: 'empty_state',
          monthly_price_cents: 100000,
        }),
      });
      const routeRes = await postSlotRoute(req);
      assert.equal(routeRes.status, 201, 'Direct route handler must return 201 for 100,000 cents');
      const routeBody = await routeRes.json();
      assert.equal(routeBody.monthly_price_cents, 100000);

      // 2. Seam Dispatcher invocation
      const seamRes = await dispatchPostSlot(
        {
          listing_id: testListingId,
          slot_name: 'Max Boundary Seam Pill',
          slot_type: 'empty_state',
          monthly_price_cents: 100000,
        },
        db
      );
      assert.equal(seamRes.status, 201, 'Seam dispatcher must return 201 for 100,000 cents');
      assert.equal(seamRes.body.monthly_price_cents, 100000);

      // 3. Domain validator unit check
      const validation = validateRentalRate(100000);
      assert.equal(validation.valid, true);
    });

    it('strictly rejects 100,001 cents ($1,000.01) with 400 Bad Request and INVALID_RENTAL_RATE on both route handler and seam', async () => {
      // 1. Direct Next.js Route Handler invocation
      const req = new Request('http://localhost:3000/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: testListingId,
          slot_name: 'Over Max Pill',
          slot_type: 'header_pill',
          monthly_price_cents: 100001,
        }),
      });
      const routeRes = await postSlotRoute(req);
      assert.equal(routeRes.status, 400, 'Direct route handler must return 400 for 100,001 cents');
      const routeBody = await routeRes.json();
      assert.equal(routeBody.code, 'INVALID_RENTAL_RATE');
      assert.ok(routeBody.error.includes('Monthly rate must be between $50.00 and $1,000.00'));

      // 2. Seam Dispatcher invocation
      const seamRes = await dispatchPostSlot(
        {
          listing_id: testListingId,
          slot_name: 'Over Max Seam Pill',
          slot_type: 'header_pill',
          monthly_price_cents: 100001,
        },
        db
      );
      assert.equal(seamRes.status, 400, 'Seam dispatcher must return 400 for 100,001 cents');
      assert.equal(seamRes.body.code, 'INVALID_RENTAL_RATE');

      // 3. Domain validator unit check
      const validation = validateRentalRate(100001);
      assert.equal(validation.valid, false);
      assert.ok(validation.error?.includes('cannot exceed $1,000.00'));
    });

    it('rejects negative rental rates, zero cents, floating-point cents, and non-numeric values', async () => {
      const adversarialRates = [
        { val: -5000, desc: 'negative $50' },
        { val: -1, desc: 'negative 1 cent' },
        { val: 0, desc: 'zero cents' },
        { val: 5000.5, desc: 'half cent float' },
        { val: 9999.99, desc: 'floating point cents' },
        { val: 50.0, desc: 'dollar representation instead of cents' },
        { val: '5000', desc: 'string representation of cents' },
        { val: null, desc: 'null price' },
        { val: undefined, desc: 'undefined price' },
        { val: NaN, desc: 'NaN' },
        { val: Infinity, desc: 'Infinity' },
        { val: -Infinity, desc: '-Infinity' },
        { val: 10000000, desc: '$100,000 excessive price' },
        { val: Number.MAX_SAFE_INTEGER, desc: 'MAX_SAFE_INTEGER' },
      ];

      for (const { val, desc } of adversarialRates) {
        // Direct Route Handler
        const req = new Request('http://localhost:3000/api/slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listing_id: testListingId,
            slot_name: `Stress ${desc}`,
            slot_type: 'header_pill',
            monthly_price_cents: val,
          }),
        });
        const routeRes = await postSlotRoute(req);
        assert.equal(routeRes.status, 400, `Route handler must reject ${desc} with 400`);
        const routeBody = await routeRes.json();
        assert.equal(routeBody.code, 'INVALID_RENTAL_RATE', `Expected INVALID_RENTAL_RATE for ${desc}`);

        // Seam Dispatcher
        const seamRes = await dispatchPostSlot(
          {
            listing_id: testListingId,
            slot_name: `Stress ${desc}`,
            slot_type: 'header_pill',
            monthly_price_cents: val as any,
          },
          db
        );
        assert.equal(seamRes.status, 400, `Seam dispatcher must reject ${desc} with 400`);
        assert.equal(seamRes.body.code, 'INVALID_RENTAL_RATE', `Expected INVALID_RENTAL_RATE for ${desc}`);

        // Domain validator
        const validation = validateRentalRate(val as any);
        assert.equal(validation.valid, false, `Domain validator must return valid:false for ${desc}`);
      }
    });
  });

  // ==========================================================================
  // Section 2: Standardized Slot Formats & Copy Limits
  // ==========================================================================
  describe('2. Standardized Slot Formats & Format Constraints', () => {
    it('successfully configures all 4 standardized slot formats with 201 Created', async () => {
      const allFourFormats: SlotType[] = [
        'header_pill',
        'empty_state',
        'footer_badge',
        'email_footer',
      ];

      for (const format of allFourFormats) {
        // 1. Route handler test
        const req = new Request('http://localhost:3000/api/slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listing_id: testListingId,
            slot_name: `Test ${format} Slot`,
            slot_type: format,
            monthly_price_cents: 20000,
          }),
        });
        const routeRes = await postSlotRoute(req);
        assert.equal(routeRes.status, 201, `Route handler must create slot for format: ${format}`);
        const routeBody = await routeRes.json();
        assert.equal(routeBody.slot_type, format);
        assert.equal(routeBody.is_available, true);
        assert.equal(routeBody.max_sponsors, 1);

        // 2. Seam dispatcher test
        const seamRes = await dispatchPostSlot(
          {
            listing_id: testListingId,
            slot_name: `Seam ${format} Slot`,
            slot_type: format,
            monthly_price_cents: 25000,
          },
          db
        );
        assert.equal(seamRes.status, 201, `Seam must create slot for format: ${format}`);
        assert.equal(seamRes.body.slot_type, format);
      }
    });

    it('strictly rejects non-existent or invalid slot formats with 400 Bad Request and INVALID_SLOT_TYPE', async () => {
      const invalidFormats = [
        'popup_modal',
        'interstitial',
        'sidebar_banner',
        'sponsored_notification',
        'HEADER_PILL', // Uppercase should not bypass
        'Header_Pill',
        'empty-state', // kebab-case instead of snake_case
        '',
        '   ',
        null,
        123,
      ];

      for (const format of invalidFormats) {
        // Route handler
        const req = new Request('http://localhost:3000/api/slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listing_id: testListingId,
            slot_name: 'Invalid Format Slot',
            slot_type: format,
            monthly_price_cents: 20000,
          }),
        });
        const routeRes = await postSlotRoute(req);
        assert.equal(routeRes.status, 400, `Route handler must reject format '${format}' with 400`);
        const routeBody = await routeRes.json();
        assert.equal(routeBody.code, 'INVALID_SLOT_TYPE');

        // Seam dispatcher
        const seamRes = await dispatchPostSlot(
          {
            listing_id: testListingId,
            slot_name: 'Invalid Format Slot',
            slot_type: format as any,
            monthly_price_cents: 20000,
          },
          db
        );
        assert.equal(seamRes.status, 400, `Seam dispatcher must reject format '${format}' with 400`);
        assert.equal(seamRes.body.code, 'INVALID_SLOT_TYPE');
      }
    });

    it('verifies exact copy limits across all 4 formats in types.ts and SlotManager format dictionary', () => {
      // 1. Check SLOT_COPY_LIMITS from lib/types.ts
      assert.equal(SLOT_COPY_LIMITS.header_pill, 80, 'header_pill max copy is 80 chars');
      assert.equal(SLOT_COPY_LIMITS.empty_state, 200, 'empty_state max copy is 200 chars');
      assert.equal(SLOT_COPY_LIMITS.footer_badge, 60, 'footer_badge max copy is 60 chars');
      assert.equal(SLOT_COPY_LIMITS.email_footer, 120, 'email_footer max copy is 120 chars');

      // 2. Check STANDARDIZED_SLOT_FORMATS from components/SlotManager.tsx
      assert.equal(STANDARDIZED_SLOT_FORMATS.header_pill.charLimit, 80);
      assert.equal(STANDARDIZED_SLOT_FORMATS.empty_state.charLimit, 200);
      assert.equal(STANDARDIZED_SLOT_FORMATS.footer_badge.charLimit, 60);
      assert.equal(STANDARDIZED_SLOT_FORMATS.email_footer.charLimit, 120);

      // 3. Verify format dimensions and placements are documented
      assert.equal(STANDARDIZED_SLOT_FORMATS.header_pill.dimensions, '320 × 36 px');
      assert.equal(STANDARDIZED_SLOT_FORMATS.empty_state.dimensions, '480 × 240 px');
      assert.equal(STANDARDIZED_SLOT_FORMATS.footer_badge.dimensions, '240 × 32 px');
      assert.equal(STANDARDIZED_SLOT_FORMATS.email_footer.dimensions, '600 × 60 px');
    });
  });

  // ==========================================================================
  // Section 3: Sponsor Guidelines Length Boundaries
  // ==========================================================================
  describe('3. Sponsor Guidelines Length Boundaries', () => {
    it('accepts guidelines with exactly 1,000 characters with 201 Created', async () => {
      const boundary1000 = 'Z'.repeat(1000);
      assert.equal(boundary1000.length, 1000);

      // Route handler
      const req = new Request('http://localhost:3000/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: testListingId,
          slot_name: '1000 Chars Guidelines Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 30000,
          guidelines: boundary1000,
        }),
      });
      const routeRes = await postSlotRoute(req);
      assert.equal(routeRes.status, 201, 'Must accept 1,000 chars guidelines with 201');
      const routeBody = await routeRes.json();
      assert.equal(routeBody.guidelines.length, 1000);
      assert.equal(routeBody.guidelines, boundary1000);

      // Seam dispatcher
      const seamRes = await dispatchPostSlot(
        {
          listing_id: testListingId,
          slot_name: 'Seam 1000 Chars Guidelines Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 30000,
          guidelines: boundary1000,
        },
        db
      );
      assert.equal(seamRes.status, 201);
      assert.equal(seamRes.body.guidelines.length, 1000);
    });

    it('strictly rejects guidelines with 1,001 characters with 400 Bad Request and GUIDELINES_TOO_LONG', async () => {
      const boundary1001 = 'Z'.repeat(1001);
      assert.equal(boundary1001.length, 1001);

      // Route handler
      const req = new Request('http://localhost:3000/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: testListingId,
          slot_name: '1001 Chars Guidelines Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 30000,
          guidelines: boundary1001,
        }),
      });
      const routeRes = await postSlotRoute(req);
      assert.equal(routeRes.status, 400, 'Must reject 1,001 chars guidelines with 400');
      const routeBody = await routeRes.json();
      assert.equal(routeBody.code, 'GUIDELINES_TOO_LONG');
      assert.ok(routeBody.error.includes('Guidelines cannot exceed 1000 characters'));

      // Seam dispatcher
      const seamRes = await dispatchPostSlot(
        {
          listing_id: testListingId,
          slot_name: 'Seam 1001 Chars Guidelines Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 30000,
          guidelines: boundary1001,
        },
        db
      );
      assert.equal(seamRes.status, 400);
      assert.equal(seamRes.body.code, 'GUIDELINES_TOO_LONG');
    });

    it('rejects extreme guidelines payloads (>5,000 chars) and non-string guidelines', async () => {
      // 5,000 chars
      const hugeGuidelines = 'ExtremePayload '.repeat(500);
      const reqHuge = new Request('http://localhost:3000/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: testListingId,
          slot_name: 'Huge Guidelines Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 15000,
          guidelines: hugeGuidelines,
        }),
      });
      const hugeRes = await postSlotRoute(reqHuge);
      assert.equal(hugeRes.status, 400);
      assert.equal((await hugeRes.json()).code, 'GUIDELINES_TOO_LONG');

      // Non-string guidelines
      const reqNonString = new Request('http://localhost:3000/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: testListingId,
          slot_name: 'Number Guidelines Slot',
          slot_type: 'header_pill',
          monthly_price_cents: 15000,
          guidelines: 12345,
        }),
      });
      const nonStringRes = await postSlotRoute(reqNonString);
      assert.equal(nonStringRes.status, 400);
      assert.equal((await nonStringRes.json()).code, 'INVALID_GUIDELINES');
    });

    it('accepts null, undefined, or empty string guidelines without error', async () => {
      for (const guidelinesVal of [undefined, null, '']) {
        const req = new Request('http://localhost:3000/api/slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listing_id: testListingId,
            slot_name: `Empty Guidelines ${String(guidelinesVal)}`,
            slot_type: 'header_pill',
            monthly_price_cents: 15000,
            guidelines: guidelinesVal,
          }),
        });
        const res = await postSlotRoute(req);
        assert.equal(res.status, 201, `Guidelines ${guidelinesVal} should be accepted with 201`);
        const body = await res.json();
        assert.equal(body.is_available, true);
      }
    });
  });

  // ==========================================================================
  // Section 4: Integration Snippet Generator Verification
  // ==========================================================================
  describe('4. Integration Snippet Generator Verification', () => {
    const testSlotId = '20000000-0000-0000-0000-000000000099';

    it('verifies generateEmbedSnippet creates correct HTML container and script tag', () => {
      const snippet = generateEmbedSnippet(testSlotId, 'https://sponsorslot.dev');

      // 1. Correct slot container ID
      assert.equal(snippet.containerId, `sponsorslot-${testSlotId}`);

      // 2. Correct embed.js script URL
      assert.equal(snippet.scriptUrl, 'https://sponsorslot.dev/embed.js');

      // 3. HTML contains container and script with data-slot-id and async attributes
      assert.ok(snippet.html.includes(`<div id="sponsorslot-${testSlotId}"></div>`));
      assert.ok(snippet.html.includes('src="https://sponsorslot.dev/embed.js"'));
      assert.ok(snippet.html.includes(`data-slot-id="${testSlotId}"`));
      assert.ok(snippet.html.includes('async'));
    });

    it('verifies generateHeadlessSnippet creates valid endpoint fetch URL and telemetry beacon', () => {
      const headless = generateHeadlessSnippet(testSlotId, 'https://sponsorslot.dev');

      // 1. Fetch code contains exact slot endpoint URL
      assert.ok(headless.fetchCode.includes(`fetch('https://sponsorslot.dev/api/v1/slot/${testSlotId}'`));

      // 2. Request header Accept application/json
      assert.ok(headless.fetchCode.includes("'Accept': 'application/json'"));

      // 3. Telemetry beacon URL and payload
      assert.ok(headless.fetchCode.includes("'https://sponsorslot.dev/api/v1/telemetry/beacon'"));
      assert.ok(headless.fetchCode.includes(`slot_id: '${testSlotId}'`));
      assert.ok(headless.fetchCode.includes("event: 'impression'"));

      // 4. cURL command contains valid endpoint URL
      assert.ok(headless.curlCommand.includes(`curl -X GET "https://sponsorslot.dev/api/v1/slot/${testSlotId}"`));
    });

    it('verifies generateIntegrationSnippets generates complete multi-channel snippets', () => {
      const snippets = generateIntegrationSnippets(testSlotId, { baseUrl: 'https://sponsorslot.dev' });

      assert.equal(snippets.slotId, testSlotId);
      assert.ok(snippets.embedHtml.includes(`id="sponsorslot-${testSlotId}"`));
      assert.ok(snippets.embedScript.includes(`data-slot-id="${testSlotId}"`));
      assert.ok(snippets.fetchSnippet.includes(`/api/v1/slot/${testSlotId}`));
      assert.ok(snippets.reactSnippet.includes('SponsorSlotBanner'));
      assert.ok(snippets.reactSnippet.includes(`/api/v1/slot/${testSlotId}`));
    });

    it('renders SnippetGenerator React component and verifies Shadow DOM callout and slot references', () => {
      const sampleSlot: InventorySlot = {
        id: testSlotId,
        listing_id: testListingId,
        slot_name: 'Primary Top Nav Pill',
        slot_type: 'header_pill',
        monthly_price_cents: 25000,
        is_available: true,
        max_sponsors: 1,
        created_at: new Date().toISOString(),
      };

      const markup = renderToStaticMarkup(
        React.createElement(SnippetGenerator, {
          slot: sampleSlot,
          baseUrl: 'https://sponsorslot.dev',
        })
      );

      // Verify slot name displayed
      assert.ok(markup.includes('Primary Top Nav Pill'));

      // Verify format badge
      assert.ok(markup.includes('header_pill'));

      // Verify tabs
      assert.ok(markup.includes('Client SDK Script'));
      assert.ok(markup.includes('Headless JSON API'));
      assert.ok(markup.includes('cURL'));

      // Verify code contents
      assert.ok(markup.includes(`sponsorslot-${testSlotId}`));
      assert.ok(markup.includes('embed.js'));

      // Verify architecture callout for Shadow DOM and Zero-PII
      assert.ok(markup.includes('Shadow DOM Isolation'));
      assert.ok(markup.includes('Zero-PII Telemetry'));
      assert.ok(markup.includes('Unfilled Fallback'));
    });
  });

  // ==========================================================================
  // Section 5: Escrow Mathematical Invariants on Boundary Rates
  // ==========================================================================
  describe('5. Escrow Invariants Across Boundary Rates', () => {
    it('verifies 15%/85% split with zero penny leakage at $50.00 (5,000 cents)', () => {
      const split = calculateEscrowSplit(5000);
      assert.equal(split.monthly_amount_cents, 5000);
      assert.equal(split.platform_fee_cents, 750, '$7.50 platform fee');
      assert.equal(split.creator_payout_cents, 4250, '$42.50 creator payout');
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 5000);
      assert.equal(split.take_rate_percentage, 15);
    });

    it('verifies 15%/85% split with zero penny leakage at $1,000.00 (100,000 cents)', () => {
      const split = calculateEscrowSplit(100000);
      assert.equal(split.monthly_amount_cents, 100000);
      assert.equal(split.platform_fee_cents, 15000, '$150.00 platform fee');
      assert.equal(split.creator_payout_cents, 85000, '$850.00 creator payout');
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 100000);
      assert.equal(split.take_rate_percentage, 15);
    });

    it('verifies zero penny leakage across all tricky cent values between boundary limits', () => {
      const trickyPoints = [5001, 5099, 7499, 9999, 14995, 25001, 49999, 75003, 99999, 100000];
      for (const amount of trickyPoints) {
        const split = calculateEscrowSplit(amount);
        assert.equal(
          split.platform_fee_cents + split.creator_payout_cents,
          amount,
          `Penny leakage violation at amount ${amount}`
        );
      }
    });
  });
});
