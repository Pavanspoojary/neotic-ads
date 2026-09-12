'use client';

/**
 * Creator Inventory Slot Management Component
 * File path: src/components/SlotManager.tsx
 *
 * Implements:
 *   - Standardized slot format configuration (header_pill, empty_state, footer_badge, email_footer)
 *   - Live escrow breakdown with 15% platform fee / 85% creator payout (zero penny leakage)
 *   - Rental rate validation ($50 to $1,000 / month)
 *   - Sponsor guidelines definition (max 1000 characters)
 *   - Slot availability toggle
 *   - Interactive SnippetGenerator launcher
 */

import React, { useState, useMemo } from 'react';
import {
  Plus,
  X,
  Layers,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Code2,
  ToggleLeft,
  ToggleRight,
  PanelTop,
  SquareCode,
  PanelBottom,
  Mail,
} from 'lucide-react';
import { InventorySlot, SlotType, SLOT_COPY_LIMITS } from '../lib/types';
import {
  calculateEscrowSplit,
  validateRentalRate,
  formatCentsToUsd,
} from '../lib/escrow';
import { SnippetGenerator } from './SnippetGenerator';

export interface SlotManagerProps {
  listingId: string;
  listingSlug?: string;
  initialSlots?: InventorySlot[];
  onSlotCreated?: (newSlot: InventorySlot) => void;
  onSlotUpdated?: (updatedSlot: InventorySlot) => void;
  readOnly?: boolean;
}

export interface SlotFormatInfo {
  type: SlotType;
  label: string;
  description: string;
  charLimit: number;
  dimensions: string;
  recommendedPlacement: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const STANDARDIZED_SLOT_FORMATS: Record<SlotType, SlotFormatInfo> = {
  header_pill: {
    type: 'header_pill',
    label: 'Header Pill',
    description: 'Prominent, non-intrusive pill placed directly in primary application navigation.',
    charLimit: SLOT_COPY_LIMITS.header_pill, // 80
    dimensions: '320 × 36 px',
    recommendedPlacement: 'Top navbar or header utility row',
    icon: PanelTop,
  },
  empty_state: {
    type: 'empty_state',
    label: 'Empty State Canvas',
    description: 'Contextually relevant placement rendered during zero-data or setup states.',
    charLimit: SLOT_COPY_LIMITS.empty_state, // 200
    dimensions: '480 × 240 px',
    recommendedPlacement: 'Zero-results search, empty dashboard, onboarding canvases',
    icon: SquareCode,
  },
  footer_badge: {
    type: 'footer_badge',
    label: 'Footer Badge',
    description: 'Discreet, high-trust partner link displayed in application footers or settings drawers.',
    charLimit: SLOT_COPY_LIMITS.footer_badge, // 60
    dimensions: '240 × 32 px',
    recommendedPlacement: 'Global page footer, sidebar footer, or extension settings view',
    icon: PanelBottom,
  },
  email_footer: {
    type: 'email_footer',
    label: 'Email Digest Footer',
    description: 'Native single-sponsor attribution included in periodic developer dispatch emails.',
    charLimit: SLOT_COPY_LIMITS.email_footer, // 120
    dimensions: '600 × 60 px',
    recommendedPlacement: 'Bottom sponsor card of weekly release notes or transactional emails',
    icon: Mail,
  },
};

export function SlotManager({
  listingId,
  listingSlug,
  initialSlots = [],
  onSlotCreated,
  onSlotUpdated,
  readOnly = false,
}: SlotManagerProps) {
  // State
  const [slots, setSlots] = useState<InventorySlot[]>(initialSlots);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSlotForSnippet, setSelectedSlotForSnippet] = useState<InventorySlot | null>(null);

  // Form State
  const [slotName, setSlotName] = useState('');
  const [slotType, setSlotType] = useState<SlotType>('header_pill');
  const [priceDollars, setPriceDollars] = useState('150.00');
  const [guidelines, setGuidelines] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Submission & Error State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Real-time Escrow Split Calculation
  const priceCents = useMemo(() => {
    const parsed = parseFloat(priceDollars);
    if (isNaN(parsed)) return null;
    return Math.round(parsed * 100);
  }, [priceDollars]);

  const escrowBreakdown = useMemo(() => {
    if (priceCents === null) {
      return { valid: false, error: 'Enter a valid numeric monthly rate' };
    }
    const validation = validateRentalRate(priceCents);
    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }
    try {
      const split = calculateEscrowSplit(priceCents);
      return { valid: true, split };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }, [priceCents]);

