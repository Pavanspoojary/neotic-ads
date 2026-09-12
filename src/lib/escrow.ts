/**
 * Escrow Calculation Engine & Financial Invariants for SponsorSlot
 * File path: src/lib/escrow.ts
 */

import { EscrowSplit } from './types';

// ============================================================================
// Constants & Configuration
// ============================================================================

/** Minimum monthly rental rate: $50.00 (5,000 cents) */
export const MIN_MONTHLY_PRICE_CENTS = 5000;

/** Maximum monthly rental rate: $1,000.00 (100,000 cents) */
export const MAX_MONTHLY_PRICE_CENTS = 100000;

/** Platform take rate: exactly 15% */
export const PLATFORM_TAKE_RATE = 0.15;

/** Creator payout rate: exactly 85% */
export const CREATOR_PAYOUT_RATE = 0.85;

/** Single sponsorship term duration: exactly 30 days */
export const TERM_DURATION_DAYS = 30;

// ============================================================================
// Core Escrow Split Arithmetic
// ============================================================================

/**
 * Calculates the exact 15% platform take-rate and 85% creator payout allocation.
 *
 * Guaranteed Invariant:
 *   platform_fee_cents + creator_payout_cents === monthly_amount_cents
 *
 * Zero penny leakage is achieved by computing:
 *   platform_fee_cents = Math.round(monthly_amount_cents * 0.15)
 *   creator_payout_cents = monthly_amount_cents - platform_fee_cents
 *
 * @param amountCents Monthly amount in integer cents ($50.00 = 5000)
 * @throws Error if amount is outside the [$50.00, $1,000.00] range or not an integer
 */
export function calculateEscrowSplit(amountCents: number): EscrowSplit {
  if (typeof amountCents !== 'number' || isNaN(amountCents) || !Number.isInteger(amountCents)) {
    throw new Error('Monthly rate must be an integer cent amount');
  }

  if (amountCents < MIN_MONTHLY_PRICE_CENTS || amountCents > MAX_MONTHLY_PRICE_CENTS) {
    throw new Error(
      `Monthly rate must be between $50.00 and $1,000.00 (5,000 to 100,000 cents), received: ${amountCents}`
    );
  }

  const platform_fee_cents = Math.round(amountCents * PLATFORM_TAKE_RATE);
  const creator_payout_cents = amountCents - platform_fee_cents;

  // Runtime assertion guaranteeing zero penny leakage
  if (platform_fee_cents + creator_payout_cents !== amountCents) {
    throw new Error(
      `Escrow invariant violation: ${platform_fee_cents} + ${creator_payout_cents} !== ${amountCents}`
    );
  }

  return {
    monthly_amount_cents: amountCents,
    platform_fee_cents,
    creator_payout_cents,
    take_rate_percentage: 15,
  };
}

/**
 * Validates whether a given monthly price in cents satisfies system boundaries.
 */
export function validateRentalRate(amountCents: number): { valid: boolean; error?: string } {
  if (typeof amountCents !== 'number' || isNaN(amountCents)) {
    return { valid: false, error: 'Monthly rate must be a valid number' };
  }
  if (!Number.isInteger(amountCents)) {
    return { valid: false, error: 'Monthly rate must be an integer number of cents' };
  }
  if (amountCents < MIN_MONTHLY_PRICE_CENTS) {
    return {
      valid: false,
      error: `Monthly rate cannot be less than $50.00 (5,000 cents). Provided: ${formatCentsToUsd(amountCents)}`,
    };
  }
  if (amountCents > MAX_MONTHLY_PRICE_CENTS) {
    return {
      valid: false,
      error: `Monthly rate cannot exceed $1,000.00 (100,000 cents). Provided: ${formatCentsToUsd(amountCents)}`,
    };
  }
  return { valid: true };
}

// ============================================================================
// Date Arithmetic (30-Day Term)
// ============================================================================

/**
 * Computes ISO YYYY-MM-DD start and end dates for a 30-day sponsorship lease.
 * Does NOT rely on variable calendar month lengths (e.g. Feb vs Aug).
 *
 * @param startDateInput Optional start date (string 'YYYY-MM-DD' or Date object). Defaults to today.
 */
