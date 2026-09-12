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
      <div className={`p-4 rounded-lg bg-slate-50 border border-slate-200 text-center ${className}`}>
        <p className="text-xs text-slate-500 font-medium">No 30-day telemetry history recorded yet.</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Telemetry begins logging upon slot activation.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg bg-slate-50/70 border border-slate-200 p-4 ${className}`}>
      {/* Metric summary banner */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-center">
        <div className="bg-white rounded-md p-2 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">30d Impressions</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">{totalImpressions.toLocaleString('en-US')}</div>
        </div>
        <div className="bg-white rounded-md p-2 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">30d Clicks</div>
          <div className="text-base font-bold text-slate-900 mt-0.5">{totalClicks.toLocaleString('en-US')}</div>
        </div>
        <div className="bg-white rounded-md p-2 border border-slate-200 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Avg CTR</div>
          <div className="text-base font-bold text-indigo-600 mt-0.5">{avgCtr.toFixed(2)}%</div>
        </div>
      </div>

      {/* Visual Bar Chart (Pure CSS Flex columns — Ponytail Compliant) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Daily Impression Volume</span>
          <span>Peak: {peakDaily.toLocaleString('en-US')} / day</span>
        </div>

        <div className="h-28 flex items-end gap-1 sm:gap-1.5 pt-3 pb-1 px-1 bg-white rounded border border-slate-200">
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
                  className="w-full bg-indigo-500 group-hover:bg-indigo-600 rounded-t-xs transition-all duration-100"
                  title={tooltip}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis date range */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
          <span>{startDate}</span>
          <span className="hidden sm:inline">{midDate}</span>
          <span>{endDate} (Today)</span>
        </div>
      </div>
    </div>
  );
}
