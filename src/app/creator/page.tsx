import React from 'react';
import type { Metadata } from 'next';
import { getDb } from '../../lib/db';
import { Navbar } from '../../components/Navbar';
import { CreatorDashboardClient } from '../../components/CreatorDashboardClient';
import { formatCentsToUsd } from '../../lib/escrow';
import {
  Layers,
  Sparkles,
  DollarSign,
  Users,
  CheckCircle2,
} from 'lucide-react';

export const revalidate = 0; // Dynamic server component for fresh inventory state

export const metadata: Metadata = {
  title: 'Creator Portal — Monetize Your Developer Tool | SponsorSlot',
  description:
    'Register your micro-tool or Chrome extension, define native inventory slots, and earn 85% net payouts on automated 30-day sponsorships.',
};

export default async function CreatorPage() {
  const db = getDb();

  // Concurrently fetch active listings and inventory slots
  const [listings, allSlots] = await Promise.all([
    db.getListings({ status: 'active', sort: 'newest' }),
    db.getAllSlots(),
  ]);

  // Metric 1: Total Registered Tools
  const totalTools = listings.length;

  // Metric 2: Slot Stats (Vacant vs Occupied)
  const totalSlots = allSlots.length;
  const vacantSlots = allSlots.filter((s) => s.is_available).length;
  const occupiedSlots = totalSlots - vacantSlots;

  // Metric 3: Potential Monthly Revenue (Gross & 85% Net Take-home)
  const grossPotentialCents = allSlots.reduce((sum, s) => sum + s.monthly_price_cents, 0);
  const netPotentialCents = Math.round(grossPotentialCents * 0.85);

  // Metric 4: Combined Audience Reach (DAU)
  const totalDau = listings.reduce((sum, l) => sum + (l.verified_dau || 0), 0);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#8b97a8] flex flex-col selection:bg-[#73e5bf] selection:text-[#0b0e14]">
      {/* Global Navigation */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 outline-none">
        {/* Creator Portal Header Banner */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-[#73e5bf] mb-3.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#73e5bf] shadow-[0_0_8px_#73e5bf] animate-pulse" />
                <Sparkles className="h-3.5 w-3.5 text-[#73e5bf]" />
                <span>Creator Monetization Console</span>
                <span className="text-white/20">•</span>
                <span className="text-gray-300">85% Net Payout Guarantee</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black tracking-[-0.03em] text-white">
                Creator Inventory & Tool Management
              </h1>
              <p className="mt-3 text-sm sm:text-base text-[#8b97a8] max-w-3xl leading-relaxed tracking-[-0.025em]">
                Onboard your developer utilities and Chrome extensions, configure standardized in-app ad slots,
                and connect with high-intent B2B sponsors on automated 30-day terms.
              </p>
            </div>
          </div>

          {/* Top Summary Metrics Cards (4-Column Grid) */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Registered Tools */}
            <div className="glass-panel rounded-2xl p-6 transition-all hover:border-white/[0.16]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8b97a8] uppercase tracking-wider">
                  Registered Tools
                </span>
                <div className="p-2 rounded-xl bg-white/[0.04] text-purple-400 border border-white/[0.08]">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight tabular-nums">{totalTools}</span>
                <span className="text-xs text-[#8b97a8] font-medium">active apps</span>
              </div>
              <p className="mt-2 text-xs text-[#8b97a8]/80">
                Live across developer, productivity, and utility categories
              </p>
            </div>

            {/* Card 2: Configured Slots */}
            <div className="glass-panel rounded-2xl p-6 transition-all hover:border-white/[0.16]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8b97a8] uppercase tracking-wider">
                  Configured Slots
                </span>
                <div className="p-2 rounded-xl bg-white/[0.04] text-[#73e5bf] border border-white/[0.08]">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight tabular-nums">{totalSlots}</span>
                <span className="text-[11px] text-[#73e5bf] font-bold bg-[#73e5bf]/10 px-2.5 py-0.5 rounded-full border border-[#73e5bf]/25">
                  {vacantSlots} bookable
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#8b97a8]">
                <span className="inline-block w-2 h-2 rounded-full bg-[#73e5bf] shadow-[0_0_6px_#73e5bf]"></span>
                <span className="text-gray-300 font-medium">{vacantSlots} vacant</span>
                <span className="text-white/20">•</span>
                <span className="inline-block w-2 h-2 rounded-full bg-purple-400"></span>
                <span>{occupiedSlots} sponsored</span>
              </div>
            </div>

            {/* Card 3: Potential Monthly Revenue */}
            <div className="glass-panel rounded-2xl p-6 transition-all hover:border-white/[0.16]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8b97a8] uppercase tracking-wider">
                  Net Monthly Potential
                </span>
                <div className="p-2 rounded-xl bg-white/[0.04] text-[#73e5bf] border border-white/[0.08]">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-display font-black text-[#73e5bf] tracking-tight tabular-nums">
                  {formatCentsToUsd(netPotentialCents)}
                </span>
                <span className="text-xs font-semibold text-[#8b97a8]">/mo</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-[#8b97a8]">
                <span>Gross: {formatCentsToUsd(grossPotentialCents)}/mo</span>
                <span className="text-[10px] text-[#73e5bf] font-semibold">85% Share</span>
              </div>
            </div>

            {/* Card 4: Verified Audience Reach */}
            <div className="glass-panel rounded-2xl p-6 transition-all hover:border-white/[0.16]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8b97a8] uppercase tracking-wider">
                  Verified Audience Reach
                </span>
                <div className="p-2 rounded-xl bg-white/[0.04] text-purple-400 border border-white/[0.08]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight tabular-nums">
                  {totalDau.toLocaleString('en-US')}
                </span>
                <span className="text-xs text-[#8b97a8] font-medium">DAU</span>
              </div>
              <p className="mt-2 text-xs text-[#8b97a8]/80">
                Audited daily active users across registered applications
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Client Shell (Tabs, Tool List, and Onboarding Form) */}
        <CreatorDashboardClient
          initialListings={listings}
          initialSlots={allSlots}
        />
      </main>
    </div>
  );
}
