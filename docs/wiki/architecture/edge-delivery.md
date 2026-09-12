# Edge Delivery Engine & Manifest V3 Integration

## 1. Overview & Purpose
The Edge Delivery Engine serves low-latency, declarative JSON payloads representing active sponsored creatives or viral self-serve referral fallbacks to client applications, Chrome extensions, and web utilities.

## 2. Invariants & Public Seams
- **Public Endpoint**: `GET /api/v1/slot/[id]` ([route.ts](/src/app/api/v1/slot/[id]/route.ts))
- **Latency Profile**: Target sub-50ms response profile across global edge regions.
- **Edge Caching**: `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`.
- **CORS Contract**: `Access-Control-Allow-Origin: *` allowing seamless cross-origin integration.
- **Manifest V3 Guarantee**: Pure declarative JSON payload containing zero executable remote code strings (`eval`, unpinned scripts).

## 3. Response Schema
```json
{
  "active": true,
  "status": "sponsored",
  "fallback": false,
  "slot": {
    "id": "20000000-0000-0000-0000-000000000001",
    "name": "Dashboard Header Bar Pill",
    "type": "header_pill",
    "listing_title": "JSONHero Visualizer",
    "listing_slug": "jsonhero-visualizer"
  },
  "creative": {
    "text": "Real-time Next.js application logs & exception tracing with LogFast",
    "target_url": "https://logfast.io?utm_source=sponsorslot",
    "image_url": "https://cdn.sponsorslot.com/creatives/logfast-logo.svg",
    "badge_svg": null,
    "disclaimer_text": "Sponsored"
  },
  "beacon": {
    "endpoint": "/api/v1/telemetry/beacon",
    "slot_id": "20000000-0000-0000-0000-000000000001"
  }
}
```

## 4. Verification & Testing
- Unit & integration tests: `tests/integration/edge_delivery.test.ts`
- Live curl test:
```bash
curl -s https://neotic-ads.vercel.app/api/v1/slot/20000000-0000-0000-0000-000000000001
```
