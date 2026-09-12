/**
 * Integration Test Suite: Next.js HTTP Route Handlers & SDK Integrity
 * File path: tests/integration/routes-e2e.test.ts
 */

import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getDb, resetInMemoryDb, setDb, InMemoryDatabaseRepository } from '../../src/lib/db.ts';
import { POST as handleSponsorshipPost, GET as handleSponsorshipGet } from '../../src/app/api/sponsorships/route.ts';
import { GET as handleSlotDeliveryGet } from '../../src/app/api/v1/slot/[id]/route.ts';
import { POST as handleBeaconPost } from '../../src/app/api/v1/telemetry/beacon/route.ts';

describe('Integration: Next.js HTTP Route Handlers & Client SDK', () => {
  let db: InMemoryDatabaseRepository;
  const vacantSlotId = '20000000-0000-0000-0000-000000000002'; // Empty state on JSONHero ($350)
  const occupiedSlotId = '20000000-0000-0000-0000-000000000001'; // Header pill on JSONHero ($250)

  beforeEach(async () => {
    db = new InMemoryDatabaseRepository();
    await db.reset();
    setDb(db);
  });

  // --------------------------------------------------------------------------
  // 1. Sponsorships Booking HTTP Route Handler (/api/sponsorships)
  // --------------------------------------------------------------------------
  describe('1. Sponsorships HTTP Route (/api/sponsorships)', () => {
    it('successfully books a vacant slot and records 30-day escrow contract', async () => {
      const req = new Request('http://localhost:3000/api/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: vacantSlotId,
          sponsor_name: 'FastTelemetry',
          sponsor_email: 'growth@fasttelemetry.io',
          creative_text: 'Real-time telemetry for modern Next.js teams',
          creative_target_url: 'https://fasttelemetry.io',
        }),
      });

      const res = await handleSponsorshipPost(req);
      assert.equal(res.status, 201);

      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.sponsorship);
      assert.equal(json.sponsorship.monthly_amount_cents, 35000);
      assert.equal(json.sponsorship.platform_fee_cents, 5250);
      assert.equal(json.sponsorship.creator_payout_cents, 29750);
      assert.equal(json.sponsorship.status, 'escrow_held');

      // Slot must now be unavailable
      const slot = await db.getSlotById(vacantSlotId);
      assert.equal(slot?.is_available, false);
    });

    it('rejects booking when slot is already occupied', async () => {
      const req = new Request('http://localhost:3000/api/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: occupiedSlotId,
          sponsor_name: 'Conflict Inc',
          sponsor_email: 'conflict@inc.com',
          creative_text: 'Should fail',
          creative_target_url: 'https://conflict.com',
        }),
      });

      const res = await handleSponsorshipPost(req);
      assert.equal(res.status, 409);
      const json = await res.json();
      assert.equal(json.code, 'SLOT_UNAVAILABLE');
    });

    it('rejects booking with insecure HTTP url', async () => {
      const req = new Request('http://localhost:3000/api/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: vacantSlotId,
          sponsor_name: 'Insecure Inc',
          sponsor_email: 'sec@inc.com',
          creative_text: 'Should fail on http',
          creative_target_url: 'http://insecure.com',
        }),
      });

      const res = await handleSponsorshipPost(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.code, 'INVALID_TARGET_URL');
    });

    it('rejects booking when creative text exceeds slot copy limit', async () => {
      // vacantSlotId is empty_state (limit 200 chars)
      const longCopy = 'A'.repeat(250);
      const req = new Request('http://localhost:3000/api/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: vacantSlotId,
          sponsor_name: 'Too Long Inc',
          sponsor_email: 'long@inc.com',
          creative_text: longCopy,
          creative_target_url: 'https://toolong.com',
        }),
      });

      const res = await handleSponsorshipPost(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.code, 'COPY_TOO_LONG');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Edge Slot Delivery HTTP Route Handler (/api/v1/slot/[id])
  // --------------------------------------------------------------------------
  describe('2. Edge Slot Delivery HTTP Route (/api/v1/slot/[id])', () => {
    it('serves active sponsorship with caching and CORS headers', async () => {
      const req = new Request(`http://localhost:3000/api/v1/slot/${occupiedSlotId}`);
      const res = await handleSlotDeliveryGet(req, { params: Promise.resolve({ id: occupiedSlotId }) });

      assert.equal(res.status, 200);
      assert.equal(res.headers.get('Access-Control-Allow-Origin'), '*');
      assert.ok(res.headers.get('Cache-Control')?.includes('public'));

      const json = await res.json();
      assert.equal(json.active, true);
      assert.equal(json.status, 'sponsored');
      assert.ok(json.creative.text.includes('LogFast'));
      assert.equal(json.beacon.slot_id, occupiedSlotId);
    });

    it('serves viral fallback CTA for vacant slot', async () => {
      const req = new Request(`http://localhost:3000/api/v1/slot/${vacantSlotId}`);
      const res = await handleSlotDeliveryGet(req, { params: Promise.resolve({ id: vacantSlotId }) });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.active, false);
      assert.equal(json.fallback, true);
      assert.ok(json.creative.text.includes('Place your product here'));
      assert.ok(json.creative.target_url.includes('ref=unfilled_slot'));
    });

    it('returns 400 for malformed slot UUID', async () => {
      const req = new Request('http://localhost:3000/api/v1/slot/not-a-uuid');
      const res = await handleSlotDeliveryGet(req, { params: Promise.resolve({ id: 'not-a-uuid' }) });

      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.code, 'INVALID_PARAM');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Telemetry Beacon HTTP Route Handler (/api/v1/telemetry/beacon)
  // --------------------------------------------------------------------------
  describe('3. Telemetry Beacon HTTP Route (/api/v1/telemetry/beacon)', () => {
    it('ingests application/json impression beacon', async () => {
      const req = new Request('http://localhost:3000/api/v1/telemetry/beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: occupiedSlotId,
          event: 'impression',
        }),
      });

      const res = await handleBeaconPost(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.event, 'impression');
      assert.ok(json.impressions_count > 0);
    });

    it('ingests text/plain click beacon from navigator.sendBeacon', async () => {
      const req = new Request('http://localhost:3000/api/v1/telemetry/beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          slot_id: occupiedSlotId,
          event: 'click',
        }),
      });

      const res = await handleBeaconPost(req);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.event, 'click');
      assert.ok(json.clicks_count > 0);
    });

    it('rejects invalid event name', async () => {
      const req = new Request('http://localhost:3000/api/v1/telemetry/beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: occupiedSlotId,
          event: 'illegal_event',
        }),
      });

      const res = await handleBeaconPost(req);
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.code, 'INVALID_EVENT');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Client Embed Script (public/embed.js) File & Contract Audit
  // --------------------------------------------------------------------------
  describe('4. Client Embed Script (public/embed.js) File & Contract Audit', () => {
    it('verifies public/embed.js exists and contains expected contracts', () => {
      const embedPath = path.resolve(process.cwd(), 'public/embed.js');
      assert.ok(fs.existsSync(embedPath), 'public/embed.js must exist');

      const content = fs.readFileSync(embedPath, 'utf8');
      assert.ok(content.includes('__SPONSORSLOT_LOADED__'), 'Must have double-load guard');
      assert.ok(content.includes('/api/v1/slot/'), 'Must fetch edge slot delivery endpoint');
      assert.ok(content.includes('/api/v1/telemetry/beacon'), 'Must reference telemetry beacon');
      assert.ok(content.includes('sendBeacon'), 'Must use navigator.sendBeacon when available');
      assert.ok(content.includes('sponsorslot-pill'), 'Must include header_pill CSS');
      assert.ok(content.includes('sponsorslot-card'), 'Must include empty_state card CSS');
      assert.ok(content.includes('sponsorslot-footer'), 'Must include footer_badge CSS');
    });
  });
});
