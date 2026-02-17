# BLVCKSHELL Facilities Services — Project Overview

**Status:** 🚧 In Development  
**Last Updated:** February 16, 2026

This repository contains three production-ready systems for BLVCKSHELL Facilities Services:

1. **[Operations Binder](./ops-binder/)** — Contracts, SOPs, policies, QA forms, checklists, state machines (47 markdown files)
2. **[Workforce Operations Portal](./portal/)** — Next.js + Supabase + Vercel; workforce/teams; full RBAC; audit-safe
3. **[Marketing Website](./marketing/)** — Public site; lead capture; SEO

---

## Quick Links

- **[ROADMAP.md](./ROADMAP.md)** — **PRIMARY EXECUTION DOCUMENT** — CTO-approved blueprint with 78 tasks, gold standard practices, quality gates
- **[DECISIONS.md](./DECISIONS.md)** — Locked product and technical decisions (20 decisions)
- **[EXECUTION_PLAN.md](./EXECUTION_PLAN.md)** — Phase-by-phase execution plan with dependencies
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)** — Detailed task breakdown (78 tasks)
- **[PROMPTS_REVIEW.md](./PROMPTS_REVIEW.md)** — In-depth review of all prompts
- **[prompts](./prompts)** — Original prompt specifications (P1 Revised, P2, P3)

---

## Project Structure

```
blvckshell/
├── ops-binder/          # Phase 1: Operations Binder (P3)
├── portal/              # Phase 2A: Workforce Operations Portal (P1 Revised)
├── marketing/           # Phase 2B: Marketing Website (P2)
├── DECISIONS.md         # Locked decisions (single source of truth)
├── ROADMAP.md           # PRIMARY EXECUTION DOCUMENT
├── EXECUTION_PLAN.md    # Phase-by-phase plan
├── IMPLEMENTATION_PLAN.md # Task breakdown
└── README.md            # This file
```

---

## Execution Order

**Phase 0:** Pre-Flight (Decisions locked, repo structure)  
**Phase 1:** Operations Binder (47 markdown files)  
**Phase 2A:** Workforce Portal (Next.js + Supabase + Vercel)  
**Phase 2B:** Marketing Website (can run parallel to 2A after Phase 0)  
**Phase 3:** Final Validation (Production gate sign-off)

See **[ROADMAP.md](./ROADMAP.md)** for complete step-by-step execution plan.

---

## Tech Stack

- **Node.js:** 20 LTS
- **Next.js:** 14.x (App Router)
- **TypeScript:** Latest (strict mode)
- **Database:** Supabase Postgres
- **Storage:** Supabase Storage (server-only)
- **ORM:** Prisma
- **Auth:** NextAuth.js (Credentials provider)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **Testing:** Vitest + React Testing Library

---

## Getting Started

### Prerequisites

- Node.js 20 LTS
- Supabase account (for portal)
- Vercel account (for deployment)

### Setup

1. **Review [ROADMAP.md](./ROADMAP.md)** — This is the execution blueprint
2. **Review [DECISIONS.md](./DECISIONS.md)** — All decisions are locked
3. **Follow Phase 0 → Phase 1 → Phase 2A → Phase 3** (P2B can parallel 2A)

Each component has its own README:
- `ops-binder/` — Operations Binder documentation
- `portal/` — Portal setup, env vars, deployment
- `marketing/` — Marketing site setup and deployment

---

## Quality Standards

All code follows gold standard practices:
- TypeScript strict mode, no `any`
- Server-side RBAC on every route/action
- Input validation with Zod
- Error handling with clear messages
- Comprehensive testing (unit, integration, E2E)
- Production gates satisfied before release

See **[ROADMAP.md Part 1](./ROADMAP.md#part-1-architecture--standards)** for complete coding standards.

---

## Production Readiness

The portal is production-ready only when:
- All production gates satisfied (see ROADMAP.md Part 4)
- Test suite passes (transitions, RBAC, upload validation, E2E)
- All documentation complete (README, DECISIONS, SECURITY, DATA_RETENTION, SEED)
- Smoke tests pass (all roles, all critical paths)

**NO dashboards or KPI visualization in Phase 1** — Metrics are collected but not visualized. See ROADMAP.md Part 8.

---

## Support

For questions or issues:
1. Check [ROADMAP.md](./ROADMAP.md) for execution guidance
2. Check [DECISIONS.md](./DECISIONS.md) for locked decisions
3. Review [EXECUTION_PLAN.md](./EXECUTION_PLAN.md) for phase details

---

**Next Step:** Begin Phase 0 (Pre-Flight) → Phase 1 (Operations Binder)
