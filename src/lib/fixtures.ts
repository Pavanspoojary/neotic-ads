/**
 * Deterministic Test Fixtures & Seed Data for SponsorSlot
 * File path: src/lib/fixtures.ts
 *
 * Synchronized with supabase/seed.sql (7 listings, 18 slots, 10 sponsorships, 540 telemetry records).
 */

import { Listing, InventorySlot, Sponsorship, ImpressionTelemetry } from './types';

function getRelativeDate(daysOffset: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

export const SEED_LISTINGS: Listing[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    creator_id: '00000000-0000-0000-0000-000000000001',
    title: 'JSONHero Visualizer',
    slug: 'jsonhero-visualizer',
    description: 'Clean, beautiful, and intuitive JSON viewer and schema validator for API developers with AST tree exploration.',
    category: 'developer-tools',
    app_type: 'web_app',
    website_url: 'https://jsonhero.io',
    verified_dau: 12400,
    verification_source: 'plausible',
    verification_identifier: 'jsonhero.io',
    verification_data: { monthly_pageviews: 410000, bounce_rate: 0.32, top_country: 'US' },
    status: 'active',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    creator_id: '00000000-0000-0000-0000-000000000002',
    title: 'TabMaster Pro',
    slug: 'tabmaster-pro',
    description: 'Lightweight Chrome extension that automatically organizes browser tabs into smart workspaces and saves 60% memory.',
    category: 'productivity',
    app_type: 'chrome_extension',
    website_url: 'https://chrome.google.com/webstore/detail/tabmaster-pro',
    verified_dau: 18900,
    verification_source: 'chrome_web_store',
    verification_identifier: 'kbfnbcaeplbcioakkpcpgfkobkghlhen',
    verification_data: { weekly_active_users: 18900, rating: 4.88, rating_count: 342, version: '2.4.1' },
    status: 'active',
    created_at: '2026-07-15T00:00:00Z',
    updated_at: '2026-09-05T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    creator_id: '00000000-0000-0000-0000-000000000003',
    title: 'SVG Shape Shifter',
    slug: 'svg-shape-shifter',
    description: 'Browser-based SVG path editor, icon optimizer, and animated spline transformer for product designers.',
    category: 'design',
    app_type: 'web_app',
    website_url: 'https://svgshapeshifter.design',
    verified_dau: 5400,
    verification_source: 'posthog',
    verification_identifier: 'svgshapeshifter.design',
    verification_data: { active_sessions_30d: 162000, avg_session_sec: 420 },
    status: 'active',
    created_at: '2026-08-05T00:00:00Z',
    updated_at: '2026-09-02T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    creator_id: '00000000-0000-0000-0000-000000000001',
    title: 'Cronitor CLI & Health Monitor',
    slug: 'cronitor-cli',
    description: 'Terminal-first cron job debugger, health telemetry dashboard, and webhook failure alerting system.',
    category: 'developer-tools',
    app_type: 'desktop_app',
    website_url: 'https://cronitor-cli.dev',
    verified_dau: 8200,
    verification_source: 'ga4',
    verification_identifier: 'G-CRON82910',
    verification_data: { monthly_events: 780000, platforms: ['darwin-arm64', 'linux-amd64'] },
    status: 'active',
    created_at: '2026-08-10T00:00:00Z',
    updated_at: '2026-09-04T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    creator_id: '00000000-0000-0000-0000-000000000002',
    title: 'RegexForge Expression Tester',
    slug: 'regex-forge',
    description: 'Real-time regular expression debugger with visual AST breakdown, match benchmarking, and code generation.',
    category: 'utilities',
    app_type: 'web_app',
    website_url: 'https://regexforge.dev',
    verified_dau: 15800,
    verification_source: 'plausible',
    verification_identifier: 'regexforge.dev',
    verification_data: { monthly_pageviews: 520000, top_referrers: ['github.com', 'stackoverflow.com'] },
    status: 'active',
    created_at: '2026-07-20T00:00:00Z',
    updated_at: '2026-09-03T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    creator_id: '00000000-0000-0000-0000-000000000003',
    title: 'Markdown Digest Mailer',
    slug: 'markdown-digest-mailer',
    description: 'Automated weekly markdown briefing service turning GitHub releases and engineering blogs into clean emails.',
    category: 'productivity',
    app_type: 'web_app',
    website_url: 'https://markdowndigest.app',
    verified_dau: 3900,
    verification_source: 'manual',
    verification_identifier: 'verified_by_sponsorslot_audit_2026',
    verification_data: { subscribers: 9400, open_rate: 0.44 },
    status: 'active',
    created_at: '2026-08-25T00:00:00Z',
    updated_at: '2026-09-08T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    creator_id: '00000000-0000-0000-0000-000000000003',
    title: 'ColorTokens Design System Palette',
    slug: 'colortokens-palette',
    description: 'Eyedropper and contrast auditor extracting CSS color tokens directly from any web page into Figma & Tailwind.',
    category: 'design',
    app_type: 'chrome_extension',
    website_url: 'https://colortokens.dev',
    verified_dau: 6100,
    verification_source: 'chrome_web_store',
    verification_identifier: 'clrtknspaletteextid998',
    verification_data: { weekly_active_users: 6100, rating: 4.92, rating_count: 89 },
    status: 'active',
    created_at: '2026-08-28T00:00:00Z',
    updated_at: '2026-09-09T00:00:00Z',
  },
];

