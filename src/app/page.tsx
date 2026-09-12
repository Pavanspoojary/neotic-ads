import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, Zap, ArrowRight, Layers, Terminal } from 'lucide-react';
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
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Global Navigation */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/[0.08] pt-20 pb-16 sm:pt-24 sm:pb-20">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.18),transparent_70%)] pointer-events-none -z-10" />
          <div className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none -z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
            {/* Header Tag Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-8 shadow-inner-border">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>Programmatic Flat-Rate Micro-Sponsorship Registry</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
              Sponsor High-Intent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-purple-400">
                Developer Tools & Extensions
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed font-normal">
              Direct flat-rate native placements inside 500–25k DAU utilities and Chrome extensions.
              Zero ad networks, fixed 30-day terms, and 85% creator payout.
            </p>

            {/* Hero Quick Actions */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <a
                href="#marketplace"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-glow-indigo border border-indigo-400/30 transition-all active:scale-[0.98]"
              >
                <span>Browse Marketplace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <Link
                href="/creator"
                className="inline-flex items-center gap-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] px-5 py-2.5 text-xs font-semibold text-zinc-200 border border-white/[0.1] shadow-inner-border transition-all active:scale-[0.98]"
              >
                <span>Monetize Your Tool</span>
              </Link>
            </div>

            {/* Platform Metrics Bar */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-white/[0.08] pt-8 text-left">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                  {initialListings.length}
                </div>
                <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                  Verified Tools
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                  {totalDau.toLocaleString()}+
                </div>
                <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                  Combined DAU
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight tabular-nums flex items-center gap-2">
                  <span>{vacantSlotsCount}</span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live
                  </span>
                </div>
                <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                  Vacant Slots Now
                </div>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-400 tracking-tight tabular-nums">
                  85%
                </div>
                <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mt-0.5">
                  Creator Share
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marketplace Directory Section */}
        <section id="marketplace" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
          {/* Client Interactive Grid with SSR Hydration */}
          <MarketplaceGrid initialListings={initialListings} initialSlots={allSlots} />
        </section>

        {/* Value Proposition Architecture Section */}
        <section className="border-t border-white/[0.08] bg-zinc-950/60 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-900 border border-white/[0.08] text-zinc-400 mb-3">
                <Terminal className="h-3 w-3 text-indigo-400" />
                <span>Production Architecture</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Engineered for High-Trust Placements
              </h2>
              <p className="mt-3 text-zinc-400 text-sm sm:text-base leading-relaxed">
                SponsorSlot eliminates middleman ad networks with fixed pricing, transparent 15% platform fees, and sub-50ms edge delivery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-white/[0.08] p-6 bg-white/[0.02] hover:border-white/[0.15] transition-all">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                  <Shield className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Verified Publisher Traffic</h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Every listed app undergoes cryptographic domain verification or direct telemetry sync with the Chrome Web Store, Plausible, or GA4.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] p-6 bg-white/[0.02] hover:border-white/[0.15] transition-all">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                  <Zap className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Sub-50ms Edge Delivery</h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Headless JSON API for modern micro-SaaS and Manifest V3 extensions, accompanied by a zero-dependency Shadow DOM client SDK.
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.08] p-6 bg-white/[0.02] hover:border-white/[0.15] transition-all">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">30-Day Escrow Math</h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  Flat-rate 30-day lease terms with exact integer-cent escrow allocations: 85% creator payout and 15% platform take-rate with zero penny leakage.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-white/[0.08] bg-[#07080c] text-zinc-500 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 text-zinc-300 font-semibold text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-3 w-3" />
            </div>
            <span>SponsorSlot</span>
            <span className="text-xs font-normal text-zinc-600 ml-2">
              © {new Date().getFullYear()} SponsorSlot. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-400">
            <Link href="/" className="hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/creator" className="hover:text-white transition-colors">
              Creator Portal
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Telemetry Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
