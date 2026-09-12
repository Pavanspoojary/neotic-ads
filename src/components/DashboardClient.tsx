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
  Sparkles,
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
    <div className="space-y-8">
      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Inventory</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-700 border border-zinc-200/80">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-zinc-950 tabular-nums">{initialSlots.length} Slots</div>
          <div className="text-[11px] text-zinc-500 mt-2">
            Across {initialListings.length} verified developer tools
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Impressions</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-700 border border-zinc-200/80">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-zinc-950 tabular-nums">
            {totalTelemetry.impressions.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">Verified non-PII session pings</div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Clicks</span>
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-700 border border-zinc-200/80">
              <MousePointer className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-zinc-950 tabular-nums">
            {totalTelemetry.clicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">High-intent developer referrals</div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-2xs hover:border-zinc-300 transition-all">
          <div className="flex items-center justify-between text-zinc-500 mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Platform CTR</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-bold text-emerald-700 tabular-nums">{ctr}%</div>
          <div className="text-[11px] text-zinc-500 mt-2">
            vs 0.15% average for web banners
          </div>
        </div>
      </div>

      {/* Live Edge Delivery & Telemetry Playground */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-8 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-zinc-950 flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-600" />
              <span>Live Edge Delivery & Beacon Simulator</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Simulate how client applications and Chrome extensions consume the /api/v1/slot/[id] edge API and send telemetry beacons.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedSlotId}
              onChange={(e) => {
                setSelectedSlotId(e.target.value);
                setApiResponse(null);
                setBeaconStatus(null);
              }}
              className="px-3.5 py-2 rounded-xl border border-zinc-200/90 text-xs font-semibold text-zinc-800 bg-white focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingApi ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              <span>Test Delivery</span>
            </button>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-zinc-100 mb-4">
          <span className="text-xs text-zinc-500 font-medium">Send Telemetry Ping:</span>
          <button
            onClick={() => fireTestBeacon('impression')}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-200/80 bg-zinc-100 hover:bg-zinc-200/70 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs"
          >
            +1 Impression
          </button>
          <button
            onClick={() => fireTestBeacon('click')}
            className="px-3.5 py-1.5 rounded-xl border border-zinc-200/80 bg-zinc-100 hover:bg-zinc-200/70 text-xs font-semibold text-zinc-700 transition-colors shadow-2xs"
          >
            +1 Click
          </button>
          {beaconStatus && (
            <span className="text-xs font-semibold text-emerald-700 ml-2 animate-fadeIn">
              {beaconStatus}
            </span>
          )}
        </div>

        {/* API Response display */}
        {apiResponse && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500 pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-900 font-semibold">
                  GET /api/v1/slot/{selectedSlotId.slice(0, 8)}...
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/80">200 OK</span>
                {latencyMs !== null && (
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 text-emerald-700 font-semibold border border-zinc-200/80 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-emerald-600" />
                    <span>{latencyMs}ms</span>
                  </span>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200/80">
                <button
                  type="button"
                  onClick={() => setViewMode('visual')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    viewMode === 'visual'
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  Visual Widget Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('json')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    viewMode === 'json'
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-950'
                  }`}
                >
                  Raw JSON Payload
                </button>
              </div>
            </div>

            {viewMode === 'visual' ? (
              <div className="p-6 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-700 uppercase tracking-wide">
                    Format: {apiResponse.slot?.type || 'slot'} • Status: {apiResponse.status}
                  </span>
                  {apiResponse.fallback ? (
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                      Viral Referral Fallback (Vacant)
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                      Active Sponsored Campaign
                    </span>
                  )}
                </div>

                {/* Rendered Visual Unit */}
                <div className="p-4 rounded-xl bg-white border border-zinc-200/80 shadow-2xs flex items-center justify-center min-h-[90px]">
                  {apiResponse.creative ? (
                    <a
                      href={apiResponse.creative.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 transition-colors text-xs text-zinc-900 group shadow-2xs"
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/80">
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
              <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono overflow-x-auto max-h-72">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Active Sponsorships Table */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <h3 className="text-base sm:text-lg font-display font-bold text-zinc-950">Active Sponsorship Contracts</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Sponsorships currently active or in 30-day escrow hold with verified creative delivery.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50/70 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Sponsor Brand</th>
                <th className="py-3 px-4">Slot Name</th>
                <th className="py-3 px-4">Creative Headline</th>
                <th className="py-3 px-4">Monthly Rate</th>
                <th className="py-3 px-4">Term Dates</th>
                <th className="py-3 px-4">Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {initialSponsorships.map((sp) => {
                const slot = initialSlots.find((s) => s.id === sp.slot_id);
                return (
                  <tr key={sp.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-950">
                      {sp.sponsor_name || 'Verified B2B Sponsor'}
                    </td>
                    <td className="py-3 px-4 text-zinc-700">
                      {slot ? slot.slot_name : sp.slot_id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 max-w-xs truncate">
                      {sp.creative_text}
                    </td>
                    <td className="py-3 px-4 font-bold text-zinc-950 tabular-nums">
                      {formatCentsToUsd(sp.monthly_amount_cents)}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                      {sp.start_date} → {sp.end_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
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
