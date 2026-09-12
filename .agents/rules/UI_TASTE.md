# Engineering Standard: UI Taste, Craft & Anti-Vibe-Coding Rules

> **Core Axiom:** "Every pixel is either an asset that builds trust or a defect that signals amateur generation."
> High-value users, developers, and B2B buyers form impressions within 50 milliseconds. Generic AI-default styling signals that a product is a throwaway prototype or scam. High-craft styling signals operational rigor, reliability, and institutional permanence.

---

## Part I. The Anatomical Diagnosis of "AI Default / Vibe-Coded" Frontend

### 1. The Telltale Hallmarks of AI-Generated UI
When an LLM generates a user interface without taste constraints, it consistently repeats the same predictable tropes:

1. **The "SaaS Template" Hero Cliché**:
   - An oversized, centered headline with an obnoxious purple-to-indigo or cyan-to-fuchsia gradient (`bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent`).
   - Floating glowing colored blur circles behind text (`blur-3xl bg-purple-500/20`).
   - Generic AI marketing buzzwords: *"Supercharge your workflow"*, *"Unleash next-gen intelligence"*, *"Seamlessly elevate your team"*.
2. **Emoji Vomit**:
   - Emojis pasted into headings, badges, and button labels (🚀 *Launch Now*, ⚡ *Supercharged*, ✨ *AI Powered*, 🔥 *Trending*, 💎 *Pro*).
   - Indiscriminate use of the Lucide `Sparkles` icon on features that have nothing to do with generative AI.
3. **Cartoonish Proportions & Blob Geometry**:
   - Massive border-radii (`rounded-3xl` or `rounded-2xl`) applied indiscriminately to tiny buttons, badge pills, and compact table cells.
   - Low information density: huge amounts of empty white space where a user has to scroll 5 screens to see 3 lines of actual data.
4. **Harsh, Opaque Borders & Clunky Drop Shadows**:
   - Hard, uncalibrated border colors (`border-zinc-200`, `border-gray-300`, or `border-zinc-700`) that look like raw wireframes.
   - Blurry, heavy drop shadows (`shadow-xl` or `shadow-2xl`) with opaque black offsets instead of delicate multi-layered ambient diffusion (`shadow-2xs`).
5. **The Generic 3-Card "Feature Grid"**:
   - Exactly three identical cards side-by-side, each with a colorful rounded circle, a generic icon, a 2-word title, and 2 sentences of lorem-style text.
6. **Fake "Vibe-Coded" Stubs & Broken Interactivity**:
   - Buttons with hover states that do nothing when clicked or trigger `alert("Coming soon!")`.
   - Hardcoded, un-backed mock data (`"99.9% Uptime"`, `"10k+ Happy Customers"` with fake Unsplash avatars).
   - Dead-end empty states with generic illustration vectors instead of actionable workflows.
7. **Neglected Typography & Layout Physics**:
   - Default browser tracking (`tracking-normal`) on huge bold headings, causing loose, amateur word spacing.
   - Failure to set tabular numerals (`tabular-nums font-mono`) on metrics, financials, and timestamps, resulting in jittery layout shifts.
   - Failure to configure sub-pixel font smoothing (`-webkit-font-smoothing: antialiased`).

---

## Part II. The 8 Pillars of High-Craft, High-Trust Engineering

Benchmarked against world-class developer interfaces: **Linear, Stripe, Apple, Raycast, Vercel, Supabase**.

### 1. Information Density & Purposeful Architecture
- **Compact & High-Leverage**: Prefer structured lists, detail drawers, and dense data feeds over giant spaced-out marketing blocks.
- **Vertical Efficiency**: Every viewport fold should present actionable, high-signal information.
- **Data-to-Ink Ratio**: Eliminate decorative fluff that doesn't inform the user.

### 2. Sub-Pixel Hairline Alpha Borders
- Never use opaque gray borders like `border-zinc-200` or `border-gray-300`.
- Use translucent alpha borders that blend seamlessly into any ambient surface:
  - Light theme: `border-black/[0.06]`, hover: `hover:border-black/[0.12]`, active: `border-black/[0.20]`
  - Dark theme: `border-white/[0.08]`, hover: `hover:border-white/[0.15]`, active: `border-white/[0.25]`
  - Sub-dividers: `border-black/[0.04]` or `divide-black/[0.04]`

