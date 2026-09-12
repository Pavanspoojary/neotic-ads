'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { InventorySlot, Listing, SlotType, SLOT_COPY_LIMITS } from '../lib/types';
import { calculateEscrowSplit, calculateTermDates, formatCentsToUsd } from '../lib/escrow';
import { ShieldCheck, FileText, Eye, CheckCircle2, ArrowRight, ExternalLink, Lock } from 'lucide-react';

interface SponsorBookingClientProps {
  slot: InventorySlot;
  listing: Listing;
}

export function SponsorBookingClient({ slot, listing }: SponsorBookingClientProps) {
  const maxChars = SLOT_COPY_LIMITS[slot.slot_type] || 80;
  const split = calculateEscrowSplit(slot.monthly_price_cents);
  const termDates = calculateTermDates(new Date());

  const [sponsorName, setSponsorName] = useState('');
  const [sponsorEmail, setSponsorEmail] = useState('');
  const [creativeText, setCreativeText] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);
  const [previewFormat, setPreviewFormat] = useState<SlotType>(slot.slot_type);

  const charCount = creativeText.length;
  const isOverLimit = charCount > maxChars;
  const charPercent = Math.min(100, Math.round((charCount / maxChars) * 100));

  const sampleCopies = [
    {
      name: 'Cloud / DevTools',
      text: `Deploy modern serverless Postgres & Auth with Supabase in seconds`,
      url: 'https://supabase.com?utm_source=sponsorslot',
    },
    {
      name: 'Observability',
      text: `Real-time Next.js application logs & exception tracing with LogFast`,
      url: 'https://logfast.io?utm_source=sponsorslot',
    },
    {
      name: 'Productivity',
      text: `SuperTask AI turns messy browser tabs into automated action plans`,
      url: 'https://supertask.app?utm_source=sponsorslot',
    },
  ];

  const applySampleCopy = (sample: { text: string; url: string }) => {
    setCreativeText(sample.text.slice(0, maxChars));
    setTargetUrl(sample.url);
    if (!sponsorName) setSponsorName('Acme Dev Corp');
    if (!sponsorEmail) setSponsorEmail('growth@acmedev.io');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetUrl.startsWith('https://')) {
      setError('Target URL must begin with https://');
      return;
    }

    if (isOverLimit) {
      setError(`Copy exceeds the maximum limit of ${maxChars} characters.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/sponsorships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: slot.id,
          sponsor_name: sponsorName,
          sponsor_email: sponsorEmail,
          creative_text: creativeText,
          creative_target_url: targetUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking');
      }

      setSuccessResult(data.sponsorship);
    } catch (err: any) {
      setError(err.message || 'Booking submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (successResult) {
    return (
      <div className="bg-white rounded-xl border border-black/[0.06] shadow-2xs p-7 text-center max-w-lg mx-auto my-6">
        <div className="w-11 h-11 bg-emerald-500/[0.08] text-emerald-700 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3.5">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-display font-semibold text-zinc-950 tracking-tight">Sponsorship Escrow Reserved!</h2>
        <p className="text-zinc-500 mt-1.5 text-xs max-w-md mx-auto leading-relaxed">
          Your creative has been locked for <span className="font-medium text-zinc-950">{listing.title}</span> ({slot.slot_name}).
          The 30-day automated escrow hold is active.
        </p>

        <div className="mt-5 p-3.5 rounded-lg bg-zinc-50/60 border border-black/[0.06] text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-zinc-500">Sponsorship ID:</span>
            <span className="font-mono text-zinc-800">{successResult.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Term Duration:</span>
            <span className="font-medium text-zinc-950">
              {successResult.start_date} to {successResult.end_date} (30 Days)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Monthly Amount:</span>
            <span className="font-semibold text-zinc-950 tabular-nums">{formatCentsToUsd(successResult.monthly_amount_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Platform Escrow Fee (15%):</span>
            <span className="text-zinc-600 tabular-nums">{formatCentsToUsd(successResult.platform_fee_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Creator Net Direct Payout (85%):</span>
            <span className="text-emerald-700 font-semibold tabular-nums">{formatCentsToUsd(successResult.creator_payout_cents)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href={`/tools/${listing.slug}`}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-medium shadow-xs hover:shadow transition-all text-center cursor-pointer"
          >
            Return to Tool Listing
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-black/[0.08] bg-white text-zinc-700 text-xs font-medium hover:bg-zinc-50 transition-colors shadow-2xs text-center"
          >
            View Telemetry Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Booking Form */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-black/[0.06] shadow-2xs p-5 sm:p-6">
        <h2 className="text-base sm:text-lg font-display font-semibold text-zinc-950 mb-0.5 tracking-tight">Reserve Slot & Submit Creative</h2>
        <p className="text-xs text-zinc-500 mb-5">
          Submit your non-intrusive in-app creative. Once confirmed, your placement goes live on the edge immediately.
        </p>

        {/* Quick Sample Copy Inserter */}
        <div className="mb-5 p-3 rounded-lg bg-zinc-50/60 border border-black/[0.06] flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="font-medium text-zinc-700 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-zinc-600" />
            <span>Fill sample copy:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {sampleCopies.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => applySampleCopy(sample)}
                className="px-2 py-0.5 rounded-md bg-white hover:bg-zinc-50 border border-black/[0.08] text-zinc-700 text-[11px] font-medium transition-colors shadow-2xs cursor-pointer"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-500/[0.08] border border-rose-500/20 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Sponsor / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              placeholder="e.g. Supabase, LogFast, PostHog"
              className="w-full px-3 py-2 rounded-lg border border-black/[0.08] bg-white text-xs text-zinc-950 focus:outline-none focus:border-black/25 focus:ring-2 focus:ring-black/[0.04] placeholder:text-zinc-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Work Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={sponsorEmail}
              onChange={(e) => setSponsorEmail(e.target.value)}
              placeholder="growth@yourbrand.com"
              className="w-full px-3 py-2 rounded-lg border border-black/[0.08] bg-white text-xs text-zinc-950 focus:outline-none focus:border-black/25 focus:ring-2 focus:ring-black/[0.04] placeholder:text-zinc-400 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-zinc-700">
                Creative Headline Copy <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono tabular-nums ${
                  isOverLimit ? 'text-rose-600 font-semibold' : charPercent > 80 ? 'text-amber-600 font-medium' : 'text-zinc-400'
                }`}
              >
                {charCount} / {maxChars} chars
              </span>
            </div>
            <input
              type="text"
              required
              value={creativeText}
              onChange={(e) => setCreativeText(e.target.value)}
              placeholder={`Deploy APIs in 1-click on YourBrand (Max ${maxChars} chars)`}
              className={`w-full px-3 py-2 rounded-lg border text-xs text-zinc-950 bg-white focus:outline-none focus:ring-2 transition-all ${
                isOverLimit
                  ? 'border-rose-300 focus:ring-rose-100 bg-rose-500/[0.04]'
                  : 'border-black/[0.08] focus:border-black/25 focus:ring-black/[0.04]'
              }`}
            />
            {/* Live Character Progress Gauge */}
            <div className="w-full bg-zinc-100 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isOverLimit ? 'bg-rose-500' : charPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${charPercent}%` }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Destination Target URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://yourbrand.com/landing?ref=tool"
              className="w-full px-3 py-2 rounded-lg border border-black/[0.08] bg-white text-xs text-zinc-950 focus:outline-none focus:border-black/25 focus:ring-2 focus:ring-black/[0.04] placeholder:text-zinc-400 transition-all"
            />
            <p className="mt-1 text-[11px] text-zinc-400">
              Must be HTTPS. Tracking parameters (utm_source=neotic_ads) will be appended automatically.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || isOverLimit}
            className="w-full mt-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:shadow focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <span>Confirming Escrow...</span>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                <span>Confirm 30-Day Sponsorship ({formatCentsToUsd(slot.monthly_price_cents)})</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Live Context Preview & Escrow Terms */}
      <div className="lg:col-span-5 space-y-5">
        {/* Live Rendering Preview Box with Floating Surface */}
        <div className="bg-white rounded-xl border border-black/[0.06] shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-zinc-600" />
              <span>Live In-App Native Preview</span>
            </h3>
            {/* Format Selector Pills */}
            <div className="flex items-center gap-1">
              {(['header_pill', 'empty_state', 'footer_badge', 'email_footer'] as SlotType[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setPreviewFormat(fmt)}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-md uppercase font-medium transition-colors cursor-pointer ${
                    previewFormat === fmt
                      ? 'bg-zinc-950 text-white shadow-2xs'
                      : 'bg-zinc-100 text-zinc-600 hover:text-zinc-950 border border-black/[0.06]'
                  }`}
                >
                  {fmt.split('_')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Product Surface */}
          <div className="p-4 rounded-xl bg-[#fafafa] text-zinc-900 border border-black/[0.06] shadow-2xs min-h-[150px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.04]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-300" />
                <span className="w-2 h-2 rounded-full bg-zinc-300" />
                <span className="w-2 h-2 rounded-full bg-zinc-300" />
              </div>
              <span className="text-[10px] font-mono text-zinc-400 font-medium truncate max-w-[180px]">
                {listing.title} — simulated host app
              </span>
            </div>

            <div className="flex items-center justify-center py-4">
              {previewFormat === 'header_pill' && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-black/[0.08] text-xs text-zinc-900 shadow-2xs">
                  <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-500/[0.08] text-emerald-800 border border-emerald-500/20">
                    Sponsored
                  </span>
                  <span className="font-medium truncate max-w-[240px]">
                    {creativeText || 'Deploy your API in 1-click on YourBrand'}
                  </span>
                </div>
              )}

              {previewFormat === 'empty_state' && (
                <div className="w-full max-w-[300px] p-3.5 rounded-xl bg-white border border-black/[0.08] text-left shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-black/[0.06]">
                      Recommended Partner
                    </span>
                    <span className="text-[10px] text-zinc-400">Sponsored</span>
                  </div>
                  <div className="text-xs font-medium text-zinc-900 mb-2 leading-snug">
                    {creativeText || 'No active alerts. Need automated Postgres monitoring? Try YourBrand.'}
                  </div>
                  <span className="inline-flex items-center text-[11px] font-medium text-emerald-700">
                    Learn more <ArrowRight className="h-3 w-3 ml-1" />
                  </span>
                </div>
              )}

              {previewFormat === 'footer_badge' && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 bg-white rounded-lg border border-black/[0.08] shadow-2xs">
                  <span className="font-normal text-zinc-500">Infrastructure Partner:</span>
                  <span className="text-zinc-950 font-medium">
                    {creativeText || 'Hosted on YourBrand'}
                  </span>
                </div>
              )}

              {previewFormat === 'email_footer' && (
                <div className="w-full p-3 rounded-lg bg-white border border-dashed border-black/[0.1] text-left text-xs text-zinc-700 font-mono">
                  [Digest Footer] Powered by {listing.title}. Sponsored by{' '}
                  <span className="text-emerald-700 font-medium">
                    {creativeText || 'YourBrand Cloud'}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[10px] text-zinc-400 text-center font-normal">
              Floating product canvas: client DOM representation
            </div>
          </div>
        </div>

        {/* Escrow Terms & Breakdown */}
        <div className="bg-white rounded-xl border border-black/[0.06] shadow-2xs p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Escrow Guarantee & Term Details</span>
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-black/[0.04]">
              <span className="text-zinc-500">Monthly Lease Price:</span>
              <span className="font-medium text-zinc-950 tabular-nums">{formatCentsToUsd(slot.monthly_price_cents)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-black/[0.04]">
              <span className="text-zinc-500">30-Day Term Window:</span>
              <span className="text-zinc-700 font-medium">
                {termDates.startDate} → {termDates.endDate}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-black/[0.04]">
              <span className="text-zinc-500">Escrow Platform Fee (15%):</span>
              <span className="text-zinc-600 tabular-nums">-{formatCentsToUsd(split.platform_fee_cents)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-zinc-500">Creator Net Allocation (85%):</span>
              <span className="text-emerald-700 font-semibold tabular-nums">+{formatCentsToUsd(split.creator_payout_cents)}</span>
            </div>
          </div>

          {/* Visual Take-Rate Split Bar */}
          <div className="mt-3.5 pt-3 border-t border-black/[0.04]">
            <div className="flex justify-between text-[11px] font-medium mb-1.5">
              <span className="text-zinc-500">Take-Rate Allocation</span>
              <span className="text-zinc-700 font-semibold">85% Creator • 15% Platform</span>
            </div>
            <div className="h-2 w-full rounded-full overflow-hidden flex bg-zinc-100 gap-0.5">
              <div
                className="bg-emerald-500 h-full rounded-l-full"
                style={{ width: '85%' }}
                title="85% Creator Direct Net Payout"
              />
              <div
                className="bg-zinc-950 h-full rounded-r-full"
                style={{ width: '15%' }}
                title="15% Platform Escrow Fee"
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1.5 font-normal">
              <span className="text-emerald-700 font-medium">{formatCentsToUsd(split.creator_payout_cents)} (Creator Net)</span>
              <span className="text-zinc-800 font-medium">{formatCentsToUsd(split.platform_fee_cents)} (Neotic Ads)</span>
            </div>
          </div>

          <div className="mt-3.5 p-3 rounded-lg bg-zinc-50/60 border border-black/[0.06] text-[11px] text-zinc-500 leading-relaxed">
            Funds remain held in escrow. Payout is released to the creator after uptime verification ensures your creative was served faithfully for the term.
          </div>
        </div>
      </div>
    </div>
  );
}
