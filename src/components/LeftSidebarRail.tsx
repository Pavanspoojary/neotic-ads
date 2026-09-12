'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Tag,
  Inbox,
  CheckSquare,
  Wrench,
  Bot,
  MapPin,
  BarChart3,
  Plus,
  Mail,
  ShoppingCart,
  HelpCircle,
  Zap,
} from 'lucide-react';

export function LeftSidebarRail() {
  const pathname = usePathname();

  const primaryIcons = [
    { icon: Home, href: '/', label: 'Home', active: pathname === '/' },
    { icon: Search, href: '/#search', label: 'Search', active: false },
    { icon: Tag, href: '/sponsor/20000000-0000-0000-0000-000000000001', label: 'Deals & Ads', active: pathname.startsWith('/sponsor') },
    { icon: Inbox, href: '/embed.js', label: 'SDK & Embeds', active: false },
    { icon: CheckSquare, href: '/#marketplace', label: 'Verified Tools', active: false },
    { icon: Wrench, href: '/tools/jsonhero-visualizer', label: 'Developer Tools', active: pathname.startsWith('/tools') },
    { icon: Bot, href: '/creator', label: 'Robots & Extensions', active: false },
    { icon: MapPin, href: '/#marketplace', label: 'Directory Hub', active: false },
    { icon: BarChart3, href: '/dashboard', label: 'Telemetry', active: pathname === '/dashboard' },
  ];

  const secondaryIcons = [
    { icon: Plus, href: '/creator', label: 'List Tool / Launchpad', active: pathname === '/creator' },
    { icon: Mail, href: 'mailto:sponsor@neotic.app', label: 'Newsletter & Inquiries', active: false },
    { icon: ShoppingCart, href: '/#marketplace', label: 'Cart & Bookings', active: false },
    { icon: HelpCircle, href: '/dashboard', label: 'Help & Docs', active: false },
  ];

  return (
    <aside className="hidden lg:flex w-14 shrink-0 bg-[#0f121a] border-r border-[#212638] flex-col items-center py-3.5 z-40 sticky top-0 h-screen justify-between select-none">
      {/* Top Logo / Brand Icon */}
      <div className="flex flex-col items-center gap-4 w-full">
        <Link
          href="/"
          className="w-9 h-9 rounded-xl bg-[#1e2536] hover:bg-[#283248] text-[#73e5bf] flex items-center justify-center transition-all group shadow-sm"
          title="Neotic Ads / There's An Ad For That"
        >
          <Zap className="w-5 h-5 fill-current" />
        </Link>

        {/* Primary Icon Group */}
        <nav className="flex flex-col items-center gap-1.5 w-full px-2">
          {primaryIcons.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  item.active
                    ? 'bg-[#22293d] text-white shadow-sm'
                    : 'text-[#8b97a8] hover:text-white hover:bg-[#1a2130]'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4 stroke-[1.8]" />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Icon Group + Vibrant Blue Plus Action */}
      <div className="flex flex-col items-center gap-2 w-full px-2 pb-1">
        <div className="w-6 h-[1px] bg-[#212638] my-1" />

        <div className="flex flex-col items-center gap-1.5 w-full">
          {secondaryIcons.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  item.active
                    ? 'bg-[#22293d] text-white shadow-sm'
                    : 'text-[#8b97a8] hover:text-white hover:bg-[#1a2130]'
                }`}
                title={item.label}
              >
                <Icon className="w-4 h-4 stroke-[1.8]" />
              </Link>
            );
          })}
        </div>

        {/* Signature Floating Blue Plus Button */}
        <Link
          href="/creator"
          className="mt-2 w-9 h-9 rounded-full bg-[#1877f2] hover:bg-[#2b88ff] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(24,119,242,0.4)] hover:scale-105 active:scale-95 transition-all"
          title="Launchpad: Add your tool or slot"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </Link>
      </div>
    </aside>
  );
}