### 3. Micro-Typography as the Primary Visual Hierarchy
- **Tight Negative Kerning on Headlines**:
  - `text-3xl` and above: `tracking-[-0.035em]` or `tracking-tight`
  - `text-xl` to `text-2xl`: `tracking-[-0.02em]`
  - Body copy (`text-sm`): `tracking-[-0.01em]`
- **Wide Positive Kerning on Micro-Labels**:
  - `text-[10px]` or `text-[11px]` uppercase labels: `tracking-wider` or `tracking-widest font-semibold uppercase`
- **Tabular Figures for All Quantities**:
  - Always apply `tabular-nums` (and `font-mono` when appropriate) to currency amounts, counts, percentages, IDs, and dates to ensure visual column alignment.
- **Systematic Font Smoothing**:
  - Mandatory in global CSS:
    ```css
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    ```

### 4. Monochromatic Discipline & Semantic Accent Restraint
- 95% of the interface must live on a neutral grayscale canvas:
  - Light: Canvas `#fafafa`, cards `#ffffff`, text `#09090b` (zinc-950), secondary text `#71717a` (zinc-500).
- Exactly ONE functional accent color:
  - In Neotic Ads: Emerald (`#10b981`) reserved strictly for verified status, live edge delivery, active inventory, and financial earnings.
  - Action buttons: Solid Obsidian (`bg-zinc-950 hover:bg-black text-white shadow-2xs`).
- **No Rainbow Pills**: Never have 6 different badge colors (pink, purple, cyan, yellow, orange) competing on one screen.

### 5. Multi-Layer Ambient Depth (Never Heavy Shadows)
- Replace generic `shadow-md` / `shadow-lg` with delicate micro-shadows:
  - `shadow-2xs`: `0 1px 2px rgba(0, 0, 0, 0.03)`
  - Card elevation: `shadow-[0_1px_2px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)]`
  - Dropdown elevation: `shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]`