export function calculateTermDates(startDateInput?: string | Date): {
  startDate: string;
  endDate: string;
} {
  let start: Date;

  if (typeof startDateInput === 'string') {
    // Treat YYYY-MM-DD as UTC to avoid local timezone drift
    const parts = startDateInput.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      start = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    } else {
      start = new Date(startDateInput);
    }
  } else if (startDateInput instanceof Date) {
    start = new Date(Date.UTC(startDateInput.getFullYear(), startDateInput.getMonth(), startDateInput.getDate()));
  } else {
    const now = new Date();
    start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  // Exactly 30 days later
  const end = new Date(start.getTime() + TERM_DURATION_DAYS * 24 * 60 * 60 * 1000);

  const formatUtcDate = (d: Date): string => {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    startDate: formatUtcDate(start),
    endDate: formatUtcDate(end),
  };
}

/**
 * Calculates remaining days in a 30-day term relative to today.
 */
export function calculateDaysRemaining(endDateStr: string): number {
  const parts = endDateStr.split('-').map(Number);
  const end = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  const now = new Date();
  const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

  const diffMs = end.getTime() - today.getTime();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, days);
}

// ============================================================================
// Formatting and Analytics Helpers
// ============================================================================

/**
 * Formats an integer cent amount into standard USD currency string (e.g. 5000 -> "$50.00").
 */
export function formatCentsToUsd(amountCents: number): string {
  if (typeof amountCents !== 'number' || isNaN(amountCents)) {
    return '$0.00';
  }
  const dollars = amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/**
 * Parses a USD currency string into integer cents (e.g. "$50.00" -> 5000, "250" -> 25000).
 */
export function parseUsdToCents(usdString: string): number {
  if (!usdString) return 0;
  const cleaned = usdString.replace(/[^0-9.-]+/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Computes Click-Through Rate (CTR) percentage formatted to 2 decimal places.
 * Safely handles 0 impressions to prevent division-by-zero or NaN errors.
 */
export function calculateCtr(clicks: number, impressions: number): number {
  if (!impressions || impressions <= 0 || !clicks || clicks <= 0) {
    return 0.0;
  }
  const ctr = (clicks / impressions) * 100;
  return Math.round(ctr * 100) / 100;
}

/**
 * Computes Effective CPM (Cost Per Thousand Impressions) in USD dollars.
 */
export function calculateEffectiveCpm(monthlyAmountCents: number, impressions: number): number {
  if (!impressions || impressions <= 0 || !monthlyAmountCents || monthlyAmountCents <= 0) {
    return 0.0;
  }
  const totalDollars = monthlyAmountCents / 100;
  const cpm = (totalDollars / impressions) * 1000;
  return Math.round(cpm * 100) / 100;
}

/**
 * Computes Effective CPC (Cost Per Click) in USD dollars.
 */
export function calculateEffectiveCpc(monthlyAmountCents: number, clicks: number): number {
  if (!clicks || clicks <= 0 || !monthlyAmountCents || monthlyAmountCents <= 0) {
    return 0.0;
  }
  const totalDollars = monthlyAmountCents / 100;
  const cpc = totalDollars / clicks;
  return Math.round(cpc * 100) / 100;
}

// ============================================================================
// Creative Security & Asset Sanitization
// ============================================================================

/**
 * Enriches target URL with UTM parameters without dropping existing query parameters.
 * Enforces HTTPS destination protocol.
 */
export function enrichWithUtm(url: string, slotType: string, slug: string): string {
  if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
    throw new Error('Target destination URL must start with https://');
  }
  const parsed = new URL(url);
  parsed.searchParams.set('utm_source', 'sponsorslot');
  parsed.searchParams.set('utm_medium', slotType);
  parsed.searchParams.set('utm_campaign', slug);
  return parsed.toString();
}

/**
 * Sanitize SVG strings by stripping dangerous script tags and event handlers to prevent stored XSS.
 */
export function sanitizeSvg(svgContent: string): { isClean: boolean; sanitized: string } {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<foreignObject\b/gi,
  ];

  let isClean = true;
  for (const pattern of dangerousPatterns) {
    if (pattern.test(svgContent)) {
      isClean = false;
      break;
    }
  }

  let sanitized = svgContent;
  if (!isClean) {
    for (const pattern of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }
  }
  return { isClean, sanitized };
}