export const SEED_SLOTS: InventorySlot[] = [
  // Listing 1: JSONHero Visualizer
  {
    id: '20000000-0000-0000-0000-000000000001',
    listing_id: '10000000-0000-0000-0000-000000000001',
    slot_name: 'Dashboard Header Bar Pill',
    slot_type: 'header_pill',
    monthly_price_cents: 25000,
    is_available: false,
    max_sponsors: 1,
    guidelines: 'B2B developer tools, cloud infrastructure, or observability platforms only. No crypto/gambling.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    listing_id: '10000000-0000-0000-0000-000000000001',
    slot_name: 'Empty Schema Canvas Card',
    slot_type: 'empty_state',
    monthly_price_cents: 35000,
    is_available: true,
    max_sponsors: 1,
    guidelines: 'Targeted at API engineers who paste payloads. API mocking and testing tools perform best here.',
    created_at: '2026-08-01T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    listing_id: '10000000-0000-0000-0000-000000000001',
    slot_name: 'Inspect Drawer Footer Link',
    slot_type: 'footer_badge',
    monthly_price_cents: 12000,
    is_available: false,
    max_sponsors: 1,
    guidelines: 'Compact 120x30 logo or clean text sponsor attribution.',
    created_at: '2026-08-01T00:00:00Z',
  },

  // Listing 2: TabMaster Pro
  {
    id: '20000000-0000-0000-0000-000000000004',
    listing_id: '10000000-0000-0000-0000-000000000002',
    slot_name: 'Extension Popup Top Pill',
    slot_type: 'header_pill',
    monthly_price_cents: 40000,
    is_available: false,
    max_sponsors: 1,
    guidelines: 'Productivity apps, task management, or remote work tools.',
    created_at: '2026-07-15T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    listing_id: '10000000-0000-0000-0000-000000000002',
    slot_name: 'No Open Tabs Empty State',
    slot_type: 'empty_state',
    monthly_price_cents: 20000,
    is_available: true,
    max_sponsors: 1,
    guidelines: 'Rendered when all tabs are organized into workspaces.',
    created_at: '2026-07-15T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000006',
    listing_id: '10000000-0000-0000-0000-000000000002',
    slot_name: 'Options Page Partner Badge',
    slot_type: 'footer_badge',
    monthly_price_cents: 8000,
    is_available: true,
    max_sponsors: 1,
    guidelines: 'Discreet partner badge in settings screen.',
    created_at: '2026-07-15T00:00:00Z',
  },

  // Listing 3: SVG Shape Shifter
  {
    id: '20000000-0000-0000-0000-000000000007',
    listing_id: '10000000-0000-0000-0000-000000000003',
    slot_name: 'Canvas Toolbar Top Pill',
    slot_type: 'header_pill',
    monthly_price_cents: 15000,
    is_available: true,
    max_sponsors: 1,
    guidelines: 'Design assets, icon libraries, fonts, and Figma plugins.',
    created_at: '2026-08-05T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000008',
    listing_id: '10000000-0000-0000-0000-000000000003',
    slot_name: 'Export Modal Partner Footer',
    slot_type: 'footer_badge',
    monthly_price_cents: 10000,
    is_available: false,
    max_sponsors: 1,
    guidelines: 'Shown directly before designers download optimized SVG code.',
    created_at: '2026-08-05T00:00:00Z',
  },

  // Listing 4: Cronitor CLI & Health Monitor
  {
    id: '20000000-0000-0000-0000-000000000009',
    listing_id: '10000000-0000-0000-0000-000000000004',
    slot_name: 'Terminal Output Summary Pill',
    slot_type: 'header_pill',
    monthly_price_cents: 30000,
    is_available: false,
    max_sponsors: 1,
    guidelines: 'DevOps, SRE tooling, incident response, and cloud monitoring services.',
    created_at: '2026-08-10T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000010',
    listing_id: '10000000-0000-0000-0000-000000000004',
    slot_name: 'Daily Health Digest Email Notice',
    slot_type: 'email_footer',
    monthly_price_cents: 18000,
    is_available: false,
    max_sponsors: 1,
    guidelines: 'Single line notice in 8,200 daily health check dispatch emails.',
    created_at: '2026-08-10T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000011',
    listing_id: '10000000-0000-0000-0000-000000000004',
    slot_name: 'Zero Incidents Empty State',
    slot_type: 'empty_state',
    monthly_price_cents: 22000,
    is_available: true,
    max_sponsors: 1,
    guidelines: 'High-visibility card rendered when all monitor checks are green.',
    created_at: '2026-08-10T00:00:00Z',
  },

  // Listing 5: RegexForge Expression Tester
  {
    id: '20000000-0000-0000-0000-000000000012',
    listing_id: '10000000-0000-0000-0000-000000000005',
    slot_name: 'Editor Navbar Pill',
    slot_type: 'header_pill',
    monthly_price_cents: 35000,
    is_available: true,
    max_sponsors: 1,
    guidelines: 'Developer SaaS, code review platforms, and security scanners.',
    created_at: '2026-07-20T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000013',
    listing_id: '10000000-0000-0000-0000-000000000005',
    slot_name: 'Cheat Sheet Drawer Footer',
    slot_type: 'footer_badge',
    monthly_price_cents: 15000,
    is_available: false,
    max_sponsors: 1,
    guidelines: 'Placed at bottom of quick-reference regex syntax guide.',
    created_at: '2026-07-20T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000014',
    listing_id: '10000000-0000-0000-0000-000000000005',
    slot_name: 'Empty Library State',
    slot_type: 'empty_state',
    monthly_price_cents: 25000,
    is_available: true,
    max_sponsors: 1,
    guidelines: 'Shown when user has no saved regex expressions.',
    created_at: '2026-07-20T00:00:00Z',
  },

  // Listing 6: Markdown Digest Mailer
  {
    id: '20000000-0000-0000-0000-000000000015',
    listing_id: '10000000-0000-0000-0000-000000000006',
    slot_name: 'Weekly Engineering Digest Footer',
    slot_type: 'email_footer',
    monthly_price_cents: 50000,
    is_available: false,
    max_sponsors: 1,
    guidelines: 'Prominent sponsor section in weekly dispatch to 9,400 senior engineers.',
    created_at: '2026-08-25T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000016',
    listing_id: '10000000-0000-0000-0000-000000000006',
    slot_name: 'Web Archive Footer Badge',
    slot_type: 'footer_badge',
    monthly_price_cents: 7500,
    is_available: true,
    max_sponsors: 1,
    guidelines: 'Clean badge on public web newsletter issue archive.',
    created_at: '2026-08-25T00:00:00Z',
  },

  // Listing 7: ColorTokens Design System Palette
  {
    id: '20000000-0000-0000-0000-000000000017',
    listing_id: '10000000-0000-0000-0000-000000000007',
    slot_name: 'Extension Eyedropper Header',
    slot_type: 'header_pill',
    monthly_price_cents: 18000,
    is_available: true,
    max_sponsors: 1,
    guidelines: 'Design software, UI kits, design token management systems.',
    created_at: '2026-08-28T00:00:00Z',
  },
  {
    id: '20000000-0000-0000-0000-000000000018',
    listing_id: '10000000-0000-0000-0000-000000000007',
    slot_name: 'Palette History Empty State',
    slot_type: 'empty_state',
    monthly_price_cents: 12000,
    is_available: true,
    max_sponsors: 1,
    guidelines: 'Rendered when user starts a new session before sampling colors.',
    created_at: '2026-08-28T00:00:00Z',
  },
];

