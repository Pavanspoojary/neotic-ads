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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 outline-none">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Platform Telemetry & Ad Delivery Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Analytics & Verification Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-3xl">
            Real-time telemetry aggregated directly from client-side pings without storing PII.
            Monitor impression volume, click conversions, and active escrow contracts.
          </p>
        </div>

        {/* Dashboard Client Area */}
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
