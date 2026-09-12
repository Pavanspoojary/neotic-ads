/**
 * Integration Snippet Generator for SponsorSlot
 * File path: src/lib/snippets.ts
 *
 * Generates client SDK embed scripts, headless JSON API snippets, and cURL commands.
 */

export interface EmbedSnippet {
  html: string;
  scriptUrl: string;
  containerId: string;
}

export interface HeadlessSnippet {
  fetchCode: string;
  curlCommand: string;
}

export interface IntegrationSnippets {
  slotId: string;
  embedHtml: string;
  embedScript: string;
  fetchSnippet: string;
  reactSnippet: string;
}

/**
 * Generates client SDK embed snippet with container element and async script tag.
 */
export function generateEmbedSnippet(
  slotId: string,
  domain: string = 'https://sponsorslot.dev'
): EmbedSnippet {
  const safeSlotId = slotId ? slotId.trim() : '';
  const containerId = `sponsorslot-${safeSlotId}`;
  const scriptUrl = `${domain}/embed.js`;
  const html = `<div id="${containerId}"></div>\n<script src="${scriptUrl}" data-slot-id="${safeSlotId}" async></script>`;

  return {
    html,
    scriptUrl,
    containerId,
  };
}

/**
 * Generates headless JSON API fetch code and cURL command.
 */
export function generateHeadlessSnippet(
  slotId: string,
  domain: string = 'https://sponsorslot.dev'
): HeadlessSnippet {
  const safeSlotId = slotId ? slotId.trim() : '';
  const fetchCode = `// Fetch active creative payload from SponsorSlot Headless Edge API
async function fetchSponsorSlot() {
  const response = await fetch('${domain}/api/v1/slot/${safeSlotId}', {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 300 } // 5-minute edge cache
  });

  const payload = await response.json();

  if (payload.active) {
    // Render verified native sponsor creative
    console.log(\`[Sponsor] \${payload.creative.text} -> \${payload.creative.target_url}\`);
  } else {
    // Unfilled slot fallback referral CTA
    console.log(\`[Available] \${payload.creative.text} -> \${payload.creative.target_url}\`);
  }

  // Fire zero-PII impression telemetry beacon
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(
      '${domain}/api/v1/telemetry/beacon',
      JSON.stringify({ slot_id: '${safeSlotId}', event: 'impression' })
    );
  }

  return payload;
}`;

  const curlCommand = `curl -X GET "${domain}/api/v1/slot/${safeSlotId}" -H "Accept: application/json"`;

  return {
    fetchCode,
    curlCommand,
  };
}

/**
 * Generates unified integration snippets for React, HTML, and Headless setups.
 */
export function generateIntegrationSnippets(
  slotId: string,
  options?: { baseUrl?: string }
): IntegrationSnippets {
  const baseUrl = options?.baseUrl || 'https://sponsorslot.dev';
  const safeSlotId = slotId ? slotId.trim() : '';

  const embed = generateEmbedSnippet(safeSlotId, baseUrl);
  const headless = generateHeadlessSnippet(safeSlotId, baseUrl);

  return {
    slotId: safeSlotId,
    embedHtml: `<div id="sponsorslot-${safeSlotId}" data-sponsorslot-id="${safeSlotId}"></div>`,
    embedScript: `<script src="${baseUrl}/embed.js" data-slot-id="${safeSlotId}" async></script>`,
    fetchSnippet: headless.fetchCode,
    reactSnippet: `import { useEffect, useState } from 'react';

export function SponsorSlotBanner() {
  const [slotData, setSlotData] = useState<any>(null);

  useEffect(() => {
    fetch('${baseUrl}/api/v1/slot/${safeSlotId}')
      .then((res) => res.json())
      .then((data) => setSlotData(data))
      .catch((err) => console.error('SponsorSlot fetch error:', err));
  }, []);

  if (!slotData) return null;

  return (
    <a
      href={slotData.creative?.target_url || '#'}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="inline-flex items-center gap-2 px-3 py-1 text-xs rounded-full bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-500 transition-colors"
    >
      <span>{slotData.creative?.text}</span>
      <span className="text-[10px] text-slate-400 font-mono">↗</span>
    </a>
  );
}`,
  };
}
