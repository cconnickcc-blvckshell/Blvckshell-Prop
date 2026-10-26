# BLVCKSHELL permission matrix (Phase 0)

| Capability | ADMIN | FOUNDER | CLIENT | VENDOR_OWNER | VENDOR/INTERNAL WORKER |
|------------|-------|---------|--------|--------------|------------------------|
| Admin portal (`requireAdmin`) | Yes | Yes | No | No | No |
| View any job / invoice / workforce | Yes | Yes | Scoped | Scoped | Scoped |
| Approve/reject/cancel jobs | Yes | Yes | No | No | No |
| Mark jobs paid (payout flow) | Yes | Yes | No | No | No |
| Pricing policy / founder overrides (`requireFounder`) | No | Yes | No | No | No |
| Worker job execution | No | No | No | Partial | Yes |

Implementation: `src/server/permissions.ts`, enforced in server actions and API routes (not edge middleware).
