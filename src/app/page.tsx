import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen bg-[#131722] text-[#8b97a8] flex flex-col selection:bg-[#73e5bf] selection:text-[#131722]">
      {/* 1. Top 2 Navigation Bars (Main Header + Red Announcement Bar) */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none w-full">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          
          {/* =====================================================================
              HERO HEADER AREA (As in Reference Screenshot)
              ===================================================================== */}
          <section className="text-center mb-6 space-y-4">
            {/* Subheader URL Tag */}
            <div className="inline-block">
              <span className="text-[11px] font-mono text-gray-400 tracking-wider hover:text-white transition-colors cursor-pointer">
                neotic.app/any-keyword
              </span>
            </div>

            {/* Massive Geometric Headline */}
            <h1 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-[68px] text-white tracking-tight uppercase leading-[1.08] select-none">
              THERE'S AN AD FOR THAT <sup className="text-xl sm:text-2xl lg:text-3xl font-bold font-sans">®</sup>
            </h1>

            {/* =====================================================================
                FEATURED SPONSOR CARD (Directly below headline, as in Screenshot)
                ===================================================================== */}
            <div className="pt-2 pb-2">
              <div className="max-w-xl mx-auto relative rounded-2xl bg-[#181e2b] border border-[#27c93f]/40 p-4 sm:p-4.5 text-left shadow-[0_0_20px_rgba(39,201,63,0.12)] hover:border-[#27c93f]/70 transition-all group">
                {/* Floating "Sponsor" Pill on top border */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#181e2b] border border-[#27c93f]/50 text-[10px] font-bold text-gray-300 uppercase tracking-wider shadow-sm">
                    Sponsor
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  {/* Left Icon/Box ($01) */}
                  <div className="w-12 h-12 rounded-xl bg-black/40 border border-[#27c93f]/30 flex items-center justify-center shrink-0 shadow-inner">
                    <span className="font-display font-black text-lg text-white font-mono tracking-tighter">
                      $01
                    </span>
                  </div>

                  {/* Middle Copy */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[#73e5bf] transition-colors truncate">
                      Salesguy - You built it. Now what?
                    </h3>
                    <p className="text-xs text-[#8b97a8] truncate mt-0.5">
                      He finds you paying customers. Sub-50ms native delivery.
                    </p>
                  </div>

                  {/* Right CTA Button */}
                  <Link
                    href={featuredBookingUrl}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#242c3d] hover:bg-[#27c93f] hover:text-black text-white border border-[#344058] hover:border-[#27c93f] text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* =====================================================================
              MARKETPLACE DIRECTORY & HIGH-DENSITY FEED (As in Reference Screenshot)
              ===================================================================== */}
          <MarketplaceGrid
            initialListings={initialListings}
            initialSlots={allSlots}
          />
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#212638] bg-[#11141e] text-[#8b97a8] py-8 text-xs w-full">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-white">NEOTIC ADS</span>
            <span className="text-gray-500">•</span>
            <span>The Front Page of Micro-Tool Placements</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/creator" className="hover:text-white transition-colors">
              Launchpad
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Telemetry
            </Link>
            <Link href="/embed.js" className="hover:text-white transition-colors">
              Embed SDK
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
