# Orchestration platform choice (Phase 1 — draft)

| Option | Fit for Vercel + Next.js | Durability | Ops complexity | Cost (early stage) |
|--------|-------------------------|------------|----------------|---------------------|
| **Inngest** | Excellent (official Vercel pattern) | High | Low | Free tier → usage |
| **Trigger.dev** | Good | High | Medium | Free tier → usage |
| **BullMQ + Fly/Railway worker** | Requires separate service | High | Higher (you run Redis) | ~$5–20/mo + host |

**Recommendation for BLVCKSHELL:** Start with **Inngest** for One-Sweep and BLAIR background steps — minimal infra, native retries/sleep, approval events, good fit with existing Next.js deploy. Re-evaluate self-hosted queue if job volume or data-residency rules require it.

**Phase 1 implementation:** stub workflow only after Phase 0 tests pass on CI.
