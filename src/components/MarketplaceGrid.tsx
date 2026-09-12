'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  X,
  Code2,
  Sliders,
  Palette,
  Clock,
  LayoutGrid,
  FileCode2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Bookmark,
  Plus,
  Eye,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
} from 'lucide-react';
import { Listing, InventorySlot, ListingCategory, AppType, SlotType } from '../lib/types';
import { formatCentsToUsd } from '../lib/escrow';
import { SnippetGenerator } from './SnippetGenerator';

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
  { id: 'all', label: 'Tools' },
  { id: 'developer-tools', label: 'Developer Tools' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'design', label: 'Design & Assets' },
  { id: 'utilities', label: 'Web Utilities' },
];

interface ToolVisualMeta {
  icon: any;
  bg: string;
  badgeLabel: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatar: string;
  timeAgo: string;
  isAd?: boolean;
  views: string;
  bookmarks: number;
  version: string;
}

const TOOL_VISUALS: Record<string, ToolVisualMeta> = {
  'jsonhero-visualizer': {
    icon: Code2,
    bg: 'bg-zinc-950 text-emerald-400 border border-black/10',
    badgeLabel: 'Developer Tools',
    creatorName: 'Anant Gupta',
    creatorHandle: '@anant-gupta',
    creatorAvatar: 'AG',
    timeAgo: '5h',
    views: '1,240',
    bookmarks: 1,
    version: 'v1.4',
  },
  'tabmaster-pro': {
    icon: LayoutGrid,
    bg: 'bg-zinc-950 text-sky-400 border border-black/10',
    badgeLabel: 'Chrome Extension',
    creatorName: 'Sarah Chen',
    creatorHandle: '@sarahchen',
    creatorAvatar: 'SC',
    timeAgo: 'Ad',
    isAd: true,
    views: '2,890',
    bookmarks: 4,
    version: 'v2.4',
  },
  'svg-shape-shifter': {
    icon: Palette,
    bg: 'bg-zinc-950 text-amber-400 border border-black/10',
    badgeLabel: 'Design & Assets',
    creatorName: 'Marco Rossi',
    creatorHandle: '@mrossi',
    creatorAvatar: 'MR',
    timeAgo: '3h',
    views: '850',
    bookmarks: 2,
    version: 'v1.1',
  },
  'tailscan-devtools': {
    icon: Sliders,
    bg: 'bg-zinc-950 text-indigo-400 border border-black/10',
    badgeLabel: 'DevTools & CSS',
    creatorName: 'Stanislav Bruch',
    creatorHandle: '@stanislav',
    creatorAvatar: 'SB',
    timeAgo: '6h',
    views: '1,120',
    bookmarks: 3,
    version: 'v2.0',
  },
  'regex101-companion': {
    icon: FileCode2,
    bg: 'bg-zinc-950 text-teal-400 border border-black/10',
    badgeLabel: 'Regex Utilities',
    creatorName: 'Paras Shah',
    creatorHandle: '@paras-shah',
    creatorAvatar: 'PS',
    timeAgo: '8h',
    views: '3,400',
    bookmarks: 6,
    version: 'v1.0',
  },
  'crontab-guru-visualizer': {
    icon: Clock,
    bg: 'bg-zinc-950 text-rose-400 border border-black/10',
    badgeLabel: 'Cron Automations',
    creatorName: 'Alex Rivera',
    creatorHandle: '@arivera',
    creatorAvatar: 'AR',
    timeAgo: '1d',
    views: '940',
    bookmarks: 1,
    version: 'v1.2',
  },
  'markdown-slides-preview': {
    icon: FileCode2,
    bg: 'bg-zinc-950 text-zinc-300 border border-black/10',
    badgeLabel: 'Markdown & Slides',
    creatorName: 'Elena Rostova',
    creatorHandle: '@erostova',
    creatorAvatar: 'ER',
    timeAgo: '2d',
    views: '610',
    bookmarks: 2,
    version: 'v1.0',
  },
};

