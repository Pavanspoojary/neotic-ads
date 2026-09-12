/**
 * Creator Portal & Tool Management Server Page
 * File path: src/app/creator/page.tsx
 *
 * Server Component fetching creator listings and slots directly from the database seam.
 * Renders summary metrics cards and hosts the interactive CreatorDashboardClient.
 */

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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Navigation */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 outline-none">
        {/* Creator Portal Header Banner */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>Creator Monetization Portal</span>
                <span className="opacity-40">•</span>
                <span>85% Net Payout Guarantee</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Creator Inventory & Tool Management
              </h1>
              <p className="mt-2 text-base text-slate-600 max-w-3xl">
                Onboard your developer utilities and Chrome extensions, configure standardized in-app ad slots,
                and connect with high-intent B2B sponsors on automated 30-day terms.
              </p>
            </div>
          </div>

          {/* Top Summary Metrics Cards (4-Column Grid) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Registered Tools */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Registered Tools
                </span>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <Layers className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{totalTools}</span>
                <span className="text-xs text-slate-500 font-medium">active apps</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Live across developer, productivity, and utility categories
              </p>
            </div>

            {/* Card 2: Configured Slots */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Configured Slots
                </span>
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">{totalSlots}</span>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {vacantSlots} bookable
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{vacantSlots} vacant</span>
                <span className="opacity-40">•</span>
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{occupiedSlots} sponsored</span>
              </div>
            </div>

            {/* Card 3: Potential Monthly Revenue */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Potential Monthly Revenue
                </span>
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-indigo-600">
                  {formatCentsToUsd(netPotentialCents)}
                </span>
                <span className="text-xs font-bold text-slate-500">/mo</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Gross Inventory:</span>
                <span className="font-semibold text-slate-700">
                  {formatCentsToUsd(grossPotentialCents)}/mo
                </span>
              </div>
            </div>

            {/* Card 4: Verified Audience Reach */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Verified Audience Reach
                </span>
                <div className="p-2 rounded-lg bg-violet-50 text-violet-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {totalDau.toLocaleString('en-US')}
                </span>
                <span className="text-xs text-slate-500 font-medium">DAU</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Daily active users across all registered developer tools
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