export const SEED_SPONSORSHIPS: Sponsorship[] = [
  // 1. LogFast Telemetry on JSONHero Header Bar (Active)
  {
    id: '30000000-0000-0000-0000-000000000001',
    slot_id: '20000000-0000-0000-0000-000000000001',
    sponsor_id: '00000000-0000-0000-0000-000000000011',
    sponsor_name: 'LogFast Telemetry',
    sponsor_email: 'partners@logfast.io',
    status: 'active',
    creative_text: 'Real-time Next.js application logs & exception tracing with LogFast',
    creative_target_url: 'https://logfast.io?utm_source=sponsorslot&utm_medium=header_pill&utm_campaign=jsonhero',
    creative_image_url: 'https://cdn.sponsorslot.com/creatives/logfast-logo.svg',
    start_date: getRelativeDate(-10),
    end_date: getRelativeDate(20),
    monthly_amount_cents: 25000,
    platform_fee_cents: 3750,
    creator_payout_cents: 21250,
    stripe_payment_intent_id: 'pi_test_jsonhero_logfast_101',
    stripe_subscription_id: 'sub_test_jsonhero_logfast_101',
    created_at: '2026-08-20T10:00:00Z',
  },

  // 2. DevProxy CLI on JSONHero Footer (Active)
  {
    id: '30000000-0000-0000-0000-000000000002',
    slot_id: '20000000-0000-0000-0000-000000000003',
    sponsor_id: '00000000-0000-0000-0000-000000000012',
    sponsor_name: 'DevProxy CLI',
    sponsor_email: 'sponsor@devproxy.net',
    status: 'active',
    creative_text: 'Inspect and mock HTTP traffic locally with DevProxy',
    creative_target_url: 'https://devproxy.net?utm_source=sponsorslot&utm_medium=footer_badge&utm_campaign=jsonhero',
    start_date: getRelativeDate(-6),
    end_date: getRelativeDate(24),
    monthly_amount_cents: 12000,
    platform_fee_cents: 1800,
    creator_payout_cents: 10200,
    stripe_payment_intent_id: 'pi_test_devproxy_102',
    stripe_subscription_id: 'sub_test_devproxy_102',
    created_at: '2026-08-25T14:30:00Z',
  },

  // 3. SuperTask AI on TabMaster Pro Header (Active)
  {
    id: '30000000-0000-0000-0000-000000000003',
    slot_id: '20000000-0000-0000-0000-000000000004',
    sponsor_id: '00000000-0000-0000-0000-000000000013',
    sponsor_name: 'SuperTask AI',
    sponsor_email: 'growth@supertask.app',
    status: 'active',
    creative_text: 'SuperTask AI automatically turns browser bookmarks into action plans',
    creative_target_url: 'https://supertask.app?utm_source=sponsorslot&utm_medium=header_pill&utm_campaign=tabmaster',
    creative_image_url: 'https://cdn.sponsorslot.com/creatives/supertask-icon.svg',
    start_date: getRelativeDate(-14),
    end_date: getRelativeDate(16),
    monthly_amount_cents: 40000,
    platform_fee_cents: 6000,
    creator_payout_cents: 34000,
    stripe_payment_intent_id: 'pi_test_supertask_103',
    stripe_subscription_id: 'sub_test_supertask_103',
    created_at: '2026-08-15T09:00:00Z',
  },

  // 4. Iconify Pro on SVG Shape Shifter Footer (Active)
  {
    id: '30000000-0000-0000-0000-000000000004',
    slot_id: '20000000-0000-0000-0000-000000000008',
    sponsor_id: '00000000-0000-0000-0000-000000000014',
    sponsor_name: 'Iconify Pro',
    sponsor_email: 'partners@iconifypro.design',
    status: 'active',
    creative_text: 'Over 100,000 vector design symbols and animated SVG icons',
    creative_target_url: 'https://iconifypro.design?utm_source=sponsorslot&utm_medium=footer_badge&utm_campaign=svgshifter',
    start_date: getRelativeDate(-4),
    end_date: getRelativeDate(26),
    monthly_amount_cents: 10000,
    platform_fee_cents: 1500,
    creator_payout_cents: 8500,
    stripe_payment_intent_id: 'pi_test_iconify_104',
    stripe_subscription_id: 'sub_test_iconify_104',
    created_at: '2026-08-28T11:00:00Z',
  },

  // 5. OpsRelay Alerts on Cronitor CLI Header (Active)
  {
    id: '30000000-0000-0000-0000-000000000005',
    slot_id: '20000000-0000-0000-0000-000000000009',
    sponsor_id: '00000000-0000-0000-0000-000000000014',
    sponsor_name: 'OpsRelay Alerts',
    sponsor_email: 'billing@opsrelay.cloud',
    status: 'active',
    creative_text: 'Reliable incident paging and on-call routing without pager fatigue',
    creative_target_url: 'https://opsrelay.cloud?utm_source=sponsorslot&utm_medium=header_pill&utm_campaign=cronitor',
    creative_image_url: 'https://cdn.sponsorslot.com/creatives/opsrelay-mark.svg',
    start_date: getRelativeDate(-2),
    end_date: getRelativeDate(28),
    monthly_amount_cents: 30000,
    platform_fee_cents: 4500,
    creator_payout_cents: 25500,
    stripe_payment_intent_id: 'pi_test_opsrelay_105',
    stripe_subscription_id: 'sub_test_opsrelay_105',
    created_at: '2026-09-01T11:00:00Z',
  },

  // 6. StatusPage Cloud on Cronitor CLI Email Digest (Active)
  {
    id: '30000000-0000-0000-0000-000000000006',
    slot_id: '20000000-0000-0000-0000-000000000010',
    sponsor_id: '00000000-0000-0000-0000-000000000011',
    sponsor_name: 'StatusPage Cloud',
    sponsor_email: 'hello@statuspage.cloud',
    status: 'active',
    creative_text: 'Free hosted status pages for indie hackers and micro-SaaS builders',
    creative_target_url: 'https://statuspage.cloud?utm_source=sponsorslot&utm_medium=email_footer&utm_campaign=cronitor',
    start_date: getRelativeDate(-18),
    end_date: getRelativeDate(12),
    monthly_amount_cents: 18000,
    platform_fee_cents: 2700,
    creator_payout_cents: 15300,
    stripe_payment_intent_id: 'pi_test_statuspage_106',
    stripe_subscription_id: 'sub_test_statuspage_106',
    created_at: '2026-08-12T08:00:00Z',
  },

  // 7. ParserLab SDK on RegexForge Footer (Active)
  {
    id: '30000000-0000-0000-0000-000000000007',
    slot_id: '20000000-0000-0000-0000-000000000013',
    sponsor_id: '00000000-0000-0000-0000-000000000012',
    sponsor_name: 'ParserLab SDK',
    sponsor_email: 'contact@parserlab.dev',
    status: 'active',
    creative_text: 'Generate blazing fast zero-allocation lexers and parsers in Rust & TS',
    creative_target_url: 'https://parserlab.dev?utm_source=sponsorslot&utm_medium=footer_badge&utm_campaign=regexforge',
    start_date: getRelativeDate(-8),
    end_date: getRelativeDate(22),
    monthly_amount_cents: 15000,
    platform_fee_cents: 2250,
    creator_payout_cents: 12750,
    stripe_payment_intent_id: 'pi_test_parserlab_107',
    stripe_subscription_id: 'sub_test_parserlab_107',
    created_at: '2026-08-22T16:00:00Z',
  },

  // 8. SubText Media on Markdown Digest Mailer Footer (Active)
  {
    id: '30000000-0000-0000-0000-000000000008',
    slot_id: '20000000-0000-0000-0000-000000000015',
    sponsor_id: '00000000-0000-0000-0000-000000000013',
    sponsor_name: 'SubText Media',
    sponsor_email: 'growth@subtext.email',
    status: 'active',
    creative_text: 'Developer newsletters that actually convert: reach 80k engineers with SubText',
    creative_target_url: 'https://subtext.email?utm_source=sponsorslot&utm_medium=email_footer&utm_campaign=markdowndigest',
    start_date: getRelativeDate(-5),
    end_date: getRelativeDate(25),
    monthly_amount_cents: 50000,
    platform_fee_cents: 7500,
    creator_payout_cents: 42500,
    stripe_payment_intent_id: 'pi_test_subtext_108',
    stripe_subscription_id: 'sub_test_subtext_108',
    created_at: '2026-08-29T10:00:00Z',
  },

  // 9. FastAPI Cloud on JSONHero Header Bar (Historical Completed)
  {
    id: '30000000-0000-0000-0000-000000000009',
    slot_id: '20000000-0000-0000-0000-000000000001',
    sponsor_id: '00000000-0000-0000-0000-000000000011',
    sponsor_name: 'FastAPI Cloud',
    sponsor_email: 'partners@fastapicloud.io',
    status: 'completed',
    creative_text: 'One-click serverless deployment for Python and FastAPI services',
    creative_target_url: 'https://fastapicloud.io?utm_source=sponsorslot&utm_medium=header_pill',
    start_date: getRelativeDate(-40),
    end_date: getRelativeDate(-10),
    monthly_amount_cents: 25000,
    platform_fee_cents: 3750,
    creator_payout_cents: 21250,
    stripe_payment_intent_id: 'pi_test_fastapi_completed_001',
    stripe_subscription_id: 'sub_test_fastapi_completed_001',
    created_at: '2026-07-10T10:00:00Z',
  },

  // 10. TabVault Cloud on TabMaster Pro Header Bar (Historical Completed)
  {
    id: '30000000-0000-0000-0000-000000000010',
    slot_id: '20000000-0000-0000-0000-000000000004',
    sponsor_id: '00000000-0000-0000-0000-000000000013',
    sponsor_name: 'TabVault Cloud',
    sponsor_email: 'hello@tabvault.co',
    status: 'completed',
    creative_text: 'Encrypted cross-device browser tab backup and team sharing',
    creative_target_url: 'https://tabvault.co?utm_source=sponsorslot&utm_medium=header_pill',
    start_date: getRelativeDate(-50),
    end_date: getRelativeDate(-20),
    monthly_amount_cents: 40000,
    platform_fee_cents: 6000,
    creator_payout_cents: 34000,
    stripe_payment_intent_id: 'pi_test_tabvault_completed_002',
    stripe_subscription_id: 'sub_test_tabvault_completed_002',
    created_at: '2026-07-01T10:00:00Z',
  },
];

