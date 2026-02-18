# BLVCKSHELL Workforce Operations Portal

**Version:** 1.0.0  
**Date:** February 16, 2026  
**Status:** In Development

---

## Overview

Production-ready workforce operations portal for BLVCKSHELL Facilities Services. Supports vendor subcontractors with multiple employees, internal BLVCKSHELL employees, admin-controlled job assignment, approval, and payout.

**Placement:** The **marketing website** is the front-facing program (what the public sees first). This **portal** is accessible from the marketing site via a “Portal” or “Log in” link (see DECISIONS.md #21).

**Tech Stack:**
- Next.js 14+ App Router (TypeScript)
- Prisma ORM
- Supabase Postgres + Storage
- NextAuth.js (Credentials provider)
- Tailwind CSS
- Vercel deployment

---

## Prerequisites

- Node.js 20 LTS
- npm or yarn
- Supabase account (Postgres + Storage)
- Git

---

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Required variables:**
- `DATABASE_URL` - Supabase pooled connection (for runtime)
- `DIRECT_URL` - Supabase direct connection (for migrations)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- `NEXTAUTH_SECRET` - Random secret for NextAuth (generate with `openssl rand -base64 32`)

### 2. Database Setup

**Important:** Use `DIRECT_URL` for Prisma migrations (bypasses Supabase pooler).

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations (uses DIRECT_URL)
npm run db:migrate

# Seed database
npm run db:seed
```

### 3. Supabase Storage

Create two buckets in Supabase Storage:
- `evidence` - For job completion photos
- `compliance` - For compliance documents (COI, WSIB, etc.)

**Storage Security:** Server-only access using service role. No client direct bucket access.

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

---

## Database Connection Rules

**CRITICAL:** Follow these rules exactly:

- **Runtime:** Use `DATABASE_URL` (pooled connection) for all application queries
- **Migrations:** Use `DIRECT_URL` (direct connection) for Prisma migrations
- **Why:** Supabase pooler doesn't support migrations; direct connection required

**Prisma Schema Configuration:**
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Pooled for runtime
  directUrl = env("DIRECT_URL")        // Direct for migrations
}
```

---

## Project Structure

```
portal/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed script
├── src/
│   ├── app/                   # Next.js App Router routes
│   │   ├── (auth)/           # Auth routes
│   │   ├── (worker)/         # Worker routes
│   │   ├── admin/            # Admin routes
│   │   └── api/              # API routes
│   ├── components/           # React components
│   │   ├── ui/               # Base UI components
│   │   ├── forms/            # Form components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utilities
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── auth.ts           # Auth utilities
│   │   ├── storage.ts        # Supabase Storage client
│   │   └── validations.ts    # Zod schemas
│   ├── server/               # Server-only code
│   │   ├── actions/          # Server actions
│   │   └── guards/           # RBAC guards
│   └── types/                # TypeScript types
├── .env.example              # Environment variables template
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json             # TypeScript configuration
└── next.config.js            # Next.js configuration
```

---

## Key Features

- **Workforce Management:** Vendor and internal workforce accounts with multiple workers
- **Job Assignment:** Admin assigns jobs to workforce accounts or individual workers
- **Completion Submission:** Workers submit completions with checklists and photo evidence
- **Admin Approval:** Admin reviews and approves/rejects completions
- **Payout Management:** Admin creates payout batches and marks jobs paid
- **Audit Trail:** All state transitions logged to AuditLog
- **Compliance:** COI/WSIB document tracking with assignment blocking
- **State Machines:** Enforced state transitions for Job and WorkOrder

---

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:migrate` - Run Prisma migrations
- `npm run db:generate` - Generate Prisma Client
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

### Code Standards

- **TypeScript:** Strict mode enabled; no `any` types
- **Error Handling:** Server actions return `{ success, data?, error? }`
- **Validation:** Zod schemas for all inputs
- **RBAC:** Server-side guards on every route/action
- **Testing:** Unit, integration, and E2E tests required

---

## Documentation

- **DECISIONS.md** - Product and technical decisions
- **SECURITY.md** - Security policies and RBAC
- **DATA_RETENTION.md** - Data retention and purge policies
- **SEED.md** - Seed data instructions

---

## Deployment

### Vercel (production host)

The app is configured for **Vercel**. Important:

- **Root Directory:** In Vercel project settings, set **Root Directory** to **`portal`** (the Next.js app is in this folder).
- **NEXTAUTH_URL:** In production, set this to your live Vercel URL (e.g. `https://your-app.vercel.app`).

Full steps, env vars, and migration notes: see **[VERCEL.md](./VERCEL.md)**.

---

## Support

For questions or issues, see:
- `EXECUTION_PLAN.md` - Execution plan and dependencies
- `ROADMAP.md` - Complete roadmap and task breakdown
- `DECISIONS.md` - Locked decisions

---

**Status:** Phase 2A.1 (Environment and Schema) - In Progress
