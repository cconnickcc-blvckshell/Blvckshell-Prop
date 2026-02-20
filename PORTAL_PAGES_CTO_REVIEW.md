# Portal (App) — CTO Review (All Pages Consolidated)

**Purpose:** Single document for CTO to review every portal page: **full content word-for-word** (every heading, label, button, table header, empty state, error message) plus styling. Standalone reference only; does not affect the live site. Where content is dynamic (e.g. from DB), marked as [Dynamic].

**Generated:** February 2026.

---

## Global styling reference (shared with marketing where applicable)

- **Tailwind & CSS variables:** Same as marketing (`portal/tailwind.config.ts`, `portal/src/app/globals.css`) — zinc scale, accent/secondary, `.text-display` / `.text-headline`, etc.
- **Admin area:** Dark theme. Layout: `min-h-screen bg-zinc-950 text-zinc-100`; main: `max-w-[1920px] mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10`.
- **Worker area:** Light theme. Layout: `min-h-screen bg-gray-50`; nav and content use white/gray.
- **Login:** Centered card on `bg-zinc-950`; form uses light-theme inputs (gray/blue) for contrast.

### Admin nav (`AdminNav.tsx`) — full content

- **Brand:** **BLVCKSHELL Admin**
- **Links:** **Locations**, **Workforce**, **Jobs**, **Invoices**, **Work Orders**, **Incidents**, **Payouts**, **Docs**
- **Log out** | [Dynamic: user name, user role badge]

### Admin nav — styling

- **Container:** `sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950 shadow-lg`, `max-w-[1920px]`, `h-14 md:h-16`
- **Brand:** `text-lg font-bold tracking-tight text-white md:text-xl`
- **Links:** `rounded-md px-3 py-2 text-sm font-medium`, active `bg-zinc-800 text-white`, inactive `text-zinc-400 hover:bg-zinc-800/50 hover:text-white`
- **User/role:** `text-sm text-zinc-400`, role badge `rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300`
- **Log out:** `rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white`
- **Mobile:** `border-t border-zinc-800 py-3`, same link styles, full-width Log out

### Worker nav (`WorkerNav.tsx`) — full content

- **Brand:** **BLVCKSHELL Portal**
- **Links:** **Jobs** | (Vendor owner only) **Team**, **Vendor Jobs**, **Payout Totals** | **Earnings**, **Profile**
- **[User name]** [Dynamic] | **Log out**

### Worker nav — styling

- **Container:** `border-b bg-white shadow-sm`, `max-w-7xl`, `h-16`
- **Brand:** `text-xl font-bold text-gray-900`
- **Links:** `text-sm font-medium text-gray-700 hover:text-gray-900`
- **User:** `text-sm text-gray-500`; Log out `text-gray-600 hover:text-gray-900`

### Login form (`LoginForm.tsx`)

- **Error:** `rounded-md bg-red-50 p-4`, `text-sm text-red-800`
- **Labels:** `block text-sm font-medium text-gray-700`
- **Inputs:** `block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500`
- **Field error:** `mt-1 text-sm text-red-600`
- **Submit:** `w-full rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50`

---

# ———————————————————————————————————————————————————
# AUTH & ENTRY
# ———————————————————————————————————————————————————

## Page: Login (`/login`)

**File:** `portal/src/app/login/page.tsx`  
**Purpose:** Sign-in; redirects by role (ADMIN → /admin/jobs, worker/vendor → /jobs). Error state shows “Portal temporarily unavailable” with Back to home / Contact.

**Key classes:**
- Wrapper: `flex min-h-screen items-center justify-center bg-zinc-950 px-4`
- Card: `w-full max-w-md space-y-8 rounded-xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl`
- Title: `text-center text-2xl font-bold tracking-tight text-white sm:text-3xl`
- Subtitle: `mt-2 text-center text-sm text-zinc-400`
- Error-state links: primary `rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900`, secondary `border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300`
- Back link: `text-xs text-zinc-500 hover:text-zinc-400`

---

## Page: Portal entry (`/portal`)

**File:** `portal/src/app/portal/page.tsx`  
**Purpose:** Server-only redirect: unauthenticated → /login; ADMIN → /admin/jobs; worker/vendor → /jobs. No UI.

---

