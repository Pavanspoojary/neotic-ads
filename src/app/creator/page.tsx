import React from 'react';
import type { Metadata } from 'next';
import { getDb } from '../../lib/db';
import { Navbar } from '../../components/Navbar';
import { CreatorDashboardClient } from '../../components/CreatorDashboardClient';
import { formatCentsToUsd } from '../../lib/escrow';
import {
  Layers,
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
    <div className="min-h-screen bg-[#fafafa] text-zinc-600 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Global Navigation */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 outline-none">
        {/* Creator Portal Header Banner */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/[0.06] pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-500/20 text-xs font-medium text-emerald-800 mb-3 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Layers className="h-3.5 w-3.5 text-emerald-600" />
                <span>Creator Monetization Console</span>
                <span className="text-zinc-300">•</span>
                <span className="text-zinc-600 font-mono text-[11px]">85% Net Payout</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-zinc-950">
                Creator Inventory & Tool Management
              </h1>
              <p className="mt-3 text-sm sm:text-base text-zinc-600 max-w-3xl leading-relaxed">
                Onboard your developer utilities and Chrome extensions, configure standardized in-app ad slots,
                and connect with high-intent B2B sponsors on automated 30-day terms.
              </p>
            </div>
          </div>

          {/* Top Summary Metrics Cards (4-Column Grid) */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Registered Tools */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-6 shadow-2xs hover:border-black/[0.12] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Registered Tools
                </span>
                <div className="p-2 rounded-xl bg-zinc-100 text-zinc-700 border border-black/[0.04]">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-bold text-zinc-950 tracking-tight tabular-nums">{totalTools}</span>
                <span className="text-xs text-zinc-500 font-medium">active apps</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Live across developer, productivity, and utility categories
              </p>
            </div>

            {/* Card 2: Configured Slots */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-6 shadow-2xs hover:border-black/[0.12] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Configured Slots
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-bold text-zinc-950 tracking-tight tabular-nums">{totalSlots}</span>
                <span className="text-[11px] text-emerald-800 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                  {vacantSlots} bookable
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-zinc-700 font-medium">{vacantSlots} vacant</span>
                <span className="text-zinc-300">•</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                <span>{occupiedSlots} sponsored</span>
              </div>
            </div>

            {/* Card 3: Potential Monthly Revenue */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-6 shadow-2xs hover:border-black/[0.12] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Net Monthly Potential
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-500/20">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-display font-bold text-emerald-700 tracking-tight tabular-nums">
                  {formatCentsToUsd(netPotentialCents)}
                </span>
                <span className="text-xs font-semibold text-zinc-500">/mo</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                <span>Gross: {formatCentsToUsd(grossPotentialCents)}/mo</span>
                <span className="text-[10px] text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-500/20 font-mono">85% Share</span>
              </div>
            </div>

            {/* Card 4: Verified Audience Reach */}
            <div className="bg-white border border-black/[0.06] rounded-xl p-6 shadow-2xs hover:border-black/[0.12] transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Verified Audience Reach
                </span>
                <div className="p-2 rounded-xl bg-zinc-100 text-zinc-700 border border-black/[0.04]">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-display font-bold text-zinc-950 tracking-tight tabular-nums">
                  {totalDau.toLocaleString('en-US')}
                </span>
                <span className="text-xs text-zinc-500 font-medium">DAU</span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
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
