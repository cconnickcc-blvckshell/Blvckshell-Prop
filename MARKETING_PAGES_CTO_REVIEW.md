# Marketing Site — CTO Review (All Pages Consolidated)

**Purpose:** Single document for CTO to review every marketing page, layout, and styling in one place. Standalone reference only; does not affect the live site.

**Generated:** February 2026.

---

## Global styling reference

### Tailwind config (`portal/tailwind.config.ts`)

```ts
content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}"]
theme.extend.colors: { background: "var(--background)", foreground: "var(--foreground)" }
```

### CSS variables & utilities (`portal/src/app/globals.css`)

- **Root:** `--background: #0a0a0a`, `--foreground: #fafafa`
- **Zinc scale:** `--zinc-50` through `--zinc-950`
- **Accent:** `--accent: #d4af37`, `--accent-light`, `--accent-dark` (gold)
- **Secondary:** `--accent-secondary: #10b981` (emerald)
- **Spacing:** `--space-1` (4px) through `--space-24` (96px)
- **Utilities:** `.text-display`, `.text-headline`, `.text-accent`, `.text-accent-secondary`, `.bg-accent`, `.border-accent`, `.image-treatment` (radial overlay)
- **Body:** `color: var(--foreground); background: var(--background);` system font stack, antialiased
- **Print:** `.doc-print`, `.print\:hidden` for doc viewer

### Marketing layout (`portal/src/app/(marketing)/layout.tsx`)

- **Main wrapper:** `min-h-screen flex-1 bg-zinc-950 text-white`
- **Structure:** `<MarketingHeader />` → `<main>{children}</main>` → `<MarketingFooter />`

### Shared components — classes used

| Component | Key Tailwind / styling |
|-----------|-------------------------|
| **Header** | `sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur`, `h-14 sm:h-16`, nav `text-sm text-zinc-400 hover:text-white`, CTA `rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2`, mobile `rounded-md p-2 text-zinc-400 hover:bg-zinc-800` |
| **Footer** | `border-t border-zinc-800 bg-zinc-950`, `text-lg font-semibold text-white`, links `text-zinc-400 hover:text-white`, copyright `text-xs text-zinc-600 border-t border-zinc-800 pt-8` |

---

# ———————————————————————————————————————————————————
# PAGE 1: Home (`/`)
# ———————————————————————————————————————————————————

**Route:** `/`  
**File:** `portal/src/app/(marketing)/page.tsx`  
**Purpose:** Hero, value props, process flow, services grid, proof section, who we serve, how it works, trust & compliance, final CTA.

