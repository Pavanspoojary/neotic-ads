'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  ArrowUpDown,
  Code2,
  Sliders,
  Palette,
  Clock,
  LayoutGrid,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Listing, InventorySlot, ListingCategory, AppType, SlotType } from '../lib/types';
import { formatCentsToUsd } from '../lib/escrow';
import { VerificationBadge } from './VerificationBadge';

export interface MarketplaceGridProps {
  initialListings: Listing[];
  initialSlots?: InventorySlot[];
}

interface ListingSlotSummary {
  totalSlots: number;
  availableSlots: number;
  minPriceCents: number | null;
  maxPriceCents: number | null;
  slotTypes: SlotType[];
}

const CATEGORY_TABS: { id: ListingCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Software' },
  { id: 'developer-tools', label: 'Developer Tools' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'design', label: 'Design & Assets' },
  { id: 'utilities', label: 'Web Utilities' },
];

const APP_TYPES: { id: AppType | 'all'; label: string }[] = [
  { id: 'all', label: 'All Formats' },
  { id: 'web_app', label: 'Web Apps' },
  { id: 'chrome_extension', label: 'Chrome Extensions' },
  { id: 'desktop_app', label: 'Desktop Tools' },
];

const DAU_PRESETS = [
  { label: 'Any DAU', value: 0 },
  { label: '5k+ DAU', value: 5000 },
  { label: '10k+ DAU', value: 10000 },
  { label: '15k+ DAU', value: 15000 },
];

function getAppVisuals(slug: string, category: string, index: number) {
  const visuals: Record<
    string,
    {
      bg: string;
      icon: any;
      rating: string;
      reviews: string;
      highlight: string;
      badge?: string;
      sentiment: { positive: number; neutral: number; negative: number };
      avatars: string[];
    }
  > = {
    'jsonhero-visualizer': {
      bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      icon: Code2,
      rating: '4.8',
      reviews: '872',
      highlight: 'Highly rated for Developer Experience',
      badge: 'Highly recommended',
      sentiment: { positive: 96, neutral: 3, negative: 1 },
      avatars: ['JD', 'M', 'SK'],
    },
    'tabmaster-pro': {
      bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      icon: LayoutGrid,
      rating: '4.9',
      reviews: '1,420',
      highlight: 'Highly rated for Ease of Use',
      badge: 'Highest rated',
      sentiment: { positive: 95, neutral: 3, negative: 2 },
      avatars: ['AL', 'RK', 'T'],
    },
    'svg-shape-shifter': {
      bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      icon: Palette,
      rating: '4.7',
      reviews: '440',
      highlight: 'Highly rated for Functionality',
      badge: 'Trending Design',
      sentiment: { positive: 92, neutral: 6, negative: 2 },
      avatars: ['MC', 'DN', 'PR'],
    },
    'tailscan-devtools': {
      bg: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
      icon: Sliders,
      rating: '4.8',
      reviews: '1,003',
      highlight: 'Highly rated for Value-for-Money',
      badge: 'Highest rated',
      sentiment: { positive: 94, neutral: 4, negative: 2 },
      avatars: ['TS', 'EW', 'B'],
    },
    'regex101-companion': {
      bg: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
      icon: FileCode2,
      rating: '4.6',
      reviews: '310',
      highlight: 'Highly rated for Productivity',
      sentiment: { positive: 91, neutral: 7, negative: 2 },
      avatars: ['RX', 'KP', 'GH'],
    },
    'crontab-guru-visualizer': {
      bg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      icon: Clock,
      rating: '4.9',
      reviews: '650',
      highlight: 'Highly rated for Customer Service',
      badge: 'Highly recommended',
      sentiment: { positive: 97, neutral: 2, negative: 1 },
      avatars: ['CG', 'LM', 'VR'],
    },
  };

  if (visuals[slug]) {
    return visuals[slug];
  }

  return {
    bg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    icon: Sparkles,
    rating: (4.6 + (index % 4) * 0.1).toFixed(1),
    reviews: `${(index + 2) * 140}`,
    highlight: 'Highly rated for Performance',
    badge: index % 2 === 0 ? 'Verified Placement' : undefined,
    sentiment: { positive: 93, neutral: 5, negative: 2 },
    avatars: ['AB', 'CD', 'EF'],
  };
}

