-- ============================================================================
-- Seed Fixtures: seed.sql
-- Description: SponsorSlot Realistic Development & Integration Test Fixtures
-- Author: SponsorSlot Engineering Team (M1 Explorer 2)
-- Date: 2026-09-11
-- ============================================================================

-- 1. CLEANUP EXISTING DATA (Ordered by FK dependencies)
DELETE FROM impression_telemetry;
DELETE FROM sponsorships;
DELETE FROM inventory_slots;
DELETE FROM listings;

-- 2. SEED LISTINGS (7 Diverse Real-World Micro-Tools)
INSERT INTO listings (
    id,
    creator_id,
    title,
    slug,
    description,
    category,
    app_type,
    website_url,
    verified_dau,
    verification_source,
    verification_identifier,
    verification_data,
    status
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'JSONHero Visualizer',
    'jsonhero-visualizer',
    'Clean, beautiful, and intuitive JSON viewer and schema validator for API developers with AST tree exploration.',
    'developer-tools',
    'web_app',
    'https://jsonhero.io',
    12400,
    'plausible',
    'jsonhero.io',
    '{"monthly_pageviews": 410000, "bounce_rate": 0.32, "top_country": "US"}'::jsonb,
    'active'
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'TabMaster Pro',
    'tabmaster-pro',
    'Lightweight Chrome extension that automatically organizes browser tabs into smart workspaces and saves 60% memory.',
    'productivity',
    'chrome_extension',
    'https://chrome.google.com/webstore/detail/tabmaster-pro',
    18900,
    'chrome_web_store',
    'kbfnbcaeplbcioakkpcpgfkobkghlhen',
    '{"weekly_active_users": 18900, "rating": 4.88, "rating_count": 342, "version": "2.4.1"}'::jsonb,
    'active'
),
(
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000003',
    'SVG Shape Shifter',
    'svg-shape-shifter',
    'Browser-based SVG path editor, icon optimizer, and animated spline transformer for product designers.',
    'design',
    'web_app',
    'https://svgshapeshifter.design',
    5400,
    'posthog',
    'svgshapeshifter.design',
    '{"active_sessions_30d": 162000, "avg_session_sec": 420}'::jsonb,
    'active'
),
(
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Cronitor CLI & Health Monitor',
    'cronitor-cli',
    'Terminal-first cron job debugger, health telemetry dashboard, and webhook failure alerting system.',
    'developer-tools',
    'desktop_app',
    'https://cronitor-cli.dev',
    8200,
    'ga4',
    'G-CRON82910',
    '{"monthly_events": 780000, "platforms": ["darwin-arm64", "linux-amd64"]}'::jsonb,
    'active'
),
(
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000002',
    'RegexForge Expression Tester',
    'regex-forge',
    'Real-time regular expression debugger with visual AST breakdown, match benchmarking, and code generation.',
    'utilities',
    'web_app',
    'https://regexforge.dev',
    15800,
    'plausible',
    'regexforge.dev',
    '{"monthly_pageviews": 520000, "top_referrers": ["github.com", "stackoverflow.com"]}'::jsonb,
    'active'
),
(
    '10000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000003',
    'Markdown Digest Mailer',
    'markdown-digest-mailer',
    'Automated weekly markdown briefing service turning GitHub releases and engineering blogs into clean emails.',
    'productivity',
    'web_app',
    'https://markdowndigest.app',
    3900,
    'manual',
    'verified_by_sponsorslot_audit_2026',
    '{"subscribers": 9400, "open_rate": 0.44}'::jsonb,
    'active'
),
(
    '10000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000003',
    'ColorTokens Design System Palette',
    'colortokens-palette',
    'Eyedropper and contrast auditor extracting CSS color tokens directly from any web page into Figma & Tailwind.',
    'design',
    'chrome_extension',
    'https://colortokens.dev',
    6100,
    'chrome_web_store',
    'clrtknspaletteextid998',
    '{"weekly_active_users": 6100, "rating": 4.92, "rating_count": 89}'::jsonb,
    'active'
);

-- 3. SEED INVENTORY SLOTS (18 Standardized Units Spanning All 4 Formats)
INSERT INTO inventory_slots (
    id,
    listing_id,
    slot_name,
    slot_type,
    monthly_price_cents,
    is_available,
    max_sponsors,
    guidelines
) VALUES
-- Slots for Listing 1 (JSONHero Visualizer)
(
    '20000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'Dashboard Header Bar Pill',
    'header_pill',
    25000, -- $250.00/mo
    false, -- Currently sponsored by LogFast
    1,
    'B2B developer tools, cloud infrastructure, or observability platforms only. No crypto/gambling.'
),
(
    '20000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',
    'Empty Schema Canvas Card',
    'empty_state',
    35000, -- $350.00/mo
    true,  -- Available
    1,
    'Targeted at API engineers who paste payloads. API mocking and testing tools perform best here.'
),
(
    '20000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',
    'Inspect Drawer Footer Link',
    'footer_badge',
    12000, -- $120.00/mo
    false, -- Currently sponsored by DevProxy
    1,
    'Compact 120x30 logo or clean text sponsor attribution.'
),