**Sections & key classes:**
- Hero: `min-h-[75vh] border-b border-zinc-800`, image treatment overlay, `text-display`, `text-zinc-300`/`text-zinc-400`, CTA `rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900`, secondary `border border-zinc-600 bg-zinc-900/50`
- Trust strip: `bg-zinc-900/30 backdrop-blur-sm`, `text-xs font-semibold uppercase tracking-wider text-zinc-500`, grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`
- Process: `text-headline`, `max-w-4xl`, ProcessFlow steps
- Services: PremiumTile grid `sm:grid-cols-2 lg:grid-cols-3`, link `border border-emerald-500/40 bg-emerald-500/10 text-emerald-300`
- Proof: `border-y border-zinc-800 bg-zinc-900/30`, list bullets `style={{ backgroundColor: "var(--accent-secondary)" }}`, image `aspect-[4/3] rounded-xl border border-zinc-800 bg-zinc-900/50`
- Who we serve: cards `rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700`
- How it works: numbered circles `h-12 w-12 rounded-full bg-white text-zinc-900`
- Trust & compliance: grid `sm:grid-cols-2 lg:grid-cols-3`, list `text-emerald-500` bullets
- Final CTA: `border-t border-zinc-800 bg-zinc-950`, primary `bg-white`, secondary `border border-zinc-600 bg-zinc-900/50`

**Inline / motion:** Framer Motion for hero reveal; ScrollReveal, StaggerContainer/StaggerItem for sections.

---

# ———————————————————————————————————————————————————
# PAGE 2: About (`/about`)
# ———————————————————————————————————————————————————

**Route:** `/about`  
**File:** `portal/src/app/(marketing)/about/page.tsx`  
**Purpose:** Origin, operating region, what we don’t do, how we’re built, why it matters.

**Container:** `mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20`

**Key classes:**
- H1: `text-headline font-bold text-white`
- Callout: `rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3`, `text-sm text-emerald-300`
- Body: `text-zinc-300`, strong `text-white`
- “What we don’t do”: list `flex gap-3`, bullet `h-1.5 w-1.5 rounded-full bg-zinc-500`
- Cards: `rounded-xl border border-zinc-800 bg-zinc-900/50 p-6`
- CTA: `rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-200`

---

# ———————————————————————————————————————————————————
# PAGE 3: Contact (`/contact`)
# ———————————————————————————————————————————————————

**Route:** `/contact` (supports `?request=sample-report`)  
**Files:** `portal/src/app/(marketing)/contact/page.tsx`, `ContactForm.tsx`  
**Purpose:** Contact info, sample-report notice when queried, form (lead capture).

**Page container:** `mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16`

**Key classes:**
- H1: `text-3xl font-bold tracking-tight text-white`
- Sample-report banner: `rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3`, `text-sm text-emerald-300`
- Direct contact block: `rounded-xl border border-zinc-800 bg-zinc-900/50 p-6`, `text-sm font-semibold uppercase tracking-wider text-zinc-500`, link `text-white underline decoration-zinc-600 hover:decoration-white`
- “What happens next”: `rounded-lg border border-zinc-800/80 bg-zinc-900/30 px-4 py-4`

**ContactForm classes:**
- Honeypot: `absolute -left-[9999px] top-0`
- Labels: `block text-sm font-medium text-zinc-300`
- Inputs: `w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-white placeholder-zinc-500 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500`
- Success: `rounded-md bg-green-900/40 p-4 text-sm text-green-300`
- Error: `rounded-md bg-red-900/40 p-4 text-sm text-red-300`
- Submit: `w-full rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 disabled:opacity-50`

---

# ———————————————————————————————————————————————————
# PAGE 4: Services index (`/services`)
# ———————————————————————————————————————————————————

**Route:** `/services`  
**File:** `portal/src/app/(marketing)/services/page.tsx`  
**Purpose:** List of three services (condo, commercial, light maintenance) with included items, cadence, CTAs.

**Container:** `mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20`

**Key classes:**
- Cards: `rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-sm hover:border-zinc-700 hover:bg-zinc-900/70`
- List bullets: `h-1.5 w-1.5 rounded-full bg-emerald-500`
- Links: “Learn more” `text-white underline decoration-zinc-600`, “Request site evaluation” `text-emerald-400 underline decoration-emerald-500/40`, “See sample report” `text-zinc-400`
- Pilot CTA: `rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6`

---

# ———————————————————————————————————————————————————
# PAGE 5: Condo cleaning (`/condo-cleaning`)
# ———————————————————————————————————————————————————

**Route:** `/condo-cleaning`  
**File:** `portal/src/app/(marketing)/condo-cleaning/page.tsx`  
**Purpose:** Service detail — common areas, what’s included, cleaning activities, how it works, CTAs.

**Layout:** Hero `min-h-[50vh] border-b border-zinc-800` with ImageTreatment; content `mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20`

**Key classes:**
- Hero text: `text-headline font-bold tracking-tight text-white`, `text-lg text-zinc-300`
- Lists: `flex gap-3`, bullet `h-1.5 w-1.5 rounded-full bg-emerald-500`
- How it works: `rounded-lg border border-zinc-800 bg-zinc-900/30 p-6`
- CTAs: primary `rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900`, secondary `border border-zinc-600 bg-zinc-900/50`, tertiary “Back to services” `border border-zinc-600 text-zinc-400`

---

# ———————————————————————————————————————————————————
# PAGE 6: Commercial cleaning (`/commercial-cleaning`)
# ———————————————————————————————————————————————————

**Route:** `/commercial-cleaning`  
**File:** `portal/src/app/(marketing)/commercial-cleaning/page.tsx`  
**Purpose:** What’s included, excluded, frequency, add-ons, how quoting works, CTAs.

**Layout:** Same hero pattern; content `mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20`

**Key classes:** Same as condo (headlines, lists, CTAs). No image treatment list; sections are headline + paragraph/list.

---

# ———————————————————————————————————————————————————
# PAGE 7: Light maintenance (`/light-maintenance`)
# ———————————————————————————————————————————————————

**Route:** `/light-maintenance`  
**File:** `portal/src/app/(marketing)/light-maintenance/page.tsx`  
**Purpose:** Hardware, paint, wall repairs, caulking, ventilation, explicit exclusions, CTAs.

**Layout:** Hero + content `mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20`

**Key classes:**
- Exclusions callout: `rounded-lg border border-red-500/20 bg-red-500/5 p-6`, `text-lg font-semibold text-white`, `text-sm text-zinc-400`
- Rest: same list/card/CTA pattern as other service pages.

---

# ———————————————————————————————————————————————————
# PAGE 8: Compliance & Risk (`/compliance`)
# ———————————————————————————————————————————————————

**Route:** `/compliance`  
**File:** `portal/src/app/(marketing)/compliance/page.tsx`  
**Purpose:** Insurance & compliance, key/FOB control, risk (missed visit, quality, incident, documentation, disputes), subcontractor governance.

**Container:** `mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20`

**Key classes:**
- Sections: `mt-12`, H2 `text-headline font-semibold text-white`
- Lists: `flex gap-3`, bullet `h-1.5 w-1.5 rounded-full bg-emerald-500`
- Risk cards: `rounded-xl border border-zinc-800 bg-zinc-900/50 p-6`
- CTA: `rounded-lg bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-200`

---

# ———————————————————————————————————————————————————
# PAGE 9: Pilots (`/pilots`)
# ———————————————————————————————————————————————————

**Route:** `/pilots`  
**File:** `portal/src/app/(marketing)/pilots/page.tsx`  
**Purpose:** Pilot programs (turnover, problem building, maintenance, readiness audit, building reset) with scope, duration, converts-to, best-for; how pilots work.

**Container:** `mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20`

**Key classes:**
- Intro callout: `rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3`, `text-sm text-emerald-300`
- Pilot cards: `rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-sm hover:border-zinc-700 hover:bg-zinc-900/70`
- Meta grid: `grid gap-4 sm:grid-cols-2`, label `text-xs font-semibold uppercase tracking-wider text-zinc-500`
- “Best for”: `rounded-md bg-zinc-800/50 px-4 py-3`
- “How pilots work”: `rounded-xl border border-zinc-800 bg-zinc-900/30 p-8`

---

# ———————————————————————————————————————————————————
# PAGE 10: Privacy (`/privacy`)
# ———————————————————————————————————————————————————

**Route:** `/privacy`  
**File:** `portal/src/app/(marketing)/privacy/page.tsx`  
**Purpose:** Privacy summary — what we collect, how we use it, your rights.

**Container:** `mx-auto max-w-3xl px-6 py-16`

**Key classes:**
- H1: `text-3xl font-bold text-white`
- Body: `text-zinc-400`, sections `mt-10 space-y-4 text-zinc-300`
- H2: `text-xl font-semibold text-white`
- Last updated: `mt-12 text-sm text-zinc-500`

---

# End of Marketing Pages

**Total marketing pages:** 10 (Home, About, Contact, Services, Condo cleaning, Commercial cleaning, Light maintenance, Compliance, Pilots, Privacy).  
**Shared:** Header, Footer, Marketing layout; ContactForm on Contact.  
**Animations:** Framer Motion (hero), ScrollReveal, StaggerContainer/StaggerItem (marketing components).
