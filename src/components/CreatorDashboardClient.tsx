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
      <div className="flex items-center justify-between border-b border-zinc-200/80 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'tools'
                ? 'bg-zinc-900 text-white shadow-2xs'
                : 'bg-white text-zinc-600 hover:text-zinc-950 border border-zinc-200/80'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>My Registered Tools ({listings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('onboard')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'onboard'
                ? 'bg-zinc-900 text-white shadow-2xs'
                : 'bg-white text-zinc-600 hover:text-zinc-950 border border-zinc-200/80'
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
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-zinc-300 p-8 shadow-2xs">
              <Layers className="h-10 w-10 mx-auto text-zinc-400 mb-3" />
              <h3 className="text-base font-bold text-zinc-950">No tools registered yet</h3>
              <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
                Onboard your first micro-tool or Chrome extension to configure ad inventory and start earning 85% net payouts.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('onboard')}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-semibold shadow-xs transition-all"
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
                    className="bg-white rounded-2xl border border-zinc-200/80 hover:border-zinc-300 transition-all overflow-hidden shadow-2xs"
                  >
                    {/* Tool Header Card */}
                    <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap mb-2">
                          <h3 className="text-lg font-bold text-zinc-950 font-display">{tool.title}</h3>
                          <VerificationBadge
                            source={tool.verification_source}
                            dau={tool.verified_dau}
                            identifier={tool.verification_identifier}
                            size="sm"
                          />
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                            {tool.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200/80">
                            {tool.app_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500 max-w-3xl line-clamp-2 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      {/* Tool Actions & Earnings Badge */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] text-zinc-400">Net Creator Payout</div>
                          <div className="text-base font-bold text-emerald-700 tabular-nums">
                            {formatCentsToUsd(monthlyNetCents)}
                            <span className="text-xs font-normal text-zinc-500">/mo</span>
                          </div>
                        </div>
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200/80 bg-zinc-100 hover:bg-zinc-200/70 text-xs font-semibold text-zinc-700 transition-colors"
                        >
                          <span>Public Page</span>
                          <ExternalLink className="h-3 w-3 text-zinc-400" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setExpandedToolId(isExpanded ? null : tool.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isExpanded
                              ? 'bg-zinc-900 text-white shadow-2xs'
                              : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200/70 border border-zinc-200/80'
                          }`}
                        >
                          <Settings className="h-3 w-3" />
                          <span>{isExpanded ? 'Hide Slots' : 'Manage Slots'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3 ml-0.5" />
                          ) : (
                            <ChevronDown className="h-3 w-3 ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Associated Inventory Slots Summary */}
                    {!isExpanded && (
                      <div className="p-6 bg-zinc-50/70">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Configured Inventory Slots ({toolSlots.length})</span>
                            <span className="text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80 text-[10px]">
                              {vacantCount} vacant & rentable
                            </span>
                          </div>
                        </div>

                        {toolSlots.length === 0 ? (
                          <div className="p-4 rounded-xl border border-dashed border-zinc-200 bg-white text-center text-xs text-zinc-500">
                            No slots configured yet. Click &quot;Manage Slots&quot; to configure your first standardized placement.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {toolSlots.map((slot) => {
                              const meta =
                                SLOT_TYPE_LABELS[slot.slot_type] || {
                                  label: slot.slot_type,
                                  bgClass: 'bg-zinc-100 text-zinc-700 border-zinc-200/80',
                                };
                              const creatorPayout = Math.round(slot.monthly_price_cents * 0.85);

                              return (
                                <div
                                  key={slot.id}
                                  className="bg-white rounded-xl p-4 border border-zinc-200/80 flex flex-col justify-between hover:border-zinc-300 transition-all shadow-2xs"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${meta.bgClass}`}
                                      >
                                        {meta.label}
                                      </span>
                                      {slot.is_available ? (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                          <span>Vacant</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200/80">
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

                                  <div className="pt-2.5 border-t border-zinc-100 flex items-center justify-between mt-2">
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
                      <div className="p-6 bg-zinc-50/50 border-t border-zinc-200/80">
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
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-2xs">
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
