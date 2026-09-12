# Neotic Ads — Design Taste, UI Craft & Anti-Vibe-Coding Playbook

## Executive Summary
This document codifies the design principles, visual grammar, and technical implementation standards for **Neotic Ads**. It serves as a binding specification to prevent "vibe-coded" AI aesthetics, ensuring the interface meets the standards of premier developer tools like **Linear, Stripe, Raycast, and Vercel**.

---

## 1. What Makes an Interface "Vibe-Coded" vs "Professional"

| Dimension | "Vibe-Coded" (Amateur / AI Default) | "Professional" (High-Trust / Linear-Grade) |
| :--- | :--- | :--- |
| **Typography** | Default tracking, loose kerning, standard font smoothing, default numerals | `-webkit-font-smoothing: antialiased`, tight negative letter spacing (`-0.03em`), tabular figures (`tabular-nums font-mono`) |
| **Borders** | Opaque gray (`#e4e4e7`, `border-zinc-200`, `border-zinc-700`) | Sub-pixel alpha hairlines (`border-black/[0.06]`, `border-white/[0.08]`) |
| **Shadows** | Heavy, blurry, high-opacity black drop shadows (`shadow-xl`) | Multi-layered ambient micro-shadows (`shadow-2xs`, diffused ambient ground) |
| **Colors** | Neon gradients, saturated rainbow badge pills, purple hero text | 95% monochromatic neutral canvas (`#fafafa` / `#09090b`), exactly 1 semantic status accent |
| **Icons & Emojis** | Raw emojis (🚀, ⚡, ✨, 🔥), generic `Sparkles` on non-AI features | Minimalist mono line icons (`Terminal`, `Layers`, `ShieldCheck`, `Cpu`, `SlidersHorizontal`) |
| **Information Density** | Low density: giant floaty cards with massive whitespace | High density: compact, purposeful, high data-to-pixel ratio |
| **Interactivity** | Fake buttons, broken triggers, dead-end states | Complete 5-state lifecycle: idle, hover, active (-0.5px translate), focus-visible, disabled |
| **Data Integrity** | Fake rounded stats (`"99.99%"`, `"10,000+ Users"`), stock photos | Cryptographic IDs, live pings, verifiable DAU sources, transparent escrow formulas |

---

## 2. The 8 Design Invariants of Neotic Ads

### Invariant 1: Hairline Borders Over Opaque Borders
- **Never** use `border-zinc-200`, `border-zinc-300`, or opaque border tokens for UI cards and rows.
- **Always** use:
  - Surface border: `border-black/[0.06]`
  - Hover border: `hover:border-black/[0.12]`
  - Active/Focus: `border-black/[0.20]`
  - Subtle divider: `border-black/[0.04]` or `divide-black/[0.04]`

### Invariant 2: Sub-Pixel Typography
- Headlines (`font-display font-semibold`) must always have negative tracking (`tracking-tight` or `tracking-[-0.03em]`).
- Uppercase metadata tags (`text-[10px]` or `text-[11px]`) must have positive tracking (`tracking-wider font-medium uppercase`).
- Currency, rates, timestamps, and counts must have `tabular-nums font-mono`.

### Invariant 3: Obsidian Primary Triggers
- Primary action buttons must use Solid Obsidian:
  ```tsx
  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-black active:scale-[0.98] text-white text-xs font-medium shadow-2xs transition-all cursor-pointer"
  ```
- Secondary action buttons must use Crisp Hairline White:
  ```tsx
  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 border border-black/[0.08] text-zinc-700 text-xs font-medium transition-colors shadow-2xs cursor-pointer"
  ```

### Invariant 4: Micro Pips for Status
- Status indicators must use micro pips (`w-1.5 h-1.5 rounded-full`) instead of heavy saturated blocks.
- Verified active state: `bg-emerald-500/[0.08] text-emerald-800 border border-emerald-500/20`.
- Occupied / Paused state: `bg-zinc-100 text-zinc-600 border border-black/[0.06]`.

### Invariant 5: No Generic "Sparkles"
- Avoid using `Sparkles` as a generic decorative element. Use icons that describe the actual system domain:
  - Inventory & Placements: `<Layers className="h-4 w-4 text-zinc-500" />`
  - Integration & SDKs: `<Code2 className="h-4 w-4 text-zinc-500" />` or `<Terminal />`
  - Escrow & Security: `<ShieldCheck className="h-4 w-4 text-emerald-600" />`
  - Telemetry & Speed: `<Zap className="h-3.5 w-3.5 text-emerald-600" />`
  - Settings & Filters: `<SlidersHorizontal className="h-3.5 w-3.5 text-zinc-500" />`

### Invariant 6: Real Mathematical Transparency
- Every escrow split must explicitly show the 15% platform take-rate and 85% creator payout calculation with the zero-penny-leakage guarantee.
- Financial figures must be calculated from database cents (`monthly_price_cents`) using `formatCentsToUsd`.

### Invariant 7: Mobile-First Responsive Containment
- All grid layouts must collapse to single-column on viewports `< 768px`.
- Navigation must collapse into a clean, minimal mobile drawer with hairline dividers.
- `overflow-x: clip` on `body` to prevent horizontal scrollbars on mobile browsers.

### Invariant 8: Zero-PII Telemetry Transparency
- UIs that display tracking metrics must explain the privacy model: zero IP addresses, zero third-party tracking cookies, purely atomic counter increments on edge pings.
