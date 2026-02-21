# Prisma Query Policy

**Purpose:** Avoid P2022 (column not found) and keep queries stable as the schema evolves (e.g. new template/snapshot columns).

## Rule

- **Job, Invoice, Site:** Prefer **explicit `select`** for reads. Only include fields and relations you need. Avoid bare `include` that pulls every column (e.g. `prisma.job.findMany({ include: { site: true } })`).
- **Why:** If new columns are added later (or not yet deployed everywhere), default/implied selects can reference missing columns and fail at runtime. Explicit `select` limits the selected columns to what exists and what the code uses.
- **Writes:** Use normal `create`/`update` with only the fields you intend to set. Do not set template/snapshot fields unless the migration for those columns is applied.

## Examples

- **Prefer:** `prisma.job.findMany({ select: { id: true, status: true, site: { select: { name: true } } }, where: ... })`
- **Avoid:** `prisma.job.findMany({ include: { site: true }, where: ... })` when you only need a few fields.

## Scope

- Applies especially to Job, Invoice, and Site. Other models (e.g. ChecklistTemplate, Contract) should still use `select` when adding new columns is likely.
- Code review: flag new `findUnique`/`findFirst`/`findMany` on Job, Invoice, or Site that use only `include` with no `select`.

## Reference

- Full audit and reconciliation: repo root `SCHEMA_RECONCILIATION_PLAN.md` and `PRISMA_SCHEMA_CTO_AUDIT.md`.
