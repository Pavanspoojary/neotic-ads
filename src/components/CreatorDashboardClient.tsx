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
  header_pill: { label: 'Header Pill', bgClass: 'bg-[#73e5bf]/10 text-[#73e5bf] border-[#73e5bf]/25' },
  empty_state: { label: 'Empty State Canvas', bgClass: 'bg-[#a37af5]/10 text-[#a37af5] border-[#a37af5]/25' },
  footer_badge: { label: 'Footer Badge', bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  email_footer: { label: 'Email Digest Footer', bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
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
      <div className="flex items-center justify-between border-b border-[#e5e7eb]/10 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tools'
                ? 'bg-[#73e5bf] text-[#130f18] shadow-mint-led'
                : 'bg-[#21192a] text-[#8b94a3] hover:text-white border border-[#e5e7eb]/12'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>My Registered Tools ({listings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('onboard')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'onboard'
                ? 'bg-[#73e5bf] text-[#130f18] shadow-mint-led'
                : 'bg-[#21192a] text-[#8b94a3] hover:text-white border border-[#e5e7eb]/12'
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
            <div className="text-center py-16 bg-[#21192a] rounded-[24px] border border-dashed border-[#e5e7eb]/15 p-8">
              <Layers className="h-10 w-10 mx-auto text-[#8b94a3] mb-3" />
              <h3 className="text-base font-bold text-white">No tools registered yet</h3>
              <p className="mt-1 text-xs text-[#8b94a3] max-w-md mx-auto">
                Onboard your first micro-tool or Chrome extension to configure ad inventory and start earning 85% net payouts.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('onboard')}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#73e5bf] hover:bg-[#85ebd0] text-[#130f18] text-xs font-bold shadow-mint-led transition-all"
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
                    className="bg-[#21192a] rounded-[24px] border border-[#e5e7eb]/12 hover:border-[#e5e7eb]/20 transition-all overflow-hidden shadow-sm"
                  >
                    {/* Tool Header Card */}
                    <div className="p-6 border-b border-[#e5e7eb]/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap mb-2">
                          <h3 className="text-lg font-bold text-white font-display">{tool.title}</h3>
                          <VerificationBadge
                            source={tool.verification_source}
                            dau={tool.verified_dau}
                            identifier={tool.verification_identifier}
                            size="sm"
                          />
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#2e2d36] text-zinc-300 border border-[#e5e7eb]/10">
                            {tool.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#a37af5]/10 text-[#a37af5] border border-[#a37af5]/25">
                            {tool.app_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[#8b94a3] max-w-3xl line-clamp-2 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      {/* Tool Actions & Earnings Badge */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] text-[#8b94a3]">Net Creator Payout</div>
                          <div className="text-base font-extrabold text-[#73e5bf] tabular-nums">
                            {formatCentsToUsd(monthlyNetCents)}
                            <span className="text-xs font-normal text-[#8b94a3]">/mo</span>
                          </div>
                        </div>
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e5e7eb]/12 bg-[#2e2d36] hover:bg-[#383742] text-xs font-semibold text-zinc-300 transition-colors"
                        >
                          <span>Public Page</span>
                          <ExternalLink className="h-3 w-3 text-[#8b94a3]" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setExpandedToolId(isExpanded ? null : tool.id)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isExpanded
                              ? 'bg-[#73e5bf] text-[#130f18] shadow-mint-led'
                              : 'bg-[#2e2d36] text-zinc-200 hover:bg-[#383742] border border-[#e5e7eb]/10'
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
                      <div className="p-6 bg-[#130f18]/40">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-[11px] font-semibold text-[#8b94a3] uppercase tracking-wider flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-[#a37af5]" />
                            <span>Configured Inventory Slots ({toolSlots.length})</span>
                            <span className="text-[#73e5bf] font-bold bg-[#73e5bf]/10 px-2.5 py-0.5 rounded-full border border-[#73e5bf]/25 text-[10px]">
                              {vacantCount} vacant & rentable
                            </span>
                          </div>
                        </div>

                        {toolSlots.length === 0 ? (
                          <div className="p-4 rounded-xl border border-dashed border-[#e5e7eb]/10 bg-[#21192a] text-center text-xs text-[#8b94a3]">
                            No slots configured yet. Click &quot;Manage Slots&quot; to configure your first standardized placement.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {toolSlots.map((slot) => {
                              const meta =
                                SLOT_TYPE_LABELS[slot.slot_type] || {
                                  label: slot.slot_type,
                                  bgClass: 'bg-[#2e2d36] text-zinc-300 border-[#e5e7eb]/10',
                                };
                              const creatorPayout = Math.round(slot.monthly_price_cents * 0.85);

                              return (
                                <div
                                  key={slot.id}
                                  className="bg-[#2e2d36] rounded-xl p-4 border border-[#e5e7eb]/10 flex flex-col justify-between hover:border-[#e5e7eb]/20 transition-all"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${meta.bgClass}`}
                                      >
                                        {meta.label}
                                      </span>
                                      {slot.is_available ? (
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#73e5bf] bg-[#73e5bf]/10 px-2 py-0.5 rounded-full border border-[#73e5bf]/25">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#73e5bf] shadow-[0_0_6px_#73e5bf]" />
                                          <span>Vacant</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8b94a3] bg-[#21192a] px-2 py-0.5 rounded-full border border-[#e5e7eb]/10">
                                          <Clock className="h-2.5 w-2.5" />
                                          <span>Occupied</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-bold text-xs text-white mb-1">
                                      {slot.slot_name}
                                    </div>
                                    {slot.guidelines && (
                                      <p className="text-[11px] text-[#8b94a3] line-clamp-1 mb-2">
                                        Guidelines: {slot.guidelines}
                                      </p>
                                    )}
                                  </div>

                                  <div className="pt-2.5 border-t border-[#e5e7eb]/10 flex items-center justify-between mt-2">
                                    <div>
                                      <span className="text-[10px] text-[#8b94a3]">Rate: </span>
                                      <span className="text-xs font-bold text-white tabular-nums">
                                        {formatCentsToUsd(slot.monthly_price_cents)}/mo
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-bold text-[#73e5bf] tabular-nums">
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
                      <div className="p-6 bg-[#130f18] border-t border-[#e5e7eb]/10">
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
        <div className="bg-[#21192a] border border-[#e5e7eb]/12 rounded-[24px] p-6 sm:p-8">
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
