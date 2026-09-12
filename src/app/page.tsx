import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Layers,
  Chrome,
  Terminal,
  Cpu,
  Star,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { getDb } from '../lib/db';
import { MarketplaceGrid } from '../components/MarketplaceGrid';
import { Navbar } from '../components/Navbar';

export const revalidate = 60; // ISR cache revalidation every 60 seconds

export default async function HomePage() {
  const db = getDb();

  // Fetch verified active listings and slots concurrently on the server
  const [initialListings, allSlots] = await Promise.all([
    db.getListings({ status: 'active', sort: 'dau_desc' }),
    db.getAllSlots(),
  ]);

  // Aggregate high-level platform stats
  const totalDau = initialListings.reduce((sum, l) => sum + (l.verified_dau || 0), 0);
  const vacantSlotsCount = allSlots.filter((s) => s.is_available).length;

  return (
    <div className="min-h-screen bg-[#130f18] text-[#8b94a3] flex flex-col selection:bg-[#73e5bf] selection:text-[#130f18]">
      {/* Jam Sticky Navigation */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {/* HERO SECTION — Jam Full-Viewport Architecture */}
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
          {/* Subtle plum glow background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[450px] bg-[radial-gradient(ellipse_at_top,_rgba(163,122,245,0.12),transparent_70%)] pointer-events-none -z-10" />
          <div className="absolute inset-0 bg-grid-plum opacity-30 pointer-events-none -z-10" />

          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            {/* Top Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#21192a] border border-[#e5e7eb]/15 text-xs text-[#8b94a3] mb-8 hover:border-[#73e5bf]/30 transition-all">
              <span className="text-[#73e5bf] font-semibold">⚡ Neotic Ads</span>
              <span className="text-[#e5e7eb]/40">•</span>
              <span>Sub-50ms in-app micro-sponsorships</span>
              <ArrowRight className="h-3 w-3 text-[#73e5bf]" />
            </div>

            {/* Massive Geometric Grotesk Display Headline */}
            <h1 className="font-display font-black text-5xl sm:text-7xl lg:text-[88px] tracking-tight text-white max-w-5xl mx-auto leading-[1.05]">
              Sponsor developer tools you{' '}
              <span className="bg-gradient-to-r from-[#73e5bf] via-[#c5ffe7] to-[#a37af5] bg-clip-text text-transparent">
                love
              </span>
            </h1>

            {/* Subtitle in Mist Gray */}
            <p className="mt-6 text-base sm:text-xl text-[#8b94a3] max-w-2xl mx-auto leading-relaxed font-normal">
              Flat-rate native placements inside 500–25k DAU utilities and Chrome extensions.
              Zero intrusive ad networks, 30-day terms, and 85% creator payout.
            </p>

            {/* Hero Primary CTA (Signal Mint with 3-layer LED glow) */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="#marketplace"
                className="inline-flex items-center justify-center gap-2 rounded-btn bg-[#73e5bf] hover:bg-[#86efac] text-[#130f18] px-6 py-3 text-base font-bold transition-all active:scale-[0.98] shadow-[rgba(19,15,24,0.1)_0px_0px_0px_2px,_rgba(115,229,191,0.25)_0px_20px_25px_-5px,_rgba(115,229,191,0.25)_0px_8px_10px_-6px]"
              >
                <span>Explore Available Slots</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" />
              </a>

              <Link
                href="/creator"
                className="inline-flex items-center justify-center gap-2 rounded-btn bg-[#21192a] hover:bg-[#2e2d36] text-white px-6 py-3 text-sm font-semibold border border-[#e5e7eb]/20 transition-all active:scale-[0.98]"
              >
                <span>Monetize Your Tool</span>
              </Link>
            </div>

            {/* Trust Badge Row under CTA */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#8b94a3]">
              <div className="flex items-center text-[#73e5bf]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-[#73e5bf] text-[#73e5bf]" />
                ))}
              </div>
              <span className="text-[#e5e7eb]/40">•</span>
              <span>1.4M+ monthly impressions verified via Chrome Web Store & GA4</span>
            </div>

            {/* FLOATING PRODUCT SCREENSHOT CARD (The only true white surface in Jam design) */}
            <div className="mt-14 max-w-4xl mx-auto rounded-card bg-[#ffffff] p-6 sm:p-8 text-slate-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),_0_0_0_1px_rgba(255,255,255,0.15)] text-left relative overflow-hidden group">
              {/* Window Controls Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                  <span className="ml-3 text-xs font-mono font-medium text-slate-500">
                    TabMaster Pro · v2.4.1 (18,900 DAU)
                  </span>
                </div>
                {/* Product Status Toggle */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Sponsor Active</span>
                </div>
              </div>

              {/* Window Content Simulation */}
              <div className="py-6 space-y-4">
                {/* Native In-App Header Bar Pill format */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#73e5bf] text-[#130f18] uppercase tracking-wider">
                      SPONSORED
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      Supabase — The Open Source Firebase Alternative for Postgres
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                    <span>Try Free</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Micro-Tool Simulated Canvas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Tab Groups</div>
                    <div className="text-xl font-extrabold text-slate-900 mt-1">14 Workspaces</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Memory Saved</div>
                    <div className="text-xl font-extrabold text-emerald-600 mt-1">1.84 GB</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200">
                    <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">Monthly Lease</div>
                    <div className="text-xl font-extrabold text-indigo-600 mt-1">$450 / mo</div>
                  </div>
                </div>
              </div>
            </div>

            {/* FEATURE PILL ROW — Jam Spec (5 horizontal pills with Electric Violet icons) */}
            <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#21192a] border border-[#e5e7eb]/15 text-sm font-medium text-white shadow-sm">
                <Chrome className="h-4 w-4 text-[#a37af5] stroke-[1.5]" />
                <span>Chrome Extensions</span>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#21192a] border border-[#e5e7eb]/15 text-sm font-medium text-white shadow-sm">
                <Terminal className="h-4 w-4 text-[#a37af5] stroke-[1.5]" />
                <span>DevTools & WebApps</span>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#21192a] border border-[#e5e7eb]/15 text-sm font-medium text-white shadow-sm">
                <Lock className="h-4 w-4 text-[#a37af5] stroke-[1.5]" />
                <span>30-Day Escrow</span>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#21192a] border border-[#e5e7eb]/15 text-sm font-medium text-white shadow-sm">
                <Cpu className="h-4 w-4 text-[#a37af5] stroke-[1.5]" />
                <span>Sub-50ms Edge API</span>
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#21192a] border border-[#e5e7eb]/15 text-sm font-medium text-white shadow-sm">
                <Shield className="h-4 w-4 text-[#a37af5] stroke-[1.5]" />
                <span>Zero-PII Telemetry</span>
              </div>
            </div>

            {/* COMPANY LOGO BAR — Grayscale Wordmarks */}
            <div className="mt-16 pt-10 border-t border-[#e5e7eb]/10 text-center">
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#8b94a3] mb-6">
                Native placements trusted across developer ecosystems
              </div>
              <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60">
                <span className="font-display font-black text-lg tracking-wider text-[#e5e7eb]">GITHUB</span>
                <span className="font-display font-black text-lg tracking-wider text-[#e5e7eb]">VERCEL</span>
                <span className="font-display font-black text-lg tracking-wider text-[#e5e7eb]">SUPABASE</span>
                <span className="font-display font-black text-lg tracking-wider text-[#e5e7eb]">RAYCAST</span>
                <span className="font-display font-black text-lg tracking-wider text-[#e5e7eb]">POSTHOG</span>
                <span className="font-display font-black text-lg tracking-wider text-[#e5e7eb]">LINEAR</span>
              </div>
            </div>
          </div>
        </section>

        {/* MARKETPLACE DIRECTORY SECTION */}
        <section id="marketplace" className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 border-t border-[#e5e7eb]/10">
          <MarketplaceGrid initialListings={initialListings} initialSlots={allSlots} />
        </section>

        {/* BENTO ARCHITECTURE SECTION (Graphite Plum #21192a cards) */}
        <section className="border-t border-[#e5e7eb]/10 bg-[#130f18] py-20">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#21192a] border border-[#e5e7eb]/15 text-[#a37af5] mb-3">
                <Zap className="h-3.5 w-3.5 text-[#a37af5]" />
                <span>Production Infrastructure</span>
              </div>
              <h2 className="font-display font-black text-3xl sm:text-4xl text-white tracking-tight">
                Engineered for High-Trust Placements
              </h2>
              <p className="mt-3 text-[#8b94a3] text-sm sm:text-base leading-relaxed">
                Direct sponsorship contracts, verified telemetry beacons, and instant client embeds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="rounded-card border border-[#e5e7eb]/15 p-8 bg-[#21192a] hover:border-[#73e5bf]/30 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#73e5bf]/10 text-[#73e5bf] border border-[#73e5bf]/20 mb-5">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">Verified Publisher Traffic</h3>
                <p className="text-sm text-[#8b94a3] leading-relaxed">
                  Every listed application undergoes cryptographic domain verification or direct telemetry sync with the Chrome Web Store, Plausible, or GA4.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-card border border-[#e5e7eb]/15 p-8 bg-[#21192a] hover:border-[#a37af5]/30 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#a37af5]/10 text-[#a37af5] border border-[#a37af5]/20 mb-5">
                  <Cpu className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">Sub-50ms Edge Delivery</h3>
                <p className="text-sm text-[#8b94a3] leading-relaxed">
                  Headless JSON API for modern micro-SaaS and Manifest V3 extensions, accompanied by a zero-dependency Shadow DOM client SDK.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-card border border-[#e5e7eb]/15 p-8 bg-[#21192a] hover:border-[#ff4070]/30 transition-all">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff4070]/10 text-[#ff4070] border border-[#ff4070]/20 mb-5">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="font-display font-bold text-lg text-white mb-2">30-Day Escrow Split</h3>
                <p className="text-sm text-[#8b94a3] leading-relaxed">
                  Flat-rate 30-day lease terms with exact integer-cent escrow allocations: 85% creator payout and 15% platform take-rate with zero penny leakage.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Jam Footer */}
      <footer className="border-t border-[#e5e7eb]/10 bg-[#130f18] text-[#8b94a3] py-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-lg text-[#ff4070]">NEOTIC ADS</span>
            <span className="text-xs text-[#8b94a3] font-mono">
              © {new Date().getFullYear()} Neotic Ads. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#8b94a3]">
            <Link href="/" className="hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/creator" className="hover:text-white transition-colors">
              Creator Portal
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Edge Simulator
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
