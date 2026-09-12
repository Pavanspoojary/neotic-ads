---
name: wikiskill
description: Comprehensive codebase wiki & LLM-Wiki knowledge management skill for capturing architectural invariants, schema contracts, integration seams, operational playbooks, and atomic concept pages with provenance and verification. Use when documenting system architecture, creating or updating codebase wiki pages, querying engineering knowledge, capturing technical lessons, or auditing docs for code drift.
---

# Codebase Wiki & LLM Knowledge Management (wikiskill)

This skill governs the creation, querying, maintenance, and verification of repository engineering wikis and atomic knowledge bases.

Wikis serve as the durable working memory for software systems: capturing architectural contracts, domain terminology, database schemas, edge protocols, and operational playbooks grounded in verified source code.

---

## 1. Core Principles & Philosophy

1. **Source Grounded (Anti-Vibe)**: Every claim in the wiki must cite living code files (`file:///...`), test suites, or immutable commits. Pure speculative prose is not permitted.
2. **Atomic & Interlinked**: Topics are split into focused, single-concept markdown files linked together with standard Markdown and `[[wikilinks]]`.
3. **Single Source of Truth**: The wiki does not duplicate ephemeral environment details (such as `package.json` scripts or `--help` outputs); it captures load-bearing rationale, invariant contracts, and boundary constraints.
4. **Active Drift Prevention**: Wiki links and code symbol references must be verified against actual repository files during reviews and CI checks.

---

## 2. Wiki Directory Layout

The codebase wiki resides in `docs/wiki/` (or `.agents/wiki/`):

```text
docs/wiki/
├── INDEX.md                 # Master index, conceptual hierarchy, and quick navigation
├── architecture/            # Deep module architecture & component seam contracts
│   ├── system-overview.md
│   ├── edge-delivery.md
│   └── escrow-engine.md
├── schema/                  # PostgreSQL DDL, RLS policies, and data models
│   ├── tables-and-rls.md
│   └── telemetry-contract.md
├── integrations/            # Client SDKs, embed scripts, and public APIs
│   ├── embed-sdk.md
│   └── chrome-extension-mv3.md
└── playbooks/               # Runbooks, deployment guides, and troubleshooting
    ├── vercel-deployment.md
    └── supabase-migrations.md
```

---

## 3. Standard Operations

### A. Query
Retrieve authoritative technical answers from the wiki:
1. Open `docs/wiki/INDEX.md` to identify relevant concept categories.
2. Read the specific topic file in `docs/wiki/` containing the answer.
3. Validate cited code paths in the repository to ensure current accuracy.
4. Synthesize the response with clickable file links.

### B. Capture (Atomic Knowledge Synthesis)
When a new architectural pattern, schema constraint, or invariant is established:
1. Determine if the knowledge belongs in an existing topic or warrants a new atomic file.
2. Author the document using the **Atomic Page Template** (see below).
3. Ground all specifications with exact file paths and test references.
4. Update `docs/wiki/INDEX.md` with the new entry and relevant category tags.

### C. Lint & Verify (Drift Detection)
Ensure documentation integrity using the bundled utility:
```bash
python3 .agents/skills/wikiskill/scripts/wiki_cli.py lint
```
- Validates all markdown links and target files exist.
- Detects broken file references and dead code pointers.
- Re-indexes the catalog when documents are added or moved.

### D. Promote (Knowledge Elevation)
When an experimental insight or convention becomes a system-wide invariant:
- **Project Directives**: Add to `AGENTS.md`.
- **Repeatable Procedures**: Create a dedicated sub-skill under `.agents/skills/<skill-name>/`.
- **Deterministic Invariants**: Add automated test cases to `tests/`.

---

## 4. Atomic Page Template

```markdown
# [Topic Title]

## 1. Overview & Purpose
Concise summary (2-3 sentences) defining the subsystem, concept, or workflow.

## 2. Invariants & Public Seams
- **Public Seam**: \`InterfaceName\` or API endpoint contract.
- **Invariants**: Must-hold rules (e.g. rate limits, character lengths, financial bounds).
- **Primary Source Code**: [\`path/to/source.ts\`](file:///path/to/source.ts)

## 3. Implementation Details
Code examples, sequence flows, or architectural decisions.

## 4. Verification & Testing
- Automated test suites verifying this subsystem: \`tests/path/to/test.test.ts\`
- Manual verification commands or curl recipes.

## 5. Related Topics
- [[related-topic-slug]]
- [External RFC or Official Docs](https://...)
```

---

## 5. Helper CLI (`wiki_cli.py`)

The skill includes a lightweight, zero-dependency Python script located at:
`.agents/skills/wikiskill/scripts/wiki_cli.py`

Commands:
- `python3 .agents/skills/wikiskill/scripts/wiki_cli.py index`: Rebuilds `docs/wiki/INDEX.md`.
- `python3 .agents/skills/wikiskill/scripts/wiki_cli.py lint`: Audits dead links and missing referenced files.
- `python3 .agents/skills/wikiskill/scripts/wiki_cli.py search --query "<keyword>"`: Searches topics.