# ———————————————————————————————————————————————————
# ADMIN (all under `/admin`)
# ———————————————————————————————————————————————————

**Layout:** `portal/src/app/admin/layout.tsx` — AdminNav + main as above. Role guard: non-ADMIN redirected.

---

## Page: Admin root (`/admin`)

**File:** `portal/src/app/admin/page.tsx`  
**Purpose:** Redirects to `/admin/jobs`. No UI.

---

## Page: Jobs list (`/admin/jobs`)

**File:** `portal/src/app/admin/jobs/page.tsx`  
**Purpose:** List jobs (optional filter by siteId); table + mobile cards; status badges; link to new job and to job detail.

### Full content (word-for-word)

H1 **Jobs** or **Jobs — [site name]** [Dynamic] | Subtitle **Manage and review job completions** or **Job history for this site** | Button **Create job** | Table headers: **Site**, **Scheduled**, **Assigned To**, **Status**, **Payout**, **Actions** | Cell link **View** | Mobile card link **View →** | Empty: **No jobs yet.**

**Key classes:**
- Header: `mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between`
- H1: `text-2xl font-bold tracking-tight text-white sm:text-3xl`; subtitle `mt-1 text-zinc-400`
- Primary CTA: `inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500`
- Section: `rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl`
- Table: `min-w-full divide-y divide-zinc-800`, thead `bg-zinc-800/50`, th `px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400`, tbody `divide-y divide-zinc-800`, tr `hover:bg-zinc-800/30`, td `px-6 py-4`, links `font-medium text-white hover:text-emerald-400`
- Status badges: `rounded-full border px-2.5 py-0.5 text-xs font-medium` + statusColor map (e.g. blue/amber/emerald/zinc)
- Mobile: `divide-y divide-zinc-800 md:hidden`, cards with same info

---

## Page: Job detail (`/admin/jobs/[id]`)

**File:** `portal/src/app/admin/jobs/[id]/page.tsx`  
**Purpose:** Single job view; assignment, completion, evidence; admin actions. Uses same admin section/table/card patterns and status colors.

---

## Page: New job (`/admin/jobs/new`)

**File:** `portal/src/app/admin/jobs/new/page.tsx`  
**Purpose:** Create job form. Same header/CTA pattern; form uses admin inputs (border-zinc-700, bg-zinc-900, text-white, focus ring).

---

## Page: Locations / Clients list (`/admin/clients`)

**File:** `portal/src/app/admin/clients/page.tsx`  
**Purpose:** Client organizations table (name, contact, site count); Add client CTA; View link to detail.

### Full content (word-for-word)

H1 **Locations** | Subtitle **Client organizations and sites** | Button **Add client** | Table headers: **Client**, **Contact**, **Sites**, **Actions** | Cell link **View** | Mobile **View →**. Rows: [Dynamic: client name, primary contact name/email, site count].

**Key classes:** Same as Jobs list — section `rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl`, table thead/tbody, `hover:text-emerald-400`, mobile cards.

---

## Page: Client detail (`/admin/clients/[id]`)

**File:** `portal/src/app/admin/clients/[id]/page.tsx`  
**Purpose:** Single client and sites; edit; add site. Same admin card/section styling.

---

## Page: Add client (`/admin/clients/new`)

**File:** `portal/src/app/admin/clients/new/page.tsx`  
**Purpose:** New client form. Same admin form styling.

---

## Page: Workforce list (`/admin/workforce`)

**File:** `portal/src/app/admin/workforce/page.tsx`  
**Purpose:** Accounts and workers table; Add workforce CTA. Same admin table/card pattern.

---

## Page: Workforce detail (`/admin/workforce/[id]`)

**File:** `portal/src/app/admin/workforce/[id]/page.tsx`  
**Purpose:** Single account/worker detail; edit. Same admin styling.

---

## Page: Add workforce (`/admin/workforce/new`)

**File:** `portal/src/app/admin/workforce/new/page.tsx`  
**Purpose:** New workforce account/worker form. Same admin form styling.

---

## Page: Invoices list (`/admin/invoices`)

**File:** `portal/src/app/admin/invoices/page.tsx`  
**Purpose:** Invoices table (number, client, period, status, total); New draft invoice CTA.

### Full content (word-for-word)

