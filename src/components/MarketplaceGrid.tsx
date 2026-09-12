'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  CheckCircle2,
  ExternalLink,
  ArrowUpDown,
  ShieldCheck,
  Chrome,
  Globe,
  Terminal,
  Layers,
  Sparkles,
  Code2,
  Sliders,
  Palette,
  Clock,
  LayoutGrid,
  FileCode2,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
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

// Helper to assign Capterra-style app icon and software badges
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
      bg: 'bg-emerald-600',
      icon: Code2,
      rating: '4.8',
      reviews: '872',
      highlight: 'Highly rated for Developer Experience',
      badge: 'Highly recommended',
      sentiment: { positive: 96, neutral: 3, negative: 1 },
      avatars: ['JD', 'M', 'SK'],
    },
    'tabmaster-pro': {
      bg: 'bg-indigo-600',
      icon: LayoutGrid,
      rating: '4.9',
      reviews: '1,420',
      highlight: 'Highly rated for Ease of Use',
      badge: 'Highest rated',
      sentiment: { positive: 95, neutral: 3, negative: 2 },
      avatars: ['AL', 'RK', 'T'],
    },
    'svg-shape-shifter': {
      bg: 'bg-amber-600',
      icon: Palette,
      rating: '4.7',
      reviews: '440',
      highlight: 'Highly rated for Functionality',
      badge: 'Trending Design',
      sentiment: { positive: 92, neutral: 6, negative: 2 },
      avatars: ['MC', 'DN', 'PR'],
    },
    'tailscan-devtools': {
      bg: 'bg-sky-600',
      icon: Sliders,
      rating: '4.8',
      reviews: '1,003',
      highlight: 'Highly rated for Value-for-Money',
      badge: 'Highest rated',
      sentiment: { positive: 94, neutral: 4, negative: 2 },
      avatars: ['TS', 'EW', 'B'],
    },
    'regex101-companion': {
      bg: 'bg-teal-600',
      icon: FileCode2,
      rating: '4.6',
      reviews: '310',
      highlight: 'Highly rated for Productivity',
      sentiment: { positive: 91, neutral: 7, negative: 2 },
      avatars: ['RX', 'KP', 'GH'],
    },
    'crontab-guru-visualizer': {
      bg: 'bg-rose-600',
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

  const fallbackBgs = ['bg-blue-600', 'bg-violet-600', 'bg-cyan-600', 'bg-orange-600'];
  return {
    bg: fallbackBgs[index % fallbackBgs.length],
    icon: Sparkles,
    rating: (4.6 + (index % 4) * 0.1).toFixed(1),
    reviews: `${(index + 2) * 140}`,
    highlight: 'Highly rated for Value-for-Money',
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
      {/* Capterra-Style Section Title */}
      <div className="text-center pt-4 pb-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Explore popular software categories
        </h2>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Browse verified micro-tools with 500–25k DAU and reserve context-driven in-app sponsorships.
        </p>
      </div>

      {/* Horizontal Category Tab Bar with Blue Underline Indicator */}
      {/* Horizontal Category Tab Bar with Blue Underline Indicator & Counts */}
      <div className="flex justify-center border-b border-slate-200">
        <div
          role="tablist"
          aria-label="Software Categories"
          className="flex items-center gap-6 sm:gap-8 overflow-x-auto px-4 scrollbar-none"
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
                className={`relative whitespace-nowrap pb-3.5 text-sm sm:text-base transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-t-lg ${
                  isSelected
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900 font-medium'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
                {isSelected && (
                  <span className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search software by name, keywords, or features..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-slate-400 text-slate-900 bg-slate-50/50 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Clear search input"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Secondary Controls: Type & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Format:</span>
              <select
                value={selectedAppType}
                onChange={(e) => setSelectedAppType(e.target.value as AppType | 'all')}
                className="text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              >
                {APP_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs sm:text-sm py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
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

        {/* Quick Search Suggestions */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span className="text-[11px] font-semibold text-slate-400">Trending:</span>
          {['JSON', 'Chrome', 'Design', 'Tabs', 'CLI', 'Digest'].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSearchQuery(tag)}
              className="text-[11px] px-2.5 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Lower Row: Presets & Instant Book Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Verified Traffic:</span>
            {DAU_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => setMinDau(preset.value)}
                className={`text-xs px-3 py-1 rounded-full transition-colors font-medium ${
                  minDau === preset.value
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                Available Slots Only
              </span>
            </label>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline ml-2"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Pill Bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-500">Active:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                <span>{CATEGORY_TABS.find((t) => t.id === selectedCategory)?.label}</span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="hover:text-blue-900 p-0.5"
                  aria-label="Remove category filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedAppType !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                <span>{APP_TYPES.find((t) => t.id === selectedAppType)?.label}</span>
                <button
                  onClick={() => setSelectedAppType('all')}
                  className="hover:text-blue-900 p-0.5"
                  aria-label="Remove format filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {minDau > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                <span>{minDau.toLocaleString()}+ DAU</span>
                <button
                  onClick={() => setMinDau(0)}
                  className="hover:text-blue-900 p-0.5"
                  aria-label="Remove DAU filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {availableOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                <span>Available Only</span>
                <button
                  onClick={() => setAvailableOnly(false)}
                  className="hover:text-emerald-900 p-0.5"
                  aria-label="Remove available only filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery.trim().length > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                <span>&quot;{searchQuery}&quot;</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="hover:text-blue-900 p-0.5"
                  aria-label="Clear search text"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Result Count Status */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{filteredListings.length}</strong> of {initialListings.length} verified software tools
        </span>
        <span className="hidden sm:inline">Single-tenant 30-day escrow terms</span>
      </div>


      {/* 3-Column Card Grid (Matching User's Screenshot Exactly) */}
      {filteredListings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing, index) => {
            const stats = slotStatsMap.get(listing.id);
            const visuals = getAppVisuals(listing.slug, listing.category, index);
            const IconComponent = visuals.icon;
            const minPrice = stats?.minPriceCents;
            const availableCount = stats?.availableSlots ?? 0;

            return (
              <div
                key={listing.id}
                className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: App Icon + Title + Rating + Top Right Badge */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* App Icon */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs ${visuals.bg}`}
                      >
                        <IconComponent className="w-6 h-6 stroke-[2.2]" />
                      </div>

                      {/* App Title & Star Rating */}
                      <div>
                        <Link
                          href={`/tools/${listing.slug}`}
                          className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {listing.title}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 mt-0.5">
                          <span className="text-amber-500 text-sm leading-none">★</span>
                          <span className="font-bold text-slate-900">{visuals.rating}</span>
                          <span className="text-slate-500 font-medium">({visuals.reviews})</span>
                        </div>
                        {/* Verified Traffic Badge & App Format */}
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <VerificationBadge
                            source={listing.verification_source}
                            dau={listing.verified_dau}
                            size="sm"
                            showDetails={false}
                          />
                          <span className="text-[10px] font-medium text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            {listing.app_type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Top Right Recommendation Badge */}
                    {visuals.badge && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                        <span>👍</span>
                        <span>{visuals.badge}</span>
                      </span>
                    )}
                  </div>

                  {/* Feature Highlight Headline */}
                  <div className="mb-4">
                    <div className="text-sm font-bold text-slate-900 leading-snug">
                      {visuals.highlight}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Based on {listing.verified_dau.toLocaleString()} verified daily active users
                    </div>
                  </div>

                  {/* Review Sentiment Progress Section */}
                  <div className="mb-4 pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900">Review Sentiment</span>
                      {/* Overlapping User Avatars */}
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {visuals.avatars.map((av, idx) => (
                          <div
                            key={idx}
                            className="w-5 h-5 rounded-full ring-2 ring-white bg-slate-700 text-white flex items-center justify-center text-[8px] font-bold"
                          >
                            {av}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3-Part Progress Bar */}
                    <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-100 gap-0.5" role="meter" aria-label="Review Sentiment Breakdown" aria-valuenow={visuals.sentiment.positive}>
                      <div
                        className="bg-[#22c55e] h-full rounded-l-full transition-all"
                        style={{ width: `${visuals.sentiment.positive}%` }}
                        title={`Positive: ${visuals.sentiment.positive}%`}
                      />
                      <div
                        className="bg-[#94a3b8] h-full transition-all"
                        style={{ width: `${visuals.sentiment.neutral}%` }}
                        title={`Neutral: ${visuals.sentiment.neutral}%`}
                      />
                      <div
                        className="bg-[#ef4444] h-full rounded-r-full transition-all"
                        style={{ width: `${visuals.sentiment.negative}%` }}
                        title={`Negative: ${visuals.sentiment.negative}%`}
                      />
                    </div>

                    {/* Sentiment Breakdown Labels */}
                    <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                      <div>
                        <div>Positive</div>
                        <div className="font-bold text-slate-900 text-xs">{visuals.sentiment.positive}%</div>
                      </div>
                      <div className="text-center">
                        <div>Neutral</div>
                        <div className="font-bold text-slate-900 text-xs">{visuals.sentiment.neutral}%</div>
                      </div>
                      <div className="text-right">
                        <div>Negative</div>
                        <div className="font-bold text-slate-900 text-xs">{visuals.sentiment.negative}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Inventory Availability Pill */}
                  <div className="py-2 px-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-1 text-slate-600">
                      <span className="font-bold text-slate-900">
                        {minPrice ? formatCentsToUsd(minPrice) : 'Contact'}
                      </span>
                      <span className="text-slate-400">/ 30 days</span>
                    </div>

                    {availableCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => setExpandedSlotsToolId(expandedSlotsToolId === listing.id ? null : listing.id)}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-100/70 hover:bg-emerald-200/70 px-2.5 py-1 rounded-full text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                        aria-expanded={expandedSlotsToolId === listing.id}
                        aria-label="Inspect available inventory slots"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>{availableCount} Vacant</span>
                        {expandedSlotsToolId === listing.id ? (
                          <ChevronUp className="h-3 w-3 ml-0.5 text-emerald-700" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-0.5 text-emerald-700" />
                        )}
                      </button>
                    ) : (
                      <span className="text-slate-400 font-medium text-[11px]">Fully Booked</span>
                    )}
                  </div>

                  {/* Expandable Quick Slot Inspector Drawer */}
                  {expandedSlotsToolId === listing.id && (
                    <div className="my-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        <span>Available Units ({initialSlots.filter((s) => s.listing_id === listing.id).length})</span>
                        <span className="text-slate-400 font-normal">30-day lease</span>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {initialSlots
                          .filter((s) => s.listing_id === listing.id)
                          .map((slot) => (
                            <div
                              key={slot.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 text-xs shadow-3xs"
                            >
                              <div className="min-w-0 pr-2">
                                <div className="font-semibold text-slate-900 truncate text-[11px]">{slot.slot_name}</div>
                                <div className="text-[10px] text-slate-500 font-mono capitalize">{slot.slot_type.replace('_', ' ')}</div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-bold text-slate-900 text-xs">{formatCentsToUsd(slot.monthly_price_cents)}</span>
                                {slot.is_available ? (
                                  <Link
                                    href={`/sponsor/${slot.id}`}
                                    className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shadow-2xs"
                                  >
                                    Book
                                  </Link>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-400">
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

                {/* Card Actions: View Profile (Outline) & Visit Website / Sponsor (Filled Blue Pill) */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
                  <Link
                    href={`/tools/${listing.slug}`}
                    className="w-full py-2.5 px-4 rounded-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-xs text-center transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  >
                    View profile
                  </Link>

                  {availableCount > 0 ? (
                    <Link
                      href={`/tools/${listing.slug}#slots`}
                      className="w-full py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <span>Sponsor Slot</span>
                      <span className="text-xs">↗</span>
                    </Link>
                  ) : (
                    <a
                      href={listing.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs text-center transition-colors flex items-center justify-center gap-1 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <span>Visit Website</span>
                      <span className="text-xs">↗</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No software found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            Try adjusting your search terms or clearing category filters.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
