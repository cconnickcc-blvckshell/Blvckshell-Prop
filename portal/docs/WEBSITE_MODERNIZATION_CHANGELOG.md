# Website Modernization — Change Register (in progress)

**Branch:** `feat/website-modernization-brand-alignment`

## Brand & visual

- Centralized `src/config/marketing-site.ts` (company, phone, nav, services, CTAs).
- CSS brand tokens in `globals.css` (`--brand-gold`, etc.).
- Logo assets in `public/brand/` (emblem + lockup from Corporate collateral).
- Marketing components: `BrandLogo`, `MarketingButton`, `ServicePageShell`.
- Header/footer nav aligned to commercial IA; gold primary CTAs on marketing surfaces.

## Pages

| Route | Change |
|-------|--------|
| `/` | Rebuilt — commercial-first hero and sections per directive |
| `/our-approach` | **New** |
| `/90-day-validation` | **New** — PVA summary (pending flyer verbatim review) |
| `/introductory-offers` | **New** — paid pilot vs PVA |
| `/pilots` | **301** → `/introductory-offers` |
| `/light-maintenance` | **301** → `/facilities-support` |
| `/rental-unit-turnovers` | **New** |
| `/deep-cleaning-building-resets` | **New** |
| `/post-construction-final-cleaning` | **New** |
| `/facilities-support` | **New** (secondary offering) |
| `/condo-cleaning`, `/commercial-cleaning` | Refactored to `ServicePageShell` |
| `/services`, `/about`, `/contact`, `/work-with-us` | Updated copy and structure |

## API / data

- `POST /api/lead` — persists optional `company`, `propertyType`, `sitesCount`, `preferredContact`, `serviceInterest` (validated allowlist).
- **No** Prisma schema migration.

## SEO

- `src/app/sitemap.ts`, `src/app/robots.ts`
- Metadata `template: "%s"` to avoid duplicate brand suffix

## Protected (unchanged)

- `/compliance` WSIB/COI/insurance statements — **not modified**

## Owner verification required

- Primary phone E.164 (`+12269462585` vs legacy `2558` link)
- Oct 24 PVA flyer PDF for legal/marketing parity
- Notification mailbox monitoring (`admin@blvckshell.com`, etc.)