  // Handle New Slot Creation
  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!slotName.trim()) {
      setFormError('Slot name is required (e.g. "Main Top Header Pill")');
      return;
    }

    if (priceCents === null || !escrowBreakdown.valid) {
      setFormError(escrowBreakdown.error || 'Monthly rate must be between $50.00 and $1,000.00');
      return;
    }

    if (guidelines.length > 1000) {
      setFormError('Sponsor guidelines cannot exceed 1,000 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        listing_id: listingId,
        slot_name: slotName.trim(),
        slot_type: slotType,
        monthly_price_cents: priceCents,
        is_available: isAvailable,
        guidelines: guidelines.trim() || undefined,
      };

      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned status ${res.status}`);
      }

      const resData = await res.json();
      const newSlot: InventorySlot = resData.slot || resData;

      setSlots((prev) => [...prev, newSlot]);
      onSlotCreated?.(newSlot);

      // Reset form
      setSlotName('');
      setSlotType('header_pill');
      setPriceDollars('150.00');
      setGuidelines('');
      setIsAvailable(true);
      setIsFormOpen(false);

      setSuccessToast(`Slot "${newSlot.slot_name}" created successfully!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create inventory slot');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Availability
  const handleToggleAvailability = async (slot: InventorySlot) => {
    if (readOnly) return;
    const newStatus = !slot.is_available;

    // Optimistic local update
    const updated = { ...slot, is_available: newStatus };
    setSlots((prev) => prev.map((s) => (s.id === slot.id ? updated : s)));
    onSlotUpdated?.(updated);

    try {
      await fetch(`/api/slots/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: newStatus }),
      });
    } catch (err) {
      console.warn('[SlotManager] Failed to persist slot availability update:', err);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-emerald-900 text-xs font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06]">
        <div>
          <h2 className="text-base sm:text-lg font-display font-semibold text-zinc-950 flex items-center gap-2 tracking-tight">
            <Layers className="h-4 w-4 text-zinc-400" />
            <span>Inventory Slots</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-black/[0.06]">
              {slots.length} Total
            </span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Standardized in-app placements configured for flat-rate 30-day recurring terms with automated 15%/85% escrow split.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isFormOpen
                ? 'bg-white text-zinc-700 hover:bg-zinc-50 border border-black/[0.08]'
                : 'bg-zinc-950 text-white hover:bg-black shadow-2xs'
            }`}
          >
            {isFormOpen ? (
              <>
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                <span>Add Inventory Slot</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Add Slot Form Drawer */}
      {isFormOpen && !readOnly && (
        <form
          onSubmit={handleCreateSlot}
          className="bg-white rounded-xl border border-black/[0.06] p-5 sm:p-6 space-y-5 shadow-2xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-black/[0.04]">
            <h3 className="text-sm font-semibold text-zinc-950 flex items-center gap-2 font-display">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Configure New Inventory Slot</span>
            </h3>
            <span className="text-[11px] text-zinc-400">All fields strictly validated</span>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Slot Name */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-700">
              Slot Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
              placeholder="e.g. Main Navigation Header Pill, Empty Search Canvas"
              className="w-full px-3 py-2 rounded-lg border border-black/[0.08] bg-white text-xs text-zinc-950 focus:outline-none focus:border-black/25 focus:ring-2 focus:ring-black/[0.04] placeholder:text-zinc-400"
            />
            <p className="text-[11px] text-zinc-400">
              A clear, descriptive label identifying where this ad format appears in your app.
            </p>
          </div>

          {/* 2. Standardized Format Selection (4 Cards) */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-700">
              Standardized Placement Format <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {(Object.keys(STANDARDIZED_SLOT_FORMATS) as SlotType[]).map((type) => {
                const format = STANDARDIZED_SLOT_FORMATS[type];
                const Icon = format.icon;
                const isSelected = slotType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSlotType(type)}
                    className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-2xs'
                        : 'border-black/[0.06] bg-white hover:border-black/[0.12] text-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            isSelected ? 'bg-white/15 text-white' : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className={`text-[10px] font-medium font-mono ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>
                          {format.dimensions}
                        </span>
                      </div>
                      <h4 className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-zinc-950'}`}>{format.label}</h4>
                      <p className={`text-[11px] line-clamp-2 mt-1 leading-relaxed ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {format.description}
                      </p>
                    </div>

                    <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] ${isSelected ? 'border-white/10' : 'border-black/[0.04]'}`}>
                      <span className={isSelected ? 'text-zinc-400' : 'text-zinc-400'}>Max copy:</span>
                      <span className={`font-medium ${isSelected ? 'text-emerald-400' : 'text-emerald-700'}`}>{format.charLimit} chars</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Monthly Rental Rate & Real-Time Escrow Split Preview */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-700">
              Monthly Rental Rate (30-day lease) <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <DollarSign className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="5"
                    required
                    value={priceDollars}
                    onChange={(e) => setPriceDollars(e.target.value)}
                    placeholder="150.00"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-black/[0.08] bg-white text-xs text-zinc-950 focus:outline-none focus:border-black/25 focus:ring-2 focus:ring-black/[0.04] font-medium placeholder:text-zinc-400"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Range: $50.00 – $1,000.00 / month</span>
                  <span className="font-mono">5,000 – 100,000 cents</span>
                </div>
              </div>

              {/* Instant Real-Time Escrow Split Breakdown Preview */}
              <div className="rounded-xl border border-black/[0.06] bg-zinc-50/60 p-3 space-y-2">
                <div className="text-[11px] font-medium text-zinc-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Escrow Allocation Preview</span>
                  <span className="text-[10px] font-medium text-emerald-800 bg-emerald-500/[0.08] px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Zero Penny Leakage
                  </span>
                </div>

                {escrowBreakdown.valid && escrowBreakdown.split ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between text-zinc-500">
                      <span>Gross Rate:</span>
                      <span className="font-medium text-zinc-950">
                        {formatCentsToUsd(escrowBreakdown.split.monthly_amount_cents)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-500">
                      <span>SponsorSlot Fee (15%):</span>
                      <span className="font-medium text-zinc-600">
                        -{formatCentsToUsd(escrowBreakdown.split.platform_fee_cents)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-semibold pt-1 border-t border-black/[0.06]">
                      <span>Creator Net Earnings (85%):</span>
                      <span className="text-xs">
                        +{formatCentsToUsd(escrowBreakdown.split.creator_payout_cents)} / mo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-rose-600 flex items-center gap-1.5 py-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{escrowBreakdown.error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Sponsor Guidelines */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-zinc-700">
                Sponsor Guidelines & Acceptable Verticals
              </label>
              <span
                className={`text-[11px] font-mono ${
                  guidelines.length > 1000 ? 'text-rose-600 font-medium' : 'text-zinc-400'
                }`}
              >
                {guidelines.length} / 1,000 characters
              </span>
            </div>
            <textarea
              rows={3}
              maxLength={1000}
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="e.g. Developer tools, SaaS, and AI developer utilities only. No crypto, gambling, or adult content."
              className="w-full px-3 py-2 rounded-lg border border-black/[0.08] bg-white text-xs text-zinc-950 focus:outline-none focus:border-black/25 focus:ring-2 focus:ring-black/[0.04] placeholder:text-zinc-400"
            />
            <p className="text-[11px] text-zinc-400">
              Guidance displayed to prospective advertisers on checkout to ensure high-relevance creative submissions.
            </p>
          </div>

          {/* 5. Availability Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-black/[0.06] bg-zinc-50/60">
            <div>
              <div className="text-xs font-medium text-zinc-800">Initial Availability</div>
              <div className="text-[11px] text-zinc-500">
                Make this slot immediately open for booking by marketplace advertisers.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`p-1 text-2xl transition-colors cursor-pointer ${
                isAvailable ? 'text-emerald-600' : 'text-zinc-400'
              }`}
            >
              {isAvailable ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
            </button>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.04]">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 border border-black/[0.08] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !escrowBreakdown.valid}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-950 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-2xs cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Slot...</span>
                </>
              ) : (
                <span>Create Inventory Slot</span>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Snippet Generator View (Expandable Drawer / Modal) */}
      {selectedSlotForSnippet && (
        <div className="bg-white rounded-xl p-5 shadow-2xs border border-black/[0.06] animate-fadeIn">
          <SnippetGenerator
            slot={selectedSlotForSnippet}
            listingSlug={listingSlug}
            onClose={() => setSelectedSlotForSnippet(null)}
            mode="card"
          />
        </div>
      )}

      {/* Existing Slots Inventory Grid */}
      {slots.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-dashed border-black/[0.1] shadow-2xs">
          <div className="w-9 h-9 mx-auto rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center mb-2.5">
            <Layers className="h-4 w-4" />
          </div>
          <h3 className="text-xs font-semibold text-zinc-950 mb-0.5">No Inventory Slots Configured</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mb-4">
            Define your first in-app placement to start receiving flat-rate 30-day sponsor bookings.
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-zinc-950 hover:bg-black shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Your First Slot</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {slots.map((slot) => {
            const format = STANDARDIZED_SLOT_FORMATS[slot.slot_type] || {
              type: slot.slot_type,
              label: slot.slot_type,
              description: 'Standard slot format',
              charLimit: 80,
              dimensions: 'N/A',
              recommendedPlacement: 'Custom placement',
              icon: Layers,
            };
            const Icon = format.icon;
            const split = calculateEscrowSplit(slot.monthly_price_cents);
            const isSnippetActive = selectedSlotForSnippet?.id === slot.id;

            return (
              <div
                key={slot.id}
                className={`bg-white rounded-xl border transition-all duration-150 p-5 flex flex-col justify-between shadow-2xs ${
                  isSnippetActive ? 'border-zinc-950 ring-1 ring-zinc-950/10' : 'border-black/[0.06] hover:border-black/[0.12]'
                }`}
              >
                <div>
                  {/* Top Bar: Badges & Availability Toggle */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-black/[0.06]">
                      <Icon className="h-3 w-3 text-zinc-400" />
                      <span>{format.label}</span>
                      <span className="text-zinc-400 font-mono text-[10px]">({format.dimensions})</span>
                    </span>

                    {/* Availability Switch */}
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleToggleAvailability(slot)}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                        slot.is_available
                          ? 'bg-emerald-500/[0.08] text-emerald-800 border-emerald-500/20 hover:bg-emerald-500/15'
                          : 'bg-zinc-100 text-zinc-500 border-black/[0.06] hover:bg-zinc-200/60'
                      }`}
                      title={slot.is_available ? 'Click to mark occupied/paused' : 'Click to make available'}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          slot.is_available ? 'bg-emerald-500' : 'bg-zinc-400'
                        }`}
                      />
                      <span>{slot.is_available ? 'Available' : 'Occupied'}</span>
                    </button>
                  </div>

                  {/* Slot Name */}
                  <h3 className="text-sm font-semibold text-zinc-950 line-clamp-1 font-display tracking-tight">{slot.slot_name}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{format.description}</p>

                  {/* Financial Breakdown */}
                  <div className="mt-3.5 p-3 rounded-lg bg-zinc-50/60 border border-black/[0.06] space-y-1.5 text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="text-zinc-500">Monthly Rental Rate:</span>
                      <span className="text-sm font-semibold text-zinc-950 tabular-nums">
                        {formatCentsToUsd(slot.monthly_price_cents)}
                        <span className="text-[10px] font-normal text-zinc-400"> / 30d</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-500 pt-1 border-t border-black/[0.04]">
                      <span>Platform Fee (15%):</span>
                      <span className="tabular-nums">-{formatCentsToUsd(split.platform_fee_cents)}</span>
                    </div>
                    <div className="flex items-center justify-between font-medium text-emerald-700">
                      <span>Creator Net Payout (85%):</span>
                      <span className="tabular-nums font-semibold">+{formatCentsToUsd(split.creator_payout_cents)}</span>
                    </div>
                  </div>

                  {/* Guidelines Snippet */}
                  {slot.guidelines && (
                    <div className="mt-2.5 text-xs text-zinc-600 bg-zinc-50/80 p-2 rounded-lg border border-black/[0.06]">
                      <span className="font-medium text-zinc-800">Guidelines: </span>
                      <span className="line-clamp-2 text-zinc-500">{slot.guidelines}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-4 pt-3 border-t border-black/[0.04] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[130px]" title={slot.id}>
                    {slot.id.slice(0, 8)}...
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSlotForSnippet((current) => (current?.id === slot.id ? null : slot))
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      isSnippetActive
                        ? 'bg-zinc-950 text-white shadow-2xs'
                        : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 border border-black/[0.06]'
                    }`}
                  >
                    <Code2 className="h-3 w-3" />
                    <span>{isSnippetActive ? 'Hide Snippet' : 'Integration Code'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
