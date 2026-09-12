# Client Embed SDK (embed.js) & Telemetry Protocol

## 1. Overview & Purpose
`embed.js` is a lightweight, zero-dependency client SDK that tool creators drop into web apps to render responsive in-app placements without CSS contamination or external library dependencies.

## 2. Invariants & Implementation
- **Source File**: [`public/embed.js`](/public/embed.js)
- **Zero Dependencies**: Pure vanilla JavaScript (no npm dependencies, no jQuery, no React runtime needed in host).
- **Scoped Shadow / CSS**: All styling is scoped to `.sponsorslot-widget` avoiding collision with host application styles.
- **Viewability Detection**: Uses native `IntersectionObserver` to trigger impression beacons only when the widget is at least 50% visible in the viewport for 1+ seconds.
- **Non-PII Privacy**: The telemetry beacon records strictly `slot_id` and `event` (`impression` | `click`), storing zero cookies, IP addresses, or user identifiers.

## 3. Usage Snippet
```html
<!-- Container element -->
<div data-sponsorslot="20000000-0000-0000-0000-000000000001" data-theme="dark"></div>

<!-- Embed Script -->
<script src="https://neotic-ads.vercel.app/embed.js" async></script>
```

## 4. Verification & Testing
- Integration test suite: `tests/integration/routes.test.ts`
- Live curl check:
```bash
curl -s https://neotic-ads.vercel.app/embed.js
```