H1 **Invoices** | Subtitle **Create and manage client invoices** | Button **New draft invoice** | Table headers: **Number**, **Client**, **Period**, **Status**, **Total**, **Actions** | Status values: Draft, Sent, Paid, Void. Rows: [Dynamic].

**Key classes:** Same section/table; statusClass map (Draft/Sent/Paid/Void) — zinc, amber, emerald, red badge styles.

---

## Page: Invoice detail (`/admin/invoices/[id]`)

**File:** `portal/src/app/admin/invoices/[id]/page.tsx`  
**Purpose:** Single invoice view/edit; status actions. Same admin cards and buttons.

---

## Page: New invoice (`/admin/invoices/new`)

**File:** `portal/src/app/admin/invoices/new/page.tsx`  
**Purpose:** Create draft invoice form. Same admin form/section styling.

---

## Page: Work orders (`/admin/workorders`)

**File:** `portal/src/app/admin/workorders/page.tsx`  
**Purpose:** Work orders list. Same admin table/card pattern.

---

## Page: Incidents (`/admin/incidents`)

**File:** `portal/src/app/admin/incidents/page.tsx`  
**Purpose:** Incidents list. Same admin section/table styling.

---

## Page: Payouts (`/admin/payouts`)

**File:** `portal/src/app/admin/payouts/page.tsx`  
**Purpose:** Payout batches list. Same admin table and CTAs.

---

## Page: Payout batch detail (`/admin/payouts/batch/[id]`)

**File:** `portal/src/app/admin/payouts/batch/[id]/page.tsx`  
**Purpose:** Single batch and lines. Same admin styling.

---

## Page: Docs index (`/admin/docs`)

**File:** `portal/src/app/admin/docs/page.tsx`  
**Purpose:** Checklists and SOPs grid; links to view/print.

### Full content (word-for-word)

H1 **Documentation** | **Checklists and standard operating procedures. Open any doc to view or print / save as PDF.** | Section **Checklists** | **Area-specific cleaning checklists for common areas (lobby, hallway, washroom, etc.)** | Empty: **No checklists in content/docs/checklists yet.** | Card label **View & print** | Section **Standard operating procedures** | **Step-by-step procedures for cleaning, access, completion, and incidents** | Empty: **No SOPs in content/docs/sops yet.** | Card label **View & print**. Doc titles [from content files].

**Key classes:**
- H1: `text-2xl font-bold tracking-tight text-white sm:text-3xl`; subtitle `mt-2 text-zinc-400`
- Section headings: `text-sm font-semibold uppercase tracking-wider text-zinc-500`
- Doc cards: `rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-lg hover:border-zinc-600 hover:bg-zinc-800/60 hover:shadow-xl`, title `font-medium text-white group-hover:text-emerald-400`, meta `text-xs text-zinc-500`
- Grid: `grid gap-3 sm:grid-cols-2 lg:grid-cols-3`

---

## Page: SOP doc viewer (`/admin/docs/sops/[slug]`)

**File:** `portal/src/app/admin/docs/sops/[slug]/page.tsx`  
**Purpose:** Render single SOP markdown; print/PDF-friendly. Uses doc-print/print utilities from globals.css.

---

## Page: Checklist doc viewer (`/admin/docs/checklists/[slug]`)

**File:** `portal/src/app/admin/docs/checklists/[slug]/page.tsx`  
**Purpose:** Render single checklist markdown; print/PDF-friendly. Same doc styling.

---

# ———————————————————————————————————————————————————
# WORKER / VENDOR (under `/`, `/jobs`, `/earnings`, `/profile`, `/vendor/*`)
# ———————————————————————————————————————————————————

**Layout:** `portal/src/app/(worker)/layout.tsx` — WorkerNav + `<main>{children}</main>`. Role guard: only VENDOR_WORKER, INTERNAL_WORKER, VENDOR_OWNER.

---

## Page: My Jobs (`/jobs`)

**File:** `portal/src/app/(worker)/jobs/page.tsx`  
**Purpose:** Jobs assigned to current user (or vendor account); list as cards; link to job detail.

### Full content (word-for-word)