export function MarketplaceGrid({ initialListings, initialSlots = [] }: MarketplaceGridProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'all'>('all');
  const [selectedAppType, setSelectedAppType] = useState<AppType | 'all'>('all');
  const [minDau, setMinDau] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'dau_desc' | 'dau_asc' | 'price_asc' | 'price_desc' | 'newest'>('dau_desc');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [expandedSlotsToolId, setExpandedSlotsToolId] = useState<string | null>(null);

  // Compute live listing count per category tab
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialListings.length };
    for (const tab of CATEGORY_TABS) {
      if (tab.id !== 'all') {
        counts[tab.id] = initialListings.filter((l) => l.category === tab.id).length;
      }
    }
    return counts;
  }, [initialListings]);

  // Precompute slot stats map per listing
  const slotStatsMap = useMemo(() => {
    const map = new Map<string, ListingSlotSummary>();
    for (const listing of initialListings) {
      const toolSlots = initialSlots.filter((s) => s.listing_id === listing.id);
      const available = toolSlots.filter((s) => s.is_available);
      const prices = toolSlots.map((s) => s.monthly_price_cents);
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
      const slotTypes = Array.from(new Set(toolSlots.map((s) => s.slot_type)));

      map.set(listing.id, {
        totalSlots: toolSlots.length,
        availableSlots: available.length,
        minPriceCents: minPrice,
        maxPriceCents: maxPrice,
        slotTypes,
      });
    }
    return map;
  }, [initialListings, initialSlots]);

  // Filtering & Sorting
  const filteredListings = useMemo(() => {
    return initialListings
      .filter((listing) => {
        if (selectedCategory !== 'all' && listing.category !== selectedCategory) {
          return false;
        }
        if (selectedAppType !== 'all' && listing.app_type !== selectedAppType) {
          return false;
        }
        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase().trim();
          const matchesTitle = listing.title.toLowerCase().includes(q);
          const matchesDesc = listing.description.toLowerCase().includes(q);
          const matchesSlug = listing.slug.toLowerCase().includes(q);
          if (!matchesTitle && !matchesDesc && !matchesSlug) {
            return false;
          }
        }
        if (minDau > 0 && listing.verified_dau < minDau) {
          return false;
        }
        if (availableOnly) {
          const stats = slotStatsMap.get(listing.id);
          if (!stats || stats.availableSlots === 0) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'dau_asc':
            return a.verified_dau - b.verified_dau;
          case 'dau_desc':
            return b.verified_dau - a.verified_dau;
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'price_asc': {
            const pA = slotStatsMap.get(a.id)?.minPriceCents ?? Infinity;
            const pB = slotStatsMap.get(b.id)?.minPriceCents ?? Infinity;
            return pA - pB;
          }
          case 'price_desc': {
            const pA = slotStatsMap.get(a.id)?.maxPriceCents ?? 0;
            const pB = slotStatsMap.get(b.id)?.maxPriceCents ?? 0;
            return pB - pA;
          }
          default:
            return b.verified_dau - a.verified_dau;
        }
      });
  }, [initialListings, slotStatsMap, selectedCategory, selectedAppType, searchQuery, minDau, availableOnly, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedAppType('all');
    setMinDau(0);
    setAvailableOnly(false);
    setSortBy('dau_desc');
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'all' ||
    selectedAppType !== 'all' ||
    minDau > 0 ||
    availableOnly ||
    sortBy !== 'dau_desc';

  return (
    <div id="marketplace" className="w-full space-y-8">
      {/* Category Tab Bar (Minimal Glass Tabs with Counts) */}
      <div className="flex justify-center border-b border-white/[0.08] pb-1">
        <div
          role="tablist"
          aria-label="Software Categories"
          className="flex items-center gap-2 sm:gap-3 overflow-x-auto px-2 py-1 scrollbar-none"
        >
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.id;
            const count = categoryCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isSelected}
                aria-controls="marketplace-cards"
                onClick={() => setSelectedCategory(tab.id)}
                className={`relative whitespace-nowrap px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isSelected
                    ? 'bg-white/[0.08] text-white shadow-inner-border border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold transition-colors ${
                    isSelected
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-white/[0.05] text-zinc-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar (High-precision Obsidian Card) */}
      <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-4 sm:p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tool name, stack, or target audience..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-white/[0.08] text-xs sm:text-sm focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 placeholder-zinc-500 text-white bg-white/[0.03] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1 rounded-full"
                aria-label="Clear search input"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Secondary Controls: Format & Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 hidden sm:inline font-medium">Format:</span>
              <select
                value={selectedAppType}
                onChange={(e) => setSelectedAppType(e.target.value as AppType | 'all')}
                className="text-xs py-1.5 px-3 rounded-lg border border-white/[0.08] bg-[#0d0f18] text-zinc-300 focus:outline-none focus:border-indigo-500/60 font-medium"
              >
                {APP_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3 w-3 text-zinc-500 hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs py-1.5 px-3 rounded-lg border border-white/[0.08] bg-[#0d0f18] text-zinc-300 focus:outline-none focus:border-indigo-500/60 font-medium"
              >
                <option value="dau_desc">Traffic: Highest DAU</option>
                <option value="dau_asc">Traffic: Lowest DAU</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Search Trending Tags */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-zinc-400">
          <span className="text-[11px] font-medium text-zinc-500">Trending:</span>
          {['JSON', 'Chrome', 'Design', 'Tabs', 'CLI', 'Digest'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(tag)}
              className="text-[11px] px-2.5 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] hover:text-zinc-200 text-zinc-400 border border-white/[0.06] font-medium transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Lower Row: Presets & Available Only Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-zinc-500 font-medium">Verified Traffic:</span>
            {DAU_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setMinDau(preset.value)}
                className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                  minDau === preset.value
                    ? 'bg-indigo-600 text-white shadow-glow-indigo font-semibold'
                    : 'bg-white/[0.03] text-zinc-400 hover:text-zinc-200 border border-white/[0.06]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-300">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-indigo-500/40"
              />
              <span className="font-medium">Available Slots Only</span>
            </label>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/[0.06] text-xs">
            <span className="text-zinc-500 font-medium">Active:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20">
                <span>{CATEGORY_TABS.find((t) => t.id === selectedCategory)?.label}</span>
                <button onClick={() => setSelectedCategory('all')} className="hover:text-white p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedAppType !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20">
                <span>{APP_TYPES.find((t) => t.id === selectedAppType)?.label}</span>
                <button onClick={() => setSelectedAppType('all')} className="hover:text-white p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {minDau > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20">
                <span>{minDau.toLocaleString()}+ DAU</span>
                <button onClick={() => setMinDau(0)} className="hover:text-white p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {availableOnly && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-medium border border-emerald-500/20">
                <span>Available Only</span>
                <button onClick={() => setAvailableOnly(false)} className="hover:text-white p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery.trim().length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20">
                <span>&quot;{searchQuery}&quot;</span>
                <button onClick={() => setSearchQuery('')} className="hover:text-white p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
        <span>
          Showing <strong className="text-zinc-200">{filteredListings.length}</strong> of {initialListings.length} verified developer tools
        </span>
        <span className="hidden sm:inline text-zinc-500">Direct flat-rate 30-day terms</span>
      </div>

      {/* High-Precision 3-Column Card Grid */}
      {filteredListings.length > 0 ? (
        <div id="marketplace-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing, index) => {
            const stats = slotStatsMap.get(listing.id);
            const visuals = getAppVisuals(listing.slug, listing.category, index);
            const IconComponent = visuals.icon;
            const minPrice = stats?.minPriceCents;
            const availableCount = stats?.availableSlots ?? 0;

            return (
              <div
                key={listing.id}
                className="group rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.18] p-5 backdrop-blur-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* App Icon */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner-border ${visuals.bg}`}>
                        <IconComponent className="w-5 h-5 stroke-[2]" />
                      </div>

                      {/* App Title & Star Rating */}
                      <div>
                        <Link
                          href={`/tools/${listing.slug}`}
                          className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1"
                        >
                          {listing.title}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                          <span className="text-amber-400 text-xs">★</span>
                          <span className="font-semibold text-zinc-200">{visuals.rating}</span>
                          <span className="text-zinc-500">({visuals.reviews})</span>
                        </div>
                        {/* Verified Traffic Badge & App Format */}
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <VerificationBadge
                            source={listing.verification_source}
                            dau={listing.verified_dau}
                            size="sm"
                            showDetails={false}
                          />
                          <span className="text-[10px] font-medium text-zinc-400 capitalize bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                            {listing.app_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top Right Recommendation Badge */}
                    {visuals.badge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        <span>{visuals.badge}</span>
                      </span>
                    )}
                  </div>

                  {/* Feature Highlight */}
                  <div className="mb-4">
                    <div className="text-xs font-semibold text-zinc-200 leading-snug">
                      {visuals.highlight}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">
                      Audited for {listing.verified_dau.toLocaleString()} verified DAU
                    </div>
                  </div>

                  {/* Review Sentiment Progress Meter */}
                  <div className="mb-4 pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium text-zinc-400">Review Sentiment</span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {visuals.avatars.map((av, idx) => (
                          <div
                            key={idx}
                            className="w-4 h-4 rounded-full ring-1 ring-[#090a0f] bg-zinc-800 text-zinc-300 flex items-center justify-center text-[7px] font-bold"
                          >
                            {av}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full rounded-full overflow-hidden flex bg-zinc-800 gap-0.5" role="meter" aria-label="Review Sentiment" aria-valuenow={visuals.sentiment.positive}>
                      <div
                        className="bg-emerald-500 h-full rounded-l-full transition-all"
                        style={{ width: `${visuals.sentiment.positive}%` }}
                        title={`Positive: ${visuals.sentiment.positive}%`}
                      />
                      <div
                        className="bg-zinc-600 h-full transition-all"
                        style={{ width: `${visuals.sentiment.neutral}%` }}
                        title={`Neutral: ${visuals.sentiment.neutral}%`}
                      />
                      <div
                        className="bg-rose-500 h-full rounded-r-full transition-all"
                        style={{ width: `${visuals.sentiment.negative}%` }}
                        title={`Negative: ${visuals.sentiment.negative}%`}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1.5">
                      <span>Positive {visuals.sentiment.positive}%</span>
                      <span>Neutral {visuals.sentiment.neutral}%</span>
                      <span>Negative {visuals.sentiment.negative}%</span>
                    </div>
                  </div>

                  {/* Pricing & Inventory Availability */}
                  <div className="py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <span className="font-bold text-white">
                        {minPrice ? formatCentsToUsd(minPrice) : 'Custom'}
                      </span>
                      <span className="text-zinc-500 text-[11px]">/ 30 days</span>
                    </div>

                    {availableCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpandedSlotsToolId(expandedSlotsToolId === listing.id ? null : listing.id)}
                        className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        aria-expanded={expandedSlotsToolId === listing.id}
                        aria-label="Inspect available slots"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{availableCount} Vacant</span>
                        {expandedSlotsToolId === listing.id ? (
                          <ChevronUp className="h-3 w-3 ml-0.5" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-0.5" />
                        )}
                      </button>
                    ) : (
                      <span className="text-zinc-500 font-medium text-[11px]">Fully Booked</span>
                    )}
                  </div>

                  {/* Expandable Slot Inspector Drawer */}
                  {expandedSlotsToolId === listing.id && (
                    <div className="my-3 p-3 rounded-xl bg-[#0d0f18] border border-white/[0.08] space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                        <span>Available Units ({initialSlots.filter((s) => s.listing_id === listing.id).length})</span>
                        <span className="text-zinc-500 font-normal">30-day lease</span>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {initialSlots
                          .filter((s) => s.listing_id === listing.id)
                          .map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-medium text-zinc-200 truncate text-[11px]">{slot.slot_name}</div>
                                <div className="text-[10px] text-zinc-500 font-mono capitalize">{slot.slot_type.replace('_', ' ')}</div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-bold text-white text-xs">{formatCentsToUsd(slot.monthly_price_cents)}</span>
                                {slot.is_available ? (
                                  <Link
                                    href={`/sponsor/${slot.id}`}
                                    className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] transition-colors shadow-glow-indigo"
                                  >
                                    Book
                                  </Link>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-500">
                                    Occupied
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2.5">
                  <Link
                    href={`/tools/${listing.slug}`}
                    className="w-full py-2 px-3 rounded-lg border border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.06] text-zinc-200 font-medium text-xs text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    View profile
                  </Link>

                  {availableCount > 0 ? (
                    <Link
                      href={`/tools/${listing.slug}#slots`}
                      className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs text-center transition-colors flex items-center justify-center gap-1 shadow-glow-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      <span>Sponsor Slot</span>
                      <span className="text-xs">↗</span>
                    </Link>
                  ) : (
                    <a
                      href={listing.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 font-medium text-xs text-center transition-colors flex items-center justify-center gap-1 border border-white/[0.08]"
                    >
                      <span>Website</span>
                      <ExternalLink className="h-3 w-3 text-zinc-400" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/[0.02] rounded-2xl border border-white/[0.08] p-12 text-center max-w-md mx-auto">
          <div className="w-10 h-10 bg-white/[0.05] rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <Search className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-white">No software found</h3>
          <p className="text-xs text-zinc-400 mt-1 mb-4">
            Try adjusting your search terms or clearing category filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-glow-indigo transition-colors"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
