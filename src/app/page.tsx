import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, Zap, ArrowRight, Layers } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Navigation */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-indigo-50/30 to-slate-50 pt-16 pb-12 sm:pt-20 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Header Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-6 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Programmatic Flat-Rate Micro-Sponsorship Registry</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-tight">
              Sponsor High-Intent{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                Developer Tools & Extensions
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Connect with 500–25k DAU developer utilities and Chrome extensions via native,
              non-intrusive placements on automated 30-day terms. Zero ad networks, 85% creator payout.
            </p>

            {/* Hero Quick Actions */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <a
                href="#marketplace"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
              >
                <span>Browse Marketplace</span>
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/creator"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-700 border border-slate-300 shadow-xs hover:bg-slate-50 transition-colors"
              >
                <span>Monetize Your Tool</span>
              </Link>
            </div>

            {/* Platform Metrics Bar */}
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-slate-200/80 pt-8 text-left">
              <div className="px-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {initialListings.length}
                </div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Verified Tools
                </div>
              </div>
              <div className="px-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {totalDau.toLocaleString()}+
                </div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Combined DAU
                </div>
              </div>
              <div className="px-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {vacantSlotsCount}
                </div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Vacant Slots Now
                </div>
              </div>
              <div className="px-3">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">85%</div>
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Creator Payout Share
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Marketplace Directory Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Client Interactive Grid with SSR Hydration */}
          <MarketplaceGrid initialListings={initialListings} initialSlots={allSlots} />
        </section>

        {/* How It Works Architecture Section */}
        <section className="border-t border-slate-200 bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Built for High-Trust Micro-Sponsorships
              </h2>
              <p className="mt-2 text-slate-600 text-sm sm:text-base">
                SponsorSlot eliminates opaque ad brokers with fixed pricing, transparent 15% platform fees, and sub-50ms edge delivery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 mb-4">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Verified Publisher Traffic</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every listed app undergoes cryptographic domain verification or direct API telemetry audit (Chrome Web Store, Plausible, PostHog, GA4).
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 mb-4">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Sub-50ms Edge Delivery</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Headless JSON API for modern micro-SaaS and Manifest V3 extensions, accompanied by a Shadow DOM SDK script with zero stylesheet clashes.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 mb-4">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">30-Day Escrow Math</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Flat-rate 30-day lease terms with exact integer-cent escrow allocations: 85% creator payout and 15% platform take-rate with zero penny leakage.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>SponsorSlot</span>
            <span className="text-xs font-normal text-slate-500 ml-2">
              © {new Date().getFullYear()} SponsorSlot. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
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
