import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateEscrowSplit } from '../../src/lib/escrow.ts';

describe('Unit: Escrow Split Billing Engine (lib/escrow.ts)', () => {
  // Tier 1: Core Feature Verification
  describe('Tier 1: Standard Fee Allocation & Invariants', () => {
    it('calculates exact 15% platform fee and 85% creator payout for standard $250.00 (25,000 cents)', () => {
      const split = calculateEscrowSplit(25000);
      assert.equal(split.monthly_amount_cents, 25000);
      assert.equal(split.platform_fee_cents, 3750, 'Platform fee must be 3,750 cents ($37.50)');
      assert.equal(split.creator_payout_cents, 21250, 'Creator payout must be 21,250 cents ($212.50)');
      assert.equal(split.take_rate_percentage, 15);
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 25000);
    });

    it('calculates exact split for $100.00 (10,000 cents)', () => {
      const split = calculateEscrowSplit(10000);
      assert.equal(split.platform_fee_cents, 1500, 'Fee should be $15.00');
      assert.equal(split.creator_payout_cents, 8500, 'Payout should be $85.00');
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 10000);
    });

    it('calculates exact split for $500.00 (50,000 cents)', () => {
      const split = calculateEscrowSplit(50000);
      assert.equal(split.platform_fee_cents, 7500, 'Fee should be $75.00');
      assert.equal(split.creator_payout_cents, 42500, 'Payout should be $425.00');
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 50000);
    });

    it('calculates exact split for $75.00 (7,500 cents)', () => {
      const split = calculateEscrowSplit(7500);
      assert.equal(split.platform_fee_cents, 1125, 'Fee should be $11.25');
      assert.equal(split.creator_payout_cents, 6375, 'Payout should be $63.75');
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 7500);
    });

    it('returns take_rate_percentage constant of 15 across all calculations', () => {
      const split = calculateEscrowSplit(20000);
      assert.equal(split.take_rate_percentage, 15);
    });
  });

  // Tier 2: Boundary & Corner Cases
  describe('Tier 2: Boundaries, Odd Cents & Validation Guardrails', () => {
    it('accepts minimum boundary of $50.00 (5,000 cents)', () => {
      const split = calculateEscrowSplit(5000);
      assert.equal(split.monthly_amount_cents, 5000);
      assert.equal(split.platform_fee_cents, 750, '$7.50 platform fee');
      assert.equal(split.creator_payout_cents, 4250, '$42.50 creator payout');
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 5000);
    });

    it('accepts maximum boundary of $1,000.00 (100,000 cents)', () => {
      const split = calculateEscrowSplit(100000);
      assert.equal(split.monthly_amount_cents, 100000);
      assert.equal(split.platform_fee_cents, 15000, '$150.00 platform fee');
      assert.equal(split.creator_payout_cents, 85000, '$850.00 creator payout');
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 100000);
    });

    it('rejects rate strictly below minimum (4,999 cents)', () => {
      assert.throws(
        () => calculateEscrowSplit(4999),
        /Monthly rate must be between \$50\.00 and \$1,000\.00/
      );
    });

    it('rejects rate strictly above maximum (100,001 cents)', () => {
      assert.throws(
        () => calculateEscrowSplit(100001),
        /Monthly rate must be between \$50\.00 and \$1,000\.00/
      );
    });

    it('rejects negative rates and zero cents', () => {
      assert.throws(() => calculateEscrowSplit(0));
      assert.throws(() => calculateEscrowSplit(-5000));
    });

    it('rejects non-integer floating point cent amounts', () => {
      assert.throws(() => calculateEscrowSplit(5000.5), /integer cent amount/);
      assert.throws(() => calculateEscrowSplit(NaN), /integer cent amount/);
      // @ts-expect-error test non-number
      assert.throws(() => calculateEscrowSplit('5000'), /integer cent amount/);
    });

    it('rounds odd cents ($99.99 = 9,999 cents) without losing a single penny', () => {
      const split = calculateEscrowSplit(9999);
      // Math.round(9999 * 0.15) = Math.round(1499.85) = 1500
      assert.equal(split.platform_fee_cents, 1500);
      assert.equal(split.creator_payout_cents, 8499);
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 9999);
    });

    it('rounds odd cents ($79.99 = 7,999 cents) with perfect penny balance', () => {
      const split = calculateEscrowSplit(7999);
      // Math.round(7999 * 0.15) = Math.round(1199.85) = 1200
      assert.equal(split.platform_fee_cents, 1200);
      assert.equal(split.creator_payout_cents, 6799);
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 7999);
    });

    it('rounds odd cents ($149.95 = 14,995 cents) with perfect penny balance', () => {
      const split = calculateEscrowSplit(14995);
      // Math.round(14995 * 0.15) = Math.round(2249.25) = 2249
      assert.equal(split.platform_fee_cents, 2249);
      assert.equal(split.creator_payout_cents, 12746);
      assert.equal(split.platform_fee_cents + split.creator_payout_cents, 14995);
    });

    it('adversarially stress tests 5,000 consecutive cent rates for zero penny leakage', () => {
      for (let cents = 5000; cents <= 10000; cents++) {
        const split = calculateEscrowSplit(cents);
        assert.equal(
          split.platform_fee_cents + split.creator_payout_cents,
          cents,
          `Penny discrepancy detected at rate ${cents} cents`
        );
      }
    });
  });
});
