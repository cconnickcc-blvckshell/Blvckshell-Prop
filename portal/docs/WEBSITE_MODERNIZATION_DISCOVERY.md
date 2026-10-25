# BLVCKSHELL Website Modernization — Phase 0 Discovery

**Branch:** `feat/website-modernization-brand-alignment`  
**Date:** 2026-10-25  
**Repo:** `cconnickcc-blvckshell/Blvckshell-Prop` (`portal/`)

## Deployment target

| Item | Finding |
|------|---------|
| Production URL | https://www.blvckshell.com (Vercel, Next.js App Router) |
| Git remote | `origin` → GitHub `Blvckshell-Prop` |
| Local tracking branch | `main` at `a90ce7e` (synced with `origin/main` at discovery) |
| CI | `.github/workflows/test.yml`, `migrate.yml` |
| Deploy inference | Vercel linked to GitHub; **production typically tracks `main`** — confirm in Vercel dashboard before merge (not assumed equal without dashboard check) |

## Marketing surface map

| Route | File | Action |
|-------|------|--------|
| `/` | `(marketing)/page.tsx` | Rebuild (commercial-first hero, gold brand) |
| `/services` | `services/page.tsx` | Restructure IA |
| `/condo-cleaning` | `condo-cleaning/page.tsx` | Refresh content + layout |
| `/commercial-cleaning` | `commercial-cleaning/page.tsx` | Refresh |
| `/light-maintenance` | `light-maintenance/page.tsx` | De-emphasize → redirect to facilities support |
| `/rental-unit-turnovers` | **NEW** | Primary service |
| `/deep-cleaning-building-resets` | **NEW** | Primary service |
| `/post-construction-final-cleaning` | **NEW** | Primary service |
| `/facilities-support` | **NEW** | Secondary conditional offering |
| `/pilots` | `pilots/page.tsx` | Replace → redirect to `/introductory-offers` |
| `/introductory-offers` | **NEW** | Paid scoped pilot + PVA entry |
| `/90-day-validation` | **NEW** | PVA commercial page |
| `/our-approach` | **NEW** | Primary nav “Our Approach” |
| `/about` | `about/page.tsx`, `AboutClient.tsx` | Rewrite positioning |
| `/work-with-us` | `work-with-us/*` | Employee-led messaging; form UX |
| `/contact` | `contact/*` | Extended lead fields + attribution |
| `/client-signup` | `client-signup/*` | Preserve portal request flow |
| `/compliance` | `compliance/page.tsx` | **Protected WSIB/COI copy — no edits** |
| `/privacy` | `privacy/page.tsx` | Flag for legal review only |

## Shared components

- `src/components/marketing/Header.tsx`, `Footer.tsx`, `MarketingLayoutClient.tsx`
- `src/components/animations/*` — reduce motion on marketing hero where possible
- **New:** `src/config/marketing-site.ts`, `BrandLogo`, `MarketingButton`, `ServicePageShell`

## Backend / API (Phase 3)

| Route | Purpose |
|-------|---------|
| `POST /api/lead` | Prisma `Lead` create — extend to use existing optional columns |
| `POST /api/applications/worker` | Worker applications (unchanged scope) |
| `POST /api/applications/client` | Client signup requests (unchanged scope) |

`Lead` model already includes: `company`, `propertyType`, `sitesCount`, `preferredContact`, etc. API currently writes only `name`, `phone`, `email`, `message`, `sourcePage`.

## Phone number discrepancy (blocking verification)

| Source | Value |
|--------|--------|
| Display | `(226) 946-BLVK` → keypad **2585** |
| Current `tel:` link | `+12269462558` → dials **2558** (**bug**) |
| Config fix (pending owner sign-off) | `+12269462585` to align with BLVK spelling |

**Owner action:** Confirm authoritative business number from company records and brand collateral (Chris/Ashley direct lines separate).

## Logo assets

| Asset | Location |
|-------|----------|
| Gold emblem | Copied to `portal/public/brand/blvckshell-emblem.png` (from Corporate Docs) |
| Lockup JPG | `portal/public/brand/blvckshell-lockup.jpg` |
| Repo `IMAGES/` | Favicon + stock photography (Vecteezy filenames — not operational photos) |

**Gap:** No vector PDF lockup from “Oct 24 PVA collateral” in git repo; PVA flyer PDF not found under `Corporate/Docs` by name — use directive-approved PVA terms in code until flyer is added to repo.

## Protected content (must not change)

- `(marketing)/compliance/page.tsx` — COI, WSIB, insurance wording
- Any duplicate WSIB/COI claims on marketing pages outside compliance — audit only, preserve meaning

## Stale / misleading content identified

- Homepage over-indexes portal/digital verification vs cleaning outcomes
- `/pilots` — five legacy programs; automatic “converts to contract” language
- Emerald accent across marketing vs black/gold brand standard (`globals.css` already defines gold tokens)
- Ontario-wide expansion copy vs Leamington / Windsor–Essex focus
- `tel:` / display phone mismatch
- Metadata template causes duplicate `\| BLVCKSHELL` in titles
- No `sitemap.xml` / `robots.txt` routes
- Work With Us promises “3 business days” review (remove unless operational guarantee)

## Dependencies

- Next.js 14, Tailwind v4 (`@import "tailwindcss"`), Framer Motion on homepage
- Prisma lead persistence (no schema change required for extended lead fields)

## Implementation order (this branch)

1. Phase 1 — tokens, config, logo, header/footer, buttons  
2. Phase 2 — homepage, services, new pages, offers, about, redirects  
3. Phase 3 — contact/lead attribution, phone centralization, work-with-us copy  
4. Phase 4 — SEO (sitemap, robots, metadata), a11y pass on forms  
5. Phase 5 — `npm run lint`, `npm run test:unit:pure`, `npm run build`

## Owner approval checklist

- [ ] Confirm primary `tel:` E.164 number  
- [ ] Confirm logo lockup (PNG/JPG vs future SVG)  
- [ ] Provide Oct 24 PVA flyer PDF for verbatim commercial terms review  
- [ ] Legal review of privacy policy before edits  
- [ ] Confirm notification recipients (`admin@blvckshell.com`, etc.)
