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
    <div className="min-h-screen bg-[#130f18] text-[#8b94a3] flex flex-col selection:bg-[#73e5bf] selection:text-[#130f18]">
      {/* Global Navigation */}
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 py-10 outline-none">
        {/* Top Navigation / Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-xs text-[#8b94a3]">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 text-[#73e5bf]" />
            <span>Marketplace</span>
          </Link>
          <span className="text-[#e5e7eb]/20">/</span>
          <span className="text-[#8b94a3] capitalize">{listing.category.replace('-', ' ')}</span>
          <span className="text-[#e5e7eb]/20">/</span>
          <span className="text-white font-medium">{listing.title}</span>
        </nav>

        {/* Hero Listing Card (Graphite Plum #21192a) */}
        <header className="bg-[#21192a] rounded-card border border-[#e5e7eb]/15 p-6 sm:p-8 backdrop-blur-sm mb-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#73e5bf]/15 text-[#73e5bf] border border-[#73e5bf]/30">
              {CATEGORY_NAMES[listing.category] || listing.category}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#2e2d36] text-white border border-[#e5e7eb]/10">
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
              <h1 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
                {listing.title}
              </h1>
              <p className="text-sm sm:text-base text-[#8b94a3] mt-3 leading-relaxed">
                {listing.description}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <a
                href={listing.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-btn text-xs font-semibold text-white bg-[#2e2d36] hover:bg-[#393844] border border-[#e5e7eb]/15 transition-all"
              >
                <span>Visit Website</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#8b94a3]" />
              </a>
            </div>
          </div>

          {/* Quick Stats Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#e5e7eb]/10">
            <div>
              <div className="text-[11px] font-mono text-[#8b94a3] uppercase tracking-wider">Verified Traffic</div>
              <div className="text-lg sm:text-2xl font-bold text-white mt-0.5 tabular-nums">
                {listing.verified_dau.toLocaleString('en-US')} DAU
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#8b94a3] uppercase tracking-wider">Inventory Slots</div>
              <div className="text-lg sm:text-2xl font-bold text-white mt-0.5 tabular-nums">
                {slots.length} Total ({availableSlotsCount} Vacant)
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#8b94a3] uppercase tracking-wider">Platform</div>
              <div className="text-lg sm:text-2xl font-bold text-white mt-0.5">
                {appTypeMeta.label}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-[#8b94a3] uppercase tracking-wider">Listing Status</div>
              <div className="text-lg sm:text-2xl font-bold text-[#73e5bf] mt-0.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#73e5bf] animate-pulse" />
                <span>Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Inventory Slot Showcase Section */}
        <section id="slots" aria-labelledby="inventory-heading" className="space-y-6 scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 id="inventory-heading" className="font-display font-bold text-xl sm:text-3xl text-white tracking-tight">
                Sponsorship Slots & Live Availability
              </h2>
              <p className="text-xs sm:text-sm text-[#8b94a3] mt-0.5">
                Guaranteed 30-day single-tenant terms. Escrow protected with 15% platform take rate.
              </p>
            </div>
            <div className="text-xs font-medium text-[#8b94a3] font-mono">
              <span className="font-bold text-[#73e5bf]">{availableSlotsCount}</span> of {slots.length} bookable now
            </div>
          </div>

          {slots.length === 0 ? (
            <div className="p-12 text-center bg-[#21192a] rounded-card border border-[#e5e7eb]/12">
              <p className="text-[#8b94a3] font-medium text-sm">No inventory slots are configured for this tool yet.</p>
              <p className="text-xs text-[#8b94a3]/70 mt-1">Check back later or explore other developer tools.</p>
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
                    className="bg-[#21192a] rounded-card border border-[#e5e7eb]/15 hover:border-[#73e5bf]/30 transition-all flex flex-col justify-between overflow-hidden shadow-sm"
                  >
                    <div className="p-6">
                      {/* Header: Name + Badges */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono text-[#a37af5] bg-[#2e2d36] border border-[#a37af5]/20 mb-2">
                            {formatMeta.label} • Max {copyLimit} chars
                          </span>
                          <h3 className="font-display font-bold text-lg text-white">{slot.slot_name}</h3>
                        </div>

                        {slot.is_available ? (
                          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#73e5bf]/15 text-[#73e5bf] border border-[#73e5bf]/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#73e5bf] animate-pulse" />
                            <span>Vacant</span>
                          </span>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#2e2d36] text-[#8b94a3] border border-[#e5e7eb]/10">
                            <span>Occupied</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#8b94a3] mb-4">{formatMeta.description}</p>

                      {/* Pricing */}
                      <div className="mb-4 pb-4 border-b border-[#e5e7eb]/10 flex items-baseline gap-2">
                        <span className="font-display font-black text-3xl text-white tabular-nums">
                          {formatCentsToUsd(slot.monthly_price_cents)}
                        </span>
                        <span className="text-xs text-[#8b94a3]">/ 30 days (flat rate)</span>
                      </div>

                      {/* Creator Guidelines */}
                      {slot.guidelines && (
                        <div className="mb-4 p-3.5 rounded-xl bg-[#2e2d36] border border-[#e5e7eb]/10 text-xs text-[#8b94a3]">
                          <span className="font-semibold text-white">Sponsor Guidelines: </span>
                          {slot.guidelines}
                        </div>
                      )}

                      {/* 30-Day Telemetry Chart */}
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-white mb-2">Historical Telemetry (30 Days)</div>
                        <TelemetryChart telemetry={slotTelemetry} slotName={slot.slot_name} slotType={slot.slot_type} />
                      </div>
                    </div>

                    {/* Card CTA Footer */}
                    <div className="p-4 bg-[#2e2d36]/60 border-t border-[#e5e7eb]/10 flex items-center justify-between">
                      <div className="text-[11px] text-[#8b94a3] font-mono">
                        {slot.is_available ? 'Instant booking via escrow' : 'Term active · unavailable'}
                      </div>

                      {slot.is_available ? (
                        <Link
                          href={`/sponsor/${slot.id}`}
                          className="inline-flex items-center justify-center px-5 py-2.5 rounded-btn text-xs font-bold text-[#130f18] bg-[#73e5bf] hover:bg-[#86efac] shadow-mint-led transition-all active:scale-[0.98]"
                        >
                          Book This Slot →
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="inline-flex items-center justify-center px-4 py-2 rounded-btn text-xs font-medium text-[#8b94a3] bg-[#2e2d36] border border-[#e5e7eb]/10 cursor-not-allowed"
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
        <footer className="mt-16 p-6 rounded-card border border-[#e5e7eb]/15 bg-[#21192a] text-center backdrop-blur-sm">
          <h4 className="font-display font-bold text-base text-white">Do you own or maintain {listing.title}?</h4>
          <p className="text-xs text-[#8b94a3] mt-1 max-w-xl mx-auto">
            Manage your inventory slots, adjust monthly pricing, review sponsor submissions, or retrieve embed snippets in the Creator Portal.
          </p>
          <Link
            href="/creator"
            className="inline-block mt-3 text-xs font-bold text-[#73e5bf] hover:underline transition-colors"
          >
            Open Creator Dashboard →
          </Link>
        </footer>
      </main>

      {/* Global Footer */}
      <footer className="border-t border-[#e5e7eb]/10 bg-[#130f18] text-[#8b94a3] py-12 mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <span className="font-display font-black text-lg text-[#ff4070]">NEOTIC ADS</span>
            <span className="text-xs font-normal text-[#8b94a3] ml-2">
              © {new Date().getFullYear()} Neotic Ads. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-[#8b94a3]">
            <Link href="/" className="hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/creator" className="hover:text-white transition-colors">
              Creator Portal
            </Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Edge Simulator
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
