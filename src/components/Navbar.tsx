'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { name: 'Marketplace', href: '/#marketplace', icon: Store, active: pathname === '/' },
    { name: 'Launchpad', href: '/creator', icon: Layers, active: pathname === '/creator', badge: '85% Payout' },
    { name: 'Telemetry', href: '/dashboard', icon: BarChart3, active: pathname === '/dashboard' },
    { name: 'Client SDK', href: '/embed.js', icon: Code, active: false },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0d1017]/85 backdrop-blur-xl border-b border-white/[0.08] transition-all select-none">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity + Edge Status Pill */}
        <div className="flex items-center gap-4 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-opacity"
            title="Neotic Ads"
          >
            <div className="w-7 h-7 rounded-lg bg-[#161c28] border border-white/10 text-[#73e5bf] flex items-center justify-center group-hover:border-[#73e5bf]/40 transition-colors shadow-sm">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm tracking-tight text-white">
                NEOTIC
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/[0.06] text-[#8b97a8] border border-white/[0.08] uppercase tracking-wider">
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

        {/* Center: Premium Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-[#8b97a8]">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  item.active
                    ? 'bg-white/[0.06] text-white font-semibold border border-white/[0.1] shadow-sm'
                    : 'hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 opacity-70" />
                <span>{item.name}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-[#73e5bf]/15 text-[#73e5bf] border border-[#73e5bf]/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Search Shortcut, Sign in, and Primary Action CTA */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Search Button (⌘K) */}
          <button
            type="button"
            onClick={handleSearchClick}
            className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] text-[#8b97a8] hover:text-white text-xs transition-all"
            title="Search developer tools (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="text-[11px]">Search</span>
            <kbd className="px-1 py-0.2 rounded bg-black/40 border border-white/10 text-[9px] font-mono text-gray-400">
              ⌘K
            </kbd>
          </button>

          <Link
            href="/creator"
            className="text-xs text-[#8b97a8] hover:text-white font-medium transition-colors hidden sm:inline-block"
          >
            Sign in
          </Link>

          {/* High-Contrast Production Action Button */}
          <Link
            href="/creator"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-gray-100 text-[#0d1017] font-semibold text-xs transition-all active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <span>List Your Tool</span>
            <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
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

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0d1017] border-b border-white/[0.08] px-4 py-3 space-y-2 text-xs">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  item.active ? 'bg-white/[0.08] text-white font-semibold' : 'text-[#8b97a8] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#8b97a8]" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-[#73e5bf]/15 text-[#73e5bf]">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-white/[0.08]">
            <Link
              href="/creator"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-1.5 py-2 rounded-lg bg-white text-[#0d1017] font-semibold text-xs"
            >
              <span>List Your Tool</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
