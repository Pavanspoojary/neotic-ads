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
  Sparkles,
  ExternalLink,
  Check,
  Bookmark,
  Plus,
  Eye,
  ArrowRight,
  ShieldCheck,
  Zap,
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
  badgeIcon: string;
  badgeLabel: string;
  creatorName: string;
  creatorHandle: string;
  creatorFlag: string;
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
    bg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
    badgeIcon: '⚡',
    badgeLabel: 'Developer Tools',
    creatorName: 'Anant Gupta',
    creatorHandle: '@anant-gupta',
    creatorFlag: '🇺🇸',
    creatorAvatar: 'AG',
    timeAgo: '5h',
    views: '1,240',
    bookmarks: 1,
    version: 'v1.4',
  },
  'tabmaster-pro': {
    icon: LayoutGrid,
    bg: 'bg-sky-500/15 text-sky-400 border border-sky-500/25',
    badgeIcon: '🧩',
    badgeLabel: 'Chrome Extension',
    creatorName: 'Sarah Chen',
    creatorHandle: '@sarahchen',
    creatorFlag: '🇨🇦',
    creatorAvatar: 'SC',
    timeAgo: 'Ad',
    isAd: true,
    views: '2,890',
    bookmarks: 4,
    version: 'v2.4',
  },
  'svg-shape-shifter': {
    icon: Palette,
    bg: 'bg-amber-500/15 text-amber-400 border border-amber-500/25',
    badgeIcon: '🎨',
    badgeLabel: 'Design & Assets',
    creatorName: 'Marco Rossi',
    creatorHandle: '@mrossi',
    creatorFlag: '🇮🇹',
    creatorAvatar: 'MR',
    timeAgo: '3h',
    views: '850',
    bookmarks: 2,
    version: 'v1.1',
  },
  'tailscan-devtools': {
    icon: Sliders,
    bg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
    badgeIcon: '🛠',
    badgeLabel: 'DevTools & CSS',
    creatorName: 'Stanislav Bruch',
    creatorHandle: '@stanislav',
    creatorFlag: '🇨🇿',
    creatorAvatar: 'SB',
    timeAgo: '6h',
    views: '1,120',
    bookmarks: 3,
    version: 'v2.0',
  },
  'regex101-companion': {
    icon: FileCode2,
    bg: 'bg-teal-500/15 text-teal-400 border border-teal-500/25',
    badgeIcon: '⚡',
    badgeLabel: 'Regex Utilities',
    creatorName: 'Paras Shah',
    creatorHandle: '@paras-shah',
    creatorFlag: '🇮🇳',
    creatorAvatar: 'PS',
    timeAgo: '8h',
    views: '3,400',
    bookmarks: 6,
    version: 'v1.0',
  },
  'crontab-guru-visualizer': {
    icon: Clock,
    bg: 'bg-rose-500/15 text-rose-400 border border-rose-500/25',
    badgeIcon: '⏱',
    badgeLabel: 'Cron Automations',
    creatorName: 'Alex Rivera',
    creatorHandle: '@arivera',
    creatorFlag: '🇪🇸',
    creatorAvatar: 'AR',
    timeAgo: '1d',
    views: '940',
    bookmarks: 1,
    version: 'v1.2',
  },
  'markdown-slides-preview': {
    icon: Sparkles,
    bg: 'bg-purple-500/15 text-purple-400 border border-purple-500/25',
    badgeIcon: '📄',
    badgeLabel: 'Markdown & Slides',
    creatorName: 'Elena Rostova',
    creatorHandle: '@erostova',
    creatorFlag: '🇩🇪',
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
    icon: Sparkles,
    bg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
    badgeIcon: '🛠',
    badgeLabel: 'Web Utility',
    creatorName: 'Developer',
    creatorHandle: `@tool-${index + 1}`,
    creatorFlag: '🌐',
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
    return initialListings.filter((listing) => {
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
  }, [initialListings, slotStatsMap, selectedCategory, searchQuery, availableOnly, verifiedOnly]);

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
            placeholder="Search..."
            className="w-full bg-[#181d28] hover:bg-[#1c2230] focus:bg-[#1c2230] text-white placeholder-[#8b97a8] border border-[#2a344d] focus:border-[#73e5bf]/60 rounded-full pl-5 pr-28 py-3 text-sm transition-all outline-none shadow-inner"
          />
          
          <div className="absolute right-2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded-full text-gray-400 hover:text-white"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-[#22293b] border border-[#323d54] text-[10px] font-mono text-gray-300">
              ⌘ + K
            </span>
            <button
              type="button"
              className="w-8 h-8 rounded-full bg-[#242c3d] hover:bg-[#2e374c] text-white flex items-center justify-center border border-[#344059] transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtext under search */}
        <p className="text-xs text-[#8b97a8] font-normal tracking-wide">
          The front page of micro-tool sponsorships. Used by 50K+ developers.
        </p>

        {/* Dual Action Buttons: [Browse Ads] & [+ Launchpad / List Tool] */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setAvailableOnly(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#d9383a]/70 hover:border-[#d9383a] bg-[#d9383a]/10 hover:bg-[#d9383a]/20 text-[#ff5f6d] text-xs font-semibold transition-all active:scale-95"
          >
            <span>📢</span>
            <span>Browse All Ads</span>
          </button>

          <Link
            href="/creator"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1e2433] hover:bg-[#262e40] text-white border border-[#2e384e] text-xs font-semibold transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create / List Tools</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          HORIZONTAL CATEGORY PILL FILTER BAR (As in Reference Screenshot)
          ========================================================================= */}
      <div className="w-full flex items-center gap-2 overflow-x-auto pb-2 pt-2 scrollbar-none no-scrollbar text-xs font-medium border-b border-[#212638]">
        {/* Today Dropdown Pill (with glowing green dot) */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            setAvailableOnly(false);
            setVerifiedOnly(false);
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            selectedCategory === 'all' && !availableOnly && !verifiedOnly
              ? 'bg-[#18392b] text-[#73e5bf] border-[#73e5bf]/40 shadow-sm'
              : 'bg-[#181d28] text-gray-300 border-[#2a344d] hover:border-gray-500'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#27c93f] shadow-[0_0_6px_#27c93f]" />
          <span className="font-semibold">Today</span>
          <span className="text-[11px] font-mono opacity-80">{initialListings.length}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>

        {/* Category Tabs with Counts */}
        {CATEGORY_TABS.map((cat) => {
          const isSelected = selectedCategory === cat.id && !availableOnly && !verifiedOnly;
          const count = categoryCounts[cat.id] ?? 0;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setAvailableOnly(false);
                setVerifiedOnly(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
                isSelected
                  ? 'bg-[#22293d] text-white border-[#3b4763] font-semibold'
                  : 'bg-[#181d28] text-[#8b97a8] border-[#252f44] hover:text-white hover:border-[#354058]'
              }`}
            >
              <span>{cat.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#121620] text-[10px] font-mono text-gray-400">
                {count}
              </span>
            </button>
          );
        })}

        {/* Chrome Extensions Quick Filter */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategory('all');
            setSearchQuery('Chrome');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            searchQuery.toLowerCase() === 'chrome'
              ? 'bg-[#22293d] text-white border-[#3b4763] font-semibold'
              : 'bg-[#181d28] text-[#8b97a8] border-[#252f44] hover:text-white'
          }`}
        >
          <span>Chrome Extensions</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#121620] text-[10px] font-mono text-gray-400">
            2
          </span>
        </button>

        {/* Verified Only Pill */}
        <button
          type="button"
          onClick={() => setVerifiedOnly(!verifiedOnly)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            verifiedOnly
              ? 'bg-[#162a3d] text-[#38bdf8] border-[#38bdf8]/40 font-semibold'
              : 'bg-[#181d28] text-[#8b97a8] border-[#252f44] hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3 h-3 text-[#38bdf8]" />
          <span>Verified Only</span>
        </button>

        {/* Available Slots Only Pill */}
        <button
          type="button"
          onClick={() => setAvailableOnly(!availableOnly)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full shrink-0 border transition-all ${
            availableOnly
              ? 'bg-[#18392b] text-[#73e5bf] border-[#73e5bf]/40 font-semibold'
              : 'bg-[#181d28] text-[#8b97a8] border-[#252f44] hover:text-white'
          }`}
        >
          <span>Available Slots</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#121620] text-[10px] font-mono text-[#73e5bf]">
            8
          </span>
        </button>
      </div>

      {/* =========================================================================
          HIGH-DENSITY LISTING FEED ("listing like so in ss")
          ========================================================================= */}
      <div className="w-full space-y-2">
        {filteredListings.length === 0 ? (
          <div className="text-center py-16 bg-[#181d28] rounded-2xl border border-[#252f44] text-[#8b97a8]">
            <p className="text-sm font-semibold text-white">No developer tools found</p>
            <p className="text-xs mt-1">Try resetting your filters or search keywords.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setAvailableOnly(false);
                setVerifiedOnly(false);
              }}
              className="mt-4 px-4 py-1.5 rounded-full bg-[#242c3d] text-white text-xs font-semibold hover:bg-[#2e374c]"
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
            const minPrice = stats?.minPriceCents ? formatCentsToUsd(stats.minPriceCents) : '$50/mo';
            const isExpanded = expandedListingId === listing.id;
            const isBookmarked = bookmarkedMap[listing.id] ?? false;
            const toolSlots = initialSlots.filter((s) => s.listing_id === listing.id);

            return (
              <div
                key={listing.id}
                className="w-full transition-all"
              >
                {/* Main Row Strip */}
                <div
                  onClick={() => setExpandedListingId(isExpanded ? null : listing.id)}
                  className={`w-full bg-[#181d28] hover:bg-[#1f2535] border transition-all rounded-xl p-3 sm:px-4 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none group ${
                    isExpanded
                      ? 'border-[#73e5bf]/40 bg-[#1c2232] shadow-sm'
                      : 'border-[#263044] hover:border-[#35425c]'
                  }`}
                >
                  {/* Left Group: Time/Stats, App Icon, Name & Description */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    
                    {/* Col 1: Time Ago / Ad Badge & Views */}
                    <div className="w-12 shrink-0 text-center flex flex-col items-center justify-center">
                      {visual.isAd ? (
                        <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold uppercase tracking-wider border border-sky-500/30">
                          Ad
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-300 font-mono">
                          {visual.timeAgo}
                        </span>
                      )}
                      <div className="flex items-center gap-0.5 text-[10px] text-gray-400 font-mono mt-0.5">
                        <Eye className="w-2.5 h-2.5 opacity-60" />
                        <span>{visual.views}</span>
                      </div>
                    </div>

                    {/* Col 2: App Icon with Corner Badge */}
                    <div className="relative shrink-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${visual.bg} shadow-inner`}>
                        <Icon className="w-5 h-5 stroke-[2]" />
                      </div>
                      {/* Corner Icon Badge */}
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1877f2] border border-[#131722] text-[9px] text-white flex items-center justify-center shadow-sm">
                        {visual.badgeIcon}
                      </span>
                    </div>

                    {/* Col 3: Tool Name, Verified Badge, Pills & One-line Description */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          href={`/tools/${listing.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold text-white text-sm hover:text-[#73e5bf] transition-colors truncate"
                        >
                          {listing.title}
                        </Link>

                        {/* Verified Checkmark Badge */}
                        <span
                          className="inline-flex items-center text-[#38bdf8]"
                          title="Verified Traffic & Publisher"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>

                        {/* Version / Meta Pill */}
                        <span className="px-1.5 py-0.2 rounded bg-[#242b3d] text-gray-300 text-[10px] font-mono">
                          {visual.version}
                        </span>

                        {/* Slots Pill */}
                        <span className="px-1.5 py-0.2 rounded bg-[#242b3d] text-gray-300 text-[10px] font-mono">
                          {totalSlots} slots
                        </span>

                        {/* Price Pill */}
                        <span className="px-1.5 py-0.2 rounded bg-[#1e2b24] text-[#73e5bf] border border-[#73e5bf]/30 text-[10px] font-mono font-bold">
                          {minPrice}
                        </span>
                      </div>

                      {/* One-Line Description */}
                      <p className="text-xs text-[#8b97a8] truncate max-w-xl font-normal">
                        {listing.description}
                      </p>
                    </div>
                  </div>

                  {/* Middle / Right Group: Category Pill, Creator Profile, Action & Bookmark */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#252f44]">
                    
                    {/* Col 4: Category Pill */}
                    <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#202737] border border-[#2c364d] text-xs text-gray-300">
                      <span>{visual.badgeIcon}</span>
                      <span className="font-medium text-[11px]">{visual.badgeLabel}</span>
                    </div>

                    {/* Col 5: Creator Profile */}
                    <div className="flex items-center gap-2 text-left">
                      <div className="w-7 h-7 rounded-full bg-[#2a344d] border border-[#3b4763] flex items-center justify-center text-[10px] font-bold text-white">
                        {visual.creatorAvatar}
                      </div>
                      <div className="text-[11px] leading-tight">
                        <div className="font-semibold text-white flex items-center gap-1">
                          <span>{visual.creatorName}</span>
                          <Check className="w-2.5 h-2.5 text-[#38bdf8] stroke-[3]" />
                          <span>{visual.creatorFlag}</span>
                        </div>
                        <div className="text-[#8b97a8] font-mono text-[10px]">
                          {visual.creatorHandle}
                        </div>
                      </div>
                    </div>

                    {/* Col 6: Actions — Book Ad / Slots & Bookmark */}
                    <div className="flex items-center gap-1.5">
                      {availableSlots > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedListingId(isExpanded ? null : listing.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#27c93f]/15 hover:bg-[#27c93f]/25 text-[#73e5bf] border border-[#73e5bf]/30 text-xs font-semibold transition-all active:scale-95"
                        >
                          Book Ad ({minPrice})
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-gray-800 text-gray-400 text-[11px] font-medium border border-gray-700">
                          Sold Out
                        </span>
                      )}

                      {/* Bookmark Icon Pill */}
                      <button
                        type="button"
                        onClick={(e) => toggleBookmark(listing.id, e)}
                        className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border transition-all ${
                          isBookmarked
                            ? 'bg-[#1877f2]/20 text-[#38bdf8] border-[#38bdf8]/40'
                            : 'bg-[#202737] hover:bg-[#293245] text-gray-400 hover:text-white border-[#2c364d]'
                        }`}
                        title="Bookmark this tool"
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[11px] font-mono">
                          {visual.bookmarks + (isBookmarked ? 1 : 0)}
                        </span>
                      </button>

                      {/* Drawer Chevron */}
                      <div className="text-gray-400 group-hover:text-white transition-colors pl-0.5">
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
                  <div className="w-full bg-[#131722] border-x border-b border-[#2a344d] rounded-b-xl p-4 mt-[-4px] mb-3 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#212638]">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Configured Micro-Sponsorship Slots for {listing.title}
                        </h4>
                        <p className="text-[11px] text-[#8b97a8] mt-0.5">
                          {listing.verified_dau.toLocaleString()} Verified DAU · {listing.verification_source.toUpperCase()} Audited
                        </p>
                      </div>

                      <Link
                        href={`/tools/${listing.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#73e5bf] hover:underline"
                      >
                        <span>View Full Listing Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {/* Available Slots Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {toolSlots.length === 0 ? (
                        <div className="col-span-full py-4 text-center text-xs text-gray-400">
                          No active slots configured for this application yet.
                        </div>
                      ) : (
                        toolSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="p-3.5 rounded-xl bg-[#181d28] border border-[#252f44] flex flex-col justify-between gap-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-white text-xs">
                                  {slot.slot_name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    slot.is_available
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}
                                >
                                  {slot.is_available ? 'Available' : 'Occupied'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#8b97a8]">
                                Format: <span className="text-white font-mono">{slot.slot_type}</span>
                              </p>
                              <div className="text-xs font-bold text-white pt-1">
                                {formatCentsToUsd(slot.monthly_price_cents)}{' '}
                                <span className="text-[10px] font-normal text-gray-400">/ 30-day term</span>
                              </div>
                            </div>

                            {/* Booking Action */}
                            <div className="pt-2 border-t border-[#212638] flex items-center justify-between">
                              <div className="text-[10px] text-gray-400 font-mono">
                                Escrow: 85% Creator / 15% Platform
                              </div>
                              <Link
                                href={`/sponsor/${slot.id}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#73e5bf] hover:bg-[#86efac] text-[#130f18] text-xs font-bold transition-colors shadow-sm"
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
