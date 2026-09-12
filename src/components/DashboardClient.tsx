'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { InventorySlot, Listing, Sponsorship } from '../lib/types';
import { formatCentsToUsd } from '../lib/escrow';
import {
  Activity,
  BarChart3,
  ExternalLink,
  Eye,
  MousePointer,
  Layers,
  Zap,
  Play,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface DashboardClientProps {
  initialSlots: InventorySlot[];
  initialListings: Listing[];
  initialSponsorships: Sponsorship[];
  totalTelemetry: { impressions: number; clicks: number };
}

export function DashboardClient({
  initialSlots,
  initialListings,
  initialSponsorships,
  totalTelemetry,
}: DashboardClientProps) {
  const [selectedSlotId, setSelectedSlotId] = useState(
    initialSlots[0]?.id || '20000000-0000-0000-0000-000000000001'
  );
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'json'>('visual');
  const [beaconStatus, setBeaconStatus] = useState<string | null>(null);

  const ctr =
    totalTelemetry.impressions > 0
      ? ((totalTelemetry.clicks / totalTelemetry.impressions) * 100).toFixed(2)
      : '0.00';

  const testEdgeDelivery = async () => {
    setLoadingApi(true);
    const start = performance.now();
    try {
      const res = await fetch(`/api/v1/slot/${selectedSlotId}`);
      const data = await res.json();
      setLatencyMs(Math.round(performance.now() - start));
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: err.message });
    } finally {
      setLoadingApi(false);
    }
  };

  const fireTestBeacon = async (event: 'impression' | 'click') => {
    setBeaconStatus(`Sending ${event} beacon...`);
    try {
      const res = await fetch('/api/v1/telemetry/beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: selectedSlotId, event }),
      });
      const data = await res.json();
      if (res.ok) {
        setBeaconStatus(
          `${event} beacon recorded! (Slot impressions: ${data.impressions_count}, clicks: ${data.clicks_count})`
        );
      } else {
        setBeaconStatus(`Failed: ${data.error}`);
      }
    } catch (err: any) {
      setBeaconStatus(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="bg-white rounded-xl border border-black/[0.06] p-5 shadow-2xs hover:border-black/[0.12] transition-all">
          <div className="flex items-center justify-between text-zinc-500 mb-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wider">Active Inventory</span>
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-600 border border-black/[0.06]">
              <Layers className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-semibold text-zinc-950 tabular-nums tracking-tight">{initialSlots.length} Slots</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Across {initialListings.length} verified developer tools
          </div>
        </div>

        <div className="bg-white rounded-xl border border-black/[0.06] p-5 shadow-2xs hover:border-black/[0.12] transition-all">
          <div className="flex items-center justify-between text-zinc-500 mb-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wider">Total Impressions</span>
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-600 border border-black/[0.06]">
              <Eye className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-semibold text-zinc-950 tabular-nums tracking-tight">
            {totalTelemetry.impressions.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Verified non-PII session pings</div>
        </div>

        <div className="bg-white rounded-xl border border-black/[0.06] p-5 shadow-2xs hover:border-black/[0.12] transition-all">
          <div className="flex items-center justify-between text-zinc-500 mb-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wider">Total Clicks</span>
            <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-600 border border-black/[0.06]">
              <MousePointer className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-semibold text-zinc-950 tabular-nums tracking-tight">
            {totalTelemetry.clicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">High-intent developer referrals</div>
        </div>

        <div className="bg-white rounded-xl border border-black/[0.06] p-5 shadow-2xs hover:border-black/[0.12] transition-all">
          <div className="flex items-center justify-between text-zinc-500 mb-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wider">Platform CTR</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/[0.08] text-emerald-700 border border-emerald-500/20">
              <BarChart3 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-display font-semibold text-emerald-700 tabular-nums tracking-tight">{ctr}%</div>
          <div className="text-[11px] text-zinc-400 mt-1">
            vs 0.15% average for web banners
          </div>
        </div>
      </div>

      {/* Live Edge Delivery & Telemetry Playground */}
      <div className="bg-white rounded-xl border border-black/[0.06] p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-display font-semibold text-zinc-950 flex items-center gap-2 tracking-tight">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>Live Edge Delivery & Beacon Simulator</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Simulate how client applications and Chrome extensions consume the /api/v1/slot/[id] edge API and send telemetry beacons.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={selectedSlotId}
              onChange={(e) => {
                setSelectedSlotId(e.target.value);
                setApiResponse(null);
                setBeaconStatus(null);
              }}
              className="px-3 py-1.5 rounded-lg border border-black/[0.08] text-xs font-medium text-zinc-800 bg-white focus:outline-none focus:border-black/25 focus:ring-2 focus:ring-black/[0.04]"
            >
              {initialSlots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.slot_name} ({s.slot_type}) — {s.is_available ? 'Available' : 'Sponsored'}
                </option>
              ))}
            </select>

            <button
              onClick={testEdgeDelivery}
              disabled={loadingApi}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-medium shadow-xs hover:shadow transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingApi ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              <span>Test Delivery</span>
            </button>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap items-center gap-2.5 pb-3.5 border-b border-black/[0.04] mb-4">
          <span className="text-xs text-zinc-500 font-normal">Send Telemetry Ping:</span>
          <button
            onClick={() => fireTestBeacon('impression')}
            className="px-3 py-1 rounded-md border border-black/[0.08] bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors shadow-2xs cursor-pointer"
          >
            +1 Impression
          </button>
          <button
            onClick={() => fireTestBeacon('click')}
            className="px-3 py-1 rounded-md border border-black/[0.08] bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors shadow-2xs cursor-pointer"
          >
            +1 Click
          </button>
          {beaconStatus && (
            <span className="text-xs font-medium text-emerald-700 ml-2 animate-fadeIn">
              {beaconStatus}
            </span>
          )}
        </div>

        {/* API Response display */}
        {apiResponse && (
          <div className="space-y-3.5 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500 pb-2 border-b border-black/[0.04]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-900 font-medium">
                  GET /api/v1/slot/{selectedSlotId.slice(0, 8)}...
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/[0.08] text-emerald-800 font-medium border border-emerald-500/20 text-[10px]">200 OK</span>
                {latencyMs !== null && (
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-emerald-700 font-medium border border-black/[0.06] flex items-center gap-1 text-[10px]">
                    <Zap className="h-2.5 w-2.5 text-emerald-600" />
                    <span>{latencyMs}ms</span>
                  </span>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-0.5 bg-zinc-100 p-0.5 rounded-lg border border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setViewMode('visual')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'visual'
                      ? 'bg-zinc-950 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  Visual Widget Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('json')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    viewMode === 'json'
                      ? 'bg-zinc-950 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  Raw JSON Payload
                </button>
              </div>
            </div>

            {viewMode === 'visual' ? (
              <div className="p-5 rounded-xl bg-zinc-50/60 border border-black/[0.06] space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 uppercase tracking-wide text-[10px]">
                    Format: {apiResponse.slot?.type || 'slot'} • Status: {apiResponse.status}
                  </span>
                  {apiResponse.fallback ? (
                    <span className="text-[10px] font-medium text-amber-800 bg-amber-500/[0.08] border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Viral Referral Fallback (Vacant)
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-800 bg-emerald-500/[0.08] border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Active Sponsored Campaign
                    </span>
                  )}
                </div>

                {/* Rendered Visual Unit */}
                <div className="p-4 rounded-xl bg-white border border-black/[0.08] shadow-2xs flex items-center justify-center min-h-[80px]">
                  {apiResponse.creative ? (
                    <a
                      href={apiResponse.creative.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-50 border border-black/[0.08] transition-colors text-xs text-zinc-900 group shadow-2xs"
                    >
                      <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/[0.08] text-emerald-800 border border-emerald-500/20">
                        {apiResponse.creative.disclaimer_text || 'Sponsored'}
                      </span>
                      <span className="font-medium group-hover:text-emerald-700 transition-colors">
                        {apiResponse.creative.text}
                      </span>
                      <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-emerald-700" />
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-400">No creative payload</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Parent Tool: {apiResponse.slot?.listing_title}</span>
                  <span>Beacon: {apiResponse.beacon?.endpoint}</span>
                </div>
              </div>
            ) : (
              <pre className="p-4 rounded-xl bg-[#0c0c0e] border border-black/10 text-zinc-200 text-xs font-mono overflow-x-auto max-h-72 shadow-2xs">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Active Sponsorships Table */}
      <div className="bg-white rounded-xl border border-black/[0.06] shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-black/[0.04]">
          <h3 className="text-sm sm:text-base font-display font-semibold text-zinc-950 tracking-tight">Active Sponsorship Contracts</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sponsorships currently active or in 30-day escrow hold with verified creative delivery.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-black/[0.06] bg-zinc-50/60 text-zinc-500 font-medium uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-4">Sponsor Brand</th>
                <th className="py-2.5 px-4">Slot Name</th>
                <th className="py-2.5 px-4">Creative Headline</th>
                <th className="py-2.5 px-4">Monthly Rate</th>
                <th className="py-2.5 px-4">Term Dates</th>
                <th className="py-2.5 px-4">Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {initialSponsorships.map((sp) => {
                const slot = initialSlots.find((s) => s.id === sp.slot_id);
                return (
                  <tr key={sp.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-zinc-950">
                      {sp.sponsor_name || 'Verified B2B Sponsor'}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-600">
                      {slot ? slot.slot_name : sp.slot_id.slice(0, 8)}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-500 max-w-xs truncate">
                      {sp.creative_text}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-zinc-950 tabular-nums">
                      {formatCentsToUsd(sp.monthly_amount_cents)}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-500 font-mono text-[11px]">
                      {sp.start_date} → {sp.end_date}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/[0.08] text-emerald-800 border border-emerald-500/20">
                        {sp.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
