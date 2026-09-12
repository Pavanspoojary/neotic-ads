import React from 'react';
import { ImpressionTelemetry, SlotType } from '../lib/types';
import { calculateCtr } from '../lib/escrow';

export interface TelemetryChartProps {
  telemetry?: ImpressionTelemetry[];
  slotName?: string;
  slotType?: SlotType;
  days?: number;
  className?: string;
}

export function TelemetryChart({
  telemetry = [],
  slotName,
  slotType,
  className = '',
}: TelemetryChartProps) {
  // Aggregate 30-day totals
  const totalImpressions = telemetry.reduce((sum, t) => sum + (t.impressions_count || 0), 0);
  const totalClicks = telemetry.reduce((sum, t) => sum + (t.clicks_count || 0), 0);
  const avgCtr = calculateCtr(totalClicks, totalImpressions);
  const peakDaily = Math.max(1, ...telemetry.map((t) => t.impressions_count || 0));

  // Date labels
  const startDate = telemetry.length > 0 ? telemetry[0].telemetry_date : '';
  const midDate = telemetry.length > 1 ? telemetry[Math.floor(telemetry.length / 2)].telemetry_date : '';
  const endDate = telemetry.length > 0 ? telemetry[telemetry.length - 1].telemetry_date : '';

  if (telemetry.length === 0) {
    return (
      <div className={`p-5 rounded-2xl bg-zinc-50 border border-black/[0.06] text-center ${className}`}>
        <p className="text-xs text-zinc-600 font-medium">No 30-day telemetry history recorded yet.</p>
        <p className="text-[11px] text-zinc-400 mt-0.5">Telemetry begins logging upon slot activation.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl bg-zinc-50/50 border border-black/[0.06] p-4 sm:p-5 ${className}`}>
      {/* Metric summary banner */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="bg-white rounded-xl p-3 border border-black/[0.06] shadow-2xs">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">30d Impressions</div>
          <div className="text-sm sm:text-base font-bold text-zinc-950 mt-0.5 tabular-nums">{totalImpressions.toLocaleString('en-US')}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-black/[0.06] shadow-2xs">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">30d Clicks</div>
          <div className="text-sm sm:text-base font-bold text-zinc-950 mt-0.5 tabular-nums">{totalClicks.toLocaleString('en-US')}</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-black/[0.06] shadow-2xs">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Avg CTR</div>
          <div className="text-sm sm:text-base font-bold text-emerald-700 mt-0.5 tabular-nums">{avgCtr.toFixed(2)}%</div>
        </div>
      </div>

      {/* Visual Bar Chart (Pure CSS Flex columns — Ponytail Compliant) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
          <span>Daily Verified Impressions</span>
          <span className="tabular-nums">Peak: {peakDaily.toLocaleString('en-US')} / day</span>
        </div>

        <div className="h-28 flex items-end gap-1 sm:gap-1.5 pt-3 pb-1 px-2 bg-white rounded-xl border border-black/[0.06] shadow-2xs">
          {telemetry.map((t, idx) => {
            const heightPercent = Math.max(8, Math.round(((t.impressions_count || 0) / peakDaily) * 100));
            const dayCtr = calculateCtr(t.clicks_count || 0, t.impressions_count || 0);
            const tooltip = `${t.telemetry_date}: ${t.impressions_count.toLocaleString()} imp, ${t.clicks_count} clicks (${dayCtr.toFixed(2)}% CTR)`;

            return (
              <div
                key={t.id || `${t.slot_id}-${t.telemetry_date}-${idx}`}
                className="group relative flex-1 h-full flex items-end justify-center"
              >
                {/* Visual bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className="w-full bg-emerald-500 group-hover:bg-emerald-600 rounded-t-xs transition-all duration-100"
                  title={tooltip}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis date range */}
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
          <span>{startDate}</span>
          <span className="hidden sm:inline">{midDate}</span>
          <span>{endDate} (Today)</span>
        </div>
      </div>
    </div>
  );
}
