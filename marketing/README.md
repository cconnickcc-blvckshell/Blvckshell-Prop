# Marketing Website (Phase 2B / P2)

**Status:** Built  
**Purpose:** **Front-facing program** — the main public website visitors see first. The workforce portal is accessible from here (e.g. “Portal” / “Log in” in header or footer).

---

## Setup

1. **Node:** Use Node 20 LTS (or as per project standard).
2. **Install:** From this directory run `npm install`.
3. **Database:** The marketing site stores leads in the same Postgres database as the portal. Ensure the portal has been migrated (including the `Lead` table). Copy `.env.example` to `.env` and set:
   - `DATABASE_URL` — same Postgres URL as the portal (pooled connection is fine).
   - `NEXT_PUBLIC_PORTAL_URL` — full URL to the portal (e.g. `https://app.blvckshell.com`) for the header/footer “Portal / Log in” link.
   - `NEXT_PUBLIC_SITE_URL` — full URL of the marketing site (e.g. `https://blvckshell.com`) for sitemap and robots.
4. **Generate Prisma client:** Run `npm run db:generate` (or `npx prisma generate`). No migrations are run from this app; the portal owns the schema and migrations.
5. **Run dev:** `npm run dev` — app runs on port 3001 (portal can run on 3000).

---

## Deploy (Vercel)

- Create a Vercel project with **Root Directory** = **`marketing`**.
- Add env vars: `DATABASE_URL`, `NEXT_PUBLIC_PORTAL_URL`, `NEXT_PUBLIC_SITE_URL`.
- Build command: `npm run build` (runs `prisma generate` then `next build`).

---

## Front door vs portal

- **Marketing site (this app)** = **front-facing.** Default landing for the brand (home, services, contact, lead capture). This is the “webpage” the public sees.
- **Portal** = workforce operations app (login, jobs, completions, admin). **Accessible from the marketing site** via a clear link (e.g. “Portal”, “Log in”, “Subcontractor portal”) in the header or footer that points to the portal URL (same domain path like `/portal` or subdomain like `app.blvckshell.com`).

When we build the marketing site, the layout **must** include a way for workers/admins to reach the portal (link/button in nav or footer).

---

## What this is

The **marketing site** is the **public website** visitors see first:

- **Home** — Hero, who we serve, what we solve, how it works, services, why BLVCKSHELL, service area, FAQ, contact CTA
- **Contact** — Lead form (name, company, role, phone, email, property type, # sites, message, consent); stored in a `Lead` table
- **Services** — `/services`, `/condo-cleaning`, `/commercial-cleaning`, `/light-maintenance`
- **About** and **Privacy**
- **Lead capture** — `/api/lead` with validation, optional email to admin, honeypot/rate limit
- **SEO** — Metadata, OpenGraph, sitemap, robots.txt
- **Brand** — Dark/neutral, strong typography, whitespace (per Prompt 2)

**No login or portal features on the marketing pages themselves** — but the site must **link to the portal** so workers and admins can sign in. Same repo; typically two Vercel projects (or one monorepo with two apps): marketing = main domain, portal = subdomain or path.

---

## How it fits with the rest of the repo

| Part | What it is | Status |
|------|------------|--------|
| **ops-binder/** | Contracts, SOPs, checklists, state machines (markdown) | ✅ Done |
| **portal/** | Workforce operations app — login, jobs, completions, admin, payouts | 🚧 In progress |
| **marketing/** | Public marketing site — home, contact, lead capture, SEO | ⏳ Not started |

So “the website” in the broad sense is **two apps**: the **portal** (internal) and the **marketing** site (public). This folder is for the latter.

---

## When we build it (Phase 2B)

Per **ROADMAP.md** and **IMPLEMENTATION_PLAN.md**:

1. Initialize Next.js 14+ App Router, TypeScript, Tailwind in `marketing/`.
2. Layout: header, footer, CTAs (“Request a Quote”, “Book a Site Walk”), phone, email, optional PDF download. **Include a clear “Portal” / “Log in” (or “Subcontractor portal”) link that goes to the portal URL.**
3. Apply brand (dark/neutral, typography).
4. Build Home and Contact (with lead form + `/api/lead`).
5. Build service pages and About/Privacy.
6. Add SEO (metadata, sitemap, robots.txt).
7. Write this README with setup and deploy (e.g. Vercel with Root Directory = `marketing`).

Phase 2B can run in parallel with 2A (portal) after Phase 0. See **ROADMAP.md** § Phase 2B and **EXECUTION_PLAN.md** § 6.

---

## Deploying (when built)

- **Vercel:** Create a separate project (or monorepo app) with **Root Directory** = **`marketing`**.
- **URL strategy:** Marketing = **front-facing** (e.g. `blvckshell.com` or `www.blvckshell.com`). Portal = reachable from marketing (e.g. `app.blvckshell.com` or `blvckshell.com/portal`). The marketing site’s header/footer must link to the portal URL.
