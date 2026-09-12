# Escrow Billing & Split Calculation Engine

## 1. Overview & Purpose
The Escrow Billing Engine calculates exact financial allocations for 30-day recurring micro-sponsorships, enforcing platform take-rates, creator net payouts, and penny conservation invariants.

## 2. Invariants & Financial Bounds
- **Pricing Boundaries**: Flat-rate rentals must be between \$50.00 (5,000 cents) and \$1,000.00 (100,000 cents).
- **Platform Take-Rate**: Fixed at 15% (`take_rate_percentage: 15`).
- **Creator Payout**: Fixed at 85% net direct payout upon successful campaign completion.
- **Penny Conservation Invariant**:
  $$\text{platform\_fee\_cents} + \text{creator\_payout\_cents} = \text{monthly\_price\_cents}$$
  Zero penny leakage across all 95,001 integer cent increments.
- **Term Contract**: Fixed 30-day duration calculated via `addDays(startDate, 30)` regardless of month length.

## 3. Core Implementation
Source: [`src/lib/escrow.ts`](/src/lib/escrow.ts)

```typescript
export function calculateEscrowSplit(monthlyPriceCents: number): EscrowCalculation {
  if (monthlyPriceCents < 5000 || monthlyPriceCents > 100000) {
    throw new Error('Monthly rate must be between $50 and $1,000');
  }
  const platformFeeCents = Math.round(monthlyPriceCents * 0.15);
  const creatorPayoutCents = monthlyPriceCents - platformFeeCents;
  return { monthlyPriceCents, platformFeeCents, creatorPayoutCents, takeRatePercentage: 15 };
}
```

## 4. Verification & Testing
- Comprehensive stress test suite: `tests/unit/escrow.test.ts` (audits 5,000 consecutive rates and edge boundary values).
