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
  header_pill: { label: 'Header Pill', bgClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  empty_state: { label: 'Empty State Canvas', bgClass: 'bg-violet-500/10 text-violet-300 border-violet-500/20' },
  footer_badge: { label: 'Footer Badge', bgClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  email_footer: { label: 'Email Digest Footer', bgClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
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
      <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'tools'
                ? 'bg-indigo-600 text-white shadow-glow-indigo'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>My Registered Tools ({listings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('onboard')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'onboard'
                ? 'bg-indigo-600 text-white shadow-glow-indigo'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
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
            <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.1] p-8">
              <Layers className="h-10 w-10 mx-auto text-zinc-500 mb-3" />
              <h3 className="text-base font-bold text-white">No tools registered yet</h3>
              <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
                Onboard your first micro-tool or Chrome extension to configure ad inventory and start earning 85% net payouts.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('onboard')}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-glow-indigo transition-all"
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
                    className="bg-white/[0.02] rounded-2xl border border-white/[0.08] hover:border-white/[0.14] transition-all overflow-hidden shadow-inner-border backdrop-blur-sm"
                  >
                    {/* Tool Header Card */}
                    <div className="p-6 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap mb-2">
                          <h3 className="text-lg font-bold text-white">{tool.title}</h3>
                          <VerificationBadge
                            source={tool.verification_source}
                            dau={tool.verified_dau}
                            identifier={tool.verification_identifier}
                            size="sm"
                          />
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-300 border border-white/[0.08]">
                            {tool.category}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {tool.app_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 max-w-3xl line-clamp-2 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      {/* Tool Actions & Earnings Badge */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] text-zinc-500">Net Creator Payout</div>
                          <div className="text-base font-extrabold text-emerald-400 tabular-nums">
                            {formatCentsToUsd(monthlyNetCents)}
                            <span className="text-xs font-normal text-zinc-500">/mo</span>
                          </div>
                        </div>
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-xs font-semibold text-zinc-300 transition-colors"
                        >
                          <span>Public Page</span>
                          <ExternalLink className="h-3 w-3 text-zinc-500" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setExpandedToolId(isExpanded ? null : tool.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isExpanded
                              ? 'bg-indigo-600 text-white shadow-glow-indigo'
                              : 'bg-white/[0.05] text-zinc-200 hover:bg-white/[0.09] border border-white/[0.08]'
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
                      <div className="p-6 bg-white/[0.01]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-indigo-400" />
                            <span>Configured Inventory Slots ({toolSlots.length})</span>
                            <span className="text-emerald-300 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                              {vacantCount} vacant & rentable
                            </span>
                          </div>
                        </div>

                        {toolSlots.length === 0 ? (
                          <div className="p-4 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] text-center text-xs text-zinc-500">
                            No slots configured yet. Click &quot;Manage Slots&quot; to configure your first standardized placement.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {toolSlots.map((slot) => {
                              const meta =
                                SLOT_TYPE_LABELS[slot.slot_type] || {
                                  label: slot.slot_type,
                                  bgClass: 'bg-white/[0.05] text-zinc-300 border-white/[0.08]',
                                };
                              const creatorPayout = Math.round(slot.monthly_price_cents * 0.85);

                              return (
                                <div
                                  key={slot.id}
                                  className="bg-white/[0.02] rounded-xl p-3.5 border border-white/[0.06] shadow-inner-border flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span
                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${meta.bgClass}`}
                                      >
                                        {meta.label}
                                      </span>
                                      {slot.is_available ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                          <CheckCircle className="h-2.5 w-2.5" />
                                          <span>Vacant</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                                          <Clock className="h-2.5 w-2.5" />
                                          <span>Occupied</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-semibold text-xs text-white mb-1">
                                      {slot.slot_name}
                                    </div>
                                    {slot.guidelines && (
                                      <p className="text-[11px] text-zinc-400 line-clamp-1 mb-2">
                                        Guidelines: {slot.guidelines}
                                      </p>
                                    )}
                                  </div>

                                  <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between mt-2">
                                    <div>
                                      <span className="text-[10px] text-zinc-500">Rate: </span>
                                      <span className="text-xs font-bold text-white tabular-nums">
                                        {formatCentsToUsd(slot.monthly_price_cents)}/mo
                                      </span>
                                    </div>
                                    <div className="text-[11px] font-semibold text-emerald-400 tabular-nums">
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
                      <div className="p-6 bg-[#07080d] border-t border-white/[0.08]">
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
        <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
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
