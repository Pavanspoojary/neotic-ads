'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Menu,
  X,
  Store,
  Layers,
  BarChart3,
  PlusCircle,
  Activity,
} from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    {
      name: 'Marketplace',
      href: '/',
      icon: Store,
      active: pathname === '/',
    },
    {
      name: 'Creator Portal',
      href: '/creator',
      icon: Layers,
      badge: '85% Payout',
      active: pathname === '/creator',
    },
    {
      name: 'Analytics Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      active: pathname === '/dashboard',
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#130f18]/90 backdrop-blur-xl border-b border-[#252542] transition-all">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand Logo & Wordmark */}
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="flex items-center gap-2 text-white group"
            >
              {/* Jam Pink Wordmark in Display Typography */}
              <span className="font-display font-black text-xl tracking-tight text-[#ff4070] group-hover:opacity-90 transition-opacity">
                NEOTIC
              </span>
              <span className="text-xs font-semibold text-[#8b94a3] uppercase tracking-wider font-mono">
                ADS
              </span>
            </Link>

            {/* Live Mint Signal Pulse Badge */}
            <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#21192a] border border-[#e5e7eb]/15 text-[#73e5bf]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#73e5bf] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#73e5bf]"></span>
              </span>
              <span className="text-[#e5e7eb] font-mono text-[10px]">Edge Active · Sub-50ms</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    link.active
                      ? 'bg-[#21192a] text-white border border-[#e5e7eb]/15 shadow-sm'
                      : 'text-[#8b94a3] hover:text-white hover:bg-[#21192a]/50'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 opacity-70" />
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#73e5bf]/15 text-[#73e5bf] border border-[#73e5bf]/30">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Ghost Nav Button */}
            <Link
              href="/dashboard"
              className="inline-flex items-center px-3.5 py-2 rounded-nav bg-[#21192a] border border-[#e5e7eb]/20 text-xs font-medium text-white hover:bg-[#2e2d36] transition-all"
            >
              Console
            </Link>

            {/* Header CTA Button (Jam Pink) */}
            <Link
              href="/creator"
              className="inline-flex items-center gap-1.5 rounded-btn bg-[#ff4070] hover:bg-[#ff2d62] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98]"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Get Started</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#8b94a3] hover:text-white hover:bg-[#21192a] transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#252542] bg-[#130f18]/98 px-4 pt-2 pb-4 space-y-2 backdrop-blur-2xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  link.active
                    ? 'bg-[#21192a] text-white border border-[#e5e7eb]/15'
                    : 'text-[#8b94a3] hover:text-white hover:bg-[#21192a]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-[#8b94a3]" />
                  <span>{link.name}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#73e5bf]/15 text-[#73e5bf] border border-[#73e5bf]/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              href="/creator"
              onClick={() => setMobileMenuOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-btn bg-[#ff4070] hover:bg-[#ff2d62] py-2.5 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Get Started (85% Payout)</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
