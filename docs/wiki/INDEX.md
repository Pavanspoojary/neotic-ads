# SponsorSlot Architecture & Engineering Wiki Index

> Authoritative, source-grounded knowledge base for system contracts, schemas, and runtime playbooks.

---

## Architecture

- [**Edge Delivery Engine & Manifest V3 Integration**](architecture/edge-delivery.md) — The Edge Delivery Engine serves low-latency, declarative JSON payloads representing active sponsored creatives or viral self-serve referral fallbacks to client applications, Chrome extensions, and web utilities.
- [**Escrow Billing & Split Calculation Engine**](architecture/escrow-engine.md) — The Escrow Billing Engine calculates exact financial allocations for 30-day recurring micro-sponsorships, enforcing platform take-rates, creator net payouts, and penny conservation invariants.
- [**System Overview & Deep Module Architecture**](architecture/system-overview.md) — SponsorSlot is a programmatic and flat-rate in-app micro-sponsorship registry and marketplace connecting high-engagement micro-tools (developer tools, Chrome extensions, web utilities with 500–25k DAU) with context-driven B2B advertisers seeking native, non-intrusive placements on automated 30-day terms.

## Integrations

- [**Client Embed SDK (embed.js) & Telemetry Protocol**](integrations/embed-sdk.md) — `embed.js` is a lightweight, zero-dependency client SDK that tool creators drop into web apps to render responsive in-app placements without CSS contamination or external library dependencies.

## Playbooks

- [**Production Deployment & Infrastructure Playbook**](playbooks/deployment.md) — This playbook details the step-by-step procedure for deploying SponsorSlot to production across GitHub, Vercel Edge Network, and Supabase Cloud.

## Schema

- [**Database Schema & Row Level Security (RLS)**](schema/tables-and-rls.md) — SponsorSlot uses Supabase PostgreSQL with strict typed schemas, foreign keys, CHECK constraints, and Row Level Security (RLS) policies.

---
*Maintained via `.agents/skills/wikiskill/scripts/wiki_cli.py`.*
