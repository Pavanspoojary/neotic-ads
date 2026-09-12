import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getDb } from '../../../lib/db';
import { formatCentsToUsd } from '../../../lib/escrow';
import { SLOT_COPY_LIMITS, SlotType, ListingCategory, AppType } from '../../../lib/types';
import { VerificationBadge } from '../../../components/VerificationBadge';
import { TelemetryChart } from '../../../components/TelemetryChart';
import { Navbar } from '../../../components/Navbar';
import { ArrowLeft, ExternalLink, Globe, Puzzle, Monitor, Settings } from 'lucide-react';

interface PageProps {
  params: { slug: string } | Promise<{ slug: string }>;
}

const CATEGORY_NAMES: Record<ListingCategory, string> = {
  'developer-tools': 'Developer Tools',
  productivity: 'Productivity',
  design: 'Design',
  utilities: 'Utilities',
};

const APP_TYPE_LABELS: Record<AppType, { label: string; icon: any }> = {
  web_app: { label: 'Web Application', icon: Globe },
  chrome_extension: { label: 'Chrome Extension', icon: Puzzle },
  desktop_app: { label: 'Desktop App', icon: Monitor },
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
  const appTypeMeta = APP_TYPE_LABELS[listing.app_type] || { label: listing.app_type, icon: Settings };
  const AppIcon = appTypeMeta.icon;

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-600 flex flex-col selection:bg-emerald-100 selection:text-emerald-900">
      {/* Global Navigation */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-10 outline-none">
        {/* Top Navigation / Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-950 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 text-zinc-400" />
            <span>Marketplace</span>
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-500 capitalize">{listing.category.replace('-', ' ')}</span>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-950 font-medium">{listing.title}</span>
        </nav>

        {/* Hero Listing Card */}
        <header className="bg-white border border-black/[0.06] rounded-xl p-6 sm:p-8 mb-8 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-500/20">
              {CATEGORY_NAMES[listing.category] || listing.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 border border-black/[0.06]">
              <AppIcon className="w-3.5 h-3.5 text-zinc-500" />
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
              <h1 className="font-display font-bold text-3xl sm:text-5xl text-zinc-950 tracking-tight">
                {listing.title}
              </h1>
              <p className="text-sm sm:text-base text-zinc-600 mt-3 leading-relaxed">
                {listing.description}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <a
                href={listing.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-800 bg-white hover:bg-zinc-50 border border-black/[0.08] hover:border-black/[0.14] transition-all shadow-2xs"
              >
                <span>Visit Website</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              </a>
            </div>
          </div>

          {/* Quick Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-black/[0.06]">
            <div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Verified Traffic</div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-950 mt-0.5 tabular-nums">
                {listing.verified_dau.toLocaleString('en-US')} DAU
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Inventory Slots</div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-950 mt-0.5 tabular-nums">
                {slots.length} Total ({availableSlotsCount} Vacant)
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Platform</div>
              <div className="text-lg sm:text-2xl font-bold text-zinc-950 mt-0.5">
                {appTypeMeta.label}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Listing Status</div>
              <div className="text-lg sm:text-2xl font-bold text-emerald-700 mt-0.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Inventory Slot Showcase Section */}
        <section id="slots" aria-labelledby="inventory-heading" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 id="inventory-heading" className="font-display font-bold text-xl sm:text-3xl text-zinc-950 tracking-tight">
                Sponsorship Slots & Live Availability
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                Guaranteed 30-day single-tenant terms. Escrow protected with 15% platform take rate.
              </p>
            </div>
            <div className="text-xs font-medium text-zinc-500 font-mono">
              <span className="font-bold text-emerald-700">{availableSlotsCount}</span> of {slots.length} bookable now
            </div>
          </div>

          {slots.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-black/[0.06] shadow-2xs">
              <p className="text-zinc-600 font-medium text-sm">No inventory slots are configured for this tool yet.</p>
              <p className="text-xs text-zinc-400 mt-1">Check back later or explore other developer tools.</p>
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
                    className="bg-white rounded-xl border border-black/[0.06] hover:border-black/[0.12] transition-all flex flex-col justify-between overflow-hidden shadow-2xs"
                  >
                    <div className="p-6">
                      {/* Header: Name + Badges */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-600 bg-zinc-100 border border-black/[0.04] mb-2">
                            {formatMeta.label} • Max {copyLimit} chars
                          </span>
                          <h3 className="font-display font-bold text-lg text-zinc-950">{slot.slot_name}</h3>
                        </div>

                        {slot.is_available ? (
                          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Vacant</span>
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-500 border border-black/[0.06]">
                            <span>Occupied</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-600 mb-4">{formatMeta.description}</p>

                      {/* Pricing */}
                      <div className="mb-4 pb-4 border-b border-black/[0.06] flex items-baseline gap-2">
                        <span className="font-display font-black text-3xl text-zinc-950 tabular-nums">
                          {formatCentsToUsd(slot.monthly_price_cents)}
                        </span>
                        <span className="text-xs text-zinc-500">/ 30 days (flat rate)</span>
                      </div>

                      {/* Creator Guidelines */}
                      {slot.guidelines && (
                        <div className="mb-4 p-3.5 rounded-xl bg-zinc-50/80 border border-black/[0.06] text-xs text-zinc-600">
                          <span className="font-semibold text-zinc-950">Sponsor Guidelines: </span>
                          {slot.guidelines}
                        </div>
                      )}

                      {/* 30-Day Telemetry Chart */}
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-zinc-950 mb-2">Historical Telemetry (30 Days)</div>
                        <TelemetryChart telemetry={slotTelemetry} slotName={slot.slot_name} slotType={slot.slot_type} />
                      </div>
                    </div>

                    {/* Card CTA Footer */}
                    <div className="p-4 bg-zinc-50/60 border-t border-black/[0.06] flex items-center justify-between">
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {slot.is_available ? 'Instant booking via escrow' : 'Term active · unavailable'}
                      </div>

                      {slot.is_available ? (
                        <Link
                          href={`/sponsor/${slot.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 shadow-xs hover:shadow transition-all active:scale-[0.98] cursor-pointer"
                        >
                          Book This Slot →
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 bg-zinc-100 border border-black/[0.06] cursor-not-allowed"
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
        <footer className="mt-16 p-6 rounded-xl border border-black/[0.06] bg-white text-center shadow-2xs">
          <h4 className="font-display font-bold text-base text-zinc-950">Do you own or maintain {listing.title}?</h4>
          <p className="text-xs text-zinc-600 mt-1 max-w-xl mx-auto">
            Manage your inventory slots, adjust monthly pricing, review sponsor submissions, or retrieve embed snippets in the Creator Portal.
          </p>
          <Link
            href="/creator"
            className="inline-block mt-3 text-xs font-semibold text-emerald-700 hover:underline transition-colors"
          >
            Open Creator Dashboard →
          </Link>
        </footer>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-black/[0.06] bg-white text-zinc-500 py-12 mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-zinc-950 font-semibold text-sm">
            <span className="font-display font-black text-lg text-zinc-950">NEOTIC ADS</span>
            <span className="text-xs font-normal text-zinc-500 ml-2">
              © {new Date().getFullYear()} Neotic Ads. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link href="/" className="hover:text-zinc-950 transition-colors">
              Marketplace
            </Link>
            <Link href="/creator" className="hover:text-zinc-950 transition-colors">
              Creator Portal
            </Link>
            <Link href="/dashboard" className="hover:text-zinc-950 transition-colors">
              Edge Simulator
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
