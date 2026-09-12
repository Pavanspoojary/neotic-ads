---
name: sponsorslot-integration
description: Guidelines, architectures, and verification rules for integrating SponsorSlot in-app native micro-sponsorship inventory, edge delivery APIs, and telemetry beacons into developer tools and Chrome extensions.
---

# SponsorSlot In-App Placement & Telemetry Engineering

This skill provides standard operating procedures, architectural invariants, and code templates for integrating SponsorSlot non-intrusive ad inventory and verified telemetry.

## 1. Inventory Types & Constraints

All inventory must adhere strictly to the 4 non-intrusive formats:
1. **Header Pill (`header_pill`)**:
   - Limit: Max 80 characters.
   - Recommended for: Navigation bars, devtool title bars, extension popups.
2. **Empty State (`empty_state`)**:
   - Limit: Max 200 characters.
   - Recommended for: 0-state query results, empty canvas, clean dashboard states.
3. **Footer Badge (`footer_badge`)**:
   - Limit: Max 60 characters.
   - Recommended for: Partner attribution, documentation footers, settings drawers.
4. **Email Footer (`email_footer`)**:
   - Limit: Max 120 characters.
   - Recommended for: Weekly digests, exported PDF/CSV reports, automated alert notices.

## 2. Integration Seams

### Option A: Headless Edge JSON API (Chrome Extensions & Micro-SaaS)
Manifest V3 compliant (zero dynamic script execution, pure declarative data):
```typescript
const res = await fetch('https://edge.sponsorslot.com/api/v1/slot/{SLOT_UUID}');
const slotData = await res.json();

if (slotData.active) {
  // Render native UI with slotData.creative.text & slotData.creative.target_url
}
```

### Option B: Zero-Code Embed Script (`embed.js`)
Drop into standard web utilities:
```html
<script 
  src="https://cdn.sponsorslot.com/embed.js" 
  data-slot="20000000-0000-0000-0000-000000000001" 
  data-theme="light" 
  async>
</script>
```

### Option C: Anonymous Non-PII Telemetry Pingback
Trigger impression and click beacons via `navigator.sendBeacon`:
```typescript
navigator.sendBeacon(
  '/api/v1/telemetry/beacon',
  JSON.stringify({ slot_id: slotId, event: 'impression' })
);
```

## 3. Financial & Escrow Invariants
- Rental pricing: $50.00 to $1,000.00 monthly flat rate.
- Platform take-rate: 15% platform escrow & uptime protection fee.
- Creator allocation: 85% net direct payout released upon 30-day term fulfillment.
- Strict penny rounding: `platform_fee + creator_payout === monthly_amount` across all cent amounts.
