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
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 outline-none">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="hover:text-white transition-colors">
            Marketplace
          </Link>
          <span className="text-zinc-700">/</span>
          <Link href={`/tools/${listing.slug}`} className="hover:text-white transition-colors">
            {listing.title}
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-300 font-medium">Sponsor {slot.slot_name}</span>
        </div>

        {/* Listing & Slot Header Summary */}
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] shadow-inner-border backdrop-blur-sm p-6 sm:p-8 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="text-xl font-extrabold text-white">{listing.title}</span>
              <VerificationBadge
                source={listing.verification_source}
                dau={listing.verified_dau}
                size="sm"
              />
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Booking inventory slot: <span className="font-semibold text-white">{slot.slot_name}</span> ({slot.slot_type}).
              Placed in high-engagement workflows with {listing.verified_dau.toLocaleString()} verified DAU.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <a
              href={listing.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-zinc-300 transition-colors"
            >
              <span>Visit Tool</span>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
            </a>
            <Link
              href={`/tools/${listing.slug}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 border border-white/[0.08] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
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