-- Slots for Listing 2 (TabMaster Pro)
(
    '20000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000002',
    'Extension Popup Top Pill',
    'header_pill',
    40000, -- $400.00/mo
    false, -- Currently sponsored by SuperTask
    1,
    'Productivity apps, task management, or remote work tools.'
),
(
    '20000000-0000-0000-0000-000000000005',
    '10000000-0000-0000-0000-000000000002',
    'No Open Tabs Empty State',
    'empty_state',
    20000, -- $200.00/mo
    true,  -- Available
    1,
    'Rendered when all tabs are organized into workspaces.'
),
(
    '20000000-0000-0000-0000-000000000006',
    '10000000-0000-0000-0000-000000000002',
    'Options Page Partner Badge',
    'footer_badge',
    8000, -- $80.00/mo
    true, -- Available
    1,
    'Discreet partner badge in settings screen.'
),

-- Slots for Listing 3 (SVG Shape Shifter)
(
    '20000000-0000-0000-0000-000000000007',
    '10000000-0000-0000-0000-000000000003',
    'Canvas Toolbar Top Pill',
    'header_pill',
    15000, -- $150.00/mo
    true,  -- Available
    1,
    'Design assets, icon libraries, fonts, and Figma plugins.'
),
(
    '20000000-0000-0000-0000-000000000008',
    '10000000-0000-0000-0000-000000000003',
    'Export Modal Partner Footer',
    'footer_badge',
    10000, -- $100.00/mo
    false, -- Currently sponsored by Iconify Pro
    1,
    'Shown directly before designers download optimized SVG code.'
),

-- Slots for Listing 4 (Cronitor CLI)
(
    '20000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000004',
    'Terminal Output Summary Pill',
    'header_pill',
    30000, -- $300.00/mo
    false, -- Currently sponsored by OpsRelay
    1,
    'DevOps, SRE tooling, incident response, and cloud monitoring services.'
),
(
    '20000000-0000-0000-0000-000000000010',
    '10000000-0000-0000-0000-000000000004',
    'Daily Health Digest Email Notice',
    'email_footer',
    18000, -- $180.00/mo
    false, -- Currently sponsored by StatusPage Cloud
    1,
    'Single line notice in 8,200 daily health check dispatch emails.'
),
(
    '20000000-0000-0000-0000-000000000011',
    '10000000-0000-0000-0000-000000000004',
    'Zero Incidents Empty State',
    'empty_state',
    22000, -- $220.00/mo
    true,  -- Available
    1,
    'High-visibility card rendered when all monitor checks are green.'
),

-- Slots for Listing 5 (RegexForge)
(
    '20000000-0000-0000-0000-000000000012',
    '10000000-0000-0000-0000-000000000005',
    'Editor Navbar Pill',
    'header_pill',
    35000, -- $350.00/mo
    true,  -- Available
    1,
    'Developer SaaS, code review platforms, and security scanners.'
),
(
    '20000000-0000-0000-0000-000000000013',
    '10000000-0000-0000-0000-000000000005',
    'Cheat Sheet Drawer Footer',
    'footer_badge',
    15000, -- $150.00/mo
    false, -- Currently sponsored by ParserLab
    1,
    'Placed at bottom of quick-reference regex syntax guide.'
),
(
    '20000000-0000-0000-0000-000000000014',
    '10000000-0000-0000-0000-000000000005',
    'Empty Library State',
    'empty_state',
    25000, -- $250.00/mo
    true,  -- Available
    1,
    'Shown when user has no saved regex expressions.'
),

-- Slots for Listing 6 (Markdown Digest Mailer)
(
    '20000000-0000-0000-0000-000000000015',
    '10000000-0000-0000-0000-000000000006',
    'Weekly Engineering Digest Footer',
    'email_footer',
    50000, -- $500.00/mo
    false, -- Currently sponsored by SubText Newsletter
    1,
    'Prominent sponsor section in weekly dispatch to 9,400 senior engineers.'
),
(
    '20000000-0000-0000-0000-000000000016',
    '10000000-0000-0000-0000-000000000006',
    'Web Archive Footer Badge',
    'footer_badge',
    7500, -- $75.00/mo
    true, -- Available
    1,
    'Clean badge on public web newsletter issue archive.'
),

