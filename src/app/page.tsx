import React from 'react';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { getDb } from '../lib/db';
import { MarketplaceGrid } from '../components/MarketplaceGrid';
import { Navbar } from '../components/Navbar';

export const revalidate = 60; // ISR cache revalidation every 60 seconds

export default async function HomePage() {
  const db = getDb();

  // Concurrently fetch verified active listings and all slots
  const [initialListings, allSlots] = await Promise.all([
    db.getListings({ status: 'active', sort: 'dau_desc' }),
    db.getAllSlots(),
  ]);

  // Find first available slot for the featured sponsor card CTA
  const featuredAvailableSlot = allSlots.find((s) => s.is_available);
  const featuredBookingUrl = featuredAvailableSlot
    ? `/sponsor/${featuredAvailableSlot.id}`
    : '/sponsor/20000000-0000-0000-0000-000000000002';

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-600 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Ultra-Minimal Glass Navigation Bar */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none w-full">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20">
          
          {/* =====================================================================
              HERO HEADER AREA — Premium & Minimal Light Theme
              ===================================================================== */}
          <section className="text-center mb-8 space-y-3">
            {/* Ambient subtle emerald glow background */}
            <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.05),transparent_70%)] pointer-events-none -z-10" />

            {/* Breadcrumb Monospace Subtext */}
            <div className="font-mono text-xs text-zinc-400 tracking-wider select-none pt-2">
              neotic.app/any-keyword
            </div>

            {/* Massive Clean Headline */}
            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-[72px] text-zinc-950 tracking-[-0.035em] uppercase leading-[1.02] select-none max-w-4xl mx-auto">
              THERE’S AN AD FOR THAT <sup className="text-lg sm:text-2xl font-bold font-sans opacity-50">®</sup>
            </h1>

            {/* =====================================================================
                FEATURED SPONSOR CARD — Pristine Minimal White Card
                ===================================================================== */}
            <div className="pt-3 pb-2">
              <div className="max-w-2xl mx-auto relative rounded-xl bg-white border border-black/[0.06] hover:border-black/[0.12] p-4 sm:px-5 sm:py-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] transition-all group">
                {/* Floating "SPONSOR" Pill on top border */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-emerald-500/30 text-[9px] font-mono font-bold text-emerald-800 uppercase tracking-widest shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>SPONSOR</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {/* Left Icon/Box ($01) */}
                  <div className="w-10 h-10 rounded-xl bg-zinc-950 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <span className="font-display font-black text-sm text-emerald-400 font-mono tracking-tight">
                      $01
                    </span>
                  </div>

                  {/* Middle Copy */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-zinc-950 group-hover:text-black transition-colors truncate">
                      Salesguy — You built it. Now what?
                    </h3>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      He finds you paying customers. Sub-50ms native delivery.
                    </p>
                  </div>

                  {/* Right CTA Button */}
                  <Link
                    href={featuredBookingUrl}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-medium transition-all shadow-xs hover:shadow active:scale-[0.98] cursor-pointer"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              MARKETPLACE DIRECTORY & HIGH-DENSITY FEED
              ===================================================================== */}
          <MarketplaceGrid
            initialListings={initialListings}
            initialSlots={allSlots}
          />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-black/[0.06] bg-white text-zinc-500 py-8 text-xs w-full">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-zinc-950">NEOTIC ADS</span>
            <span className="text-zinc-300">•</span>
            <span>The Front Page of Developer Micro-Sponsorships</span>
          </div>

          <div className="flex items-center gap-6 text-zinc-500">
            <Link href="/" className="hover:text-zinc-950 transition-colors">
              Marketplace
            </Link>
            <Link href="/creator" className="hover:text-zinc-950 transition-colors">
              Creator Launchpad
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-950 transition-colors">
              Telemetry Simulator
            </Link>
            <Link href="/embed.js" className="hover:text-zinc-950 transition-colors">
              Client Embed SDK
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
