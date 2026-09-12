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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-[#21192a] rounded-[24px] border border-[#e5e7eb]/12 p-6 shadow-sm hover:border-[#e5e7eb]/20 transition-all">
          <div className="flex items-center justify-between text-[#8b94a3] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Inventory</span>
            <div className="p-2 rounded-xl bg-[#2e2d36] text-[#73e5bf] border border-[#e5e7eb]/10">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-black text-white tabular-nums">{initialSlots.length} Slots</div>
          <div className="text-[11px] text-[#8b94a3] mt-2">
            Across {initialListings.length} verified developer tools
          </div>
        </div>

        <div className="bg-[#21192a] rounded-[24px] border border-[#e5e7eb]/12 p-6 shadow-sm hover:border-[#e5e7eb]/20 transition-all">
          <div className="flex items-center justify-between text-[#8b94a3] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Impressions</span>
            <div className="p-2 rounded-xl bg-[#2e2d36] text-[#a37af5] border border-[#e5e7eb]/10">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-black text-white tabular-nums">
            {totalTelemetry.impressions.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#8b94a3] mt-2">Verified non-PII session pings</div>
        </div>

        <div className="bg-[#21192a] rounded-[24px] border border-[#e5e7eb]/12 p-6 shadow-sm hover:border-[#e5e7eb]/20 transition-all">
          <div className="flex items-center justify-between text-[#8b94a3] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Clicks</span>
            <div className="p-2 rounded-xl bg-[#2e2d36] text-[#73e5bf] border border-[#e5e7eb]/10">
              <MousePointer className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-black text-white tabular-nums">
            {totalTelemetry.clicks.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#8b94a3] mt-2">High-intent developer referrals</div>
        </div>

        <div className="bg-[#21192a] rounded-[24px] border border-[#e5e7eb]/12 p-6 shadow-sm hover:border-[#e5e7eb]/20 transition-all">
          <div className="flex items-center justify-between text-[#8b94a3] mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Platform CTR</span>
            <div className="p-2 rounded-xl bg-[#2e2d36] text-[#a37af5] border border-[#e5e7eb]/10">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-display font-black text-[#73e5bf] tabular-nums">{ctr}%</div>
          <div className="text-[11px] text-[#8b94a3] mt-2">
            vs 0.15% average for web banners
          </div>
        </div>
      </div>

      {/* Live Edge Delivery & Telemetry Playground */}
      <div className="bg-[#21192a] rounded-[24px] border border-[#e5e7eb]/12 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg sm:text-xl font-display font-black text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#73e5bf]" />
              <span>Live Edge Delivery & Beacon Simulator</span>
            </h3>
            <p className="text-xs text-[#8b94a3] mt-1">
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
              className="px-3.5 py-2 rounded-xl border border-[#e5e7eb]/12 text-xs font-semibold text-zinc-200 bg-[#2e2d36] focus:outline-none focus:border-[#73e5bf] focus:ring-1 focus:ring-[#73e5bf]"
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#73e5bf] hover:bg-[#85ebd0] text-[#130f18] text-xs font-bold shadow-mint-led transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingApi ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              <span>Test Delivery</span>
            </button>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-[#e5e7eb]/10 mb-4">
          <span className="text-xs text-[#8b94a3] font-medium">Send Telemetry Ping:</span>
          <button
            onClick={() => fireTestBeacon('impression')}
            className="px-3.5 py-1.5 rounded-xl border border-[#e5e7eb]/12 bg-[#2e2d36] hover:bg-[#383742] text-xs font-semibold text-zinc-200 transition-colors"
          >
            +1 Impression
          </button>
          <button
            onClick={() => fireTestBeacon('click')}
            className="px-3.5 py-1.5 rounded-xl border border-[#e5e7eb]/12 bg-[#2e2d36] hover:bg-[#383742] text-xs font-semibold text-zinc-200 transition-colors"
          >
            +1 Click
          </button>
          {beaconStatus && (
            <span className="text-xs font-bold text-[#73e5bf] ml-2 animate-fadeIn">
              {beaconStatus}
            </span>
          )}
        </div>

        {/* API Response display */}
        {apiResponse && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#8b94a3] pb-2 border-b border-[#e5e7eb]/10">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-200 font-semibold">
                  GET /api/v1/slot/{selectedSlotId.slice(0, 8)}...
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#73e5bf]/10 text-[#73e5bf] font-bold border border-[#73e5bf]/25">200 OK</span>
                {latencyMs !== null && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2e2d36] text-[#73e5bf] font-bold border border-[#e5e7eb]/10 flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[#73e5bf]" />
                    <span>{latencyMs}ms</span>
                  </span>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-[#2e2d36] p-1 rounded-xl border border-[#e5e7eb]/10">
                <button
                  type="button"
                  onClick={() => setViewMode('visual')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    viewMode === 'visual'
                      ? 'bg-[#73e5bf] text-[#130f18] shadow-mint-led'
                      : 'text-[#8b94a3] hover:text-white'
                  }`}
                >
                  Visual Widget Preview
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('json')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    viewMode === 'json'
                      ? 'bg-[#73e5bf] text-[#130f18] shadow-mint-led'
                      : 'text-[#8b94a3] hover:text-white'
                  }`}
                >
                  Raw JSON Payload
                </button>
              </div>
            </div>

            {viewMode === 'visual' ? (
              <div className="p-6 rounded-[24px] bg-[#130f18] border border-[#e5e7eb]/10 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300 uppercase tracking-wide">
                    Format: {apiResponse.slot?.type || 'slot'} • Status: {apiResponse.status}
                  </span>
                  {apiResponse.fallback ? (
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                      Viral Referral Fallback (Vacant)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#73e5bf] bg-[#73e5bf]/10 border border-[#73e5bf]/25 px-2.5 py-0.5 rounded-full">
                      Active Sponsored Campaign
                    </span>
                  )}
                </div>

                {/* Rendered Visual Unit */}
                <div className="p-4 rounded-xl bg-[#21192a] border border-[#e5e7eb]/10 flex items-center justify-center min-h-[90px]">
                  {apiResponse.creative ? (
                    <a
                      href={apiResponse.creative.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#2e2d36] hover:bg-[#383742] border border-[#e5e7eb]/12 transition-colors text-xs text-zinc-200 group"
                    >
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#73e5bf]/20 text-[#73e5bf] border border-[#73e5bf]/30">
                        {apiResponse.creative.disclaimer_text || 'Sponsored'}
                      </span>
                      <span className="font-medium group-hover:text-[#73e5bf] transition-colors">
                        {apiResponse.creative.text}
                      </span>
                      <ExternalLink className="h-3 w-3 text-[#8b94a3] group-hover:text-[#73e5bf]" />
                    </a>
                  ) : (
                    <span className="text-xs text-[#8b94a3]">No creative payload</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8b94a3] font-mono">
                  <span>Parent Tool: {apiResponse.slot?.listing_title}</span>
                  <span>Beacon: {apiResponse.beacon?.endpoint}</span>
                </div>
              </div>
            ) : (
              <pre className="p-4 rounded-2xl bg-[#130f18] border border-[#e5e7eb]/10 text-zinc-200 text-xs font-mono overflow-x-auto max-h-72">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Active Sponsorships Table */}
      <div className="bg-[#21192a] rounded-[24px] border border-[#e5e7eb]/12 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#e5e7eb]/10">
          <h3 className="text-base sm:text-lg font-display font-black text-white">Active Sponsorship Contracts</h3>
          <p className="text-xs text-[#8b94a3] mt-0.5">
            Sponsorships currently active or in 30-day escrow hold with verified creative delivery.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#e5e7eb]/10 bg-[#130f18]/40 text-[#8b94a3] font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Sponsor Brand</th>
                <th className="py-3 px-4">Slot Name</th>
                <th className="py-3 px-4">Creative Headline</th>
                <th className="py-3 px-4">Monthly Rate</th>
                <th className="py-3 px-4">Term Dates</th>
                <th className="py-3 px-4">Escrow Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]/10">
              {initialSponsorships.map((sp) => {
                const slot = initialSlots.find((s) => s.id === sp.slot_id);
                return (
                  <tr key={sp.id} className="hover:bg-[#2e2d36]/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {sp.sponsor_name || 'Verified B2B Sponsor'}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {slot ? slot.slot_name : sp.slot_id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4 text-[#8b94a3] max-w-xs truncate">
                      {sp.creative_text}
                    </td>
                    <td className="py-3 px-4 font-bold text-white tabular-nums">
                      {formatCentsToUsd(sp.monthly_amount_cents)}
                    </td>
                    <td className="py-3 px-4 text-[#8b94a3] font-mono text-[11px]">
                      {sp.start_date} → {sp.end_date}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#73e5bf]/10 text-[#73e5bf] border border-[#73e5bf]/25">
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
