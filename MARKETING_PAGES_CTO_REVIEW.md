# Marketing Site — CTO Review (All Pages Consolidated)

**Purpose:** Single document for CTO to review every marketing page: **full content word-for-word** plus styling. Standalone reference only; does not affect the live site.

**Generated:** February 2026.

---

## Global styling reference

- **Tailwind:** `portal/tailwind.config.ts` — content paths, `theme.extend.colors`: `background`, `foreground`.
- **CSS:** `portal/src/app/globals.css` — `:root` (--background #0a0a0a, --foreground, zinc scale, --accent gold, --accent-secondary emerald), body, `.text-display`, `.text-headline`, `.text-accent`, `.bg-accent`, `.image-treatment`; print rules.
- **Layout:** `(marketing)/layout.tsx` — main: `min-h-screen flex-1 bg-zinc-950 text-white`. Structure: Header → main → Footer.

---

## Shared: Header (all marketing pages)

**File:** `portal/src/components/marketing/Header.tsx`

**Full content (word-for-word):**
- Brand link: **BLVCKSHELL**
- Nav links: **Home**, **Services**, **Pilots**, **Compliance**, **About**, **Contact**
- CTA button (desktop): **Portal / Log in**
- CTA (mobile): **Log in**
- Mobile menu: same nav labels; button aria-label: **Toggle menu**

**Styling:** `sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur`, `h-14 sm:h-16`, nav `text-sm text-zinc-400 hover:text-white`, CTA `rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2`, mobile panel `border-t border-zinc-800 bg-zinc-950 py-4`.

---

## Shared: Footer (all marketing pages)

**File:** `portal/src/components/marketing/Footer.tsx`

**Full content (word-for-word):**
- **BLVCKSHELL**
- **Facilities services for condos and commercial properties. Windsor–Essex & Ontario.**
- Links: **Services**, **Compliance**, **About**, **Contact**, **Privacy**, **Portal / Log in**
- **© [year] BLVCKSHELL. All rights reserved.**

**Styling:** `border-t border-zinc-800 bg-zinc-950`, `text-lg font-semibold text-white`, tagline `text-sm text-zinc-500`, links `text-zinc-400 hover:text-white`, copyright `text-xs text-zinc-600 border-t border-zinc-800 pt-8`.

---

# ———————————————————————————————————————————————————
# PAGE 1: Home (`/`)
# ———————————————————————————————————————————————————

**Route:** `/`  
**File:** `portal/src/app/(marketing)/page.tsx`

### Full content (word-for-word)

**Hero**
- H1: **Facilities Services Built Deliberately**
- Sub: **Structured, Accountable, Prepared from Day One**
- Body: **Checklists, photo verification, and compliance tracking designed into our operations from the start. Built for property managers who value structure over scale.**
- Buttons: **Request a site evaluation** | **Get in touch** (mobile only)

**Trust strip**
- Label: **Built for property managers**
- Items: **Photo-verified visits** | **Checklist-based service** | **Missed-visit make-goods** | **Incident reporting** | **Key/FOB control**

**How We Operationalize Quality**
- H2: **How We Operationalize Quality**
- Body: **Not generic promises—a systematic flow. Every visit is structured to follow a documented process with accountability at every step.**
- Steps: **Scheduled Visits** — Checklist enforced. Every job tied to site-specific scope and frequency. No guesswork. | **Photo Evidence Captured** — Timestamped and labeled. Minimum evidence per area so you see what was done, when. | **Site Manager Review** — Approval required. You review completions, evidence, and checklists before sign-off. | **Issue & Escalation** — Automatic alerts for safety, damage, or scope gaps. Reported same day with documented response times. | **Audit Trails** — Every change logged. Complete history of visits, approvals, issues, and resolutions. Board-ready reporting.

**Our Services**
- H2: **Our Services**
- Body: **Cleaning, unit turnovers, light maintenance, and facilities support. Each service is structured with checklists, evidence, and accountability built in.**
- Tiles: **Condo cleaning** — Common areas, lobbies, washrooms, and shared spaces. (Label: Scope) | **Commercial cleaning** — Office, retail, and mixed-use. Scheduled and on-demand. (Label: Process) | **Light maintenance** — Minor repairs, paint touch-ups, caulking, and site support. (Label: Reporting)
- Link: **View Pilot Programs →**

**Proof & Accountability**
- H2: **Proof & Accountability**
- Body: **Our operations are structured to produce proof by default. Every job is designed to be tied to clear standards and your review—this isn't added later, it's built in from the start.**
- Rule: **If a visit can't be evidenced and reviewed, it isn't considered complete.**
- Audit: **Our documentation exists to protect you during audits, disputes, and board review.**
- Bullets: **Site-specific checklists so scope is clear and nothing is missed.** | **Photo evidence minimums per area—structured to show what was done, not added as an afterthought.** | **Issue escalation logic: safety and damage reported same day with documented response times.** | **Re-clean policy: we return to fix it or you get credit—accountability designed in, not reactive.**
- Caption: **Every visit produces timestamped evidence and checklist sign-off. Request a sample report below.**
- Button: **Request a sample report**

**Who We Serve**
- H2: **Who We Serve**
- Body: **Property managers, condo boards, and commercial building operators who need reliable, auditable facilities work. We launch in Windsor-Essex and serve Ontario-wide coverage as we expand - multi-site portfolios considered case-by-case.**
- Cards: **Condo corporations** | **Commercial property managers** | **Multi-site portfolios**

**How It Works**
- H2: **How It Works**
- 1 **Scope & quote** — We align on scope, checklists, and frequency. You get a clear quote and schedule.
- 2 **Scheduled service** — Assigned crews complete work on schedule. Evidence and checklists are captured in our portal.
- 3 **Review & approve** — You review completions and approve. Invoicing and payouts are handled in one place.

**Trust & Compliance**
- H2: **Trust & Compliance**
- **Insurance & compliance:** COI on file, WSIB coverage, Compliance-ready, HST registered
- **Service-level expectations:** Photo evidence per visit, Site-specific checklists, Completion reports, Review & approve workflow
- **Issue handling:** Safety & damage reported same day, Incident reports logged, Response times documented, Escalation workflow
- **Operational coverage:** Backup cleaner plan, Missed-visit make-good policy, Key/FOB control, Multi-site coordination
- **Where we operate:** Launch: Windsor–Essex, Service area: Ontario-wide, Multi-site portfolios welcome, Site walks available
- **Proof & accountability:** Site-specific checklists, Photo evidence minimums, Re-clean or credit policy, Portal access for review
- **When things go wrong:** **Missed visits, quality issues, and incidents have a defined response: make-good or credit, same-day reporting, and documented escalation. We own the process—you get a clear audit trail.** Link: **Full details →** (to /compliance)

**Final CTA**
- H2: **Ready to Get Started?**
- **Get a no-obligation site evaluation. See how we run your sites with a guided tour of our portal and process.**
- **We'll respond within one business day.**
- Buttons: **Request a site evaluation** | **See a sample report**

### Styling (key classes)

Hero: `min-h-[75vh] border-b border-zinc-800`, `text-display`, `text-zinc-300`/`text-zinc-400`, callout `border-emerald-500/20 bg-emerald-500/5`, primary CTA `bg-white px-8 py-3.5 text-zinc-900`. Trust strip: `bg-zinc-900/30`, grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5`. Sections: `text-headline`, `border-zinc-800`, cards `rounded-xl border border-zinc-800 bg-zinc-900/50`. CTAs: primary white, secondary `border border-zinc-600 bg-zinc-900/50`. Framer Motion + ScrollReveal + StaggerContainer.

---

# ———————————————————————————————————————————————————
# PAGE 2: About (`/about`)
# ———————————————————————————————————————————————————

**Route:** `/about`  
**File:** `portal/src/app/(marketing)/about/page.tsx`

### Full content (word-for-word)

- H1: **About BLVCKSHELL**

- Blvckshell exists because property managers were tired of undocumented work and excuses. We provide facilities services for condos and commercial properties-cleaning, turnovers, light maintenance-with consistency, evidence, and ease of review built in. Our operations are structured to produce audit-ready documentation by default.

- **These standards were designed by operators who have worked inside facilities environments where undocumented work created risk, disputes, and board exposure.**

- **Operating region:** We launch in Windsor-Essex and serve Ontario-wide coverage as we expand. One consistent footprint - no geographic ambiguity on coverage, staffing, or response times.

- Our network includes internal crews and vetted subcontractors. All are onboarded with compliance documentation (COI, WSIB) and trained on your scope. Work is assigned, completed, and approved through our portal—one place for scheduling, evidence, and payouts. Accountability remains with Blvckshell; we don't subcontract anonymously.

- For custom scope or multi-site programs, get in touch.

**What We Don't Do**
- H2: **What We Don't Do**
- **Clear boundaries reduce disputes and set expectations.**
- We do not bill hourly for cleaning—scope and cadence are agreed, then flat or per-visit pricing.
- We do not subcontract anonymously—everyone is vetted, documented, and accountable through us.
- We do not clean without documentation—every visit is checklist- and evidence-based.
- We do not change scope mid-contract without written confirmation.

**How We're Built**
- H2: **How We're Built**
- **These aren't promises we'll add later—they're how we operate.**
- **Accountability Design** — Every task is designed to be photo-verified and logged from day one. Responsibility is assigned, not diffused. When something is missed, there's a clear path to resolution.
- **Failure-Mode Awareness** — We've thought through what can go wrong—missed visits, quality issues, safety concerns—and built escalation logic and response protocols into our systems before they're needed.
- **Growth Limits** — We cap active properties early. This isn't a limitation—it's intentional. We'd rather do fewer sites well than many sites poorly. Quality over scale.
- **Issue Handling Before Complaints** — Safety and damage issues are reported same day with documented response times. We don't wait for complaints—we catch issues early and escalate proactively.
- **Supervision Model** — Every completion requires approval. Site managers review evidence, checklists, and quality before sign-off. This isn't optional—it's how we operate.
- **Audit-Ready by Default** — Our operations are structured to produce audit-ready documentation by default. Every change is logged. Complete history of visits, approvals, issues, and resolutions. Board-ready reporting.

**Why This Matters**
- H2: **Why This Matters**
- Property managers hire cleaners to avoid problems, not to admire resumes. Our value isn't in years of experience—it's in systems thinking, accountability design, and risk awareness that prevent problems before they happen.
- **Transparency:** We're upfront about being new. We're also upfront about being unusually prepared. That combination—honesty plus structure—is rare in this industry.

- Button: **Contact us**

### Styling

Container: `mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20`. H1 `text-headline font-bold text-white`. Callout `rounded-lg border border-emerald-500/20 bg-emerald-500/5`. Body `text-zinc-300`, strong `text-white`. List bullets `h-1.5 w-1.5 rounded-full bg-zinc-500`. Cards `rounded-xl border border-zinc-800 bg-zinc-900/50 p-6`. CTA `rounded-lg bg-white px-6 py-3 text-zinc-900 hover:bg-zinc-200`.

---

# ———————————————————————————————————————————————————
# PAGE 3: Contact (`/contact`)
# ———————————————————————————————————————————————————

**Route:** `/contact` (optional `?request=sample-report`)  
**Files:** `portal/src/app/(marketing)/contact/page.tsx`, `ContactForm.tsx`

### Full content (word-for-word)

- H1: **Contact**
- **Request a quote, book a site walk, or ask a question. We'll respond within one business day.**

- (When sample-report) Banner: **Sample report request.** Share your details below and we'll send you an anonymized example of a completion report.

- H2: **Reach us directly**
- **hello@blvckshell.com** (mailto link)
- **Phone available when we connect** — share your number in the form and we'll call you.
- **Prefer to book a site walk? Say so in your message and we'll send a link or coordinate a time.**

- H2: **Send a message**

**ContactForm labels & copy:**
- Honeypot: label **Website** (hidden)
- **Name *** placeholder: Your name
- **Email *** placeholder: you@company.com
- **Phone** placeholder: Your phone (optional)
- **Building address** placeholder: Street address, city
- **Building type** options: Select | Condo | Office / Commercial | Mixed | Other
- **Frequency** options: Select | Daily | 3x per week | 2x per week | Weekly | Other / Not sure
- **Best callback time** options: Select | Morning | Afternoon | Either
- **Preferred contact method** options: Email or phone—your choice | Email | Phone
- **Message (optional)** placeholder: Any questions or details about your needs?
- Success: **Thanks. We've received your message and will respond within one business day.**
- Error: `{errorMessage}` (default: **Something went wrong. Please try again.**)
- Button: **Send message** / **Sending…**

- **What happens next** — We'll reply within one business day. If you asked for a quote, we'll confirm your details and schedule a site walk or send a proposal. You can reply by email or phone—whichever you prefer.

### Styling

Page: `mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16`. H1 `text-3xl font-bold text-white`. Banner `rounded-lg border border-emerald-500/20 bg-emerald-500/5`. Direct block `rounded-xl border border-zinc-800 bg-zinc-900/50 p-6`. Form labels `text-sm font-medium text-zinc-300`, inputs `border-zinc-700 bg-zinc-900 text-white placeholder-zinc-500`, success `bg-green-900/40 text-green-300`, error `bg-red-900/40 text-red-300`, submit `bg-white text-zinc-900`.

---

# ———————————————————————————————————————————————————
# PAGE 4: Services index (`/services`)
# ———————————————————————————————————————————————————

**Route:** `/services`  
**File:** `portal/src/app/(marketing)/services/page.tsx`

### Full content (word-for-word)

- H1: **Services**
- **Cleaning, unit turnovers, light maintenance, and facilities support. Each service is structured with checklists, evidence, and accountability built in from day one.**

**Condo cleaning**
- **Condo cleaning**
- **Common areas, lobbies, washrooms, and shared spaces. Site-specific checklists and evidence.**
- What's included: **Lobby and entrance (floor, glass, desk, bins)** | **Hallways and stairwells (sweep, mop, baseboards)** | **Elevators (floor, panel, walls)** | **Common washrooms (toilets, sinks, mirrors, sanitize)** | **Garbage rooms (floor, bins, deodorize)**
- **Typical cadence: 2x, 3x, or 5x per week (set per contract)**
- **Learn more →** | **Request a site evaluation** | **See a sample report**

**Commercial cleaning**
- **Commercial cleaning**
- **Office, retail, and mixed-use. Scheduled and on-demand cleaning with consistent quality.**
- What's included: **Lobbies, corridors, and common areas** | **Washrooms and break rooms** | **Floor care (sweep, mop, vacuum per surface)** | **High-touch surfaces and sanitization** | **Trash and recycling removal**
- **Typical cadence: Daily, several times per week, or weekly**
- Same three links

**Light maintenance**
- **Light maintenance**
- **Minor repairs, bulb replacement, and site support. Logged and tracked in our portal.**
- What's included: **Bulb replacement (common areas, within reach)** | **Minor repairs (door hardware, cabinet fixes, touch-ups)** | **Filter checks and basic HVAC visual checks** | **Site support (access issues, lockouts, coordination)** | **Work logged in portal with notes**
- **Typical cadence: Bundled with cleaning or stand-alone visits**
- Same three links

- **Starting with a Pilot?** — We offer controlled, scope-locked pilot programs designed to prove value without long-term commitment. Each pilot is time-bound and naturally converts to ongoing service. **View pilot programs →**

- **Need a custom scope or multi-site program? Contact us for a quote.**

### Styling

Container `mx-auto max-w-4xl`. Cards `rounded-xl border border-zinc-800 bg-zinc-900/50 p-8`, hover `hover:border-zinc-700`. Pilot block `rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-6`. Links: Learn more `text-white`, Request evaluation `text-emerald-400`, Sample report `text-zinc-400`.

---

# ———————————————————————————————————————————————————
# PAGE 5: Condo cleaning (`/condo-cleaning`)
# ———————————————————————————————————————————————————

**Route:** `/condo-cleaning`  
**File:** `portal/src/app/(marketing)/condo-cleaning/page.tsx`

### Full content (word-for-word)

- H1: **Condo Cleaning**
- **Common areas, lobbies, washrooms, and shared spaces. Site-specific checklists and evidence designed into every visit from day one.**

**Common Areas**
- H2: **Common Areas**
- **Lobbies, hallways, stairwells, elevators, mail rooms, garbage rooms, shared washrooms, and amenity spaces.**

**What's Included**
- H3: **What's Included**
- Lobbies and vestibules (floor, glass, desk, bins) | Hallways and corridors (sweep, mop, baseboards) | Stairwells and landings (sweep, mop, railings) | Elevators (interiors, floors, buttons, rails) | Mail rooms and parcel areas | Garbage rooms and recycling areas (floor, bins, deodorize) | Shared washrooms (toilets, sinks, mirrors, sanitize) | Amenity spaces (gyms, lounges, party rooms)

**Cleaning Activities**
- H3: **Cleaning Activities**
- Surface cleaning and sanitization | Floor care (vacuuming, mopping, spot treatment) | Glass and mirror cleaning (ground-level only) | Trash and recycling handling | Odor control and deodorization

**How It Works**
- H3: **How It Works**
- **Every visit follows a site-specific checklist. Photo evidence is captured per area, logged in our portal, and requires your approval before completion. Frequency is set per contract (2x, 3x, or 5x per week) with a flat monthly fee - no hourly billing. Hourly billing creates disputes and misaligned incentives; we don't use it.**

- **Request a site evaluation** | **See a sample report** | **← Back to services**

### Styling

Hero `min-h-[50vh] border-b border-zinc-800`, ImageTreatment. Content `mx-auto max-w-4xl`. Lists with `bg-emerald-500` bullets. How it works `rounded-lg border border-zinc-800 bg-zinc-900/30 p-6`. CTAs: primary white, secondary border, tertiary Back.

---

# ———————————————————————————————————————————————————
# PAGE 6: Commercial cleaning (`/commercial-cleaning`)
# ———————————————————————————————————————————————————

**Route:** `/commercial-cleaning`  
**File:** `portal/src/app/(marketing)/commercial-cleaning/page.tsx`

### Full content (word-for-word)

- H1: **Commercial cleaning**
- **Office, retail, and mixed-use. Scheduled and on-demand cleaning with consistent quality and evidence in the portal.**

**What's included**
- H2: **What's included**
- Lobbies, corridors, and common areas | Washrooms and break rooms | Floor care (sweep, mop, vacuum per surface) | High-touch surfaces and sanitization | Trash and recycling removal | Scope and checklist per site; completion evidence in the portal

**What's excluded**
- H2: **What's excluded**
- **Tenant-only areas unless in scope. Hazmat, specialized equipment (e.g. floor stripping), and after-hours only by agreement. We'll confirm at walkthrough.**

**Frequency**
- H2: **Frequency**
- **Daily, several times per week, or weekly - tailored to your building and contract. Service window and days agreed at quote. Flat fee or per-visit pricing; we avoid hourly billing so scope and incentives stay aligned.**
- **Why we avoid hourly billing:** Hourly billing creates disputes and misaligned incentives. When scope is locked upfront, you know what you're paying for and we're incentivized to complete efficiently, not drag out time.

**Add-ons**
- H2: **Add-ons**
- **Deep cleans, carpet cleaning, window interiors, and one-off work orders. Priced per site or per visit - outline your needs in the contact form.**
- **Why scope lock matters:** We define scope upfront so there's no ambiguity about what's included. Add-ons are quoted separately, preventing scope creep and surprise charges.

**How quoting works**
- H2: **How quoting works**
- **We review your areas and frequency, do a site walk if needed, then send a clear quote. After approval, crews run on schedule and you review completions in the portal.**

- **Request a site evaluation** | **See a sample report** | **← Back to services**

### Styling

Same hero + content pattern as condo; content `max-w-3xl`. Same CTA set.

---

# ———————————————————————————————————————————————————
# PAGE 7: Light maintenance (`/light-maintenance`)
# ———————————————————————————————————————————————————

**Route:** `/light-maintenance`  
**File:** `portal/src/app/(marketing)/light-maintenance/page.tsx`

### Full content (word-for-word)

- H1: **Light Maintenance**
- **Non-structural, non-permit, non-licensed work. Paint touch-ups, caulking, hardware fixes, and minor repairs—logged and tracked in our portal.**

**Hardware & Fixtures:** Door handle replacement | Cabinet hardware tightening or replacement | Closet hardware adjustments | Window handle replacement | Switch plate and cover replacement | Light fixture replacement (like-for-like only)

**Paint & Surface Touch-Ups:** Wall touch-ups | Baseboard repainting | Stairwell repainting | Door and trim touch-ups | Minor surface sealing

**Wall & Finish Repairs:** Drywall patching (small holes, anchors) | Minor crack filling | Wood filler repairs | Cosmetic surface smoothing

**Caulking & Sealing:** Bathroom caulking | Kitchen caulking | Vanity and countertop sealing | Baseboard gap sealing | Window and trim sealing

**Ventilation & Filters:** HVAC filter replacement (client-supplied or approved) | HRV filter cleaning | Range hood filter cleaning | Vent cover removal and cleaning

**Explicit Exclusions**
- H3: **Explicit Exclusions**
- **Blvckshell does not provide electrical work beyond fixture replacement, plumbing work beyond visible fittings, HVAC servicing or repair, structural repairs, roofing or exterior envelope work, permit-required work, emergency response services, or licensed trade replacement.**
- **Why exclusions protect both sides:** Clear boundaries prevent liability risk, permit violations, and disputes. We stay within our expertise - you know exactly what we handle and what requires a licensed trade.

- **Request a site evaluation** | **See a sample report** | **← Back to services**

### Styling

Exclusions callout: `rounded-lg border border-red-500/20 bg-red-500/5 p-6`. Rest same as other service pages.

---

# ———————————————————————————————————————————————————
# PAGE 8: Compliance & Risk (`/compliance`)
# ———————————————————————————————————————————————————

**Route:** `/compliance`  
**File:** `portal/src/app/(marketing)/compliance/page.tsx`

### Full content (word-for-word)

- H1: **Compliance & Risk**
- **How we handle insurance, keys, incidents, and remediation. One consistent region: Windsor–Essex launch, Ontario-wide service. Our documentation exists to protect you during audits, disputes, and board review.**

**Insurance & Compliance**
- H2: **Insurance & Compliance**
- **COI (Certificate of Insurance)** — On file and available upon request. We maintain current commercial general liability and relevant coverage for our operations.
- **WSIB** — Coverage in place for our workforce. Proof available upon request.
- **HST registered** — Invoices and compliance documentation are issued accordingly.

**Key / FOB Control**
- H2: **Key / FOB Control**
- **We do not take key or FOB access for granted. Our process:**
- Sign-out and sign-in tracked per site and per worker.
- Keys/FOBs are used only for assigned jobs and returned or logged as per your agreement.
- Incident protocol: any loss or concern is reported same day; we document and remediate in line with your requirements.

**Risk, Accountability & What Happens When Things Go Wrong**
- H2: **Risk, Accountability & What Happens When Things Go Wrong**
- **We own the risk narrative so you know exactly what to expect.**
- **Missed visit** — We have a make-good policy: we return to complete the service or you receive credit as agreed. Missed visits are logged, acknowledged, and remediated—no silent skips.
- **Quality failure / re-clean** — If something isn't done to standard, we return to fix it or you get credit. Response window and remediation are documented. We don't leave quality disputes open.
- **Incident escalation** — Safety and damage issues are reported the same day. We log incident type, response time, and outcome. Escalation chain and follow-up are documented so you have a clear audit trail.
- **Documentation retention** — Completion evidence and logs are retained per our retention policy. Dispute-flagged items are retained longer. We can provide a written summary of our retention and dispute-handling process on request.
- **Client disputes** — We handle disputes through a defined process: documentation review, timeline of events, and resolution (re-clean, credit, or other agreed outcome). Accountability stays with Blvckshell; we don't diffuse responsibility to unnamed subcontractors.

**Subcontractor Governance**
- H2: **Subcontractor Governance**
- **When we use vetted subcontractors, you still get one accountable operator: Blvckshell.**
- Vetting: COI, WSIB, and scope alignment before they touch your sites.
- Training: Same checklist and documentation standards; they work through our system.
- Accountability: We remain the single point of contact and liability to you. You don't manage subs—we do.

- **Contact us**

### Styling

Sections `mt-12`, risk cards `rounded-xl border border-zinc-800 bg-zinc-900/50 p-6`. CTA `rounded-lg bg-white px-6 py-3 text-zinc-900`.

---

# ———————————————————————————————————————————————————
# PAGE 9: Pilots (`/pilots`)
# ———————————————————————————————————————————————————

**Route:** `/pilots`  
**File:** `portal/src/app/(marketing)/pilots/page.tsx`

### Full content (word-for-word)

- H1: **Pilot Programs**
- **Scope-locked, time-bound, prepaid or deposit-based. Each pilot converts naturally to ongoing service or ends cleanly.**

**1. Unit Turnover Pilot**
- **Unit Turnover Pilot**
- Perfect for property managers with frequent move-outs. A complete turnover package designed to prove readiness and quality.
- Pilot scope: 1 vacant unit | Full turnover cleaning | Visual readiness inspection | Minor touch-ups (up to 2 hours included)
- Duration: Single unit or 30 days (whichever comes first) | Converts to: Per-unit turnover pricing or ongoing maintenance
- Best for: PMs with frequent turnovers who need reliable, inspection-ready units
- **Request this pilot →**

**2. Problem Building Cleaning Pilot**
- Scope: 1 building only | Common area cleaning | Garbage room + stairwells | Weekly inspection report
- Duration: 30 days | Converts to: Monthly recurring cleaning contract
- Best for: PMs with problem buildings who need proof of improvement

**3. Light Maintenance & Punch-List Pilot**
- Scope: Fixed block of labor (6 or 10 hours) | Paint touch-ups | Caulking | Hardware fixes | Minor repairs only
- Duration: 30 days or hours-based | Converts to: Hourly maintenance or monthly maintenance retainer
- Best for: PMs drowning in small issues who want one accountable vendor

**4. Turnover Readiness Audit Pilot**
- Scope: 1–3 vacant units | Visual inspection only | Photo documentation | Readiness checklist | Trade-required notes
- Duration: One inspection cycle | Converts to: Turnover cleaning, maintenance, or ongoing inspection support
- Best for: PMs who have vendors but need validation and accountability

**5. Building Reset / Seasonal Refresh Pilot**
- Scope: Pressure washing (walkways / entries) | Carpet refresh (common areas) | Light maintenance punch list | Condition report
- Duration: Single project (2–7 days) | Converts to: Ongoing cleaning or seasonal maintenance contracts
- Best for: PMs before board inspections or seasonal complaint cycles

**How Pilots Work**
- H3: **How Pilots Work**
- **Scope-locked:** Each pilot has a defined scope. No scope creep, no surprises.
- **Time-bound:** Pilots have clear end dates. They convert to ongoing service or end cleanly.
- **Prepaid or deposit:** Cash flow protection for both sides. No net-30 until we prove value.
- **Natural conversion:** Successful pilots move to standard net-30 billing and ongoing contracts.

- **Not sure which pilot fits? Contact us and we'll recommend based on where your pain points are.**

### Styling

Pilot cards `rounded-xl border border-zinc-800 bg-zinc-900/50 p-8`, meta grid `sm:grid-cols-2`, labels `text-xs font-semibold uppercase tracking-wider text-zinc-500`. How Pilots Work block `rounded-xl border border-zinc-800 bg-zinc-900/30 p-8`.

---

# ———————————————————————————————————————————————————
# PAGE 10: Privacy (`/privacy`)
# ———————————————————————————————————————————————————

**Route:** `/privacy`  
**File:** `portal/src/app/(marketing)/privacy/page.tsx`

### Full content (word-for-word)

- H1: **Privacy**
- **BLVCKSHELL respects your privacy. This page summarizes how we collect, use, and protect information in connection with our website and services. Our practices are intended to align with applicable privacy laws, including PIPEDA and Ontario privacy requirements where relevant.**

**Information we collect**
- H2: **Information we collect**
- When you contact us (e.g. via the contact form), we collect the information you provide: name, company, role, phone, email, property type, number of sites, and message. We use this to respond to your inquiry and, with your consent where required, to provide quotes and services.

**How we use it**
- H2: **How we use it**
- We use contact and lead information to respond to requests, provide quotes, and deliver facilities services. We do not sell your information to third parties. We may retain information as needed for business and legal purposes, and in accordance with our data retention policy.

**Your rights**
- H2: **Your rights**
- You may request access to or correction of your personal information, or ask about our retention and deletion practices. Contact us using the information on our Contact page. We will respond in accordance with applicable law.

- **Last updated: February 2026.**

### Styling

Container `mx-auto max-w-3xl px-6 py-16`. H1 `text-3xl font-bold text-white`. Sections `mt-10 space-y-4 text-zinc-300`. H2 `text-xl font-semibold text-white`. Last updated `mt-12 text-sm text-zinc-500`.

---

# End of Marketing Pages

**Total:** 10 pages (Home, About, Contact, Services, Condo cleaning, Commercial cleaning, Light maintenance, Compliance, Pilots, Privacy) + shared Header and Footer. All content above is word-for-word as on the live site for CTO copy review; styling summaries are for design/implementation reference.
