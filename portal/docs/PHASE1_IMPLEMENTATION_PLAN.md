# Phase 1 — BLVCKSHELL BRAIN (separate PR)

**Scope:** AI Gateway, durable orchestration, One-Sweep Site Build foundations. **No production agents** (BLAIR, ALICE, CLARA) until a later gated phase.

## Goals

1. **AI Gateway** — Replace stub (`server/ai/gateway/stub-gateway.ts`) with provider routing, policy hooks, audit logging, and cost caps.
2. **Durable orchestration** — Adopt **Inngest** (see `ORCHESTRATION_CHOICE.md`) for long-running workflows (quote assist, site build sweep, notification retries).
3. **One-Sweep Site Build** — Job graph: intake → template selection → checklist generation → human approval gates.
4. **BLVCKSHELL BRAIN** — Read-only context assembly from portal data (sites, jobs, compliance) behind RBAC; no autonomous writes in Phase 1.

## Deliverables (proposed)

| Item | PR |
|------|-----|
| Inngest app + dev server wiring | phase-1-orchestration |
| Gateway v1 (OpenAI/Anthropic env, redaction) | phase-1-gateway |
| Brain context API (internal only) | phase-1-brain |
| One-Sweep prototype (admin-only, feature flag) | phase-1-one-sweep |

## Non-goals

- Changing WSIB/insurance marketing or compliance copy
- Auto-approving applications or jobs via AI
- Twilio/SMS activation

## Dependencies

- Phase 0 merged (activation, notifications, RBAC)
- Feature flags per environment
- Separate security review for external LLM data flow

## Suggested timeline

- Week 1–2: Gateway + Inngest skeleton, observability
- Week 3–4: Brain read API + One-Sweep draft workflow
- Week 5: Staging pilots with FOUNDER/ADMIN only
