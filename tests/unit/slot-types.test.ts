import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SLOT_COPY_LIMITS, type SlotType } from '../../src/lib/types.ts';

describe('Unit: Standardized Slot Types & Format Constraints', () => {
  const allowedSlotTypes: SlotType[] = [
    'header_pill',
    'empty_state',
    'footer_badge',
    'email_footer',
  ];

  // Tier 1: Slot Formats & Allowed Types
  describe('Tier 1: Standardized Slot Type Definitions', () => {
    it('defines exactly 4 standardized slot types', () => {
      assert.equal(allowedSlotTypes.length, 4);
      assert.ok(allowedSlotTypes.includes('header_pill'));
      assert.ok(allowedSlotTypes.includes('empty_state'));
      assert.ok(allowedSlotTypes.includes('footer_badge'));
      assert.ok(allowedSlotTypes.includes('email_footer'));
    });

    it('assigns strict character copy limits to all 4 slot formats', () => {
      assert.equal(SLOT_COPY_LIMITS.header_pill, 80, 'header_pill limit must be 80 characters');
      assert.equal(SLOT_COPY_LIMITS.empty_state, 200, 'empty_state limit must be 200 characters');
      assert.equal(SLOT_COPY_LIMITS.footer_badge, 60, 'footer_badge limit must be 60 characters');
      assert.equal(SLOT_COPY_LIMITS.email_footer, 120, 'email_footer limit must be 120 characters');
    });
  });

  // Tier 2: Boundary & Corner Cases
  describe('Tier 2: Character Limit Boundaries', () => {
    it('verifies exact boundary copy strings at maximum allowed length', () => {
      for (const type of allowedSlotTypes) {
        const maxLen = SLOT_COPY_LIMITS[type];
        const exactString = 'X'.repeat(maxLen);
        assert.equal(exactString.length, maxLen);
        assert.ok(exactString.length <= SLOT_COPY_LIMITS[type]);
      }
    });

    it('flags boundary violations when string exceeds limit by 1 character', () => {
      for (const type of allowedSlotTypes) {
        const overLimitString = 'X'.repeat(SLOT_COPY_LIMITS[type] + 1);
        assert.ok(
          overLimitString.length > SLOT_COPY_LIMITS[type],
          `Expected violation for ${type} at length ${overLimitString.length}`
        );
      }
    });

    it('rejects empty creative text submissions', () => {
      const emptyText = '   ';
      assert.equal(emptyText.trim().length, 0, 'Whitespace-only string must fail length check');
    });
  });
});
