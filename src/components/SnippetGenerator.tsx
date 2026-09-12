'use client';

/**
 * Integration Snippet Generator Component
 * File path: src/components/SnippetGenerator.tsx
 *
 * Provides copy-ready Client SDK embed tags, Headless JSON API fetch code,
 * and cURL terminal commands with native clipboard copy feedback.
 */

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Code,
  Terminal,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { InventorySlot } from '../lib/types';

export interface SnippetGeneratorProps {
  slot: InventorySlot;
  listingSlug?: string;
  baseUrl?: string;
  onClose?: () => void;
  mode?: 'card' | 'modal';
}

type SnippetTab = 'client_sdk' | 'headless_api' | 'curl';

export function SnippetGenerator({
  slot,
  listingSlug,
  baseUrl = 'https://sponsorslot.dev',
  onClose,
  mode = 'card',
}: SnippetGeneratorProps) {
  const [activeTab, setActiveTab] = useState<SnippetTab>('client_sdk');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Snippet 1: Client SDK Embed Script with Shadow DOM Isolation
  const clientSdkSnippet = `<!-- 1. Place Container Where You Want the Ad Format Rendered -->
<div id="sponsorslot-${slot.id}"></div>

<!-- 2. Async Client SDK (Shadow DOM Isolated, Zero Style Clashing) -->
<script
  src="${baseUrl}/embed.js"
  data-slot-id="${slot.id}"
  async
></script>`;

  // Snippet 2: Headless JSON API (Next.js, React, Chrome Extension MV3)
  const headlessApiSnippet = `// SponsorSlot Headless Edge Delivery (Manifest V3 & Server Components Compliant)
async function fetchSponsorSlot() {
  const response = await fetch('${baseUrl}/api/v1/slot/${slot.id}', {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 300 } // 5-minute CDN cache
  });

  const payload = await response.json();

  if (payload.active) {
    // Render live sponsored advertiser creative
    console.log(\`[Sponsor] \${payload.creative.text} -> \${payload.creative.target_url}\`);
  } else {
    // Unfilled slot fallback referral CTA
    console.log(\`[Available] \${payload.creative.text} -> \${payload.creative.target_url}\`);
  }

  // Fire zero-PII impression telemetry beacon
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(
      '${baseUrl}/api/v1/telemetry/beacon',
      JSON.stringify({ slot_id: '${slot.id}', event: 'impression' })
    );
  }

  return payload;
}`;

  // Snippet 3: Terminal cURL
  const curlSnippet = `curl -X GET "${baseUrl}/api/v1/slot/${slot.id}" \\
  -H "Accept: application/json"`;

  // Native Platform Clipboard Copy Routine
  const handleCopy = async (text: string, key: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-secure contexts or testing environments
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 2500);
    } catch (err) {
      console.error('[SnippetGenerator] Copy failed:', err);
    }
  };

  const getActiveCode = () => {
    switch (activeTab) {
      case 'client_sdk':
        return clientSdkSnippet;
      case 'headless_api':
        return headlessApiSnippet;
      case 'curl':
        return curlSnippet;
    }
  };

  return (
    <div className="w-full text-slate-100 space-y-4">
      {/* Header Context */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base sm:text-lg font-bold text-white">
              Integration Snippets for {slot.slot_name}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Embed via Client SDK script or fetch directly using the Headless JSON API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Format: {slot.slot_type}
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Snippet Generator"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 text-xs sm:text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('client_sdk')}
          className={`pb-2.5 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'client_sdk'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Client SDK Script</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Zero-Code
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('headless_api')}
          className={`pb-2.5 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'headless_api'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="h-4 w-4" />
          <span>Headless JSON API</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            React / MV3
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('curl')}
          className={`pb-2.5 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'curl'
              ? 'border-indigo-500 text-indigo-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="h-4 w-4" />
          <span>cURL</span>
        </button>
      </div>

      {/* Code Block Box with Copy Button */}
      <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-inner">
        {/* Copy Button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={() => handleCopy(getActiveCode(), activeTab)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
              copiedKey === activeTab
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            {copiedKey === activeTab ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <pre className="overflow-x-auto pr-24 pt-1 leading-relaxed whitespace-pre font-mono">
          <code>{getActiveCode()}</code>
        </pre>
      </div>

      {/* Architecture Guidance Callout */}
      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
        <div className="font-semibold text-white flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Architecture & Runtime Behavior</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 text-[11px] leading-relaxed">
          <li>
            <strong className="text-slate-300">Shadow DOM Isolation:</strong> <code className="text-indigo-300">embed.js</code> mounts into an open shadow root to prevent global CSS clashes.
          </li>
          <li>
            <strong className="text-slate-300">Unfilled Fallback:</strong> If the slot is vacant, it automatically renders a viral sponsor referral banner (<code className="text-indigo-300">⚡ Place your product here via SponsorSlot</code>).
          </li>
          <li>
            <strong className="text-slate-300">Zero-PII Telemetry:</strong> Impressions and clicks trigger atomic counters on the Edge without collecting user IP, cookies, or personal identifiers.
          </li>
        </ul>
      </div>
    </div>
  );
}
