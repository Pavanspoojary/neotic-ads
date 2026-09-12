# Project Guidelines & Agent Directives

## 1. Persistent Rule: Ponytail Principles
Always adhere to `/ponytail` skills and senior engineering principles across this project:
- **The Ponytail Ladder ("The best code is the code you never wrote")**:
  1. **YAGNI**: Speculative features and premature configurability must not exist.
  2. **Existing Codebase**: Reuse existing utilities, models, and components before creating new ones.
  3. **Standard Library / Native Platform**: Favor native web/Node/SQL capabilities over third-party micro-dependencies.
  4. **Existing Dependencies**: Maximize existing packages in `package.json`; avoid adding external packages for trivial tasks.
  5. **Concise, High-Leverage Code**: Clean, minimal, readable code over bloated multi-file boilerplate.
  6. **Boring Over Clever**: The simplest robust solution that works reliably in production is the right one.
- **Production-Grade Standard (Anti-Vibe-Coding)**:
  - Full end-to-end functionality, strict type safety, real database schemas, robust error handling, security controls, and verification test suites.
  - No mock placeholders or fake "vibe coded" UI without backing implementation.

## 2. Persistent Rule: Skill Discovery & Extensibility
- **Broad Skill Utilization**: Actively search, activate, and draw upon the library of 2,000+ specialized engineering skills (from AAS, Matt Pocock architecture, Karpathy LLM guidelines, Chrome DevTools, Supabase/Firebase, etc.) whenever relevant to the task at hand.
- **On-Demand Custom Skills**: When encountering domain-specific operations or repeatable project patterns not covered by existing tools, create and persist modular skills in the project repository under `.agents/skills/`.
  - [`sponsorslot-integration`](file:///.agents/skills/sponsorslot-integration/SKILL.md): Standard integration rules for in-app ad slots, embed SDK, and telemetry.
  - [`wikiskill`](file:///.agents/skills/wikiskill/SKILL.md): Repository architecture wiki, LLM knowledge management, and link drift linting via `docs/wiki/`.

## 3. Persistent Rule: NO Autonomous Vercel Deployment
- **Strict User Directive**: DO NOT deploy to Vercel on your own. Never run `vercel --prod` or deploy automatically without explicit instruction from the user.
- **Workflow Boundary**: Changes should be verified locally with tests (`node --import tsx --test 'tests/**/*.test.ts'`) and type checking (`npx tsc --noEmit`). Deploy to Vercel ONLY when the user explicitly prompts to deploy.