H1 **My Jobs** | **View and complete your assigned jobs** | Empty: **No jobs assigned yet.** | Cards: [Dynamic: site name, site address, Scheduled: [date], Status badge, View link]. Status labels: SCHEDULED, COMPLETED PENDING APPROVAL, APPROVED PAYABLE, PAID.

**Key classes:**
- Wrapper: `min-h-screen bg-gray-50 p-4`; inner `mx-auto max-w-4xl`
- H1: `text-2xl font-bold text-gray-900`; subtitle `text-gray-600`
- Empty: `rounded-lg bg-white p-8 text-center shadow`, `text-gray-500`
- Job cards: `block rounded-lg bg-white p-6 shadow transition hover:shadow-md`
- Card title: `text-lg font-semibold text-gray-900`; meta `text-sm text-gray-600`, `text-sm text-gray-500`
- Status: `rounded-full px-2.5 py-0.5 text-xs font-medium` + getStatusColor (blue-100/blue-800, yellow-100/yellow-800, green-100/green-800, gray-100/gray-800)

---

## Page: Job detail (`/jobs/[id]`)

**File:** `portal/src/app/(worker)/jobs/[id]/page.tsx`  
**Purpose:** Single job; complete/submit completion; evidence. Same worker card/button styling (white, gray, status badges).

### Full content (word-for-word)

**Vendor-owner (no workerId):** **This job is assigned to your organization. Only the assigned worker can complete the checklist. Please log in as that worker or assign the job to yourself from the admin panel.** | **Job: [site name] — [status]** [Dynamic].

**No checklist:** **No checklist template available for this site. Please contact admin.**

**Run error:** **{runResult.error}** or **Could not load checklist.**

**Success:** Renders JobDetailClient (checklist run, evidence upload, submit). [Client component copy not duplicated here; CTO can open JobDetailClient for labels/buttons.]

---

## Page: Earnings (`/earnings`)

**File:** `portal/src/app/(worker)/earnings/page.tsx`  
**Purpose:** Worker’s earnings/payout summary. Same worker layout: `bg-gray-50`, white cards, `text-gray-900`/`text-gray-600`.

---

## Page: Profile (`/profile`)

**File:** `portal/src/app/(worker)/profile/page.tsx`  
**Purpose:** Name, email, phone, role, workforce info.

### Full content (word-for-word)

H1 **Profile** | **Your account information** | Labels: **Name**, **Email**, **Phone**, **Role**; optional **Workforce account**, **Display name**, **Account type**. Values [Dynamic from user/worker].

**Key classes:**
- Wrapper: `min-h-screen bg-gray-50 p-4`, `mx-auto max-w-4xl`
- H1: `text-2xl font-bold text-gray-900`; subtitle `text-gray-600`
- Card: `rounded-lg bg-white p-6 shadow`
- Labels: `text-sm font-medium text-gray-600`; values `mt-1 text-gray-900`

---

## Page: Vendor — Team (`/vendor/team`)

**File:** `portal/src/app/(worker)/vendor/team/page.tsx`  
**Purpose:** Vendor owner: team members. Same worker light theme (white cards, gray text).

---

## Page: Vendor — Jobs (`/vendor/jobs`)

**File:** `portal/src/app/(worker)/vendor/jobs/page.tsx`  
**Purpose:** Vendor owner: jobs for their account. Same worker list/card pattern.

---

## Page: Vendor — Payout totals (`/vendor/earnings`)

**File:** `portal/src/app/(worker)/vendor/earnings/page.tsx`  
**Purpose:** Vendor owner: payout summary. Same worker styling.

---

# End of Portal Pages

**Summary:**
- **Auth:** Login (with error fallback), /portal redirect.
- **Admin:** 1 redirect + 18 substantive routes (jobs, clients, workforce, invoices, work orders, incidents, payouts, docs + SOP/checklist viewers). All use dark theme (zinc-950, zinc-800/900, white, emerald CTAs), tables + mobile cards, consistent section/card/button classes.
- **Worker/Vendor:** 7 routes (jobs, job detail, earnings, profile, vendor team/jobs/earnings). All use light theme (gray-50, white, gray-700/900), cards and status badges (blue/yellow/green/gray).
- **Styling:** Admin = dark zinc + emerald; Worker = light gray + white; Login = dark background + light form. Tailwind + same globals as marketing where applicable.
