import React from 'react';
import { VerificationSource } from '../lib/types';

export interface VerificationBadgeProps {
  source: VerificationSource;
  dau?: number;
  identifier?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  className?: string;
}

interface SourceConfig {
  name: string;
  shortLabel: string;
  badgeClass: string;
  iconSvg: React.ReactNode;
  description: string;
}

const SOURCE_CONFIGS: Record<VerificationSource, SourceConfig> = {
  chrome_web_store: {
    name: 'Chrome Web Store',
    shortLabel: 'CWS Verified',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]',
    description: 'Verified via Chrome Web Store active user metrics',
    iconSvg: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="21.17" y1="8" x2="12" y2="8" />
        <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
        <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
      </svg>
    ),
  },
  plausible: {
    name: 'Plausible Analytics',
    shortLabel: 'Plausible Verified',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]',
    description: 'Verified via Plausible privacy-friendly analytics API',
    iconSvg: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  posthog: {
    name: 'PostHog Analytics',
    shortLabel: 'PostHog Verified',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]',
    description: 'Verified via PostHog product telemetry event stream',
    iconSvg: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  ga4: {
    name: 'Google Analytics 4',
    shortLabel: 'GA4 Verified',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]',
    description: 'Verified via Google Analytics 4 daily active stream',
    iconSvg: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="8" width="4" height="12" rx="1" />
        <rect x="18" y="4" width="4" height="16" rx="1" />
      </svg>
    ),
  },
  manual: {
    name: 'SponsorSlot Audited',
    shortLabel: 'Audit Verified',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]',
    description: 'Audited and verified by SponsorSlot engineering staff',
    iconSvg: (
      <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
};

export function VerificationBadge({
  source,
  dau,
  identifier,
  size = 'md',
  showDetails = false,
  className = '',
}: VerificationBadgeProps) {
  const config = SOURCE_CONFIGS[source] || SOURCE_CONFIGS.manual;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3 py-1.5 gap-2.5',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-4.5 h-4.5',
  }[size];

  return (
    <div
      className={`inline-flex items-center font-medium rounded-full border shadow-sm ${config.badgeClass} ${sizeClasses} ${className}`}
      title={`${config.name}: ${config.description}`}
    >
      <span className={`shrink-0 ${iconSizes}`} aria-hidden="true">
        {config.iconSvg}
      </span>
      <span>{config.shortLabel}</span>
      {dau !== undefined && (
        <>
          <span className="opacity-40">•</span>
          <span className="font-semibold">{dau.toLocaleString('en-US')} DAU</span>
        </>
      )}
      {showDetails && identifier && (
        <span className="text-[10px] opacity-75 font-mono hidden sm:inline">({identifier})</span>
      )}
    </div>
  );
}