-- Slots for Listing 7 (ColorTokens Palette)
(
    '20000000-0000-0000-0000-000000000017',
    '10000000-0000-0000-0000-000000000007',
    'Extension Eyedropper Header',
    'header_pill',
    18000, -- $180.00/mo
    true,  -- Available
    1,
    'Design software, UI kits, design token management systems.'
),
(
    '20000000-0000-0000-0000-000000000018',
    '10000000-0000-0000-0000-000000000007',
    'Palette History Empty State',
    'empty_state',
    12000, -- $120.00/mo
    true,  -- Available
    1,
    'Rendered when user starts a new session before sampling colors.'
);

-- 4. SEED SPONSORSHIPS (8 Active + 2 Historical Completed)
INSERT INTO sponsorships (
    id,
    slot_id,
    sponsor_id,
    sponsor_name,
    sponsor_email,
    status,
    creative_text,
    creative_target_url,
    creative_image_url,
    start_date,
    end_date,
    monthly_amount_cents,
    platform_fee_cents,
    creator_payout_cents,
    stripe_payment_intent_id,
    stripe_subscription_id
) VALUES
-- Active 1: LogFast on JSONHero Header Bar
(
    '30000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    'LogFast Telemetry',
    'partners@logfast.io',
    'active',
    'Real-time Next.js application logs & exception tracing with LogFast',
    'https://logfast.io?utm_source=sponsorslot&utm_medium=header_pill&utm_campaign=jsonhero',
    'https://cdn.sponsorslot.com/creatives/logfast-logo.svg',
    CURRENT_DATE - INTERVAL '10 days',
    (CURRENT_DATE - INTERVAL '10 days' + INTERVAL '30 days')::date,
    25000,
    3750,  -- 15% platform take-rate ($37.50)
    21250, -- 85% creator net payout ($212.50)
    'pi_test_jsonhero_logfast_101',
    'sub_test_jsonhero_logfast_101'
),

-- Active 2: DevProxy on JSONHero Footer
(
    '30000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000012',
    'DevProxy CLI',
    'sponsor@devproxy.net',
    'active',
    'Inspect and mock HTTP traffic locally with DevProxy',
    'https://devproxy.net?utm_source=sponsorslot&utm_medium=footer_badge&utm_campaign=jsonhero',
    NULL,
    CURRENT_DATE - INTERVAL '6 days',
    (CURRENT_DATE - INTERVAL '6 days' + INTERVAL '30 days')::date,
    12000,
    1800,  -- $18.00
    10200, -- $102.00
    'pi_test_devproxy_102',
    'sub_test_devproxy_102'
),

-- Active 3: SuperTask on TabMaster Pro Header
(
    '30000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000013',
    'SuperTask AI',
    'growth@supertask.app',
    'active',
    'SuperTask AI automatically turns browser bookmarks into action plans',
    'https://supertask.app?utm_source=sponsorslot&utm_medium=header_pill&utm_campaign=tabmaster',
    'https://cdn.sponsorslot.com/creatives/supertask-icon.svg',
    CURRENT_DATE - INTERVAL '14 days',
    (CURRENT_DATE - INTERVAL '14 days' + INTERVAL '30 days')::date,
    40000,
    6000,  -- $60.00
    34000, -- $340.00
    'pi_test_supertask_103',
    'sub_test_supertask_103'
),

-- Active 4: Iconify Pro on SVG Shape Shifter Footer
(
    '30000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000014',
    'Iconify Pro',
    'partners@iconifypro.design',
    'active',
    'Over 100,000 vector design symbols and animated SVG icons',
    'https://iconifypro.design?utm_source=sponsorslot&utm_medium=footer_badge&utm_campaign=svgshifter',
    NULL,
    CURRENT_DATE - INTERVAL '4 days',
    (CURRENT_DATE - INTERVAL '4 days' + INTERVAL '30 days')::date,
    10000,
    1500,  -- $15.00
    8500,  -- $85.00
    'pi_test_iconify_104',
    'sub_test_iconify_104'
),

-- Active 5: OpsRelay on Cronitor CLI Header
(
    '30000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000014',
    'OpsRelay Alerts',
    'billing@opsrelay.cloud',
    'active',
    'Reliable incident paging and on-call routing without pager fatigue',
    'https://opsrelay.cloud?utm_source=sponsorslot&utm_medium=header_pill&utm_campaign=cronitor',
    'https://cdn.sponsorslot.com/creatives/opsrelay-mark.svg',
    CURRENT_DATE - INTERVAL '2 days',
    (CURRENT_DATE - INTERVAL '2 days' + INTERVAL '30 days')::date,
    30000,
    4500,  -- $45.00
    25500, -- $255.00
    'pi_test_opsrelay_105',
    'sub_test_opsrelay_105'
),

