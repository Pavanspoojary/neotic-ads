'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  Search,
  Menu,
  X,
  Store,
  Layers,
  BarChart3,
  Code,
  ArrowUpRight,
  ChevronDown,
  ShieldCheck,
  DollarSign,
  PlusCircle,
  FileCode2,
} from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adsDropdownOpen, setAdsDropdownOpen] = useState(false);
  const [launchpadDropdownOpen, setLaunchpadDropdownOpen] = useState(false);
  const pathname = usePathname();

  const adsDropdownRef = useRef<HTMLDivElement>(null);
  const launchpadDropdownRef = useRef<HTMLDivElement>(null);

  const handleSearchClick = () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleSearchClick();
      }
      if (e.key === 'Escape') {
        setAdsDropdownOpen(false);
        setLaunchpadDropdownOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (adsDropdownRef.current && !adsDropdownRef.current.contains(e.target as Node)) {
        setAdsDropdownOpen(false);
      }
      if (launchpadDropdownRef.current && !launchpadDropdownRef.current.contains(e.target as Node)) {
        setLaunchpadDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdowns on route changes
  useEffect(() => {
    setAdsDropdownOpen(false);
    setLaunchpadDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-black/[0.06] transition-all select-none">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-13 sm:h-14 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity + Edge Status Pill */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity"
            title="Neotic Ads"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-950 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-3.5 h-3.5 fill-current text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm tracking-tight text-zinc-950">
                NEOTIC
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-800 border border-black/[0.06] uppercase tracking-wider">
                ADS
              </span>
            </div>
          </Link>

          {/* Sub-50ms Live Status Badge */}
          <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-50 border border-black/[0.06] text-[11px] text-zinc-500">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="font-mono text-[10px] text-zinc-600">Sub-50ms Edge</span>
          </div>
        </div>

        {/* Center: Top Navigation Tabs (Prominent Ads & Launchpad Dropdowns) */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-zinc-600">
          {/* 1. Ads Dropdown */}
          <div className="relative" ref={adsDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setAdsDropdownOpen(!adsDropdownOpen);
                setLaunchpadDropdownOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${
                adsDropdownOpen || pathname === '/'
                  ? 'bg-zinc-100 text-zinc-950 border-black/[0.08] font-medium shadow-2xs'
                  : 'bg-transparent hover:bg-black/[0.04] text-zinc-600 hover:text-zinc-950 border-transparent'
              }`}
            >
              <Store className="w-3.5 h-3.5 opacity-80" />
              <span>Ads</span>
              <ChevronDown className={`w-3 h-3 transition-transform opacity-70 ${adsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Ads Dropdown Menu */}
            {adsDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-xl bg-white/95 backdrop-blur-xl border border-black/[0.08] p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  href="/"
                  onClick={() => setAdsDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-50 transition-colors group"
                >
                  <Store className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-950 group-hover:text-emerald-600">Browse Directory</div>
                    <div className="text-[11px] text-zinc-500">Search 50K+ verified developer apps</div>
                  </div>
                </Link>
                <Link
                  href="/#marketplace-feed"
                  onClick={() => setAdsDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-50 transition-colors group"
                >
                  <Layers className="w-4 h-4 text-zinc-500 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-950 group-hover:text-emerald-600">Active Placements</div>
                    <div className="text-[11px] text-zinc-500">View 30-day verified slots available</div>
                  </div>
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setAdsDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-50 transition-colors group"
                >
                  <BarChart3 className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-950 group-hover:text-purple-600">Live Telemetry</div>
                    <div className="text-[11px] text-zinc-500">Real-time impressions & CTR stats</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* 2. Launchpad Dropdown */}
          <div className="relative" ref={launchpadDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setLaunchpadDropdownOpen(!launchpadDropdownOpen);
                setAdsDropdownOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${
                launchpadDropdownOpen || pathname === '/creator'
                  ? 'bg-zinc-100 text-zinc-950 border-black/[0.08] font-medium shadow-2xs'
                  : 'bg-transparent hover:bg-black/[0.04] text-zinc-600 hover:text-zinc-950 border-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5 opacity-80" />
              <span>Launchpad</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-500/20">
                85%
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform opacity-70 ${launchpadDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Launchpad Dropdown Menu */}
            {launchpadDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 rounded-xl bg-white/95 backdrop-blur-xl border border-black/[0.08] p-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.08)] z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  href="/creator"
                  onClick={() => setLaunchpadDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-50 transition-colors group"
                >
                  <Layers className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-950 group-hover:text-emerald-600">Creator Console</div>
                    <div className="text-[11px] text-zinc-500">Manage your registered tools & inventory</div>
                  </div>
                </Link>
                <Link
                  href="/creator"
                  onClick={() => setLaunchpadDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-50 transition-colors group"
                >
                  <PlusCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-950 group-hover:text-amber-600">Submit New Software</div>
                    <div className="text-[11px] text-zinc-500">Add web app or Chrome extension in 2 min</div>
                  </div>
                </Link>
                <Link
                  href="/creator"
                  onClick={() => setLaunchpadDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-50 transition-colors group"
                >
                  <DollarSign className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-950 group-hover:text-emerald-600">85% Escrow Payouts</div>
                    <div className="text-[11px] text-zinc-500">Automated 30-day recurring payouts</div>
                  </div>
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setLaunchpadDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-zinc-50 transition-colors group"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-600 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-950 group-hover:text-sky-600">Traffic Verification</div>
                    <div className="text-[11px] text-zinc-500">Chrome Web Store & Plausible integration</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* 3. Telemetry Tab */}
          <Link
            href="/dashboard"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${
              pathname === '/dashboard'
                ? 'bg-zinc-100 text-zinc-950 border-black/[0.08] font-medium shadow-2xs'
                : 'bg-transparent hover:bg-black/[0.04] text-zinc-600 hover:text-zinc-950 border-transparent'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 opacity-80" />
            <span>Telemetry</span>
          </Link>

          {/* 4. Client SDK Tab */}
          <Link
            href="/embed.js"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border bg-transparent hover:bg-black/[0.04] text-zinc-600 hover:text-zinc-950 border-transparent"
          >
            <Code className="w-3.5 h-3.5 opacity-80" />
            <span>Client SDK</span>
          </Link>
        </nav>

        {/* Right: Search Shortcut, Sign in, and Primary Action CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Quick Search Button (⌘K) */}
          <button
            type="button"
            onClick={handleSearchClick}
            className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100/60 hover:bg-zinc-100 border border-black/[0.05] hover:border-black/[0.1] text-zinc-500 hover:text-zinc-900 text-xs transition-all"
            title="Search developer tools (⌘K)"
          >
            <Search className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-[11px] text-zinc-600">Search</span>
            <kbd className="px-1.5 py-0.2 rounded bg-white border border-black/[0.08] text-[9px] font-mono text-zinc-500 shadow-2xs">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/creator"
            className="text-xs text-zinc-600 hover:text-zinc-950 font-medium transition-colors hidden sm:inline-block px-1"
          >
            Log in
          </Link>

          {/* High-Contrast Production Action Button */}
          <Link
            href="/creator"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all active:scale-[0.98] shadow-xs hover:shadow"
          >
            <span>List Your Tool</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-950 md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-black/[0.06] px-4 py-3 space-y-1.5 text-xs shadow-2xs">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
              pathname === '/' ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Ads Directory</span>
            </div>
          </Link>

          <Link
            href="/creator"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
              pathname === '/creator' ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Creator Launchpad</span>
            </div>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-medium font-mono bg-emerald-500/[0.08] text-emerald-800 border border-emerald-500/20">
              85% Payout
            </span>
          </Link>

          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
              pathname === '/dashboard' ? 'bg-zinc-100 text-zinc-950 font-semibold' : 'text-zinc-700 hover:text-zinc-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-zinc-500" />
              <span>Telemetry & CTR</span>
            </div>
          </Link>

          <Link
            href="/embed.js"
            target="_blank"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-zinc-700 hover:text-zinc-950"
          >
            <Code className="w-4 h-4 text-zinc-500" />
            <span>Client Embed SDK</span>
          </Link>

          <div className="pt-2 border-t border-black/[0.04]">
            <Link
              href="/creator"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
            >
              <span>List Your Tool (85% Payout)</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