### 6. Tactile State Completeness
Every interactive element MUST have 5 complete states defined:
1. **Idle**: Clean, restful, non-distracting.
2. **Hover**: Crisp hairline darkening (`hover:border-black/[0.12]`), subtle background lift (`hover:bg-zinc-50`).
3. **Active**: Micro-press tactile feedback (`active:scale-[0.98]` or `active:translate-y-[0.5px]`).
4. **Focus-Visible**: Accessible, distinct focus ring (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1`).
5. **Disabled**: Clear reduced opacity and forbidden cursor (`disabled:opacity-40 disabled:cursor-not-allowed`).
- **Explicit Pointer**: Always add `cursor-pointer` to clickable controls.

### 7. Deterministic Trust Signals
- Real, verifiable identifiers (e.g. `slot_id.slice(0, 8)`, commit hashes, SHA-256 signatures).
- Direct external links with verified icons (`ExternalLink className="h-3 w-3 text-zinc-400"`).
- Exact mathematical formulas surfaced directly in the UI (e.g. `85% Creator Payout • 15% Platform Escrow Fee` with zero-penny rounding validation).
- Live latency measurements (e.g. `<Zap /> 24ms`) rather than static fake uptime claims.

### 8. Viewport & Mobile Edge Stability
- Zero horizontal overflow: `body { overflow-x: clip; }`.
- Multi-column grids must gracefully collapse to single-column on mobile viewports (< 768px).
- Dynamic viewport height: use `min-h-[100dvh]` instead of `h-screen` to prevent mobile address bar jumping.
- Minimum tap targets: all interactive triggers must be at least `36px` to `44px` in tap height.

---

## Part III. Anti-Vibe-Coding Banned Patterns

| ❌ Banned Pattern | Why It Fails | ✅ Premium / High-Trust Replacement |
| :--- | :--- | :--- |
| **Emojis in UI** (`🚀 Launch`, `✨ AI`) | Looks like a student hackathon project; destroys B2B credibility. | Clean Lucide line icons (`Terminal`, `Layers`, `ShieldCheck`, `Cpu`, `SlidersHorizontal`). |
| **Oversaturated Gradients** (`from-purple-500 to-pink-500`) | Instant tell of generic AI prompt generator. | Monochromatic typography (`text-zinc-950`) with tight tracking. |
| **Generic `Sparkles` on Non-AI** | Overused cliché; signals lack of domain-specific vocabulary. | Domain-accurate icons: `SlidersHorizontal` for filters, `Layers` for inventory, `Terminal` for SDKs. |
| **Harsh Gray Borders** (`border-zinc-200`) | Makes layout feel boxed-in and heavy. | Hairline alpha borders (`border-black/[0.06]`, `hover:border-black/[0.12]`). |
| **Exaggerated `rounded-3xl` everywhere** | Feels like a children's toy or mobile game. | Clean architectural curvature (`rounded-lg` 8px for controls, `rounded-xl` 12px for cards). |
| **Fake or Unconnected Buttons** | Users lose trust immediately when clicks don't work. | Real API handlers, clipboard copy routines, modal drawers, or direct URL links. |
| **Vague Marketing Jargon** (*"Next-Gen Synergy"*) | Empty words that tell the user nothing about what the app does. | Specific technical specs: *"Flat-rate 30-day recurring micro-sponsorships with sub-50ms edge delivery"*. |
| **Loose Default Kerning** (`tracking-normal` on display) | Looks unstyled and floaty. | Negative tracking (`tracking-tight` / `tracking-[-0.03em]`). |

---

## Part IV. Component Transformation Reference

### A. Primary Action Button
```tsx
// ❌ VIBE-CODED / AI DEFAULT:
<button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-purple-500/50 transition-all flex items-center gap-2">
  🚀 Launch Your Campaign Now!
</button>

// ✅ HIGH-CRAFT / PREMIUM:
<button
  type="submit"
  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-black active:scale-[0.98] text-white text-xs font-medium shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
>
  <Lock className="h-3.5 w-3.5 text-zinc-400" />
  <span>Confirm 30-Day Sponsorship</span>
</button>
```

### B. Status / Verification Badge
```tsx
// ❌ VIBE-CODED / AI DEFAULT:
<div className="bg-emerald-500 text-white font-bold text-sm px-4 py-2 rounded-3xl shadow-md flex items-center gap-2">
  🔥 100% VERIFIED TRAFFIC 🔥
</div>

// ✅ HIGH-CRAFT / PREMIUM:
<div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/[0.08] text-emerald-800 border border-emerald-500/20 shadow-2xs">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
  <span>14,200 Verified DAU</span>
  <span className="text-emerald-600/70 font-mono text-[10px]">• Chrome Store</span>
</div>
```

### C. Data Metric Card
```tsx
// ❌ VIBE-CODED / AI DEFAULT:
<div className="p-8 bg-purple-50 rounded-3xl border-2 border-purple-200 text-center shadow-xl">
  <div className="text-5xl font-extrabold text-purple-900 mb-2">⚡ 12.4M+</div>
  <div className="text-purple-600 font-medium">Incredible Impressions Served</div>
</div>

// ✅ HIGH-CRAFT / PREMIUM:
<div className="bg-white rounded-xl border border-black/[0.06] hover:border-black/[0.12] p-5 shadow-2xs transition-all">
  <div className="flex items-center justify-between text-zinc-500 mb-2.5">
    <span className="text-[10px] font-medium uppercase tracking-wider">30-Day Impressions</span>
    <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-600 border border-black/[0.06]">
      <Eye className="h-3.5 w-3.5" />
    </div>
  </div>
  <div className="text-2xl sm:text-3xl font-display font-semibold text-zinc-950 tabular-nums tracking-tight">
    12,418,290
  </div>
  <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
    <span className="text-emerald-700 font-medium">+14.2%</span>
    <span>vs previous 30-day term</span>
  </div>
</div>
```
