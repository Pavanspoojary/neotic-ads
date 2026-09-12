import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getDb } from '../../../lib/db';
import { Navbar } from '../../../components/Navbar';
import { SponsorBookingClient } from '../../../components/SponsorBookingClient';
import { VerificationBadge } from '../../../components/VerificationBadge';
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';

interface PageProps {
  params: { slotId: string } | Promise<{ slotId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slotId } = await Promise.resolve(params);
  const db = getDb();
  const slot = await db.getSlotById(slotId);

  if (!slot) {
    return {
      title: 'Slot Not Found — SponsorSlot',
      description: 'The requested inventory slot could not be found.',
    };
  }

  const listing = await db.getListingById(slot.listing_id);

  return {
    title: `Sponsor ${slot.slot_name} on ${listing?.title || 'App'} — SponsorSlot`,
    description: `Book non-intrusive 30-day in-app sponsorship on ${listing?.title || 'SaaS'}.`,
  };
}

export default async function SponsorBookingPage({ params }: PageProps) {
  const { slotId } = await Promise.resolve(params);
  const db = getDb();

  const slot = await db.getSlotById(slotId);
  if (!slot) {
    notFound();
  }

  const listing = await db.getListingById(slot.listing_id);
  if (!listing) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-600 flex flex-col selection:bg-emerald-500/10 selection:text-emerald-950">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-9 outline-none">
        {/* Breadcrumb Navigation */}
        <div className="mb-5 flex items-center gap-1.5 text-xs text-zinc-400">
          <Link href="/" className="text-zinc-500 hover:text-zinc-950 transition-colors">
            Marketplace
          </Link>
          <span>/</span>
          <Link href={`/tools/${listing.slug}`} className="text-zinc-500 hover:text-zinc-950 transition-colors">
            {listing.title}
          </Link>
          <span>/</span>
          <span className="text-zinc-900 font-medium">Sponsor {slot.slot_name}</span>
        </div>

        {/* Listing & Slot Header Summary */}
        <div className="bg-white border border-black/[0.06] rounded-xl p-5 sm:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-2xs">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <span className="text-lg sm:text-xl font-display font-semibold text-zinc-950 tracking-tight">{listing.title}</span>
              <VerificationBadge
                source={listing.verification_source}
                dau={listing.verified_dau}
                size="sm"
              />
            </div>
            <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
              Booking inventory slot: <span className="font-medium text-zinc-950">{slot.slot_name}</span> ({slot.slot_type}).
              Directly embedded in high-engagement workflows with {listing.verified_dau.toLocaleString()} verified DAU.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2.5">
            <a
              href={listing.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/[0.08] bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors shadow-2xs"
            >
              <span>Visit Tool</span>
              <ExternalLink className="h-3 w-3 text-zinc-400" />
            </a>
            <Link
              href={`/tools/${listing.slug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 border border-black/[0.08] transition-colors shadow-2xs"
            >
              <ArrowLeft className="h-3 w-3 text-zinc-400" />
              <span>All Slots</span>
            </Link>
          </div>
        </div>

        {/* Interactive Advertiser Booking Studio Client */}
        <SponsorBookingClient slot={slot} listing={listing} />
      </main>
    </div>
  );
}
