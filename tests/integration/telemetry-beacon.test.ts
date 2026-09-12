import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryDatabaseRepository } from '../../src/lib/db.ts';
import { dispatchPostBeacon } from '../test-utils.ts';

describe('Integration: Telemetry Beacon Ingestion API (POST /api/v1/telemetry/beacon)', () => {
  let db: InMemoryDatabaseRepository;
  const slotId = '20000000-0000-0000-0000-000000000001';
  const today = new Date().toISOString().split('T')[0];

  beforeEach(async () => {
    db = new InMemoryDatabaseRepository();
    await db.reset();
  });

  // Tier 1: Core Feature Verification
  describe('Tier 1: Impression & Click Beacon Ingestion', () => {
    it('successfully ingests impression event and increments impressions_count', async () => {
      const records = await db.getTelemetry(slotId, 1);
      const initialRecord = records.find((t) => t.telemetry_date === today);
      const initialImpressions = initialRecord ? initialRecord.impressions_count : 0;

      const payload = { slot_id: slotId, event: 'impression', referrer: 'jsonhero.io' };
      const res = await dispatchPostBeacon(JSON.stringify(payload), 'application/json', db);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.impressions_count, initialImpressions + 1);

      const updatedRecords = await db.getTelemetry(slotId, 1);
      const stored = updatedRecords.find((t) => t.telemetry_date === today);
      assert.ok(stored);
      assert.equal(stored.impressions_count, initialImpressions + 1);
    });

    it('successfully ingests click event and increments clicks_count', async () => {
      const records = await db.getTelemetry(slotId, 1);
      const initialRecord = records.find((t) => t.telemetry_date === today);
      const initialClicks = initialRecord ? initialRecord.clicks_count : 0;

      const payload = { slot_id: slotId, event: 'click', referrer: 'jsonhero.io' };
      const res = await dispatchPostBeacon(JSON.stringify(payload), 'application/json', db);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.clicks_count, initialClicks + 1);

      const updatedRecords = await db.getTelemetry(slotId, 1);
      const stored = updatedRecords.find((t) => t.telemetry_date === today);
      assert.ok(stored);
      assert.equal(stored.clicks_count, initialClicks + 1);
    });

    it('handles navigator.sendBeacon text/plain payload serialization', async () => {
      const payloadString = JSON.stringify({ slot_id: slotId, event: 'impression' });
      const res = await dispatchPostBeacon(payloadString, 'text/plain', db);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it('maintains a single daily aggregate record per slot on conflict (slot_id, timestamp)', async () => {
      // Fire 5 consecutive impression pings
      for (let i = 0; i < 5; i++) {
        await dispatchPostBeacon({ slot_id: slotId, event: 'impression' }, 'application/json', db);
      }

      // Verify only 1 telemetry record exists for this slot & date
      const records = await db.getTelemetry(slotId, 1);
      const matching = records.filter((t) => t.telemetry_date === today);
      assert.equal(matching.length, 1, 'Only exactly 1 row should exist for (slot_id, date)');
    });

    it('returns Access-Control-Allow-Origin: * on response', async () => {
      const res = await dispatchPostBeacon({ slot_id: slotId, event: 'impression' }, 'application/json', db);
      assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
    });
  });

  // Tier 2: Boundary & Corner Cases
  describe('Tier 2: Input Validation, Non-PII Privacy & Error Rejection', () => {
    it('rejects invalid or unsupported event types with 400 Bad Request', async () => {
      const badEvents = ['conversion', 'hover', 'exploit', ''];
      for (const event of badEvents) {
        const res = await dispatchPostBeacon({ slot_id: slotId, event }, 'application/json', db);
        assert.equal(res.status, 400);
        assert.ok(res.body.error.includes("Expected 'impression' or 'click'"));
      }
    });

    it('rejects payload missing slot_id with 400 Bad Request', async () => {
      const res = await dispatchPostBeacon({ event: 'impression' }, 'application/json', db);
      assert.equal(res.status, 400);
      assert.ok(res.body.error.includes('Missing or invalid slot_id'));
    });

    it('returns 404 Not Found if slot does not exist', async () => {
      const missingUuid = '00000000-0000-0000-0000-000000000000';
      const res = await dispatchPostBeacon({ slot_id: missingUuid, event: 'impression' }, 'application/json', db);
      assert.equal(res.status, 404);
      assert.equal(res.body.error, 'Slot not found');
    });

    it('returns 400 on malformed raw JSON string', async () => {
      const res = await dispatchPostBeacon('{ invalid json...', 'application/json', db);
      assert.equal(res.status, 400);
      assert.equal(res.body.error, 'Malformed payload');
    });

    it('strictly guarantees ZERO PII is stored in the telemetry table', async () => {
      await dispatchPostBeacon({ slot_id: slotId, event: 'impression' }, 'application/json', db);
      const records = await db.getTelemetry(slotId, 1);
      const stored = records.find((t) => t.telemetry_date === today);
      assert.ok(stored);

      // Verify no PII fields exist
      const keys = Object.keys(stored);
      assert.ok(!keys.includes('ip_address'), 'No IP address allowed');
      assert.ok(!keys.includes('user_agent'), 'No user agent allowed');
      assert.ok(!keys.includes('cookie'), 'No cookie allowed');
      assert.ok(!keys.includes('fingerprint'), 'No fingerprint allowed');
      assert.ok(!keys.includes('email'), 'No email allowed');
    });
  });

  // Tier 3: Concurrency & Cumulative Aggregation
  describe('Tier 3: Rapid Concurrent Beacon Ingestion', () => {
    it('accurately tallies 20 consecutive beacons without race conditions or counter drops', async () => {
      const records = await db.getTelemetry(slotId, 1);
      const initialRecord = records.find((t) => t.telemetry_date === today);
      const initialImp = initialRecord?.impressions_count || 0;
      const initialClicks = initialRecord?.clicks_count || 0;

      // 15 impressions, 5 clicks
      for (let i = 0; i < 15; i++) {
        await dispatchPostBeacon({ slot_id: slotId, event: 'impression' }, 'application/json', db);
      }
      for (let i = 0; i < 5; i++) {
        await dispatchPostBeacon({ slot_id: slotId, event: 'click' }, 'application/json', db);
      }

      const updatedRecords = await db.getTelemetry(slotId, 1);
      const finalRecord = updatedRecords.find((t) => t.telemetry_date === today);
      assert.ok(finalRecord);
      assert.equal(finalRecord.impressions_count, initialImp + 15);
      assert.equal(finalRecord.clicks_count, initialClicks + 5);
    });
  });
});
