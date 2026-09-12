'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { InventorySlot, Listing, SlotType, SLOT_COPY_LIMITS } from '../lib/types';
import { calculateEscrowSplit, calculateTermDates, formatCentsToUsd } from '../lib/escrow';
import { ShieldCheck, Sparkles, CheckCircle2, ArrowRight, ExternalLink, Lock } from 'lucide-react';

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
      <div className="bg-[#21192a] rounded-[24px] border border-[#73e5bf]/30 shadow-sm p-8 text-center max-w-2xl mx-auto my-8">
        <div className="w-14 h-14 bg-[#73e5bf]/10 text-[#73e5bf] border border-[#73e5bf]/25 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-display font-black text-white">Sponsorship Escrow Reserved!</h2>
        <p className="text-[#8b94a3] mt-2 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
          Your creative has been locked for <span className="font-bold text-white">{listing.title}</span> ({slot.slot_name}).
          The 30-day automated escrow hold is active.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-[#2e2d36] border border-[#e5e7eb]/10 text-left text-xs space-y-2.5">
          <div className="flex justify-between">
            <span className="text-[#8b94a3]">Sponsorship ID:</span>
            <span className="font-mono text-zinc-300">{successResult.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b94a3]">Term Duration:</span>
            <span className="font-medium text-white">
              {successResult.start_date} to {successResult.end_date} (30 Days)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b94a3]">Monthly Amount:</span>
            <span className="font-bold text-white tabular-nums">{formatCentsToUsd(successResult.monthly_amount_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b94a3]">Platform Escrow Fee (15%):</span>
            <span className="text-zinc-400 tabular-nums">{formatCentsToUsd(successResult.platform_fee_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b94a3]">Creator Net Direct Payout (85%):</span>
            <span className="text-[#73e5bf] font-bold tabular-nums">{formatCentsToUsd(successResult.creator_payout_cents)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/tools/${listing.slug}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#73e5bf] text-[#130f18] text-xs font-bold hover:bg-[#85ebd0] shadow-mint-led transition-all"
          >
            Return to Tool Listing
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#e5e7eb]/12 bg-[#2e2d36] text-zinc-200 text-xs font-semibold hover:bg-[#383742] transition-colors"
          >
            View Telemetry Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Booking Form */}
      <div className="lg:col-span-7 bg-[#21192a] rounded-[24px] border border-[#e5e7eb]/12 shadow-sm p-6 sm:p-8">
        <h2 className="text-xl font-display font-black text-white mb-1">Reserve Slot & Submit Creative</h2>
        <p className="text-xs text-[#8b94a3] mb-6">
          Submit your non-intrusive in-app creative. Once confirmed, your placement goes live on the edge immediately.
        </p>

        {/* Quick Sample Copy Inserter */}
        <div className="mb-6 p-3.5 rounded-xl bg-[#2e2d36] border border-[#e5e7eb]/10 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#73e5bf]" />
            <span>Fill sample copy:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {sampleCopies.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => applySampleCopy(sample)}
                className="px-2.5 py-1 rounded-lg bg-[#21192a] hover:bg-[#130f18] border border-[#e5e7eb]/10 text-zinc-300 hover:text-white text-[11px] font-medium transition-colors"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Sponsor / Company Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              placeholder="e.g. Supabase, LogFast, PostHog"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e7eb]/12 bg-[#2e2d36] text-sm text-white focus:outline-none focus:border-[#73e5bf] focus:ring-1 focus:ring-[#73e5bf] placeholder-[#8b94a3] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Work Email Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="email"
              required
              value={sponsorEmail}
              onChange={(e) => setSponsorEmail(e.target.value)}
              placeholder="growth@yourbrand.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e7eb]/12 bg-[#2e2d36] text-sm text-white focus:outline-none focus:border-[#73e5bf] focus:ring-1 focus:ring-[#73e5bf] placeholder-[#8b94a3] transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-zinc-300">
                Creative Headline Copy <span className="text-rose-400">*</span>
              </label>
              <span
                className={`text-[11px] font-mono tabular-nums ${
                  isOverLimit ? 'text-rose-400 font-bold' : charPercent > 80 ? 'text-amber-400 font-semibold' : 'text-[#8b94a3]'
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
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-white bg-[#2e2d36] focus:outline-none focus:ring-1 transition-all ${
                isOverLimit
                  ? 'border-rose-500/60 focus:ring-rose-500/40 bg-rose-500/10'
                  : 'border-[#e5e7eb]/12 focus:border-[#73e5bf] focus:ring-[#73e5bf]'
              }`}
            />
            {/* Live Character Progress Gauge */}
            <div className="w-full bg-[#130f18] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isOverLimit ? 'bg-rose-500' : charPercent > 80 ? 'bg-amber-500' : 'bg-[#73e5bf]'
                }`}
                style={{ width: `${charPercent}%` }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Destination Target URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://yourbrand.com/landing?ref=tool"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#e5e7eb]/12 bg-[#2e2d36] text-sm text-white focus:outline-none focus:border-[#73e5bf] focus:ring-1 focus:ring-[#73e5bf] placeholder-[#8b94a3] transition-all"
            />
            <p className="mt-1 text-[11px] text-[#8b94a3]">
              Must be HTTPS. Tracking parameters (utm_source=neotic_ads) will be appended automatically.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || isOverLimit}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#73e5bf] hover:bg-[#85ebd0] px-5 py-3 text-sm font-bold text-[#130f18] shadow-mint-led focus:outline-none focus:ring-2 focus:ring-[#73e5bf] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {loading ? (
              <span>Confirming Escrow...</span>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Confirm 30-Day Sponsorship ({formatCentsToUsd(slot.monthly_price_cents)})</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Live Context Preview & Escrow Terms */}
      <div className="lg:col-span-5 space-y-6">
        {/* Live Rendering Preview Box with Floating White Surface */}
        <div className="bg-[#21192a] rounded-[24px] border border-[#e5e7eb]/12 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#73e5bf]" />
              <span>Live In-App Native Preview</span>
            </h3>
            {/* Format Selector Pills */}
            <div className="flex items-center gap-1">
              {(['header_pill', 'empty_state', 'footer_badge', 'email_footer'] as SlotType[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setPreviewFormat(fmt)}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded-lg uppercase font-bold transition-colors ${
                    previewFormat === fmt
                      ? 'bg-[#73e5bf] text-[#130f18] shadow-mint-led'
                      : 'bg-[#2e2d36] text-[#8b94a3] hover:text-white'
                  }`}
                >
                  {fmt.split('_')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Product Surface (Level 3): The only white surface in the dark UI */}
          <div className="p-5 rounded-2xl bg-[#ffffff] text-[#130f18] border border-zinc-200 shadow-2xl min-h-[160px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <span className="text-[10px] font-mono text-zinc-400 font-medium truncate max-w-[180px]">
                {listing.title} — simulated host app
              </span>
            </div>

            <div className="flex items-center justify-center py-4">
              {previewFormat === 'header_pill' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 shadow-xs">
                  <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#73e5bf]/20 text-[#130f18] border border-[#73e5bf]/40">
                    Sponsored
                  </span>
                  <span className="font-semibold truncate max-w-[240px]">
                    {creativeText || 'Deploy your API in 1-click on YourBrand'}
                  </span>
                </div>
              )}

              {previewFormat === 'empty_state' && (
                <div className="w-full max-w-[300px] p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-left shadow-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[#a37af5]/15 text-[#6c39db] border border-[#a37af5]/30">
                      Recommended Partner
                    </span>
                    <span className="text-[10px] text-zinc-400">Sponsored</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-900 mb-2 leading-snug">
                    {creativeText || 'No active alerts. Need automated Postgres monitoring? Try YourBrand.'}
                  </div>
                  <span className="inline-flex items-center text-[11px] font-bold text-[#6c39db]">
                    Learn more <ArrowRight className="h-3 w-3 ml-1" />
                  </span>
                </div>
              )}

              {previewFormat === 'footer_badge' && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-600 bg-zinc-50 rounded-lg border border-zinc-200 shadow-xs">
                  <span className="font-medium text-zinc-500">Infrastructure Partner:</span>
                  <span className="text-zinc-950 font-bold">
                    {creativeText || 'Hosted on YourBrand'}
                  </span>
                </div>
              )}

              {previewFormat === 'email_footer' && (
                <div className="w-full p-3 rounded-lg bg-zinc-50 border border-dashed border-zinc-300 text-left text-xs text-zinc-700 font-mono">
                  [Digest Footer] Powered by {listing.title}. Sponsored by{' '}
                  <span className="text-[#6c39db] font-bold">
                    {creativeText || 'YourBrand Cloud'}
                  </span>
                </div>
              )}
            </div>

            <div className="text-[10px] text-zinc-400 text-center font-medium">
              Floating product canvas: client DOM representation
            </div>
          </div>
        </div>

        {/* Escrow Terms & Breakdown */}
        <div className="bg-[#21192a] rounded-[24px] border border-[#e5e7eb]/12 shadow-sm p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-3 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-[#73e5bf]" />
            <span>Escrow Guarantee & Term Details</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-[#e5e7eb]/10">
              <span className="text-[#8b94a3]">Monthly Lease Price:</span>
              <span className="font-bold text-white tabular-nums">{formatCentsToUsd(slot.monthly_price_cents)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#e5e7eb]/10">
              <span className="text-[#8b94a3]">30-Day Term Window:</span>
              <span className="text-zinc-300 font-medium">
                {termDates.startDate} → {termDates.endDate}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#e5e7eb]/10">
              <span className="text-[#8b94a3]">Escrow Platform Fee (15%):</span>
              <span className="text-zinc-300 tabular-nums">{formatCentsToUsd(split.platform_fee_cents)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[#8b94a3]">Creator Net Allocation (85%):</span>
              <span className="text-[#73e5bf] font-bold tabular-nums">{formatCentsToUsd(split.creator_payout_cents)}</span>
            </div>
          </div>

          {/* Visual Take-Rate Split Bar */}
          <div className="mt-4 pt-3 border-t border-[#e5e7eb]/10">
            <div className="flex justify-between text-[11px] font-semibold mb-2">
              <span className="text-[#8b94a3]">Take-Rate Allocation</span>
              <span className="text-zinc-300 font-bold">85% Creator • 15% Platform</span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-[#130f18] gap-0.5">
              <div
                className="bg-[#73e5bf] h-full rounded-l-full shadow-[0_0_8px_rgba(115,229,191,0.4)]"
                style={{ width: '85%' }}
                title="85% Creator Direct Net Payout"
              />
              <div
                className="bg-[#a37af5] h-full rounded-r-full"
                style={{ width: '15%' }}
                title="15% Platform Escrow Fee"
              />
            </div>
            <div className="flex justify-between text-[10px] mt-1.5 font-medium">
              <span className="text-[#73e5bf] font-bold">{formatCentsToUsd(split.creator_payout_cents)} (Creator Net)</span>
              <span className="text-[#a37af5] font-bold">{formatCentsToUsd(split.platform_fee_cents)} (Neotic Ads)</span>
            </div>
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-[#2e2d36] border border-[#e5e7eb]/10 text-[11px] text-[#8b94a3] leading-relaxed">
            Funds remain held in escrow. Payout is released to the creator after uptime verification ensures your creative was served faithfully for the term.
          </div>
        </div>
      </div>
    </div>
  );
}
