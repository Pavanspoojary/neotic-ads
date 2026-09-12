'use client';

/**
 * Creator Dashboard Interactive Client Shell
 * File path: src/components/CreatorDashboardClient.tsx
 *
 * Manages tab switching between "My Registered Tools" and "Register New Tool",
 * presents configured slots with rental rates and availability, and embeds
 * SlotManager for configuring standardized in-app ad placements.
 */

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
  header_pill: { label: 'Header Pill', bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  empty_state: { label: 'Empty State Canvas', bgClass: 'bg-violet-50 text-violet-700 border-violet-200' },
  footer_badge: { label: 'Footer Badge', bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  email_footer: { label: 'Email Digest Footer', bgClass: 'bg-amber-50 text-amber-700 border-amber-200' },
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
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('tools')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'tools'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>My Registered Tools ({listings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('onboard')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'onboard'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Register New Tool</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Registered Tools & Slot Inventory View */}
      {activeTab === 'tools' && (
        <div className="space-y-6">
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
              <Layers className="h-12 w-12 mx-auto text-slate-400 mb-3" />
              <h3 className="text-lg font-bold text-slate-900">No tools registered yet</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Onboard your first micro-tool or Chrome extension to configure ad inventory and start earning 85% net payouts.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('onboard')}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold shadow-xs hover:bg-indigo-700"
              >
                <PlusCircle className="h-4 w-4" />
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
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
                  >
                    {/* Tool Header Card */}
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <h3 className="text-xl font-bold text-slate-900">{tool.title}</h3>
                          <VerificationBadge
                            source={tool.verification_source}
                            dau={tool.verified_dau}
                            identifier={tool.verification_identifier}
                            size="sm"
                          />
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {tool.category}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                            {tool.app_type.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 max-w-3xl line-clamp-2">
                          {tool.description}
                        </p>
                      </div>

                      {/* Tool Actions & Earnings Badge */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs text-slate-500">Net Creator Payout</div>
                          <div className="text-lg font-extrabold text-emerald-600">
                            {formatCentsToUsd(monthlyNetCents)}
                            <span className="text-xs font-normal text-slate-500">/mo</span>
                          </div>
                        </div>
                        <Link
                          href={`/tools/${tool.slug}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <span>Public Page</span>
                          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setExpandedToolId(isExpanded ? null : tool.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isExpanded
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                        >
                          <Settings className="h-3.5 w-3.5" />
                          <span>{isExpanded ? 'Hide Slots' : 'Manage Slots'}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Associated Inventory Slots Summary */}
                    {!isExpanded && (
                      <div className="p-6 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Configured Inventory Slots ({toolSlots.length})</span>
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                              {vacantCount} vacant & rentable
                            </span>
                          </div>
                        </div>

                        {toolSlots.length === 0 ? (
                          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-white text-center text-xs text-slate-500">
                            No slots configured yet. Click "Manage Slots" to configure your first standardized placement.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {toolSlots.map((slot) => {
                              const meta =
                                SLOT_TYPE_LABELS[slot.slot_type] || {
                                  label: slot.slot_type,
                                  bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
                                };
                              const creatorPayout = Math.round(slot.monthly_price_cents * 0.85);

                              return (
                                <div
                                  key={slot.id}
                                  className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span
                                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${meta.bgClass}`}
                                      >
                                        {meta.label}
                                      </span>
                                      {slot.is_available ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                          <CheckCircle className="h-3 w-3" />
                                          <span>Vacant</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                          <Clock className="h-3 w-3" />
                                          <span>Sponsored</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-semibold text-sm text-slate-900 mb-1">
                                      {slot.slot_name}
                                    </div>
                                    {slot.guidelines && (
                                      <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                                        Guidelines: {slot.guidelines}
                                      </p>
                                    )}
                                  </div>

                                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-2">
                                    <div>
                                      <span className="text-xs text-slate-400">Rate: </span>
                                      <span className="text-sm font-bold text-slate-900">
                                        {formatCentsToUsd(slot.monthly_price_cents)}/mo
                                      </span>
                                    </div>
                                    <div className="text-xs font-semibold text-emerald-600">
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

                    {/* Expanded SlotManager View for this tool */}
                    {isExpanded && (
                      <div className="p-6 bg-slate-50/70 border-t border-slate-200">
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
        <ListingForm
          existingSlugs={existingSlugs}
          onSuccess={handleToolCreated}
          onCancel={() => setActiveTab('tools')}
        />
      )}
    </div>
  );
}
