'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  Check,
  ChevronDown,
  FileText,
  Tag,
  Search,
  Download,
  ArrowRight,
  Menu,
  X,
  Layers,
  Store,
} from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [freeMode, setFreeMode] = useState(false);
  const pathname = usePathname();

  const handleSearchClick = () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col transition-all select-none">
      {/* =========================================================================
          TOP NAV BAR 1: Main Header (As in Reference Screenshot)
          ========================================================================= */}
      <div className="w-full bg-[#131722] border-b border-[#212638] text-white">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-5 lg:px-6 h-12 flex items-center justify-between gap-3 text-xs">
          
          {/* Left: Brand Icon + Free Mode Toggle */}
          <div className="flex items-center gap-4 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              title="Neotic Ads"
            >
              <div className="w-7 h-7 rounded-lg bg-[#1e2536] text-[#73e5bf] flex items-center justify-center border border-[#2a344d]">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="font-display font-black text-sm tracking-tight text-white hidden sm:inline">
                NEOTIC <span className="text-[#ff4070]">ADS</span>
              </span>
            </Link>

            {/* > Free mode / Live Edge Toggle Switch */}
            <div className="flex items-center gap-2 pl-1 border-l border-[#212638] text-[#8b97a8]">
              <button
                type="button"
                onClick={() => setFreeMode(!freeMode)}
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <span className="text-gray-400 font-mono text-[11px]">&gt;</span>
                <span className="font-medium text-[11px]">Free mode</span>
                <span
                  className={`w-7 h-4 rounded-full p-0.5 flex items-center transition-colors ${
                    freeMode ? 'bg-[#27c93f] justify-end' : 'bg-[#2e374c] justify-start'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-white shadow-sm" />
                </span>
              </button>
            </div>
          </div>

          {/* Center: Main Navigation Tabs (Ads, Launchpad, Prompts, Deals, Search) */}
          <nav className="hidden md:flex items-center gap-2 text-xs font-medium text-[#8b97a8]">
            {/* Ads Dropdown/Tab */}
            <Link
              href="/"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/'
                  ? 'bg-[#1c2233] text-white font-semibold border border-[#2a344d]'
                  : 'hover:text-white hover:bg-[#1c2233]/60'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-[#73e5bf]" />
              <span>Ads</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Link>

            {/* Launchpad Tab */}
            <Link
              href="/creator"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/creator'
                  ? 'bg-[#1c2233] text-white font-semibold border border-[#2a344d]'
                  : 'hover:text-white hover:bg-[#1c2233]/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#a37af5]" />
              <span>Launchpad</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </Link>

            {/* Prompts / SDK Embeds */}
            <Link
              href="/embed.js"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:text-white hover:bg-[#1c2233]/60 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Prompts</span>
            </Link>

            {/* Deals */}
            <Link
              href="/dashboard"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-[#1c2233] text-white font-semibold border border-[#2a344d]'
                  : 'hover:text-white hover:bg-[#1c2233]/60'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-rose-400" />
              <span>Deals</span>
            </Link>

            {/* Quick Search Shortcut */}
            <button
              type="button"
              onClick={handleSearchClick}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181d2a] border border-[#263044] text-[#8b97a8] hover:text-white hover:border-[#384663] transition-all"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="px-1.5 py-0.2 rounded bg-[#22293b] border border-[#323d54] text-[10px] font-mono text-gray-300">
                ⌘+K
              </kbd>
            </button>
          </nav>

          {/* Right: Actions (Install, Log in, Sign up) */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/embed.js"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#8b97a8] hover:text-white font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </Link>

            <Link
              href="/dashboard"
              className="text-xs text-[#8b97a8] hover:text-white font-medium transition-colors"
            >
              Log in
            </Link>

            {/* Bright Green Sign up Pill Button */}
            <Link
              href="/creator"
              className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-[#27c93f] hover:bg-[#2ee048] text-black font-bold text-xs tracking-tight transition-all active:scale-95 shadow-sm"
            >
              Sign up
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded-lg text-[#8b97a8] hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          TOP NAV BAR 2: Announcement & Dual Switcher Bar (As in Reference Screenshot)
          ========================================================================= */}
      <div className="w-full bg-[#cb2d3e] bg-gradient-to-r from-[#d9383a] via-[#e53935] to-[#c62828] text-white py-1.5 px-3 sm:px-6 shadow-sm border-b border-[#a82224]">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4 text-xs font-semibold">
          {/* Left/Center Announcement Link */}
          <Link
            href="/creator"
            className="flex-1 text-center sm:text-left hover:underline tracking-wide flex items-center justify-center sm:justify-start gap-1.5"
          >
            <span>Click here to join Launchpad for free! Monetize native micro-slots on 30-day terms</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>

          {/* Right Dual Switcher Pills: Ads & Launchpad */}
          <div className="hidden sm:flex items-center gap-1.5">
            <Link
              href="/"
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                pathname === '/'
                  ? 'bg-white text-[#d9383a] shadow-sm'
                  : 'bg-black/20 text-white hover:bg-black/30'
              }`}
            >
              📢 Ads Directory
            </Link>
            <Link
              href="/creator"
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all ${
                pathname === '/creator'
                  ? 'bg-white text-[#d9383a] shadow-sm'
                  : 'bg-black/20 text-white hover:bg-black/30'
              }`}
            >
              🚀 Launchpad
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#131722] border-b border-[#212638] px-4 py-3 space-y-2 text-xs">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-white bg-[#1e2536]"
          >
            <Store className="w-4 h-4 text-[#73e5bf]" />
            <span>Ads Directory</span>
          </Link>
          <Link
            href="/creator"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-[#8b97a8] hover:text-white"
          >
            <Layers className="w-4 h-4 text-[#a37af5]" />
            <span>Creator Launchpad</span>
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-[#8b97a8] hover:text-white"
          >
            <Tag className="w-4 h-4 text-rose-400" />
            <span>Telemetry & Deals</span>
          </Link>
          <Link
            href="/embed.js"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 px-3 rounded-lg text-[#8b97a8] hover:text-white"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Install SDK (embed.js)</span>
          </Link>
        </div>
      )}
    </header>
  );
}
