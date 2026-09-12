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
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-8 text-center max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Sponsorship Escrow Reserved!</h2>
        <p className="text-slate-600 mt-2 text-sm max-w-md mx-auto">
          Your creative has been locked for <span className="font-semibold">{listing.title}</span> ({slot.slot_name}).
          The 30-day escrow hold is active.
        </p>

        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Sponsorship ID:</span>
            <span className="font-mono font-medium text-slate-800">{successResult.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Term Duration:</span>
            <span className="font-medium text-slate-800">
              {successResult.start_date} to {successResult.end_date} (30 Days)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Monthly Amount:</span>
            <span className="font-bold text-slate-900">{formatCentsToUsd(successResult.monthly_amount_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Platform Escrow Fee (15%):</span>
            <span className="text-slate-700">{formatCentsToUsd(successResult.platform_fee_cents)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Creator Direct Net Payout (85%):</span>
            <span className="text-emerald-700 font-semibold">{formatCentsToUsd(successResult.creator_payout_cents)}</span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={`/tools/${listing.slug}`}
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Return to Tool Listing
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
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
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-1">Reserve Slot & Submit Creative</h2>
        <p className="text-xs text-slate-500 mb-6">
          Submit your non-intrusive in-app creative. Once confirmed, your creative goes live on edge immediately.
        </p>

        {/* Quick Sample Copy Inserter */}
        <div className="mb-6 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="font-semibold text-indigo-900 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Fill sample copy:</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {sampleCopies.map((sample) => (
              <button
                key={sample.name}
                type="button"
                onClick={() => applySampleCopy(sample)}
                className="px-2.5 py-1 rounded-md bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 text-[11px] font-medium shadow-3xs transition-colors"
              >
                {sample.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sponsor / Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={sponsorName}
              onChange={(e) => setSponsorName(e.target.value)}
              placeholder="e.g. Supabase, LogFast, PostHog"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={sponsorEmail}
              onChange={(e) => setSponsorEmail(e.target.value)}
              placeholder="growth@yourbrand.com"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Creative Headline Copy <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-[11px] font-mono ${
                  isOverLimit ? 'text-rose-600 font-bold' : charPercent > 80 ? 'text-amber-600 font-semibold' : 'text-slate-400'
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
              className={`w-full px-3.5 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 ${
                isOverLimit
                  ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/30'
                  : 'border-slate-300 focus:ring-indigo-500'
              }`}
            />
            {/* Live Character Progress Gauge */}
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isOverLimit ? 'bg-rose-500' : charPercent > 80 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${charPercent}%` }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Destination Target URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://yourbrand.com/landing?ref=tool"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Must be HTTPS. Tracking parameters (utm_source=sponsorslot) will be appended automatically.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || isOverLimit}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
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
        {/* Live Rendering Preview Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span>Live In-App Native Preview</span>
            </h3>
            {/* Format Selector Pills */}
            <div className="flex items-center gap-1">
              {(['header_pill', 'empty_state', 'footer_badge', 'email_footer'] as SlotType[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setPreviewFormat(fmt)}
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold transition-colors ${
                    previewFormat === fmt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {fmt.split('_')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Render Mock Container */}
          <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200 min-h-[130px] flex items-center justify-center">
            {previewFormat === 'header_pill' && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs text-slate-800">
                <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                  Sponsored
                </span>
                <span className="font-medium truncate max-w-[280px]">
                  {creativeText || 'Deploy your API in 1-click on YourBrand'}
                </span>
              </div>
            )}

            {previewFormat === 'empty_state' && (
              <div className="w-full max-w-[320px] p-4 rounded-xl bg-white border border-slate-200 shadow-xs text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                    Recommended Partner
                  </span>
                  <span className="text-[10px] text-slate-400">Sponsored</span>
                </div>
                <div className="text-xs font-semibold text-slate-900 mb-2">
                  {creativeText || 'No active alerts. Need automated Postgres monitoring? Try YourBrand.'}
                </div>
                <span className="inline-flex items-center text-[11px] font-medium text-indigo-600 hover:text-indigo-800">
                  Learn more <ArrowRight className="h-3 w-3 ml-1" />
                </span>
              </div>
            )}

            {previewFormat === 'footer_badge' && (
              <div className="inline-flex items-center gap-2 px-3 py-1 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Infrastructure Partner:</span>
                <span className="text-indigo-600 font-medium">
                  {creativeText || 'Hosted on YourBrand'}
                </span>
              </div>
            )}

            {previewFormat === 'email_footer' && (
              <div className="w-full p-3 rounded-lg bg-white border border-dashed border-slate-300 text-left text-xs text-slate-600 font-mono">
                [Digest Footer] Report powered by {listing.title}. Sponsored by{' '}
                <span className="text-indigo-600 font-semibold">
                  {creativeText || 'YourBrand Cloud'}
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 text-center">
            Native rendering automatically matches host application themes.
          </p>
        </div>

        {/* Escrow Terms & Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Escrow Guarantee & Term Details</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Monthly Lease Price:</span>
              <span className="font-bold text-slate-900">{formatCentsToUsd(slot.monthly_price_cents)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">30-Day Term Window:</span>
              <span className="text-slate-800 font-medium">
                {termDates.startDate} → {termDates.endDate}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-600">Escrow Platform Fee (15%):</span>
              <span className="text-slate-800">{formatCentsToUsd(split.platform_fee_cents)}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Creator Net Allocation (85%):</span>
              <span className="text-emerald-700 font-bold">{formatCentsToUsd(split.creator_payout_cents)}</span>
            </div>
          </div>

          {/* Visual Take-Rate Split Bar */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-[11px] font-semibold mb-1.5">
              <span className="text-slate-600">Take-Rate Allocation</span>
              <span className="text-slate-900">85% Creator • 15% Platform</span>
            </div>
            <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-100 gap-0.5">
              <div
                className="bg-emerald-500 h-full rounded-l-full"
                style={{ width: '85%' }}
                title="85% Creator Direct Net Payout"
              />
              <div
                className="bg-indigo-600 h-full rounded-r-full"
                style={{ width: '15%' }}
                title="15% Platform Escrow Fee"
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-medium">
              <span className="text-emerald-700 font-bold">{formatCentsToUsd(split.creator_payout_cents)} (Creator Net)</span>
              <span className="text-indigo-700 font-bold">{formatCentsToUsd(split.platform_fee_cents)} (SponsorSlot)</span>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-800 leading-relaxed">
            Funds remain held in escrow. Payout is released to the creator after uptime verification ensures your creative was served faithfully for the term.
          </div>
        </div>
      </div>
    </div>
  );
}


