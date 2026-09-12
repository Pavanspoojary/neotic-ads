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
  Sparkles,
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
    <header className="sticky top-0 z-50 w-full bg-[#0b0e14]/90 backdrop-blur-xl border-b border-white/[0.08] transition-all select-none">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity + Edge Status Pill */}
        <div className="flex items-center gap-3.5 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity"
            title="Neotic Ads"
          >
            <div className="w-7 h-7 rounded-lg bg-[#141923] border border-white/10 text-[#73e5bf] flex items-center justify-center group-hover:border-[#73e5bf]/40 transition-colors shadow-sm">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm tracking-tight text-white">
                NEOTIC
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/[0.06] text-[#73e5bf] border border-[#73e5bf]/25 uppercase tracking-wider">
                ADS
              </span>
            </div>
          </Link>

          {/* Sub-50ms Live Status Badge */}
          <div className="hidden lg:inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.07] text-[11px] text-[#8b97a8]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#73e5bf] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#73e5bf]" />
            </span>
            <span className="font-mono text-[10px] text-gray-300">Edge Sub-50ms</span>
          </div>
        </div>

        {/* Center: Top Navigation Tabs (Prominent Ads & Launchpad Dropdowns) */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-medium text-[#8b97a8]">
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
                  ? 'bg-white/[0.08] text-white border-white/[0.15] shadow-sm font-semibold'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-gray-300 border-white/[0.07] hover:border-white/[0.12]'
              }`}
            >
              <span>🛒</span>
              <span>Ads</span>
              <ChevronDown className={`w-3 h-3 transition-transform opacity-70 ${adsDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Ads Dropdown Menu */}
            {adsDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 rounded-xl glass-panel p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  href="/"
                  onClick={() => setAdsDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] transition-colors group"
                >
                  <Store className="w-4 h-4 text-[#73e5bf] mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-[#73e5bf]">Browse Directory</div>
                    <div className="text-[11px] text-[#8b97a8]">Search 50K+ verified developer apps</div>
                  </div>
                </Link>
                <Link
                  href="/#marketplace-feed"
                  onClick={() => setAdsDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] transition-colors group"
                >
                  <Sparkles className="w-4 h-4 text-sky-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-sky-300">Active Placements</div>
                    <div className="text-[11px] text-[#8b97a8]">View 30-day verified slots available</div>
                  </div>
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setAdsDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] transition-colors group"
                >
                  <BarChart3 className="w-4 h-4 text-purple-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-purple-300">Live Telemetry</div>
                    <div className="text-[11px] text-[#8b97a8]">Real-time impressions & CTR stats</div>
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
                  ? 'bg-white/[0.08] text-white border-white/[0.15] shadow-sm font-semibold'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] text-gray-300 border-white/[0.07] hover:border-white/[0.12]'
              }`}
            >
              <span>🚀</span>
              <span>Launchpad</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-[#73e5bf]/15 text-[#73e5bf] border border-[#73e5bf]/30">
                85%
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform opacity-70 ${launchpadDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Launchpad Dropdown Menu */}
            {launchpadDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 rounded-xl glass-panel p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <Link
                  href="/creator"
                  onClick={() => setLaunchpadDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] transition-colors group"
                >
                  <Layers className="w-4 h-4 text-[#73e5bf] mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-[#73e5bf]">Creator Console</div>
                    <div className="text-[11px] text-[#8b97a8]">Manage your registered tools & inventory</div>
                  </div>
                </Link>
                <Link
                  href="/creator"
                  onClick={() => setLaunchpadDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] transition-colors group"
                >
                  <PlusCircle className="w-4 h-4 text-amber-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-amber-300">Submit New Software</div>
                    <div className="text-[11px] text-[#8b97a8]">Add web app or Chrome extension in 2 min</div>
                  </div>
                </Link>
                <Link
                  href="/creator"
                  onClick={() => setLaunchpadDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] transition-colors group"
                >
                  <DollarSign className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-emerald-300">85% Escrow Payouts</div>
                    <div className="text-[11px] text-[#8b97a8]">Automated 30-day recurring payouts</div>
                  </div>
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setLaunchpadDropdownOpen(false)}
                  className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.06] transition-colors group"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-sky-300">Traffic Verification</div>
                    <div className="text-[11px] text-[#8b97a8]">Chrome Web Store & Plausible integration</div>
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
                ? 'bg-white/[0.08] text-white border-white/[0.15] font-semibold'
                : 'bg-white/[0.03] hover:bg-white/[0.06] text-[#8b97a8] hover:text-white border-white/[0.07] hover:border-white/[0.12]'
            }`}
          >
            <span>📊</span>
            <span>Telemetry</span>
          </Link>

          {/* 4. Client SDK Tab */}
          <Link
            href="/embed.js"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border bg-white/[0.03] hover:bg-white/[0.06] text-[#8b97a8] hover:text-white border-white/[0.07] hover:border-white/[0.12]"
          >
            <span>🧩</span>
            <span>Client SDK</span>
          </Link>
        </nav>

        {/* Right: Search Shortcut, Sign in, and Primary Action CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Search Button (⌘K) */}
          <button
            type="button"
            onClick={handleSearchClick}
            className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] text-[#8b97a8] hover:text-white text-xs transition-all"
            title="Search developer tools (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[11px]">Search</span>
            <kbd className="px-1.5 py-0.2 rounded bg-black/40 border border-white/10 text-[9px] font-mono text-gray-400">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/creator"
            className="text-xs text-[#8b97a8] hover:text-white font-medium transition-colors hidden sm:inline-block"
          >
            Log in
          </Link>

          {/* High-Contrast Production Action Button */}
          <Link
            href="/creator"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-gray-100 text-[#0b0e14] font-bold text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <span>List Your Tool</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-[#8b97a8] hover:text-white md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0b0e14] border-b border-white/[0.08] px-4 py-3 space-y-2 text-xs">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
              pathname === '/' ? 'bg-white/[0.08] text-white font-semibold' : 'text-[#8b97a8] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#73e5bf]" />
              <span>Ads Directory</span>
            </div>
          </Link>

          <Link
            href="/creator"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
              pathname === '/creator' ? 'bg-white/[0.08] text-white font-semibold' : 'text-[#8b97a8] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#73e5bf]" />
              <span>Creator Launchpad</span>
            </div>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-[#73e5bf]/15 text-[#73e5bf]">
              85% Payout
            </span>
          </Link>

          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between py-2 px-3 rounded-lg ${
              pathname === '/dashboard' ? 'bg-white/[0.08] text-white font-semibold' : 'text-[#8b97a8] hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Telemetry & CTR</span>
            </div>
          </Link>

          <Link
            href="/embed.js"
            target="_blank"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-[#8b97a8] hover:text-white"
          >
            <Code className="w-4 h-4 text-sky-400" />
            <span>Client Embed SDK</span>
          </Link>

          <div className="pt-2 border-t border-white/[0.08]">
            <Link
              href="/creator"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 py-2.5 rounded-full bg-white text-[#0b0e14] font-bold text-xs"
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
