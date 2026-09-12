import React from 'react';
import type { Metadata } from 'next';
import { getDb } from '../../lib/db';
import { Navbar } from '../../components/Navbar';
import { DashboardClient } from '../../components/DashboardClient';
import { BarChart2, Shield } from 'lucide-react';

export const revalidate = 30; // ISR cache revalidation every 30 seconds

export const metadata: Metadata = {
  title: 'Telemetry & Advertiser Analytics — SponsorSlot',
  description: 'Track impressions, click-through rates, active escrow sponsorships, and edge delivery telemetry.',
};

export default async function DashboardPage() {
  const db = getDb();

  const [allListings, allSlots] = await Promise.all([
    db.getListings({ status: 'active' }),
    db.getAllSlots(),
  ]);

  // Aggregate all sponsorships and telemetry
  const allSponsorshipsPromises = allSlots.map((s) => db.getSponsorshipsBySlotId(s.id));
  const allTelemetryPromises = allSlots.map((s) => db.getTelemetry(s.id, 30));

  const [sponsorshipsNested, telemetryNested] = await Promise.all([
    Promise.all(allSponsorshipsPromises),
    Promise.all(allTelemetryPromises),
  ]);

  const flatSponsorships = sponsorshipsNested.flat();
  const allTelemetryRecords = telemetryNested.flat();

  const totalTelemetry = allTelemetryRecords.reduce(
    (acc, curr) => ({
      impressions: acc.impressions + (curr.impressions_count || 0),
      clicks: acc.clicks + (curr.clicks_count || 0),
    }),
    { impressions: 0, clicks: 0 }
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-600 flex flex-col selection:bg-emerald-500/10 selection:text-emerald-950">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-10 outline-none">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-800 text-[11px] font-medium mb-3 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <BarChart2 className="h-3 w-3 text-emerald-600" />
            <span>Platform Telemetry & Ad Delivery Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-zinc-950 tracking-tight">
            Analytics & Verification Dashboard
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-500 max-w-2xl leading-relaxed">
            Real-time telemetry aggregated directly from client-side pings without storing PII.
            Monitor impression volume, click conversions, and active escrow contracts.
          </p>
        </div>

        {/* Client Interactive Dashboard */}
        <DashboardClient
          initialSlots={allSlots}
          initialListings={allListings}
          initialSponsorships={flatSponsorships}
          totalTelemetry={totalTelemetry}
        />
      </main>
    </div>
  );
}
