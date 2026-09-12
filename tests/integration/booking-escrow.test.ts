import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryDatabaseRepository } from '../../src/lib/db.ts';
import { enrichWithUtm, sanitizeSvg } from '../../src/lib/escrow.ts';
import { SLOT_COPY_LIMITS } from '../../src/lib/types.ts';
import { dispatchGetSlot } from '../test-utils.ts';

describe('Integration: Advertiser Booking & Escrow Engine (/sponsor/[slotId])', () => {
  let db: InMemoryDatabaseRepository;
  const vacantSlotId = '20000000-0000-0000-0000-000000000002'; // empty_state, 35000 cents ($350)
  const headerSlotId = '20000000-0000-0000-0000-000000000007'; // header_pill on SVG Shape Shifter (is_available: true)

  beforeEach(async () => {
    db = new InMemoryDatabaseRepository();
    await db.reset();
  });

  // Tier 1: Core Feature Verification
  describe('Tier 1: Booking Flow, Status Transitions & Financial Allocation', () => {
    it('successfully books a vacant slot and transitions status to escrow_held', async () => {
      const result = await db.bookSlot({
        slot_id: vacantSlotId,
        sponsor_name: 'SuperScale SaaS',
        sponsor_email: 'growth@superscale.io',
        creative_text: 'Scale your Postgres database effortlessly with SuperScale',
        creative_target_url: 'https://superscale.io?ref=hero',
      });

      assert.equal(result.success, true);
      assert.ok(result.sponsorship);
      assert.equal(result.sponsorship.status, 'escrow_held');
      assert.equal(result.sponsorship.monthly_amount_cents, 35000);
      assert.equal(result.sponsorship.platform_fee_cents, 5250, '15% of 35000 is 5250 cents ($52.50)');
      assert.equal(result.sponsorship.creator_payout_cents, 29750, '85% of 35000 is 29750 cents ($297.50)');
      assert.equal(
        result.sponsorship.platform_fee_cents + result.sponsorship.creator_payout_cents,
        35000
      );

      // Slot must now be marked unavailable
      const slot = await db.getSlotById(vacantSlotId);
      assert.equal(slot?.is_available, false, 'Slot must be locked to prevent double booking');
    });

    it('enforces exact 30-day term duration regardless of month length', async () => {
      const result = await db.bookSlot({
        slot_id: vacantSlotId,
        sponsor_name: 'Acme Corp',
        sponsor_email: 'sponsor@acme.com',
        creative_text: 'Deploy faster with Acme CI',
        creative_target_url: 'https://acme.com',
      });

      assert.ok(result.sponsorship);
      const start = new Date(result.sponsorship.start_date);
      const end = new Date(result.sponsorship.end_date);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      assert.equal(diffDays, 30, 'Term duration must be exactly 30 days');
    });
  });

  // Tier 2: Boundary & Security Enforcement
  describe('Tier 2: Concurrency Race, Copy Limits, UTM Enrichment & SVG Sanitization', () => {
    it('prevents double booking race conditions (atomic slot reservation mutex)', async () => {
      // First booking succeeds
      const first = await db.bookSlot({
        slot_id: vacantSlotId,
        sponsor_name: 'First Sponsor',
        sponsor_email: 'first@test.com',
        creative_text: 'First valid creative',
        creative_target_url: 'https://first.com',
      });
      assert.equal(first.success, true);

      // Second simultaneous booking must be rejected
      const second = await db.bookSlot({
        slot_id: vacantSlotId,
        sponsor_name: 'Second Sponsor',
        sponsor_email: 'second@test.com',
        creative_text: 'Second valid creative',
        creative_target_url: 'https://second.com',
      });
      assert.equal(second.success, false);
      assert.equal(second.error, 'SLOT_ALREADY_BOOKED');
    });

    it('strictly enforces copy character limits across all 4 slot formats', async () => {
      const headerSlot = (await db.getSlotById(headerSlotId))!;

      // 81 characters
      const overLimitCopy = 'A'.repeat(81);
      const result = await db.bookSlot({
        slot_id: headerSlot.id,
        sponsor_name: 'Overflow Corp',
        sponsor_email: 'test@corp.com',
        creative_text: overLimitCopy,
        creative_target_url: 'https://corp.com',
      });
      assert.equal(result.success, false);
      assert.equal(result.error, 'COPY_EXCEEDS_LIMIT_MAX_80');

      // Exactly 80 characters succeeds
      const exactCopy = 'A'.repeat(80);
      const validResult = await db.bookSlot({
        slot_id: headerSlot.id,
        sponsor_name: 'Valid Corp',
        sponsor_email: 'test@corp.com',
        creative_text: exactCopy,
        creative_target_url: 'https://corp.com',
      });
      assert.equal(validResult.success, true);
    });

    it('rejects unencrypted or malicious target URLs (requires HTTPS)', () => {
      const insecureUrls = [
        'http://insecure-site.com',
        'javascript:alert(document.cookie)',
        'ftp://files.com',
        'data:text/html,bad',
      ];
      for (const url of insecureUrls) {
        assert.throws(
          () => enrichWithUtm(url, 'header_pill', 'test-app'),
          /must start with https:\/\//
        );
      }
    });

    it('enriches destination URL with standard UTM tracking while preserving existing params', () => {
      const rawUrl = 'https://myservice.io/signup?plan=pro&source=organic';
      const enriched = enrichWithUtm(rawUrl, 'header_pill', 'jsonhero-visualizer');

      const parsed = new URL(enriched);
      assert.equal(parsed.searchParams.get('utm_source'), 'sponsorslot');
      assert.equal(parsed.searchParams.get('utm_medium'), 'header_pill');
      assert.equal(parsed.searchParams.get('utm_campaign'), 'jsonhero-visualizer');
      // Preserves original query params
      assert.equal(parsed.searchParams.get('plan'), 'pro');
      assert.equal(parsed.searchParams.get('source'), 'organic');
    });

    it('sanitizes SVG creative assets removing stored XSS vectors', () => {
      const maliciousSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="red" onload="alert('xss')" />
          <script>fetch('/stolen-token?c=' + document.cookie)</script>
          <a xlink:href="javascript:alert(1)">Click Me</a>
        </svg>
      `;

      const { isClean, sanitized } = sanitizeSvg(maliciousSvg);
      assert.equal(isClean, false, 'Should flag malicious SVG patterns');
      assert.ok(!sanitized.includes('<script>'), 'Must strip script tags');
      assert.ok(!sanitized.includes('onload='), 'Must strip onload handlers');
      assert.ok(!sanitized.includes('javascript:'), 'Must strip javascript: protocols');
    });
  });

  // Tier 3: Cross-Feature Integration (Booking -> Edge Delivery Seam)
  describe('Tier 3: Immediate Reflection in Edge Delivery API', () => {
    it('switches slot delivery from fallback referral badge to sponsored creative immediately after booking', async () => {
      // 1. Before booking: slot delivery returns unfilled fallback CTA
      const preCheck = await dispatchGetSlot(vacantSlotId, db);
      assert.equal(preCheck.body.active, false);
      assert.equal(preCheck.body.fallback, true);
      assert.ok(preCheck.body.creative.text.includes('Place your product here'));

      // 2. Perform booking
      const bookRes = await db.bookSlot({
        slot_id: vacantSlotId,
        sponsor_name: 'Edge Sponsor',
        sponsor_email: 'edge@sponsor.com',
        creative_text: 'Fast Edge Cache for Developers',
        creative_target_url: 'https://edgecache.io',
      });
      assert.equal(bookRes.success, true);

      // 3. After booking: slot delivery immediately returns sponsored payload
      const postCheck = await dispatchGetSlot(vacantSlotId, db);
      assert.equal(postCheck.body.active, true);
      assert.equal(postCheck.body.fallback, false);
      assert.equal(postCheck.body.status, 'sponsored');
      assert.equal(postCheck.body.creative.text, 'Fast Edge Cache for Developers');
      assert.equal(postCheck.body.creative.target_url, 'https://edgecache.io');
    });
  });
});
