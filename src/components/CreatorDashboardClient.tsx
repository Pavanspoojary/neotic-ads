'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Listing, InventorySlot, SlotType } from '../lib/types';
import { ListingForm } from './ListingForm';
import { SlotManager } from './SlotManager';
import { VerificationBadge } from './VerificationBadge';
import { formatCentsToUsd } from '../lib/escrow';
import {
  Layers,
  PlusCircle,
  ExternalLink,
  Tag,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Settings,
  Eye,
} from 'lucide-react';

export interface CreatorDashboardClientProps {
  initialListings: Listing[];
  initialSlots: InventorySlot[];
}

const SLOT_TYPE_LABELS: Record<SlotType, { label: string; bgClass: string }> = {
  header_pill: { label: 'Header Pill', bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80' },
  empty_state: { label: 'Empty State Canvas', bgClass: 'bg-violet-50 text-violet-800 border-violet-200/80' },
  footer_badge: { label: 'Footer Badge', bgClass: 'bg-sky-50 text-sky-800 border-sky-200/80' },
  email_footer: { label: 'Email Digest Footer', bgClass: 'bg-amber-50 text-amber-800 border-amber-200/80' },
};

export function CreatorDashboardClient({
  initialListings,
  initialSlots,
}: CreatorDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'tools' | 'onboard'>('tools');
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [slots, setSlots] = useState<InventorySlot[]>(initialSlots);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(
    initialListings.length > 0 ? initialListings[0].id : null
  );

  // Group slots by listing_id
  const slotsMap = new Map<string, InventorySlot[]>();
  for (const slot of slots) {
    const group = slotsMap.get(slot.listing_id) || [];
    group.push(slot);
    slotsMap.set(slot.listing_id, group);
  }

  const existingSlugs = listings.map((l) => l.slug);

  const handleToolCreated = (newListing: Listing) => {
    setListings((prev) => [newListing, ...prev]);
    setExpandedToolId(newListing.id);
    setActiveTab('tools');
  };

  const handleSlotCreated = (newSlot: InventorySlot) => {
    setSlots((prev) => [...prev, newSlot]);
  };

  const handleSlotUpdated = (updatedSlot: InventorySlot) => {
    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${
              activeTab === 'tools'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-white text-zinc-600 hover:text-zinc-950 border border-black/[0.06] hover:border-black/[0.12] shadow-2xs'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>My Registered Tools ({listings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('onboard')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.98] cursor-pointer ${
              activeTab === 'onboard'
                ? 'bg-zinc-950 text-white shadow-xs'
                : 'bg-white text-zinc-600 hover:text-zinc-950 border border-black/[0.06] hover:border-black/[0.12] shadow-2xs'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Register New Tool</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Registered Tools & Slot Inventory View */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          {listings.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-xl border border-dashed border-black/[0.1] p-8 shadow-2xs">
              <Layers className="h-9 w-9 mx-auto text-zinc-400 mb-2.5" />
              <h3 className="text-sm font-semibold text-zinc-950">No tools registered yet</h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
                Onboard your first micro-tool or Chrome extension to configure ad inventory and start earning 85% net payouts.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('onboard')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-medium shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Register First Tool</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {listings.map((tool) => {
                const toolSlots = slotsMap.get(tool.id) || [];
                const vacantCount = toolSlots.filter((s) => s.is_available).length;
                const monthlyGrossCents = toolSlots.reduce((sum, s) => sum + s.monthly_price_cents, 0);
                const monthlyNetCents = Math.round(monthlyGrossCents * 0.85);
                const isExpanded = expandedToolId === tool.id;

                return (
                  <div
                    key={tool.id}
                    className="bg-white rounded-xl border border-black/[0.06] hover:border-black/[0.12] transition-all overflow-hidden shadow-2xs"
                  >
                    {/* Tool Header Card */}
                    <div className="p-5 sm:p-6 border-b border-black/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                          <h3 className="text-base font-semibold text-zinc-950 font-display tracking-tight">{tool.title}</h3>
                          <VerificationBadge
                            source={tool.verification_source}
                            dau={tool.verified_dau}
                            size="sm"
                          />
                        </div>
                        <p className="text-xs text-zinc-500 max-w-xl line-clamp-2 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/[0.08] bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-zinc-400" />
                          <span>View Public Page</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => setExpandedToolId(isExpanded ? null : tool.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-medium shadow-xs hover:shadow transition-all cursor-pointer"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>{isExpanded ? 'Hide Slots' : `Manage Slots (${toolSlots.length})`}</span>
                        </button>
                      </div>
                    </div>

                    {/* Metrics Ribbon */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-black/[0.04] bg-zinc-50/50 border-b border-black/[0.04] text-xs">
                      <div className="p-3.5 text-center">
                        <span className="text-[10px] uppercase font-medium text-zinc-400 block tracking-wider">Verified DAU</span>
                        <span className="text-sm font-semibold text-zinc-950 tabular-nums">
                          {tool.verified_dau.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3.5 text-center">
                        <span className="text-[10px] uppercase font-medium text-zinc-400 block tracking-wider">Total Slots</span>
                        <span className="text-sm font-semibold text-zinc-950 tabular-nums">
                          {toolSlots.length}
                        </span>
                      </div>
                      <div className="p-3.5 text-center">
                        <span className="text-[10px] uppercase font-medium text-zinc-400 block tracking-wider">Available</span>
                        <span className="text-sm font-semibold text-emerald-700 tabular-nums">
                          {vacantCount}
                        </span>
                      </div>
                      <div className="p-3.5 text-center">
                        <span className="text-[10px] uppercase font-medium text-zinc-400 block tracking-wider">Monthly Potential</span>
                        <span className="text-sm font-semibold text-zinc-950 tabular-nums">
                          {formatCentsToUsd(monthlyNetCents)}
                          <span className="text-[10px] font-normal text-zinc-400"> / mo</span>
                        </span>
                      </div>
                    </div>

                    {/* Expandable Slot Manager Drawer */}
                    {isExpanded && (
                      <div className="p-5 sm:p-6 bg-[#fafafa] border-t border-black/[0.04]">
                        <SlotManager
                          listingId={tool.id}
                          listingSlug={tool.slug}
                          initialSlots={toolSlots}
                          onSlotCreated={handleSlotCreated}
                          onSlotUpdated={handleSlotUpdated}
                        />
                      </div>
                    )}

                    {/* Collapsed Inventory Quick Preview */}
                    {!isExpanded && toolSlots.length > 0 && (
                      <div className="p-5 bg-[#fafafa]">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Configured Inventory Slots ({toolSlots.length})</span>
                            <span className="text-emerald-800 font-medium bg-emerald-500/[0.08] px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                              {vacantCount} vacant & rentable
                            </span>
                          </div>
                        </div>

                        {toolSlots.length === 0 ? (
                          <div className="p-4 rounded-xl border border-dashed border-black/[0.1] bg-white text-center text-xs text-zinc-500">
                            No slots configured yet. Click &quot;Manage Slots&quot; to configure your first standardized placement.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {toolSlots.map((slot) => {
                              const meta =
                                SLOT_TYPE_LABELS[slot.slot_type] || {
                                  label: slot.slot_type,
                                  bgClass: 'bg-zinc-100 text-zinc-700 border-black/[0.04]',
                                };
                              const creatorPayout = Math.round(slot.monthly_price_cents * 0.85);

                              return (
                                <div
                                  key={slot.id}
                                  className="bg-white rounded-xl p-4 border border-black/[0.06] flex flex-col justify-between hover:border-black/[0.12] transition-all shadow-2xs"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${meta.bgClass}`}
                                      >
                                        {meta.label}
                                      </span>
                                      {slot.is_available ? (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          <span>Vacant</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-black/[0.04]">
                                          <Clock className="h-2.5 w-2.5" />
                                          <span>Occupied</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-bold text-xs text-zinc-950 mb-1">
                                      {slot.slot_name}
                                    </div>
                                    {slot.guidelines && (
                                      <p className="text-[11px] text-zinc-500 line-clamp-1 mb-2">
                                        Guidelines: {slot.guidelines}
                                      </p>
                                    )}
                                  </div>

                                  <div className="pt-2.5 border-t border-black/[0.04] flex items-center justify-between mt-2">
                                    <div>
                                      <span className="text-[10px] text-zinc-400">Rate: </span>
                                      <span className="text-xs font-bold text-zinc-950 tabular-nums">
                                        {formatCentsToUsd(slot.monthly_price_cents)}/mo
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-bold text-emerald-700 tabular-nums">
                                      {formatCentsToUsd(creatorPayout)} take-home
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Expanded SlotManager View */}
                    {isExpanded && (
                      <div className="p-6 bg-[#fafafa] border-t border-black/[0.06]">
                        <SlotManager
                          listingId={tool.id}
                          listingSlug={tool.slug}
                          initialSlots={toolSlots}
                          onSlotCreated={handleSlotCreated}
                          onSlotUpdated={handleSlotUpdated}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Tool Onboarding Form View */}
      {activeTab === 'onboard' && (
        <div className="bg-white border border-black/[0.06] rounded-xl p-6 sm:p-8 shadow-2xs">
          <ListingForm
            existingSlugs={existingSlugs}
            onSuccess={handleToolCreated}
            onCancel={() => setActiveTab('tools')}
          />
        </div>
      )}
    </div>
  );
}
