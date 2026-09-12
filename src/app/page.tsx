import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
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
    <div className="min-h-screen bg-[#0d1017] text-[#8b97a8] flex flex-col selection:bg-[#73e5bf] selection:text-[#0d1017]">
      {/* 1. Ultra-Minimal Glass Navigation Bar */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none w-full">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20">
          
          {/* =====================================================================
              HERO HEADER AREA — Premium & Minimal
              ===================================================================== */}
          <section className="text-center mb-8 space-y-4">
            {/* Ambient subtle glow background */}
            <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-[radial-gradient(ellipse_at_top,_rgba(115,229,191,0.08),transparent_70%)] pointer-events-none -z-10" />

            {/* Top Verified Announcement Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-[#8b97a8] hover:border-white/[0.15] transition-all cursor-pointer">
              <span className="w-1.5 h-1.5 rounded-full bg-[#73e5bf] shadow-[0_0_6px_#73e5bf]" />
              <span className="text-gray-200 font-medium">In-App Micro-Sponsorships</span>
              <span className="text-white/20">•</span>
              <span className="font-mono text-[11px] text-gray-400">Sub-50ms Edge API</span>
            </div>

            {/* Massive Clean Headline */}
            <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-[76px] text-white tracking-tight uppercase leading-[1.04] select-none max-w-4xl mx-auto">
              THERE’S AN AD FOR THAT <sup className="text-lg sm:text-2xl font-bold font-sans opacity-70">®</sup>
            </h1>

            {/* Concise Tagline */}
            <p className="text-sm sm:text-base text-[#8b97a8] max-w-2xl mx-auto font-normal leading-relaxed">
              Direct, flat-rate sponsorships inside verified developer tools and Chrome extensions. 
              Zero intrusive ad networks, 30-day automated escrow, and 85% creator payouts.
            </p>

            {/* =====================================================================
                FEATURED SPONSOR CARD (Refined Linear-grade styling)
                ===================================================================== */}
            <div className="pt-4 pb-2">
              <div className="max-w-xl mx-auto relative rounded-2xl bg-white/[0.02] border border-white/[0.1] hover:border-[#73e5bf]/40 p-4 sm:p-4.5 text-left shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all group">
                {/* Floating "Sponsor" Pill on top border */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#0d1017] border border-white/[0.15] text-[10px] font-bold text-gray-300 uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#73e5bf]" />
                    <span>Featured Sponsor</span>
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {/* Left Icon/Box ($01) */}
                  <div className="w-11 h-11 rounded-xl bg-black/50 border border-white/[0.08] flex items-center justify-center shrink-0 shadow-inner">
                    <span className="font-display font-black text-base text-[#73e5bf] font-mono tracking-tight">
                      $01
                    </span>
                  </div>

                  {/* Middle Copy */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#73e5bf] transition-colors truncate">
                      Salesguy — You built it. Now what?
                    </h3>
                    <p className="text-xs text-[#8b97a8] truncate mt-0.5">
                      He finds you paying customers. Sub-50ms native delivery inside verified tools.
                    </p>
                  </div>

                  {/* Right CTA Button */}
                  <Link
                    href={featuredBookingUrl}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#0d1017] text-xs font-bold transition-all shadow-sm active:scale-95"
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
      <footer className="border-t border-white/[0.08] bg-[#090c12] text-[#8b97a8] py-8 text-xs w-full">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-white">NEOTIC ADS</span>
            <span className="text-gray-600">•</span>
            <span>The Front Page of Developer Micro-Sponsorships</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/creator" className="hover:text-white transition-colors">
              Creator Launchpad
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Telemetry Simulator
            </Link>
            <Link href="/embed.js" className="hover:text-white transition-colors">
              Client Embed SDK
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