/**
 * Generates 30-day realistic telemetry fixtures for all 18 slots (18 slots x 30 days = 540 records).
 * Aligned with SQL seed generation function in supabase/seed.sql.
 */
export function generateSeedTelemetry(): ImpressionTelemetry[] {
  const telemetry: ImpressionTelemetry[] = [];

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const dateStr = getRelativeDate(-dayOffset);
    const dayEpochSeconds = Math.floor(new Date(dateStr).getTime() / 1000);

    for (const slot of SEED_SLOTS) {
      // Scale impressions by slot price and sine wave (200 - 1,200 impressions/day) matching seed.sql
      const impressions = Math.floor(
        180 + (Math.sin(dayEpochSeconds / 86400.0) + 1.2) * 90 + (slot.monthly_price_cents / 100.0) * 1.6
      );

      // Scale clicks with natural CTR variance (1.6% - 3.4%) ensuring clicks <= impressions
      const dayOfMonth = parseInt(dateStr.split('-')[2], 10) || 1;
      const ctr = 0.016 + (dayOfMonth % 5) * 0.0035;
      const clicks = Math.floor(impressions * ctr);

      telemetry.push({
        id: `tel_${slot.id.substring(0, 8)}_${dateStr}`,
        slot_id: slot.id,
        telemetry_date: dateStr,
        impressions_count: Math.max(0, impressions),
        clicks_count: Math.min(impressions, Math.max(0, clicks)),
      });
    }
  }

  return telemetry;
}
