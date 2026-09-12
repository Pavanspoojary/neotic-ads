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
  Sparkles,
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
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-600" />
            <span>Inventory Slots</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {slots.length} Total
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Standardized in-app placements configured for flat-rate 30-day recurring terms with automated 15%/85% escrow split.
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              isFormOpen
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {isFormOpen ? (
              <>
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
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
          className="bg-white rounded-2xl border-2 border-indigo-100 p-6 sm:p-8 shadow-md space-y-6"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Configure New Inventory Slot</span>
            </h3>
            <span className="text-xs text-slate-400">All fields strictly validated</span>
          </div>

          {formError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* 1. Slot Name */}
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-800">
              Slot Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
              placeholder="e.g. Main Navigation Header Pill, Empty Search Canvas"
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
            <p className="text-[11px] text-slate-500">
              A clear, descriptive label identifying where this ad format appears in your app.
            </p>
          </div>

          {/* 2. Standardized Format Selection (4 Cards) */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-semibold text-slate-800">
              Standardized Placement Format <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(Object.keys(STANDARDIZED_SLOT_FORMATS) as SlotType[]).map((type) => {
                const format = STANDARDIZED_SLOT_FORMATS[type];
                const Icon = format.icon;
                const isSelected = slotType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSlotType(type)}
                    className={`text-left p-3.5 rounded-xl border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`p-1.5 rounded-lg ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="text-[11px] font-bold text-slate-400 font-mono">
                          {format.dimensions}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{format.label}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {format.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Max copy:</span>
                      <span className="font-bold text-indigo-700">{format.charLimit} chars</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Monthly Rental Rate & Real-Time Escrow Split Preview */}
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-semibold text-slate-800">
              Monthly Rental Rate (30-day lease) <span className="text-rose-500">*</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Input */}
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <DollarSign className="h-4 w-4" />
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
                    className="w-full pl-9 pr-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                  <span>Range: $50.00 – $1,000.00 / month</span>
                  <span className="font-mono">5,000 – 100,000 cents</span>
                </div>
              </div>

              {/* Instant Real-Time Escrow Split Breakdown Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Escrow Allocation Preview</span>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Zero Penny Leakage
                  </span>
                </div>

                {escrowBreakdown.valid && escrowBreakdown.split ? (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Gross Rate:</span>
                      <span className="font-semibold text-slate-900">
                        {formatCentsToUsd(escrowBreakdown.split.monthly_amount_cents)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>SponsorSlot Fee (15%):</span>
                      <span className="font-semibold text-slate-600">
                        -{formatCentsToUsd(escrowBreakdown.split.platform_fee_cents)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-bold pt-1 border-t border-slate-200">
                      <span>Creator Net Earnings (85%):</span>
                      <span className="text-sm">
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
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                Sponsor Guidelines & Acceptable Verticals
              </label>
              <span
                className={`text-[11px] font-mono ${
                  guidelines.length > 1000 ? 'text-rose-600 font-bold' : 'text-slate-400'
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
              className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
            />
            <p className="text-[11px] text-slate-500">
              Guidance displayed to prospective advertisers on checkout to ensure high-relevance creative submissions.
            </p>
          </div>

          {/* 5. Availability Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-800">Initial Availability</div>
              <div className="text-[11px] text-slate-500">
                Make this slot immediately open for booking by marketplace advertisers.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`p-1 text-2xl transition-colors ${
                isAvailable ? 'text-indigo-600' : 'text-slate-400'
              }`}
            >
              {isAvailable ? <ToggleRight className="h-7 w-7" /> : <ToggleLeft className="h-7 w-7" />}
            </button>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !escrowBreakdown.valid}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-800 animate-fadeIn">
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
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No Inventory Slots Configured</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-5">
            Define your first in-app placement to start receiving flat-rate 30-day sponsor bookings.
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Your First Slot</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className={`bg-white rounded-xl border transition-all duration-200 p-5 shadow-xs flex flex-col justify-between ${
                  isSnippetActive ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Bar: Badges & Availability Toggle */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <Icon className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{format.label}</span>
                      <span className="text-slate-400 font-normal">({format.dimensions})</span>
                    </span>

                    {/* Availability Switch */}
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleToggleAvailability(slot)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
                        slot.is_available
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                      title={slot.is_available ? 'Click to mark occupied/paused' : 'Click to make available'}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          slot.is_available ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      <span>{slot.is_available ? 'Available' : 'Occupied'}</span>
                    </button>
                  </div>

                  {/* Slot Name */}
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{slot.slot_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{format.description}</p>

                  {/* Financial Breakdown */}
                  <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-baseline justify-between">
                      <span className="text-slate-500">Monthly Rental Rate:</span>
                      <span className="text-base font-extrabold text-slate-900">
                        {formatCentsToUsd(slot.monthly_price_cents)}
                        <span className="text-[11px] font-normal text-slate-500"> / 30d</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Platform Fee (15%):</span>
                      <span>-{formatCentsToUsd(split.platform_fee_cents)}</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold text-emerald-700">
                      <span>Creator Net Payout (85%):</span>
                      <span>+{formatCentsToUsd(split.creator_payout_cents)}</span>
                    </div>
                  </div>

                  {/* Guidelines Snippet */}
                  {slot.guidelines && (
                    <div className="mt-3 text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-700">Guidelines: </span>
                      <span className="line-clamp-2">{slot.guidelines}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400 truncate max-w-[140px]" title={slot.id}>
                    ID: {slot.id.slice(0, 8)}...
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedSlotForSnippet((current) => (current?.id === slot.id ? null : slot))
                    }
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isSnippetActive
                        ? 'bg-slate-900 text-white'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                    }`}
                  >
                    <Code2 className="h-3.5 w-3.5" />
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