function getToolVisual(slug: string, index: number): ToolVisualMeta {
  if (TOOL_VISUALS[slug]) {
    return TOOL_VISUALS[slug];
  }
  return {
    icon: Code2,
    bg: 'bg-zinc-950 text-zinc-300 border border-black/10',
    badgeLabel: 'Web Utility',
    creatorName: 'Developer',
    creatorHandle: `@tool-${index + 1}`,
    creatorAvatar: 'DEV',
    timeAgo: `${index + 2}h`,
    views: `${(index + 1) * 320}`,
    bookmarks: (index % 5) + 1,
    version: 'v1.0',
  };
}

export function MarketplaceGrid({ initialListings, initialSlots = [] }: MarketplaceGridProps) {
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | 'all'>('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'today' | 'dau' | 'price' | 'views'>('today');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [expandedListingId, setExpandedListingId] = useState<string | null>(null);
  const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});

  // Compute live counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialListings.length };
    for (const tab of CATEGORY_TABS) {
      if (tab.id !== 'all') {
        counts[tab.id] = initialListings.filter((l) => l.category === tab.id).length;
      }
    }
    return counts;
  }, [initialListings]);

  // Precompute slot summaries
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

  // Filter listings
  const filteredListings = useMemo(() => {
    const list = initialListings.filter((listing) => {
      if (selectedCategory !== 'all' && listing.category !== selectedCategory) {
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
      if (availableOnly) {
        const stats = slotStatsMap.get(listing.id);
        if (!stats || stats.availableSlots === 0) {
          return false;
        }
      }
      if (verifiedOnly && !listing.verification_source) {
        return false;
      }
      return true;
    });

    // Apply sorting
    return list.sort((a, b) => {
      if (sortBy === 'dau') {
        return (b.verified_dau || 0) - (a.verified_dau || 0);
      }
      if (sortBy === 'price') {
        const priceA = slotStatsMap.get(a.id)?.minPriceCents ?? 999999;
        const priceB = slotStatsMap.get(b.id)?.minPriceCents ?? 999999;
        return priceA - priceB;
      }
      if (sortBy === 'views') {
        const viewsA = parseInt(TOOL_VISUALS[a.slug]?.views.replace(/,/g, '') || '0', 10);
        const viewsB = parseInt(TOOL_VISUALS[b.slug]?.views.replace(/,/g, '') || '0', 10);
        return viewsB - viewsA;
      }
      // 'today' default
      return 0;
    });
  }, [initialListings, slotStatsMap, selectedCategory, searchQuery, availableOnly, verifiedOnly, sortBy]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div id="marketplace" className="w-full space-y-6">
      {/* =========================================================================
          CENTERED SEARCH BAR & DUAL ACTION BUTTONS (As in Reference Screenshot)
          ========================================================================= */}
      <div className="max-w-2xl mx-auto text-center space-y-3 px-4">
        {/* Search Bar with ⌘+K and Search Button */}
        <div className="relative flex items-center w-full">
          <input
            id="search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const feed = document.getElementById('marketplace-feed');
                if (feed) {
                  feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }
            }}
            placeholder="Search..."
            className="w-full bg-white hover:bg-zinc-50/50 focus:bg-white text-zinc-950 placeholder-zinc-400 border border-black/[0.08] focus:border-zinc-400 rounded-full pl-5 pr-28 py-3 text-sm transition-all outline-none shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:ring-2 focus:ring-zinc-900/5"
          />
          
          <div className="absolute right-2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-700"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-100/80 border border-black/[0.06] text-[10px] font-mono text-zinc-500 shadow-2xs">
              ⌘ + K
            </span>
            <button
              type="button"
              onClick={() => {
                const feed = document.getElementById('marketplace-feed');
                if (feed) {
                  feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="w-8 h-8 rounded-full bg-zinc-950 hover:bg-black text-white flex items-center justify-center transition-colors shadow-xs"
              title="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Subtext under search */}
        <p className="text-xs text-zinc-400 font-normal tracking-wide">
          The front page of micro-tool sponsorships. Used by 50K+ developers.
        </p>

        {/* Dual Action Buttons: [Browse All Ads] & [+ Create / List Tools] */}
        <div className="flex items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setAvailableOnly(false);
              setVerifiedOnly(false);
              setSearchQuery('');
              const feed = document.getElementById('marketplace-feed');
              if (feed) {
                feed.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-black/[0.08] hover:border-black/[0.14] bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 text-xs font-medium transition-all active:scale-[0.98] shadow-2xs cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <span>Browse All Ads</span>
          </button>

          <Link
            href="/creator"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 border border-black/[0.08] hover:border-black/[0.14] text-xs font-medium transition-all active:scale-[0.98] shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-500" />
            <span>Create / List Tools</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          HORIZONTAL CATEGORY PILL FILTER BAR (Exactly as in Reference Screenshot)
          ========================================================================= */}
      <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-none no-scrollbar text-xs font-medium border-b border-black/[0.06]">
        {/* 1. Today Dropdown Pill (with glowing green dot) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
              sortBy === 'today'
                ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs font-medium'
                : 'bg-white text-zinc-700 border-black/[0.06] hover:border-black/[0.12] shadow-2xs font-medium'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sortBy === 'today' ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-emerald-500'}`} />
            <span>Today</span>
            <span className={`text-[10px] font-mono ${sortBy === 'today' ? 'opacity-80' : 'text-zinc-500'}`}>{initialListings.length}</span>
            <ChevronDown className={`w-3 h-3 opacity-60 transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Sort Dropdown Menu */}
          {sortDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-44 rounded-xl bg-white border border-black/[0.08] p-1 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] z-40">
              <button
                type="button"
                onClick={() => {
                  setSortBy('today');
                  setSortDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  sortBy === 'today' ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                <span>Today (Recent)</span>
                {sortBy === 'today' && <Check className="w-3 h-3 text-emerald-600" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('dau');
                  setSortDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  sortBy === 'dau' ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                <span>Highest DAU</span>
                {sortBy === 'dau' && <Check className="w-3 h-3 text-emerald-600" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('price');
                  setSortDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  sortBy === 'price' ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                <span>Lowest Price</span>
                {sortBy === 'price' && <Check className="w-3 h-3 text-emerald-600" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('views');
                  setSortDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                  sortBy === 'views' ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50'
                }`}
              >
                <span>Most Views</span>
                {sortBy === 'views' && <Check className="w-3 h-3 text-emerald-600" />}
              </button>
            </div>
          )}
        </div>

        {/* 2. Tools Tab */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            setAvailableOnly(false);
            setVerifiedOnly(false);
            setSearchQuery('');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            selectedCategory === 'all' && !availableOnly && !verifiedOnly && searchQuery === ''
              ? 'bg-zinc-950 text-white border-zinc-950 font-medium shadow-xs'
              : 'bg-white text-zinc-600 hover:text-zinc-950 border-black/[0.06] hover:border-black/[0.12] shadow-2xs font-medium'
          }`}
        >
          <span>Tools</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            selectedCategory === 'all' && !availableOnly && !verifiedOnly && searchQuery === ''
              ? 'bg-white/20 text-white'
              : 'bg-zinc-100 text-zinc-500 border border-black/[0.04]'
          }`}>
            {initialListings.length}
          </span>
        </button>

        {/* 3. Developer Tools */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('developer-tools');
            setAvailableOnly(false);
            setVerifiedOnly(false);
            setSearchQuery('');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            selectedCategory === 'developer-tools' && !availableOnly && !verifiedOnly
              ? 'bg-zinc-950 text-white border-zinc-950 font-medium shadow-xs'
              : 'bg-white text-zinc-600 hover:text-zinc-950 border-black/[0.06] hover:border-black/[0.12] shadow-2xs font-medium'
          }`}
        >
          <span>Developer Tools</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            selectedCategory === 'developer-tools' && !availableOnly && !verifiedOnly
              ? 'bg-white/20 text-white'
              : 'bg-zinc-100 text-zinc-500 border border-black/[0.04]'
          }`}>
            {categoryCounts['developer-tools'] ?? 2}
          </span>
        </button>

        {/* 4. Productivity */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('productivity');
            setAvailableOnly(false);
            setVerifiedOnly(false);
            setSearchQuery('');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            selectedCategory === 'productivity' && !availableOnly && !verifiedOnly
              ? 'bg-zinc-950 text-white border-zinc-950 font-medium shadow-xs'
              : 'bg-white text-zinc-600 hover:text-zinc-950 border-black/[0.06] hover:border-black/[0.12] shadow-2xs font-medium'
          }`}
        >
          <span>Productivity</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            selectedCategory === 'productivity' && !availableOnly && !verifiedOnly
              ? 'bg-white/20 text-white'
              : 'bg-zinc-100 text-zinc-500 border border-black/[0.04]'
          }`}>
            {categoryCounts['productivity'] ?? 2}
          </span>
        </button>

        {/* 5. Design & Assets */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('design');
            setAvailableOnly(false);
            setVerifiedOnly(false);
            setSearchQuery('');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            selectedCategory === 'design' && !availableOnly && !verifiedOnly
              ? 'bg-zinc-950 text-white border-zinc-950 font-medium shadow-xs'
              : 'bg-white text-zinc-600 hover:text-zinc-950 border-black/[0.06] hover:border-black/[0.12] shadow-2xs font-medium'
          }`}
        >
          <span>Design & Assets</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            selectedCategory === 'design' && !availableOnly && !verifiedOnly
              ? 'bg-white/20 text-white'
              : 'bg-zinc-100 text-zinc-500 border border-black/[0.04]'
          }`}>
            {categoryCounts['design'] ?? 2}
          </span>
        </button>

        {/* 6. Web Utilities */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('utilities');
            setAvailableOnly(false);
            setVerifiedOnly(false);
            setSearchQuery('');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            selectedCategory === 'utilities' && !availableOnly && !verifiedOnly
              ? 'bg-zinc-950 text-white border-zinc-950 font-medium shadow-xs'
              : 'bg-white text-zinc-600 hover:text-zinc-950 border-black/[0.06] hover:border-black/[0.12] shadow-2xs font-medium'
          }`}
        >
          <span>Web Utilities</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            selectedCategory === 'utilities' && !availableOnly && !verifiedOnly
              ? 'bg-white/20 text-white'
              : 'bg-zinc-100 text-zinc-500 border border-black/[0.04]'
          }`}>
            {categoryCounts['utilities'] ?? 1}
          </span>
        </button>

        {/* 7. Chrome Extensions */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            setSearchQuery('Chrome');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            searchQuery.toLowerCase() === 'chrome'
              ? 'bg-zinc-950 text-white border-zinc-950 font-medium shadow-xs'
              : 'bg-white text-zinc-600 hover:text-zinc-950 border-black/[0.06] hover:border-black/[0.12] shadow-2xs font-medium'
          }`}
        >
          <span>Chrome Extensions</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            searchQuery.toLowerCase() === 'chrome'
              ? 'bg-white/20 text-white'
              : 'bg-zinc-100 text-zinc-500 border border-black/[0.04]'
          }`}>
            2
          </span>
        </button>

        {/* 8. Verified Only Pill */}
        <button
          type="button"
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            verifiedOnly
              ? 'bg-sky-50 text-sky-700 border-sky-200 font-medium shadow-2xs'
              : 'bg-white text-zinc-600 hover:text-zinc-950 border-black/[0.06] hover:border-black/[0.12] shadow-2xs font-medium'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
          <span>Verified Only</span>
        </button>

        {/* 9. Available Slots Only Pill */}
        <button
          type="button"
          onClick={() => setAvailableOnly(!availableOnly)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            availableOnly
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium shadow-2xs'
              : 'bg-white text-zinc-600 hover:text-zinc-950 border-black/[0.06] hover:border-black/[0.12] shadow-2xs font-medium'
          }`}
        >
          <span>Available Slots</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-medium ${
            availableOnly ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-emerald-700 border border-black/[0.04]'
          }`}>
            8
          </span>
        </button>
      </div>

      {/* =========================================================================
          HIGH-DENSITY LISTING FEED ("listing like so in ss")
          ========================================================================= */}
      <div id="marketplace-feed" className="w-full space-y-2">
        {filteredListings.length === 0 ? (
          <div className="text-center py-14 bg-white rounded-xl border border-black/[0.06] text-zinc-500 shadow-2xs">
            <p className="text-xs font-semibold text-zinc-950">No developer tools found</p>
            <p className="text-xs text-zinc-400 mt-0.5">Try resetting your filters or search keywords.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setAvailableOnly(false);
                setVerifiedOnly(false);
              }}
              className="mt-3.5 px-3.5 py-1.5 rounded-lg bg-zinc-950 text-white text-xs font-medium hover:bg-black shadow-2xs transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredListings.map((listing, index) => {
            const visual = getToolVisual(listing.slug, index);
            const Icon = visual.icon;
            const stats = slotStatsMap.get(listing.id);
            const availableSlots = stats?.availableSlots ?? 0;
            const totalSlots = stats?.totalSlots ?? 0;
            const minPrice = stats?.minPriceCents ? formatCentsToUsd(stats.minPriceCents) : '$50.00';
            const isExpanded = expandedListingId === listing.id;
            const isBookmarked = bookmarkedMap[listing.id] ?? false;
            const toolSlots = initialSlots.filter((s) => s.listing_id === listing.id);
            const firstAvailableSlot = toolSlots.find((s) => s.is_available);

            return (
              <div
                key={listing.id}
                className="w-full transition-all"
              >
                {/* Main Row Strip */}
                <div
                  onClick={() => setExpandedListingId(isExpanded ? null : listing.id)}
                  className={`w-full glass-row transition-all duration-150 rounded-xl p-3 sm:px-4 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none group ${
                    isExpanded
                      ? 'border-black/[0.12] bg-white shadow-xs'
                      : ''
                  }`}
                >
                  {/* Left Group: Time/Stats, App Icon, Name & Description */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    
                    {/* Col 1: Time Ago / Ad Badge & Views */}
                    <div className="w-12 shrink-0 text-center flex flex-col items-center justify-center">
                      {visual.isAd ? (
                        <span className="px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 font-mono text-[10px] font-medium uppercase tracking-wider border border-sky-200/60">
                          AD
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-zinc-700 font-mono">
                          {visual.timeAgo}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 text-[10px] text-zinc-400 font-mono mt-0.5">
                        <Eye className="w-2.5 h-2.5 opacity-50" />
                        <span>{visual.views}</span>
                      </div>
                    </div>

                    {/* Col 2: App Icon */}
                    <div className="shrink-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${visual.bg} shadow-2xs`}>
                        <Icon className="w-5 h-5 stroke-[1.8]" />
                      </div>
                    </div>

                    {/* Col 3: Tool Name, Verified Badge, Pills & One-line Description */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/tools/${listing.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-zinc-950 text-sm hover:text-black transition-colors truncate"
                        >
                          {listing.title}
                        </Link>

                        {/* Verified Checkmark Badge */}
                        <span
                          className="inline-flex items-center text-sky-600"
                          title="Verified Traffic & Publisher"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>

                        {/* Version / Meta Pill */}
                        <span className="px-1.5 py-0.2 rounded bg-zinc-100/80 text-zinc-600 text-[10px] font-mono border border-black/[0.04]">
                          {visual.version}
                        </span>

                        {/* Slots Pill */}
                        <span className="px-1.5 py-0.2 rounded bg-zinc-100/80 text-zinc-600 text-[10px] font-mono border border-black/[0.04]">
                          {totalSlots} slots
                        </span>

                        {/* Price Pill */}
                        <span className="px-2 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-500/20 text-[10px] font-mono font-medium">
                          {minPrice}
                        </span>
                      </div>

                      {/* One-Line Description */}
                      <p className="text-xs text-zinc-500 truncate max-w-xl font-normal">
                        {listing.description}
                      </p>
                    </div>
                  </div>

                  {/* Middle / Right Group: Category Pill, Creator Profile, Action & Bookmark */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.05]">
                    
                    {/* Col 4: Category Pill */}
                    <div className="hidden lg:flex items-center px-2.5 py-0.5 rounded-full bg-zinc-100/60 border border-black/[0.05] text-[11px] text-zinc-600">
                      <span className="font-medium text-[11px] text-zinc-600">{visual.badgeLabel}</span>
                    </div>

                    {/* Col 5: Creator Profile */}
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-6 h-6 rounded-full bg-zinc-950 border border-black/10 flex items-center justify-center text-[9px] font-bold text-zinc-200 font-mono shadow-2xs">
                        {visual.creatorAvatar}
                      </div>
                      <div className="text-[11px] leading-tight">
                        <div className="font-medium text-zinc-950 flex items-center gap-1">
                          <span>{visual.creatorName}</span>
                          <Check className="w-2.5 h-2.5 text-sky-600 stroke-[2.5]" />
                        </div>
                        <div className="text-zinc-400 font-mono text-[10px]">
                          {visual.creatorHandle}
                        </div>
                      </div>
                    </div>

                    {/* Col 6: Actions — Sleek Obsidian Book Ad button & Bookmark */}
                    <div className="flex items-center gap-2">
                      {firstAvailableSlot ? (
                        <Link
                          href={`/sponsor/${firstAvailableSlot.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="px-3.5 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white border border-zinc-950 text-xs font-medium transition-all active:scale-[0.98] shadow-2xs flex items-center gap-1.5"
                          title="Directly book this slot"
                        >
                          <span>Book Ad</span>
                          <span className="text-emerald-400 font-mono text-[11px] font-normal">({minPrice})</span>
                        </Link>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-400 text-[11px] font-medium border border-black/[0.06]">
                          Sold Out
                        </span>
                      )}

                      {/* Bookmark Icon Pill */}
                      <button
                        type="button"
                        onClick={(e) => toggleBookmark(listing.id, e)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
                          isBookmarked
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-white hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900 border-black/[0.06] hover:border-black/[0.12] shadow-2xs'
                        }`}
                        title="Bookmark this tool"
                      >
                        <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : 'fill-none'}`} />
                        <span className="text-[11px] font-mono">
                          {visual.bookmarks + (isBookmarked ? 1 : 0)}
                        </span>
                      </button>

                      {/* Drawer Chevron */}
                      <div className="text-zinc-400 group-hover:text-zinc-700 transition-colors pl-0.5">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* =========================================================================
                    EXPANDABLE INLINE DRAWER (Slot Booking & Code Embed Details)
                    ========================================================================= */}
                {isExpanded && (
                  <div className="w-full bg-[#fafafa] border-x border-b border-black/[0.06] rounded-b-xl p-5 mt-[-4px] mb-3 space-y-4 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-black/[0.06]">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-950 uppercase tracking-wider">
                          Configured Micro-Sponsorship Slots for {listing.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {listing.verified_dau.toLocaleString()} Verified DAU · {listing.verification_source.toUpperCase()} Audited
                        </p>
                      </div>

                      <Link
                        href={`/tools/${listing.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline"
                      >
                        <span>View Full Listing Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Available Slots Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {toolSlots.length === 0 ? (
                        <div className="col-span-full py-4 text-center text-xs text-zinc-500">
                          No active slots configured for this application yet.
                        </div>
                      ) : (
                        toolSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="p-3.5 rounded-xl bg-white border border-black/[0.06] hover:border-black/[0.12] flex flex-col justify-between gap-3 transition-all shadow-2xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-zinc-950 text-xs">
                                  {slot.slot_name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                    slot.is_available
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-500/20'
                                      : 'bg-rose-50 text-rose-800 border border-rose-500/20'
                                  }`}
                                >
                                  {slot.is_available ? 'Available' : 'Occupied'}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500">
                                Format: <span className="text-zinc-900 font-mono">{slot.slot_type}</span>
                              </p>
                              <div className="text-xs font-bold text-zinc-950 pt-1">
                                {formatCentsToUsd(slot.monthly_price_cents)}{' '}
                                <span className="text-[10px] font-normal text-zinc-500">/ 30-day term</span>
                              </div>
                            </div>

                            {/* Booking Action */}
                            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                              <div className="text-[10px] text-zinc-500 font-mono">
                                Escrow: 85% Creator / 15% Platform
                              </div>
                              <Link
                                href={`/sponsor/${slot.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-black text-white text-xs font-semibold transition-colors shadow-xs"
                              >
                                <span>Book This Slot</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Quick Client SDK Integration */}
                    {toolSlots.length > 0 && (
                      <div className="pt-2">
                        <SnippetGenerator
                          slot={toolSlots[0]}
                          listingSlug={listing.slug}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