-- Active 6: StatusPage Cloud on Cronitor CLI Email Digest
(
    '30000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000011',
    'StatusPage Cloud',
    'hello@statuspage.cloud',
    'active',
    'Free hosted status pages for indie hackers and micro-SaaS builders',
    'https://statuspage.cloud?utm_source=sponsorslot&utm_medium=email_footer&utm_campaign=cronitor',
    NULL,
    CURRENT_DATE - INTERVAL '18 days',
    (CURRENT_DATE - INTERVAL '18 days' + INTERVAL '30 days')::date,
    18000,
    2700,  -- $27.00
    15300, -- $153.00
    'pi_test_statuspage_106',
    'sub_test_statuspage_106'
),

-- Active 7: ParserLab on RegexForge Footer
(
    '30000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000013',
    '00000000-0000-0000-0000-000000000012',
    'ParserLab SDK',
    'contact@parserlab.dev',
    'active',
    'Generate blazing fast zero-allocation lexers and parsers in Rust & TS',
    'https://parserlab.dev?utm_source=sponsorslot&utm_medium=footer_badge&utm_campaign=regexforge',
    NULL,
    CURRENT_DATE - INTERVAL '8 days',
    (CURRENT_DATE - INTERVAL '8 days' + INTERVAL '30 days')::date,
    15000,
    2250,  -- $22.50
    12750, -- $127.50
    'pi_test_parserlab_107',
    'sub_test_parserlab_107'
),

-- Active 8: SubText Newsletter on Markdown Digest Mailer Footer
(
    '30000000-0000-0000-0000-000000000008',
    '20000000-0000-0000-0000-000000000015',
    '00000000-0000-0000-0000-000000000013',
    'SubText Media',
    'growth@subtext.email',
    'active',
    'Developer newsletters that actually convert: reach 80k engineers with SubText',
    'https://subtext.email?utm_source=sponsorslot&utm_medium=email_footer&utm_campaign=markdowndigest',
    NULL,
    CURRENT_DATE - INTERVAL '5 days',
    (CURRENT_DATE - INTERVAL '5 days' + INTERVAL '30 days')::date,
    50000,
    7500,  -- $75.00
    42500, -- $425.00
    'pi_test_subtext_108',
    'sub_test_subtext_108'
),

-- Historical Completed 1: FastAPI Cloud on JSONHero Header Bar (Term ended 10 days ago)
(
    '30000000-0000-0000-0000-000000000009',
    '20000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000011',
    'FastAPI Cloud',
    'partners@fastapicloud.io',
    'completed',
    'One-click serverless deployment for Python and FastAPI services',
    'https://fastapicloud.io?utm_source=sponsorslot&utm_medium=header_pill',
    NULL,
    CURRENT_DATE - INTERVAL '40 days',
    (CURRENT_DATE - INTERVAL '40 days' + INTERVAL '30 days')::date,
    25000,
    3750,
    21250,
    'pi_test_fastapi_completed_001',
    'sub_test_fastapi_completed_001'
),

-- Historical Completed 2: TabVault on TabMaster Pro Header Bar (Term ended 20 days ago)
(
    '30000000-0000-0000-0000-000000000010',
    '20000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000013',
    'TabVault Cloud',
    'hello@tabvault.co',
    'completed',
    'Encrypted cross-device browser tab backup and team sharing',
    'https://tabvault.co?utm_source=sponsorslot&utm_medium=header_pill',
    NULL,
    CURRENT_DATE - INTERVAL '50 days',
    (CURRENT_DATE - INTERVAL '50 days' + INTERVAL '30 days')::date,
    40000,
    6000,
    34000,
    'pi_test_tabvault_completed_002',
    'sub_test_tabvault_completed_002'
);

-- 5. SEED 30-DAY IMPRESSION & CLICK TELEMETRY (All 18 Slots x 30 Days = 540 Records)
INSERT INTO impression_telemetry (
    slot_id,
    telemetry_date,
    impressions_count,
    clicks_count
)
SELECT 
    s.id AS slot_id,
    d::date AS telemetry_date,
    -- Realistic daily impressions scaled by slot price and date wave (200 - 1,200 impressions/day)
    FLOOR(180 + (sin(EXTRACT(epoch FROM d) / 86400.0) + 1.2) * 90 + (s.monthly_price_cents / 100.0) * 1.6)::int AS impressions_count,
    -- Realistic clicks with natural variance ensuring clicks <= impressions (CTR ~1.6% - 3.4%)
    FLOOR(
        (180 + (sin(EXTRACT(epoch FROM d) / 86400.0) + 1.2) * 90 + (s.monthly_price_cents / 100.0) * 1.6) * 
        (0.016 + (EXTRACT(day FROM d)::int % 5) * 0.0035)
    )::int AS clicks_count
FROM inventory_slots s
CROSS JOIN generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') AS d
ON CONFLICT (slot_id, telemetry_date) 
DO UPDATE SET
    impressions_count = EXCLUDED.impressions_count,
    clicks_count = EXCLUDED.clicks_count;
