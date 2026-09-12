import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getDb } from '../../../lib/db';
import { formatCentsToUsd } from '../../../lib/escrow';
import { SLOT_COPY_LIMITS, SlotType, ListingCategory, AppType } from '../../../lib/types';
import { VerificationBadge } from '../../../components/VerificationBadge';
import { TelemetryChart } from '../../../components/TelemetryChart';
import { Navbar } from '../../../components/Navbar';
import { Sparkles, ArrowLeft, ExternalLink } from 'lucide-react';

interface PageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

const CATEGORY_NAMES: Record<ListingCategory, string> = {
  'developer-tools': 'Developer Tools',
  productivity: 'Productivity',
  design: 'Design',
  utilities: 'Utilities',
};

const APP_TYPE_LABELS: Record<AppType, { label: string; icon: string }> = {
  web_app: { label: 'Web Application', icon: '🌐' },
  chrome_extension: { label: 'Chrome Extension', icon: '🧩' },
  desktop_app: { label: 'Desktop App', icon: '💻' },
};

const SLOT_FORMAT_META: Record<SlotType, { label: string; description: string }> = {
  header_pill: {
    label: 'Header Pill',
    description: 'Prominent, non-intrusive pill placed directly in primary application navigation.',
  },
  empty_state: {
    label: 'Empty State Canvas',
    description: 'Contextually relevant placement rendered during zero-data or setup states.',
  },
  footer_badge: {
    label: 'Footer Badge',
    description: 'Discreet, high-trust partner link displayed in application footers or settings drawers.',
  },
  email_footer: {
    label: 'Email Digest Footer',
    description: 'Native single-sponsor attribution included in periodic developer dispatch emails.',
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const db = getDb();
  const listing = await db.getListingBySlug(decodeURIComponent(slug));

  if (!listing) {
    return {
      title: 'Tool Not Found — SponsorSlot',
      description: 'The requested micro-tool listing could not be found.',
    };
  }

  return {
    title: `${listing.title} — In-App Micro-Sponsorships | SponsorSlot`,
    description: `${listing.description} Reach ${listing.verified_dau.toLocaleString('en-US')} verified daily active users with flat-rate 30-day sponsorships.`,
  };
}

export default async function ToolDetailPage({ params }: PageProps) {
  const { slug } = await Promise.resolve(params);
  const db = getDb();
  const listing = await db.getListingBySlug(decodeURIComponent(slug));

  if (!listing || listing.status !== 'active') {
    notFound();
  }

  const slots = await db.getSlotsByListingId(listing.id);

  // Fetch 30-day telemetry history for each slot in parallel
  const telemetryEntries = await Promise.all(
    slots.map(async (slot) => {
      const telemetry = await db.getTelemetry(slot.id, 30);
      return [slot.id, telemetry] as const;
    })
  );
  const telemetryMap = Object.fromEntries(telemetryEntries);

  const availableSlotsCount = slots.filter((s) => s.is_available).length;
  const appTypeMeta = APP_TYPE_LABELS[listing.app_type] || { label: listing.app_type, icon: '⚙️' };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Global Navigation */}
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Top Navigation / Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Marketplace</span>
          </Link>
          <span>/</span>
          <span className="text-slate-400 capitalize">{listing.category.replace('-', ' ')}</span>
          <span>/</span>
          <span className="text-slate-900 font-medium">{listing.title}</span>
        </nav>

        {/* Hero Listing Card */}
        <header className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {CATEGORY_NAMES[listing.category] || listing.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              <span>{appTypeMeta.icon}</span>
              <span>{appTypeMeta.label}</span>
            </span>
            <VerificationBadge
              source={listing.verification_source}
              dau={listing.verified_dau}
              identifier={listing.verification_identifier}
              showDetails={true}
            />
          </div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {listing.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mt-3 leading-relaxed">
                {listing.description}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <a
                href={listing.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                <span>Visit Website</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verified Traffic</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {listing.verified_dau.toLocaleString('en-US')} DAU
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inventory Slots</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {slots.length} Total ({availableSlotsCount} Available)
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Platform</div>
              <div className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {appTypeMeta.label}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Listing Status</div>
              <div className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Inventory Slot Showcase Section */}
        <section aria-labelledby="inventory-heading" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 id="inventory-heading" className="text-2xl font-bold text-slate-900 tracking-tight">
                Sponsorship Slots & Availability
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Guaranteed 30-day single-tenant terms. Escrow protected with 15% platform take rate.
              </p>
            </div>
            <div className="text-sm font-medium text-slate-600">
              <span className="font-bold text-indigo-600">{availableSlotsCount}</span> of {slots.length} bookable now
            </div>
          </div>

          {slots.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
              <p className="text-slate-600 font-medium">No inventory slots are configured for this tool yet.</p>
              <p className="text-xs text-slate-400 mt-1">Check back later or explore other developer tools.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {slots.map((slot) => {
                const formatMeta = SLOT_FORMAT_META[slot.slot_type] || {
                  label: slot.slot_type,
                  description: 'Standard native sponsorship slot.',
                };
                const copyLimit = SLOT_COPY_LIMITS[slot.slot_type] || 80;
                const slotTelemetry = telemetryMap[slot.id] || [];

                return (
                  <div
                    key={slot.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Header: Name + Badges */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 mb-2">
                            {formatMeta.label} • Max {copyLimit} chars
                          </span>
                          <h3 className="text-lg font-bold text-slate-900">{slot.slot_name}</h3>
                        </div>

                        {slot.is_available ? (
                          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Available</span>
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Occupied</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 mb-4">{formatMeta.description}</p>

                      {/* Pricing */}
                      <div className="mb-4 pb-4 border-b border-slate-100 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-slate-900">
                          {formatCentsToUsd(slot.monthly_price_cents)}
                        </span>
                        <span className="text-xs text-slate-500">/ 30 days (flat rate)</span>
                      </div>

                      {/* Creator Guidelines */}
                      {slot.guidelines && (
                        <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                          <span className="font-semibold text-slate-800">Sponsor Guidelines: </span>
                          {slot.guidelines}
                        </div>
                      )}

                      {/* 30-Day Telemetry Chart */}
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-slate-700 mb-2">Historical Telemetry (30 Days)</div>
                        <TelemetryChart telemetry={slotTelemetry} slotName={slot.slot_name} slotType={slot.slot_type} />
                      </div>
                    </div>

                    {/* Card CTA Footer */}
                    <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">
                        {slot.is_available ? 'Instant booking via escrow' : 'Check back when term concludes'}
                      </div>

                      {slot.is_available ? (
                        <Link
                          href={`/sponsor/${slot.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs hover:shadow transition-all"
                        >
                          Book This Slot →
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                        >
                          Currently Leased
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Creator Callout Footer */}
        <footer className="mt-16 p-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center">
          <h4 className="text-sm font-bold text-slate-800">Do you own or maintain {listing.title}?</h4>
          <p className="text-xs text-slate-600 mt-1 max-w-xl mx-auto">
            Manage your inventory slots, adjust monthly pricing, review sponsor submissions, or retrieve embed snippets in the Creator Portal.
          </p>
          <Link
            href="/creator"
            className="inline-block mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Open Creator Dashboard →
          </Link>
        </footer>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <span>SponsorSlot</span>
            <span className="text-xs font-normal text-slate-500 ml-2">
              © {new Date().getFullYear()} SponsorSlot. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/creator" className="hover:text-white transition-colors">
              Creator Portal
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Telemetry Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
