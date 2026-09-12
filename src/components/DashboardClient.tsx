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
          `✓ ${event} beacon recorded! (Slot impressions: ${data.impressions_count}, clicks: ${data.clicks_count})`
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-5 shadow-inner-border backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Active Inventory</span>
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">{initialSlots.length} Slots</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Across {initialListings.length} verified developer tools
          </div>
        </div>

        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-5 shadow-inner-border backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Impressions</span>
            <Eye className="h-3.5 w-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            {totalTelemetry.impressions.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">Verified non-PII session pings</div>
        </div>

        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-5 shadow-inner-border backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total Clicks</span>
            <MousePointer className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            {totalTelemetry.clicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">High-intent developer referrals</div>
        </div>

        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-5 shadow-inner-border backdrop-blur-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Platform CTR</span>
            <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 tabular-nums">{ctr}%</div>
          <div className="text-[11px] text-zinc-500 mt-1">
            vs 0.15% average for web banners
          </div>
        </div>
      </div>

      {/* Live Edge Delivery & Telemetry Playground */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-6 sm:p-8 shadow-inner-border backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              <span>Live Edge Delivery & Beacon Simulator</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
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
              className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-xs font-medium text-zinc-200 bg-[#0d0f18] focus:outline-none focus:border-indigo-500/60"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow-indigo transition-all disabled:opacity-50"
            >
              {loadingApi ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              <span>Test Delivery</span>
            </button>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-white/[0.06] mb-4">
          <span className="text-xs text-zinc-400 font-medium">Send Telemetry Ping:</span>
          <button
            onClick={() => fireTestBeacon('impression')}
            className="px-3 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 transition-colors"
          >
            +1 Impression
          </button>
          <button
            onClick={() => fireTestBeacon('click')}
            className="px-3 py-1 rounded-md border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 transition-colors"
          >
            +1 Click
          </button>
          {beaconStatus && (
            <span className="text-xs font-medium text-emerald-400 ml-2 animate-fade-in">
              {beaconStatus}
            </span>
          )}
        </div>

        {/* API Response display */}
        {apiResponse && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400 pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-200 font-semibold">
                  GET /api/v1/slot/{selectedSlotId.slice(0, 8)}...
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">200 OK</span>
                {latencyMs !== null && (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-400" />
                    <span>{latencyMs}ms</span>
                  </span>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setViewMode('visual')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    viewMode === 'visual'
                      ? 'bg-indigo-600 text-white shadow-glow-indigo'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Visual Widget Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('json')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                    viewMode === 'json'
                      ? 'bg-indigo-600 text-white shadow-glow-indigo'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Raw JSON Payload
                </button>
              </div>
            </div>

            {viewMode === 'visual' ? (
              <div className="p-6 rounded-2xl bg-[#07080d] border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300 uppercase tracking-wide">
                    Format: {apiResponse.slot?.type || 'slot'} • Status: {apiResponse.status}
                  </span>
                  {apiResponse.fallback ? (
                    <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Viral Referral Fallback (Vacant)
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      Active Sponsored Campaign
                    </span>
                  )}
                </div>

                {/* Rendered Visual Unit */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center min-h-[90px]">
                  {apiResponse.creative ? (
                    <a
                      href={apiResponse.creative.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.1] transition-colors text-xs text-zinc-200 group"
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {apiResponse.creative.disclaimer_text || 'Sponsored'}
                      </span>
                      <span className="font-medium group-hover:text-indigo-300 transition-colors">
                        {apiResponse.creative.text}
                      </span>
                      <ExternalLink className="h-3 w-3 text-zinc-500 group-hover:text-indigo-300" />
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-500">No creative payload</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Parent Tool: {apiResponse.slot?.listing_title}</span>
                  <span>Beacon: {apiResponse.beacon?.endpoint}</span>
                </div>
              </div>
            ) : (
              <pre className="p-4 rounded-xl bg-[#07080d] border border-white/[0.08] text-zinc-200 text-xs font-mono overflow-x-auto max-h-72">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Active Sponsorships Table */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] shadow-inner-border backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-white/[0.06]">
          <h3 className="text-base font-bold text-white">Active Sponsorship Contracts</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sponsorships currently active or in 30-day escrow hold with verified creative delivery.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Sponsor Brand</th>
                <th className="py-3 px-4">Slot Name</th>
                <th className="py-3 px-4">Creative Headline</th>
                <th className="py-3 px-4">Monthly Rate</th>
                <th className="py-3 px-4">Term Dates</th>
                <th className="py-3 px-4">Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {initialSponsorships.map((sp) => {
                const slot = initialSlots.find((s) => s.id === sp.slot_id);
                return (
                  <tr key={sp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {sp.sponsor_name || 'Verified B2B Sponsor'}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {slot ? slot.slot_name : sp.slot_id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 max-w-xs truncate">
                      {sp.creative_text}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white tabular-nums">
                      {formatCentsToUsd(sp.monthly_amount_cents)}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 font-mono text-[11px]">
                      {sp.start_date} → {sp.end_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
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
