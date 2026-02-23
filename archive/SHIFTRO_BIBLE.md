# SHIFTRO BIBLE
## Complete Developer Manual for Shiftro Platform

**Generated:** 2024-12-23  
**Purpose:** Comprehensive developer manual explaining all components, workflows, kernels, and patterns  
**Target:** Future developers working on Shiftro - no prior knowledge assumed  
**Status:** Living document - update as system evolves  
**Dependencies:** All specification documents (read these first for architecture)

---

## TABLE OF CONTENTS

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Architecture Layers](#architecture-layers)
4. [Data Model (48 Tables)](#data-model-48-tables)
5. [Kernels & Engines](#kernels--engines)
6. [Control Plane](#control-plane)
7. [Workflows (113)](#workflows-113)
8. [Frontend Architecture](#frontend-architecture)
9. [Patterns & Conventions](#patterns--conventions)
10. [Common Tasks](#common-tasks)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Glossary](#glossary)

---

## INTRODUCTION

### What is Shiftro?

Shiftro is a **deterministic workforce orchestration platform** designed for Fortune 500 companies. It provides enterprise-grade scheduling, compliance, and audit capabilities for managing workforce operations.

### Core Principles

1. **Determinism**: Every evaluation produces identical results for the same inputs
2. **Explainability**: Every decision cites specific reasons with codes and rule traces
3. **Auditability**: Immutable, append-only audit ledger with cryptographic hashing
4. **Multi-Tenancy**: Complete tenant isolation with Row-Level Security (RLS)
5. **Time-Versioning**: All eligibility data uses EffectiveFrom/EffectiveTo pattern

### Who Should Read This?

- **New developers** joining the project
- **Existing developers** needing reference material
- **Architects** understanding system design
- **QA engineers** understanding test requirements
- **DevOps engineers** understanding deployment

### How to Use This Document

1. **Start here** if you're new to the project
2. **Reference specific sections** as needed
3. **Update this document** when you add new features
4. **Link to this document** in code comments

---

## SYSTEM OVERVIEW

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend Apps (5 apps)                         │
│  - Employee, Supervisor, Scheduler, Owner, SA   │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/WebSocket
                   ↓
┌─────────────────────────────────────────────────┐
│  Control Plane (BFF + Policy Enforcement)       │
│  - Auth, Authorization, Tier Enforcement        │
└──────────────────┬──────────────────────────────┘
                   │ Commands/Queries
                   ↓
┌─────────────────────────────────────────────────┐
│  Domain Kernels & Engines (8)                   │
│  - Identity, Workflow, Eligibility, Scheduling  │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│  Audit & Decision Ledger (Immutable Spine)       │
│  - AuditEvent, DecisionRecord                    │
└──────────────────┬──────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────┐
│  Data Layer (48 tables, RLS, time-versioning)   │
└─────────────────────────────────────────────────┘
```

### Technology Stack

**Backend:**
- Node.js 20+ (TypeScript)
- PostgreSQL 15+ (database)
- Express/Fastify (HTTP server)
- Prisma (ORM, optional)

**Frontend:**
- React 18+ (TypeScript)
- Vite (build tool)
- pnpm (package manager)
- Turborepo (monorepo)

**Testing:**
- Vitest (unit tests)
- Playwright (E2E tests)
- MSW (API mocking)

### Project Structure

```
shiftro-platform/
├── apps/
│   ├── backend/              # Backend application
│   │   ├── control-plane/   # Control Plane
│   │   └── workflows/       # Workflow implementations
│   └── frontend/            # Frontend monorepo (see FRONTEND_MASTER_SPEC.md)
├── packages/
│   ├── kernels/             # Domain kernels
│   │   ├── identity-authority/
│   │   ├── audit-decision/
│   │   ├── test-harness/
│   │   ├── workflow-execution/
│   │   └── scheduling/
│   ├── engines/             # Domain engines
│   │   ├── eligibility-rules/
│   │   ├── request-orchestration/
│   │   └── notification-signal/
│   ├── shared/              # Shared utilities
│   └── contracts/           # API contracts (Zod schemas)
├── database/
│   ├── schema/              # Database schema
│   └── migrations/          # Database migrations
└── docs/                    # Documentation
```

---

## ARCHITECTURE LAYERS

### Layer 1: Frontend Apps

**Purpose:** User-facing applications for different personas

**Apps:**
1. **Employee App** - Mobile-first, self-service portal
2. **Supervisor App** - Operations console for daily management
3. **Scheduler App** - ATC cockpit for schedule creation
4. **Owner App** - Control plane for tenant configuration
5. **Super-Admin App** - Shiftro Tek support console

**Key Rule:** Frontends never talk directly to kernels. All access flows through Control Plane.

**See:** FRONTEND_MASTER_SPEC.md for complete frontend architecture

---

### Layer 2: Control Plane

**Purpose:** Barrier between frontends and kernels. Enforces security, pricing, and workflow boundaries.

**Responsibilities:**
1. **Authentication Normalization** - Session validation, token rotation
2. **Authorization + Scope Resolution** - Resolve user authority
3. **Tier & Entitlement Enforcement** - Check plan, features, limits
4. **Workflow Boundary Enforcement** - Only registered workflows allowed
5. **Read Model Shaping** - Persona/tier-based data projection

**Key Rule:** All requests must go through Control Plane. No direct kernel access.

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Control Plane section

---

### Layer 3: Domain Kernels & Engines

**Purpose:** Core business logic organized into kernels and engines

**Kernels (5):**
1. **Identity & Authority Kernel** - Who can do what
2. **Workflow Execution Kernel** - Orchestrates workflows
3. **Scheduling Kernel** - Schedule/assignment semantics
4. **Audit & Decision Ledger** - Immutable truth
5. **Test Harness Kernel** - Test infrastructure

**Engines (3):**
1. **Eligibility & Rules Engine** - Is this allowed?
2. **Request Orchestration Engine** - Human-driven operations
3. **Notification & Signal Engine** - Event-driven notifications

**Key Rule:** Kernels have explicit interfaces. No shared mutable state.

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Mandatory Kernels & Engines section

---

### Layer 4: Data Layer

**Purpose:** PostgreSQL database with 48 tables, RLS, time-versioning

**Key Features:**
- **Row-Level Security (RLS)** - Tenant isolation at database level
- **Time-Versioning** - EffectiveFrom/EffectiveTo pattern
- **Append-Only Ledger** - AuditEvent, DecisionRecord
- **Referential Integrity** - Foreign keys, constraints

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Canonical Data Model section

---

## DATA MODEL (48 TABLES)

### Bounded Area 1: Tenant & Organizational Structure (8 tables)

#### 1. Tenants
**Purpose:** Customer organization (tenant)

**Key Fields:**
- `TenantId` (UUID, PK) - Unique tenant identifier
- `Name` (string) - Tenant display name
- `LegalEntityName` (string) - Legal entity name
- `TimezoneId` (string) - Default timezone
- `Locale` (string) - Default locale
- `IsActive` (boolean) - Active status

**Usage:**
- Every operation is tenant-scoped
- RLS policies filter by TenantId
- All queries must include TenantId

**Example Query:**
```sql
SELECT * FROM Tenants WHERE TenantId = $1 AND IsActive = true;
```

---

#### 2. TenantSubscriptions
**Purpose:** Links tenants to subscription plans (time-versioned)

**Key Fields:**
- `SubscriptionId` (UUID, PK)
- `TenantId` (UUID, FK)
- `PlanId` (UUID, FK)
- `EffectiveFrom` (timestamp) - Inclusive start
- `EffectiveTo` (timestamp) - Exclusive end (sentinel for current)

**Time-Versioning:**
- Deletion handled via `EffectiveTo = now()`
- No `IsDeleted` flag
- Query: `WHERE EffectiveFrom <= @Time AND @Time < EffectiveTo`

**Example Query:**
```sql
SELECT * FROM TenantSubscriptions 
WHERE TenantId = $1 
  AND EffectiveFrom <= NOW() 
  AND NOW() < EffectiveTo;
```

---

#### 3-8. Plans, EntitlementSets, Facilities, Departments, Lines, OperationalRoles

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Bounded Area 1 for complete table definitions

---

### Bounded Area 2: Identity, RBAC, and Authority (7 tables)

#### 9. Persons
**Purpose:** Immutable global identity for human beings

**Key Fields:**
- `PersonId` (UUID, PK) - **Immutable** (never changes)
- `LegalName` (string)
- `PreferredName` (string, nullable)
- `DateOfBirth` (date, nullable)

**Critical Rule:** PersonId is immutable. Never update PersonId. Create new Person if identity changes.

**Usage:**
- Links to Users (authentication)
- Links to Employees (employment)
- One Person can have multiple Employees (different tenants)

---

#### 10. PersonContacts
**Purpose:** Time-versioned contact information

**Key Fields:**
- `ContactId` (UUID, PK)
- `PersonId` (UUID, FK)
- `ContactType` (enum: Email, Phone, Address)
- `Value` (string)
- `EffectiveFrom` (timestamp)
- `EffectiveTo` (timestamp)

**Time-Versioning:**
- Deletion: `EffectiveTo = now()`
- No `IsDeleted` flag
- Query with time predicate

---

#### 11. Users
**Purpose:** Global system user accounts (NOT tenant-scoped)

**Key Fields:**
- `UserId` (UUID, PK) - **Global, immutable**
- `PersonId` (UUID, FK, nullable) - Links to Person
- `Username` (string, unique)
- `Email` (string, unique)
- `ExternalIdentityProvider` (string) - e.g., "Okta", "Auth0"
- `ExternalSubjectId` (string) - External IdP subject ID
- `IsActive` (boolean)
- `LastLoginAt` (timestamp, nullable)

**Critical Rule:** Users are global. Tenant membership is in UserTenantMemberships table.

**Usage:**
- Authentication (who is logged in)
- Links to Person (identity)
- Links to UserTenantMemberships (tenant access)

---

#### 11a. UserTenantMemberships
**Purpose:** Links global Users to Tenants

**Key Fields:**
- `MembershipId` (UUID, PK)
- `UserId` (UUID, FK) - Global user
- `TenantId` (UUID, FK) - Tenant
- `Status` (enum: Active, Inactive, Suspended)
- `EffectiveFrom` (timestamp)
- `EffectiveTo` (timestamp)
- `CreatedAt` (timestamp)

**Rationale:** Enterprise IdP (Okta/Auth0) requires global user identity + tenant memberships.

**Usage:**
- Check if user has access to tenant
- Resolve tenant context for user
- Time-versioned (handles membership changes)

---

#### 12. UserAuthorities
**Purpose:** Time-versioned authority assignments (RBAC)

**Key Fields:**
- `AuthorityId` (UUID, PK)
- `UserId` (UUID, FK)
- `TenantId` (UUID, FK) - **Required** (authority is tenant-scoped)
- `AuthorityRole` (enum: Employee, Supervisor, ManagerL1, ManagerL2, ManagerL3, TenantAdmin)
- `AuthorityScopeJson` (JSONB) - Scope (facility, department, time window)
- `EffectiveFrom` (timestamp)
- `EffectiveTo` (timestamp)
- `CreatedBy` (UUID, FK)

**Time-Versioning:**
- Deletion: `EffectiveTo = now()`
- No `IsDeleted` flag
- Query with time predicate

**Usage:**
- Resolve user's authority in tenant
- Check capabilities
- Generate authority snapshots

**Example Query:**
```sql
SELECT * FROM UserAuthorities 
WHERE UserId = $1 
  AND TenantId = $2
  AND EffectiveFrom <= $3 
  AND $3 < EffectiveTo;
```

---

#### 13. AuthorityHierarchyEdges
**Purpose:** Organizational authority relationships (time-versioned)

**Key Fields:**
- `EdgeId` (UUID, PK)
- `TenantId` (UUID, FK)
- `SuperiorUserId` (UUID, FK)
- `SubordinateUserId` (UUID, FK)
- `EffectiveFrom` (timestamp)
- `EffectiveTo` (timestamp)
- `ApplicableDaysOfWeek` (JSONB) - e.g., [1,2,3,4,5] for weekdays

**Time-Versioning:**
- Deletion: `EffectiveTo = now()`
- No `IsDeleted` flag

**Usage:**
- Permission inheritance
- Escalation paths
- Authority hierarchy queries

---

#### 14. Sessions
**Purpose:** User session tracking

**Key Fields:**
- `SessionId` (UUID, PK)
- `UserId` (UUID, FK)
- `TokenHash` (string) - Hashed session token
- `CreatedAt` (timestamp)
- `ExpiresAt` (timestamp)
- `LastActivityAt` (timestamp)

**Usage:**
- Session validation
- Token rotation
- Session management

---

### Bounded Area 3: Person, Employee, Employment (4 tables)

#### 15. Employees
**Purpose:** Tenant-scoped employment relationship

**Key Fields:**
- `EmployeeId` (UUID, PK)
- `TenantId` (UUID, FK)
- `PersonId` (UUID, FK) - Links to Person
- `EmployeeNumber` (string, unique per tenant)
- `EmploymentType` (enum: FullTime, PartTime, Contract, Temporary)
- `Status` (enum: Active, OnLeave, Terminated)
- `DefaultFacilityId` (UUID, FK, nullable)
- `IsDeleted` (boolean) - **Tombstone flag** (not time-versioning)

**Critical Rule:** `IsDeleted` is a tombstone flag for GDPR/data retention redaction. Employees are NOT time-versioned (they are the entity itself).

**Usage:**
- All employee-related workflows
- Assignment workflows
- Eligibility evaluation

---

#### 16. EmploymentPeriods
**Purpose:** Time-bounded employment periods (handles rehires)

**Key Fields:**
- `PeriodId` (UUID, PK)
- `TenantId` (UUID, FK)
- `EmployeeId` (UUID, FK)
- `HireDate` (date)
- `TerminationDate` (date, nullable)
- `IsRehire` (boolean)

**Usage:**
- Employee lifecycle
- Eligibility evaluation (check if employed)
- Rehire handling (new period, not update)

---

#### 17. EmployeeDepartmentAssignments
**Purpose:** Employee assignments to departments (time-versioned)

**Key Fields:**
- `AssignmentId` (UUID, PK)
- `TenantId` (UUID, FK)
- `EmployeeId` (UUID, FK)
- `DepartmentId` (UUID, FK)
- `EffectiveFrom` (timestamp)
- `EffectiveTo` (timestamp)

**Time-Versioning:**
- Deletion: `EffectiveTo = now()`
- No `IsDeleted` flag

**Usage:**
- Organizational structure
- Employee management workflows
- Department-based queries

---

#### 18. EmployeeProfileSections
**Purpose:** Flexible employee profile data (key-value pairs)

**Key Fields:**
- `SectionId` (UUID, PK)
- `TenantId` (UUID, FK)
- `EmployeeId` (UUID, FK)
- `SectionKey` (string) - e.g., "EmergencyContact", "Preferences"
- `SectionValue` (JSONB) - Flexible JSON data

**Usage:**
- Employee profile management
- Custom fields
- Flexible data storage

---

### Bounded Area 4: Qualifications, Credentials, Unions, Contracts (12 tables)

#### 19. EmployeeRoles
**Purpose:** Employee role assignments (time-versioned)

**Key Fields:**
- `EmployeeRoleId` (UUID, PK)
- `TenantId` (UUID, FK)
- `EmployeeId` (UUID, FK)
- `RoleId` (UUID, FK) - Links to OperationalRoles
- `FacilityId` (UUID, FK, nullable) - Role scoped to facility
- `DepartmentId` (UUID, FK, nullable) - Role scoped to department
- `EffectiveFrom` (timestamp)
- `EffectiveTo` (timestamp)

**Time-Versioning:**
- Deletion: `EffectiveTo = now()`
- No `IsDeleted` flag
- **DB-level exclusion constraint** prevents overlaps

**Usage:**
- Eligibility evaluation (check if employee has required role)
- Role assignment workflows
- Time-versioned queries

**Example Query:**
```sql
SELECT * FROM EmployeeRoles 
WHERE EmployeeId = $1 
  AND RoleId = $2
  AND EffectiveFrom <= $3 
  AND $3 < EffectiveTo;
```

---

#### 20. EmployeeCredentials
**Purpose:** Employee credential/certification assignments (time-versioned)

**Key Fields:**
- `CredentialId` (UUID, PK)
- `TenantId` (UUID, FK)
- `EmployeeId` (UUID, FK)
- `CredentialTypeId` (UUID, FK)
- `FacilityId` (UUID, FK, nullable)
- `IssuedAt` (timestamp)
- `ExpiresAt` (timestamp, nullable)
- `EffectiveFrom` (timestamp)
- `EffectiveTo` (timestamp)

**Time-Versioning:**
- Deletion: `EffectiveTo = now()`
- No `IsDeleted` flag

**Usage:**
- Eligibility evaluation (check if employee has required credential)
- Certification management workflows
- Expiration checking

---

#### 21-28. CredentialTypes, EmployeeUnionMemberships, Unions, EmployeeContractAssignments, Contracts, RuleSets, Rules, AvailabilityRules, EmployeeRestrictions

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Bounded Area 4 for complete table definitions

---

### Bounded Area 5: Scheduling Demand & Definitions (5 tables)

#### 31. ShiftTemplates
**Purpose:** Reusable shift templates

**Key Fields:**
- `TemplateId` (UUID, PK)
- `TenantId` (UUID, FK)
- `Name` (string)
- `FacilityId` (UUID, FK)
- `DepartmentId` (UUID, FK)
- `RoleId` (UUID, FK)
- `StartTime` (time) - e.g., "08:00"
- `Duration` (integer) - minutes
- `DaysOfWeek` (JSONB) - [1,2,3,4,5] for weekdays
- `IsActive` (boolean)

**Usage:**
- Shift creation workflows
- Schedule generation
- Recurring shift patterns

---

#### 32-35. ShiftRotations, ShiftRotationSteps, EmployeeShiftRotationAssignments, CoverageRequirements

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Bounded Area 5 for complete table definitions

---

### Bounded Area 6: Schedules, Shifts, Assignments (6 tables)

#### 36. Schedules
**Purpose:** Schedule identity (facility/department + date window) - NOT versioned

**Key Fields:**
- `ScheduleId` (UUID, PK)
- `TenantId` (UUID, FK)
- `FacilityId` (UUID, FK)
- `DepartmentId` (UUID, FK)
- `StartDate` (date)
- `EndDate` (date)
- `IsActive` (boolean)

**Usage:**
- Schedule versioning
- Schedule comparison
- Schedule queries

**Note:** Schedules are NOT versioned. ScheduleVersions are versioned snapshots.

---

#### 36a. ScheduleVersions
**Purpose:** Versioned schedule snapshots

**Key Fields:**
- `ScheduleVersionId` (UUID, PK)
- `ScheduleId` (UUID, FK) - Links to Schedule
- `VersionNumber` (integer) - Sequential version number
- `Status` (enum: Draft, Published, Locked)
- `CreatedAt` (timestamp)
- `PublishedAt` (timestamp, nullable)
- `LockedAt` (timestamp, nullable)
- `CreatedBy` (UUID, FK)

**Usage:**
- Schedule versioning
- Schedule rollback
- Schedule comparison

**Note:** Shifts/Assignments are linked to ScheduleVersions via link tables (ScheduleVersionShifts, ScheduleVersionAssignments).

---

#### 36b. ScheduleVersionShifts
**Purpose:** Links Shifts to ScheduleVersions (AUTHORITATIVE)

**Key Fields:**
- `LinkId` (UUID, PK)
- `ScheduleVersionId` (UUID, FK)
- `ShiftId` (UUID, FK)
- `CreatedAt` (timestamp)

**Critical Rule:** This table is **authoritative** for version membership. Do NOT add ScheduleVersionId to Shifts table.

**Usage:**
- Reconstruct schedule version contents
- Schedule rollback
- Schedule comparison

---

#### 36c. ScheduleVersionAssignments
**Purpose:** Links Assignments to ScheduleVersions (AUTHORITATIVE)

**Key Fields:**
- `LinkId` (UUID, PK)
- `ScheduleVersionId` (UUID, FK)
- `AssignmentId` (UUID, FK)
- `CreatedAt` (timestamp)

**Critical Rule:** This table is **authoritative** for version membership. Do NOT add ScheduleVersionId to Assignments table.

**Usage:**
- Reconstruct schedule version contents
- Schedule rollback
- Schedule comparison

---

#### 37. Shifts
**Purpose:** Work demand (individual shifts) - immutable once locked

**Key Fields:**
- `ShiftId` (UUID, PK)
- `TenantId` (UUID, FK)
- `FacilityId` (UUID, FK)
- `DepartmentId` (UUID, FK)
- `RoleId` (UUID, FK)
- `StartTime` (timestamp)
- `EndTime` (timestamp)
- `ShiftTemplateId` (UUID, FK, nullable)
- `ShiftRotationId` (UUID, FK, nullable)
- `IsLocked` (boolean)
- `CreatedAt` (timestamp)

**Usage:**
- All scheduling workflows
- Assignment workflows
- Coverage gap detection

**Note:** Shifts are linked to ScheduleVersions via ScheduleVersionShifts table.

---

#### 38. Assignments
**Purpose:** Employee-to-shift assignments with state machine

**Key Fields:**
- `AssignmentId` (UUID, PK)
- `TenantId` (UUID, FK)
- `EmployeeId` (UUID, FK)
- `ShiftId` (UUID, FK)
- `State` (enum: Draft, Proposed, Validated, Published, Locked)
- `Source` (enum: Manual, Auto, Bid, Swap, CallOut, Rotation)
- `CorrelationId` (UUID, nullable) - Links to request/workflow
- `ProposedAt` (timestamp, nullable)
- `ValidatedAt` (timestamp, nullable)
- `PublishedAt` (timestamp, nullable)
- `LockedAt` (timestamp, nullable)
- `OverrideJustification` (string, nullable)
- `OverrideReason` (string, nullable)
- `OverrideBy` (UUID, FK, nullable)
- `LockedBy` (UUID, FK, nullable)
- `LockReason` (string, nullable)
- `LockDecisionRecordId` (UUID, FK, nullable)
- `EffectiveFrom` (timestamp, nullable) - For historical correction
- `EffectiveTo` (timestamp, nullable) - For historical correction
- `CreatedAt` (timestamp)
- `UpdatedAt` (timestamp)

**State Machine:**
- Draft → Proposed (requires eligibility evaluation)
- Proposed → Validated (requires re-evaluation)
- Validated → Published (requires supervisor authority)
- Proposed → Overridden (requires ManagerL2+ authority)
- Overridden → Published (requires supervisor authority)
- Any → Locked (requires authority + decision record)

**Usage:**
- Assignment lifecycle workflows
- Coverage workflows
- Employee self-service

**Note:** Assignments are linked to ScheduleVersions via ScheduleVersionAssignments table.

---

### Bounded Area 7: Operational Requests (1 table)

#### 39. OperationalRequests
**Purpose:** Generic request framework (all request types)

**Key Fields:**
- `RequestId` (UUID, PK)
- `TenantId` (UUID, FK)
- `RequestType` (enum: ShiftSwap, TimeOff, AvailabilityChange, Bid, CallOut, LeaveOfAbsence)
- `RequestStatus` (enum: Pending, Approved, Rejected, Cancelled, Expired)
- `RequesterType` (enum: Employee, User, System)
- `RequesterEmployeeId` (UUID, FK, nullable) - One of requester fields must be non-null
- `RequesterUserId` (UUID, FK, nullable)
- `TargetType` (enum: Shift, Assignment, Employee, ScheduleVersion, None)
- `TargetShiftId` (UUID, FK, nullable) - Typed target columns
- `TargetAssignmentId` (UUID, FK, nullable)
- `TargetEmployeeId` (UUID, FK, nullable)
- `TargetScheduleVersionId` (UUID, FK, nullable)
- `RequestPayload` (JSONB) - Type-specific request data
- `DecisionPayload` (JSONB) - Type-specific decision data
- `DecidedBy` (UUID, FK, nullable) - UserId of decision maker
- `DecidedAt` (timestamp, nullable)
- `EffectiveFrom` (timestamp)
- `EffectiveTo` (timestamp)
- `CreatedAt` (timestamp)
- `UpdatedAt` (timestamp)

**Usage:**
- All request/approval workflows
- Shift swaps, time-off, availability, bidding, call-outs

**Critical Rule:** All request workflows use this single table. No workflow-specific request tables.

---

### Bounded Area 8: Audit, Events, Decisions, Evidence (2 tables)

#### 40. AuditEvents
**Purpose:** Append-only audit event log (immutable)

**Key Fields:**
- `AuditEventId` (UUID, PK)
- `TenantId` (UUID, FK, indexed)
- `EventType` (string, indexed) - e.g., "AssignmentProposed"
- `OccurredAt` (timestamp, indexed)
- `ActorType` (enum: User, System, Scheduler)
- `ActorId` (UUID, indexed)
- `CorrelationId` (UUID, indexed) - Request tracing
- `CausationId` (UUID, nullable, indexed) - Event sourcing
- `SourceDomain` (string) - e.g., "Scheduling", "Employment"
- `Payload` (JSONB) - Immutable snapshot of event data
- `PayloadHash` (string) - SHA-256 hash for integrity
- `AuthoritySnapshotJson` (JSONB, nullable) - For critical operations

**Critical Rules:**
- **Append-only** (no updates/deletes)
- **Immutable** (cannot be modified)
- Every mutation must emit an event
- Hashes enable integrity verification

**Usage:**
- Audit trail
- Event sourcing (if needed)
- Compliance exports
- Incident reconstruction

**Example Query:**
```sql
SELECT * FROM AuditEvents 
WHERE TenantId = $1 
  AND EventType = $2
  AND OccurredAt >= $3 
  AND OccurredAt < $4
ORDER BY OccurredAt DESC;
```

---

#### 41. DecisionRecords
**Purpose:** Eligibility and rule evaluation decisions (immutable)

**Key Fields:**
- `DecisionId` (UUID, PK)
- `TenantId` (UUID, FK, indexed)
- `DecisionType` (enum: Eligibility, Override, Lock)
- `DecisionOutcome` (JSONB) - BLOCK/WARN/ALLOWED with reasons
- `RuleTraceJson` (JSONB) - Complete rule evaluation history
- `InputSnapshotHash` (string) - SHA-256 hash of inputs (for replay)
- `OccurredAt` (timestamp, indexed)
- `AuditEventId` (UUID, FK, indexed) - Links to AuditEvent

**Critical Rules:**
- **Append-only** (no updates/deletes)
- **Immutable** (cannot be modified)
- Every eligibility evaluation creates a DecisionRecord
- InputSnapshotHash enables deterministic replay

**Usage:**
- Decision explainability
- Decision replay (deterministic)
- Audit trail
- Compliance exports

**Example Query:**
```sql
SELECT * FROM DecisionRecords 
WHERE TenantId = $1 
  AND DecisionType = 'Eligibility'
  AND OccurredAt >= $2 
  AND OccurredAt < $3
ORDER BY OccurredAt DESC;
```

---

### Bounded Area 9: System Operations & Controls (4 tables)

#### 42-45. FeatureFlags, WorkflowActivations, ImportJobs, ImportRows

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Bounded Area 9 for complete table definitions

---

## KERNELS & ENGINES

### Identity & Authority Kernel

**Purpose:** Resolve *who* can do *what*, *where*, and *when* — deterministically.

**Location:** `packages/kernels/identity-authority/`

**Status:** ✅ **IMPLEMENTED** (Phase 0.2 Complete)

**Implementation:** `IdentityAuthorityKernelImpl` class

**Interface:**
```typescript
interface IdentityAuthorityKernel {
  resolveAuthority(input: ResolveAuthorityInput): Promise<AuthorityContext>;
  generateAuthoritySnapshot(userId: string, tenantId: string, atTime: DateTimeOffset): Promise<AuthoritySnapshot>;
  hasCapability(userId: string, tenantId: string, capability: Capability, scope?: Partial<Scope>): Promise<boolean>;
  resolveScope(userId: string, tenantId: string, requestedScope: Partial<Scope>): Promise<Scope>;
}
```

**How It Works:**
1. **resolveAuthority()** - Queries UserTenantMemberships and UserAuthorities (time-versioned)
   - Verifies user and tenant exist
   - Checks active UserTenantMembership at specified time
   - Loads all active UserAuthorities at specified time
   - Resolves personas from authority roles (Employee, Supervisor, Scheduler, Owner, SuperAdmin)
   - Resolves capabilities from authority roles (assignments:propose, schedules:publish, etc.)
   - Merges scope from all authorities
   - Generates immutable authority snapshot
2. **generateAuthoritySnapshot()** - Creates immutable snapshot with SHA-256 hash
   - Loads current authority at specified time
   - Creates snapshot payload with all authority data
   - Generates SHA-256 hash for integrity verification
   - Returns immutable snapshot
3. **hasCapability()** - Checks if user has required capability
   - Resolves user authority
   - Checks if capability exists in capabilities list
   - Validates scope if provided
   - Returns boolean
4. **resolveScope()** - Validates and resolves scope (tenant/facility/department)
   - Resolves user authority
   - Merges requested scope with authority scope
   - Validates resolved scope is within authority
   - Returns resolved scope

**Usage Example:**
```typescript
import { IdentityAuthorityKernelImpl } from '@shiftro/kernels/identity-authority';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const kernel = new IdentityAuthorityKernelImpl(prisma);

// Resolve authority
const authority = await kernel.resolveAuthority({
  UserId: 'user-123',
  TenantId: 'tenant-456',
  AtTime: new Date().toISOString(),
});

console.log(authority.Personas); // ['Scheduler']
console.log(authority.Capabilities); // ['schedules:publish', 'assignments:override', ...]
console.log(authority.Scope); // { TenantId: '...', FacilityId: '...', ... }

// Check capability
const canPublish = await kernel.hasCapability(
  'user-123',
  'tenant-456',
  'schedules:publish'
);
// Returns: true

// Check capability with scope validation
const canPublishAtFacility = await kernel.hasCapability(
  'user-123',
  'tenant-456',
  'schedules:publish',
  { FacilityId: 'facility-1' }
);
// Returns: true if user has access to facility-1, false otherwise

// Generate snapshot (for audit)
const snapshot = await kernel.generateAuthoritySnapshot(
  'user-123',
  'tenant-456',
  new Date().toISOString()
);
console.log(snapshot.SnapshotHash); // SHA-256 hash for integrity verification

// Resolve scope
const scope = await kernel.resolveScope('user-123', 'tenant-456', {
  FacilityId: 'facility-1',
  DepartmentId: 'dept-2',
});
// Returns merged scope validated against user's authority
```

**Time-Versioning:**
The kernel fully supports time-versioned authority queries:
- Queries use `EffectiveFrom <= AtTime AND EffectiveTo >= AtTime` predicates
- Allows historical authority reconstruction
- Enables audit replay at specific points in time

**Persona Mapping:**
Authority roles map to personas:
- `Employee` → Employee persona
- `Supervisor` → Supervisor persona
- `ManagerL1/L2/L3` → Scheduler persona
- `TenantAdmin` → Owner persona
- `PlatformSuperAdmin` → SuperAdmin persona

**Capability Mapping:**
Authority roles map to capabilities:
- `Supervisor` → assignments:propose, requests:approve
- `ManagerL1` → assignments:propose, assignments:override, requests:approve
- `ManagerL2` → + schedules:publish
- `ManagerL3` → + schedules:rollback
- `TenantAdmin` → + employees:onboard
- `PlatformSuperAdmin` → All capabilities

**Testing:**
- ✅ **Unit Tests (Tier A):** 17/17 passing
  - Tests all methods with mocked Prisma client
  - Tests error cases, time-versioning, scope validation
  - Fast execution (< 10ms per test)
- ⏳ **Integration Tests (Tier B):** Created, skipped until Test Harness Kernel available
  - Tests with real database
  - Tests time-versioned queries
  - Tests scope validation

**Dependencies:** 
- `@prisma/client` - Database access
- `@shiftro/shared/types` - Shared types (UUID, DateTimeOffset, AppPersona, Capability, Scope)
- `@shiftro/shared/utils` - Shared utilities (generateUUID, sha256)

**Files:**
- `src/interfaces/IdentityAuthorityKernel.ts` - Interface definition
- `src/IdentityAuthorityKernelImpl.ts` - Implementation
- `src/index.ts` - Package exports
- `src/__tests__/IdentityAuthorityKernelImpl.test.ts` - Unit tests
- `src/__tests__/IdentityAuthorityKernelImpl.integration.test.ts` - Integration tests
- `README.md` - Package documentation

**See:** 
- `SYSTEM_ARCHITECTURE_SPEC.md` - Complete kernel specification
- `packages/kernels/identity-authority/README.md` - Package documentation

---

### Time Integrity Kernel

**Purpose:** Enforce time-versioning overlap constraints **as if they were database constraints**. This kernel is **mandatory, centralized, and unskippable**.

**Location:** `packages/kernels/time-integrity/`

**Status:** ✅ **IMPLEMENTED** (Phase 0.1.1 Complete)

**Implementation:** `TimeIntegrityKernelImpl` class

**Interface:**
```typescript
interface TimeIntegrityKernel {
  checkOverlap(tableName: string, record: TimeVersionedRecord, excludeRecordId?: UUID): Promise<void>;
  validateTable(tableName: string, tenantId?: UUID): Promise<OverlapViolation[]>;
  hasOverlap(tableName: string, entityId: UUID, effectiveFrom: DateTimeOffset, effectiveTo: DateTimeOffset, excludeRecordId?: UUID): Promise<boolean>;
}
```

**TimeSafePrismaClient Enforcement** 🔴 **CONSTITUTIONAL - GATE**

All workflow handlers **MUST** use `TimeSafePrismaClient` instead of raw `PrismaClient`. This ensures time integrity checks cannot be bypassed.

**Enforcement:**
- `TimeSafePrismaClient` type wraps `PrismaClient` with time integrity extension
- `createTimeSafePrismaClient()` factory creates time-safe client
- Type system prevents raw `PrismaClient` from being passed to workflow handlers
- Bootstrap function enforces time-safe client creation
- All database operations on time-versioned tables automatically check for overlaps

**Usage Example:**
```typescript
import { createTimeSafePrismaClient } from '@shiftro/kernels/time-integrity';
import { TimeIntegrityKernelImpl } from '@shiftro/kernels/time-integrity';
import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();
const timeIntegrityKernel = new TimeIntegrityKernelImpl(basePrisma);

// Create time-safe client (required for workflow handlers)
const timeSafePrisma = createTimeSafePrismaClient(basePrisma, timeIntegrityKernel);

// Workflow handler constructor (CONSTITUTIONAL REQUIREMENT)
export class MyWorkflowHandler implements WorkflowHandler {
  constructor(
    private readonly prisma: TimeSafePrismaClient, // ✅ Time-safe (required)
    // NOT: private readonly prisma: PrismaClient // ❌ FORBIDDEN
  ) {}
}
```

**Tables Protected:**
- EmployeeRoles, EmployeeCredentials, EmployeeUnionMemberships
- EmployeeContractAssignments, AvailabilityRules
- UserAuthorities, AuthorityHierarchyEdges
- ShiftRotations, CoverageRequirements, EmploymentPeriods
- ScheduleVersions, ScheduleVersionShifts, ScheduleVersionAssignments
- OperationalRequests, RuleSets, Contracts

**See:** `TIME_SAFE_PRISMA_ENFORCEMENT.md` for complete specification

---

### Workflow Execution Kernel

**Purpose:** Execute workflows without workflows owning schema or logic.

**Location:** `packages/kernels/workflow-execution/`

**Key Features:**
- **Workflow Declaration DSL:** All workflows must declare Type, MutatesTables, RequiresTimeIntegrity, StatePersistence
- **Workflow Registry:** Validates workflow declarations before registration
- **State Persistence:** WorkflowStateStore interface for orchestrated workflow state
- **Scenario Testing:** Tier C scenario test framework for end-to-end workflow testing

**Recent Updates (2024-12-23):**
- ✅ WorkflowDeclaration interface updated with constitutional requirements
- ✅ WorkflowRegistry validation implemented (time integrity, state persistence)
- ✅ WorkflowStateStore interface created (InMemoryWorkflowStateStore implemented)
- ✅ Scenario test framework implemented (5 scenario templates created)

**Interface:**
```typescript
interface WorkflowExecutionKernel {
  registerWorkflow(definition: WorkflowDefinition): void;
  executeWorkflow(command: WorkflowCommand): Promise<WorkflowExecutionResult>;
  getWorkflowState(workflowId: string, correlationId: string): Promise<WorkflowState>;
}
```

**How It Works:**
1. **registerWorkflow()** - Registers workflow definition in registry
2. **executeWorkflow()** - Executes workflow:
   - Loads workflow definition
   - Validates command
   - Resolves authority (via Identity Kernel)
   - Executes state machine transitions
   - Calls required engines (Eligibility, Scheduling, etc.)
   - Emits AuditEvents (via Audit Ledger)
   - Creates DecisionRecords (if applicable)
   - Attaches CorrelationId/CausationId
3. **getWorkflowState()** - Queries workflow state

**Usage Example:**
```typescript
const kernel = new WorkflowExecutionKernel();

// Register workflow
kernel.registerWorkflow({
  WorkflowId: 'assignment-lifecycle',
  WorkflowName: 'Assignment Lifecycle',
  Aggregates: ['Assignment', 'Shift', 'Employee'],
  StateMachine: { /* ... */ },
  AuthorityRequirements: { /* ... */ },
  DecisionChecks: ['EligibilityEvaluation'],
  EventTypes: ['AssignmentProposed', 'AssignmentValidated'],
  Engines: ['EligibilityRulesEngine', 'SchedulingKernel'],
});

// Execute workflow
const result = await kernel.executeWorkflow({
  WorkflowId: 'assignment-lifecycle',
  CommandType: 'ProposeAssignment',
  Payload: { ShiftId: 'shift-123', EmployeeId: 'emp-456' },
  AuthorityContext: authority,
  CorrelationId: 'corr-789',
});
```

**Dependencies:**
- Identity & Authority Kernel (for authority context)
- Audit & Decision Ledger (for event/decision emission)
- Eligibility & Rules Engine (for eligibility checks)
- Scheduling Kernel (for schedule operations)

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Workflow Execution Kernel section

---

### Eligibility & Rules Engine

**Purpose:** Answer *"Is this allowed?"* with explainability.

**Location:** `packages/engines/eligibility-rules/`

**Interface:**
```typescript
interface EligibilityRulesEngine {
  evaluateEligibility(input: EligibilityEvaluationInput): Promise<EligibilityEvaluationResult>;
  evaluateRules(input: RuleEvaluationInput): Promise<RuleEvaluationResult>;
  replayDecision(decisionId: string): Promise<EligibilityEvaluationResult>;
}
```

**How It Works:**
1. **evaluateEligibility()** - Evaluates employee eligibility for shift:
   - Queries EmployeeRoles (time-versioned)
   - Queries EmployeeCredentials (time-versioned)
   - Queries EmployeeUnionMemberships (time-versioned)
   - Queries EmployeeContractAssignments (time-versioned)
   - Queries AvailabilityRules (time-versioned)
   - Queries EmployeeRestrictions (time-versioned)
   - Queries WorkHistorySnapshots (fatigue rules)
   - Evaluates contract rules
   - Aggregates results (ALLOWED/WARN/BLOCKED)
   - Generates rule trace
   - Hashes inputs (for replay)
2. **evaluateRules()** - Evaluates rule set
3. **replayDecision()** - Replays decision deterministically

**Usage Example:**
```typescript
const engine = new EligibilityRulesEngine();

// Evaluate eligibility
const result = await engine.evaluateEligibility({
  TenantId: 'tenant-123',
  EmployeeId: 'emp-456',
  ShiftId: 'shift-789',
  EvaluationTime: new Date(),
  IncludeTrace: true,
});

// Result: { Outcome: 'BLOCKED', Reasons: [...], RuleTrace: {...}, InputSnapshotHash: '...' }

// Replay decision
const replayed = await engine.replayDecision('decision-123');
// Must match original result (deterministic)
```

**Dependencies:** None (reads from data layer)

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Eligibility & Rules Engine section

---

### Scheduling Kernel

**Purpose:** Own the semantics of schedules, versions, shifts, and assignments.

**Location:** `packages/kernels/scheduling/`

**Interface:**
```typescript
interface SchedulingKernel {
  createScheduleVersion(input: CreateScheduleVersionInput): Promise<ScheduleVersion>;
  compareScheduleVersions(versionAId: string, versionBId: string): Promise<ScheduleVersionDiff>;
  proposeAssignment(input: ProposeAssignmentInput): Promise<AssignmentProposalResult>;
  validateAssignment(assignmentId: string): Promise<AssignmentValidationResult>;
  publishScheduleVersion(scheduleVersionId: string, authorityContext: AuthorityContext): Promise<PublishScheduleResult>;
  detectCoverageGaps(input: CoverageGapDetectionInput): Promise<CoverageGap[]>;
}
```

**How It Works:**
1. **createScheduleVersion()** - Creates schedule version (snapshot)
2. **compareScheduleVersions()** - Computes diff between versions
3. **proposeAssignment()** - Proposes assignment:
   - Calls Eligibility Engine (evaluate eligibility)
   - Creates Assignment (Draft state)
   - Transitions to Proposed state
   - Emits AuditEvent
   - Creates DecisionRecord
4. **validateAssignment()** - Validates assignment (re-evaluates eligibility)
5. **publishScheduleVersion()** - Publishes schedule version
6. **detectCoverageGaps()** - Detects coverage gaps

**Usage Example:**
```typescript
const kernel = new SchedulingKernel();

// Propose assignment
const result = await kernel.proposeAssignment({
  TenantId: 'tenant-123',
  ShiftId: 'shift-456',
  EmployeeId: 'emp-789',
  ProposedBy: 'user-123',
  AuthorityContext: authority,
  CorrelationId: 'corr-abc',
});

// Result includes: Assignment, EligibilityResult, CreatedEvents, CreatedDecision
```

**Dependencies:**
- Eligibility & Rules Engine (for eligibility checks)
- Audit & Decision Ledger (for event emission)

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Scheduling Kernel section

---

### Audit & Decision Ledger

**Purpose:** Provide forensic truth — immutable append-only ledger.

**Location:** `packages/kernels/audit-decision/`

**Interface:**
```typescript
interface AuditDecisionLedger {
  appendAuditEvent(event: AuditEvent): Promise<void>;
  appendDecisionRecord(decision: DecisionRecord): Promise<void>;
  queryAuditEvents(filters: AuditEventFilters): Promise<AuditEvent[]>;
  queryDecisionRecords(filters: DecisionRecordFilters): Promise<DecisionRecord[]>;
  assembleEvidencePackage(input: EvidencePackageInput): Promise<EvidencePackage>;
  replayDecision(decisionId: string): Promise<DecisionReplayResult>;
}
```

**How It Works:**
1. **appendAuditEvent()** - Appends event (append-only, immutable)
2. **appendDecisionRecord()** - Appends decision (append-only, immutable)
3. **queryAuditEvents()** - Queries events (with filters)
4. **queryDecisionRecords()** - Queries decisions (with filters)
5. **assembleEvidencePackage()** - Assembles evidence package for compliance
6. **replayDecision()** - Replays decision deterministically

**Usage Example:**
```typescript
const ledger = new AuditDecisionLedger();

// Append event
await ledger.appendAuditEvent({
  AuditEventId: uuid(),
  TenantId: 'tenant-123',
  EventType: 'AssignmentProposed',
  OccurredAt: new Date(),
  ActorType: 'User',
  ActorId: 'user-456',
  CorrelationId: 'corr-789',
  SourceDomain: 'Scheduling',
  Payload: { AssignmentId: 'assign-123' },
  PayloadHash: hash(payload),
});

// Query events
const events = await ledger.queryAuditEvents({
  TenantId: 'tenant-123',
  EventType: 'AssignmentProposed',
  StartDate: new Date('2024-01-01'),
  EndDate: new Date('2024-12-31'),
});
```

**Dependencies:** None (immutable spine)

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Audit & Decision Ledger section

---

### Request Orchestration Engine

**Purpose:** Handle human-driven operations without workflow-specific tables.

**Location:** `packages/engines/request-orchestration/`

**Interface:**
```typescript
interface RequestOrchestrationEngine {
  submitRequest(input: SubmitRequestInput): Promise<OperationalRequest>;
  approveRequest(requestId: string, input: ApproveRequestInput): Promise<OperationalRequest>;
  rejectRequest(requestId: string, input: RejectRequestInput): Promise<OperationalRequest>;
  cancelRequest(requestId: string, requesterId: string): Promise<OperationalRequest>;
  getPendingRequests(approverId: string, filters?: RequestFilters): Promise<OperationalRequest[]>;
}
```

**How It Works:**
1. **submitRequest()** - Creates OperationalRequest (Pending status)
2. **approveRequest()** - Updates status to Approved, executes workflow
3. **rejectRequest()** - Updates status to Rejected
4. **cancelRequest()** - Updates status to Cancelled (by requester)
5. **getPendingRequests()** - Queries pending requests for approver

**Usage Example:**
```typescript
const engine = new RequestOrchestrationEngine();

// Submit request
const request = await engine.submitRequest({
  TenantId: 'tenant-123',
  RequestType: 'TimeOff',
  RequesterType: 'Employee',
  RequesterEmployeeId: 'emp-456',
  TargetType: 'None',
  RequestPayload: { StartDate: '2024-01-01', EndDate: '2024-01-05' },
  AuthorityContext: authority,
  CorrelationId: 'corr-789',
});

// Approve request
const approved = await engine.approveRequest('request-123', {
  ApproverId: 'user-456',
  DecisionReason: 'Approved per policy',
  AuthorityContext: authority,
});
```

**Dependencies:**
- Workflow Execution Kernel (for request workflows)
- Notification & Signal Engine (for notifications)

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Request Orchestration Engine section

---

### Notification & Signal Engine

**Purpose:** Deliver truth, not spam.

**Location:** `packages/engines/notification-signal/`

**Interface:**
```typescript
interface NotificationSignalEngine {
  subscribeToEvent(eventType: string, handler: NotificationHandler): void;
  sendNotification(input: SendNotificationInput): Promise<NotificationDeliveryResult>;
  getUserNotifications(userId: string, filters?: NotificationFilters): Promise<Notification[]>;
}
```

**How It Works:**
1. **subscribeToEvent()** - Subscribes to AuditEvents (event-driven)
2. **sendNotification()** - Sends notification (email/push/in-app)
3. **getUserNotifications()** - Queries user notifications

**Usage Example:**
```typescript
const engine = new NotificationSignalEngine();

// Subscribe to event
engine.subscribeToEvent('AssignmentProposed', async (event) => {
  await engine.sendNotification({
    TenantId: event.TenantId,
    UserId: event.ActorId,
    NotificationType: 'ScheduleUpdate',
    Channels: ['email', 'in-app'],
    Title: 'Assignment Proposed',
    Body: 'Your assignment has been proposed',
    CorrelationId: event.CorrelationId,
    Priority: 'normal',
  });
});
```

**Dependencies:** None (subscribes to AuditEvents)

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Notification & Signal Engine section

---

### Test Harness Kernel

**Purpose:** Guarantee you never restart again.

**Location:** `packages/kernels/test-harness/`

**Interface:**
```typescript
interface TestHarnessKernel {
  createTestTenant(overrides?: Partial<Tenant>): Promise<Tenant>;
  createTestUser(persona: AppPersona, tenantId: string): Promise<User>;
  setTestTime(time: DateTimeOffset): void;
  advanceTestTime(duration: Duration): void;
  captureCorrelationId(correlationId: string): void;
  getCapturedCorrelationIds(): string[];
  runTestScenario<T>(scenario: TestScenario<T>): Promise<TestScenarioResult<T>>;
  captureArtifacts(testId: string, artifacts: TestArtifacts): Promise<void>;
}
```

**How It Works:**
1. **createTestTenant()** - Creates isolated test tenant
2. **createTestUser()** - Creates test user with persona
3. **setTestTime()** - Injects time (for time-versioning tests)
4. **captureCorrelationId()** - Tracks correlation IDs
5. **runTestScenario()** - Runs test scenario with isolation
6. **captureArtifacts()** - Captures artifacts on failure

**Usage Example:**
```typescript
const harness = new TestHarnessKernel();

// Create test tenant
const tenant = await harness.createTestTenant();

// Create test user
const user = await harness.createTestUser('Scheduler', tenant.TenantId);

// Set test time
harness.setTestTime(new Date('2024-01-15T10:00:00Z'));

// Run test scenario
const result = await harness.runTestScenario({
  Name: 'Assignment Proposal Test',
  Setup: async () => { /* ... */ },
  Execute: async () => { /* ... */ },
  Verify: (result) => { /* ... */ },
  Teardown: async () => { /* ... */ },
});
```

**Dependencies:** None (foundational)

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Test Harness Kernel section

---

## CONTROL PLANE

**Purpose:** Barrier between frontends and kernels. Enforces security, pricing, and workflow boundaries.

**Location:** `apps/backend/control-plane/`

### Responsibilities

1. **Authentication Normalization**
   - Validates session token
   - Loads user from session
   - Rotates token if needed
   - Injects CorrelationId

2. **Authorization + Scope Resolution**
   - Calls Identity Kernel (resolveAuthority)
   - Validates scope
   - Checks capabilities
   - Denies early if invalid

3. **Tier & Entitlement Enforcement**
   - Checks tenant plan
   - Checks feature availability
   - Checks workflow access
   - Checks usage limits
   - Denies or degrades gracefully

4. **Workflow Boundary Enforcement**
   - Validates workflow exists
   - Validates command structure
   - Blocks direct kernel calls
   - Enforces workflow-only access

5. **Read Model Shaping**
   - Shapes data per persona
   - Shapes data per tier
   - Same data source, different projections

### Request Flow

```
1. HTTP Request arrives
   ↓
2. Authentication Middleware (validate session)
   ↓
3. Authorization Middleware (resolve authority)
   ↓
4. Tier Enforcement Middleware (check plan/features)
   ↓
5. Workflow Boundary Middleware (validate workflow)
   ↓
6. Execute Workflow (via Workflow Kernel)
   ↓
7. Shape Response (read model shaping)
   ↓
8. Return Response
```

### Error Handling

**Standard Denial Response:**
```typescript
{
  StatusCode: 403,
  Headers: {
    'X-Denial-Reason': 'FEATURE_NOT_AVAILABLE',
    'X-Required-Plan': 'Professional',
  },
  Body: {
    error: 'Feature not available in your plan',
    code: 'FEATURE_NOT_AVAILABLE',
    feature: 'schedules:publish',
    requiredPlan: 'Professional',
    correlationId: 'corr-123',
  },
}
```

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Control Plane section

---

## WORKFLOWS (113)

### Workflow Definition Structure

Every workflow is defined as:

```typescript
interface WorkflowDefinition {
  WorkflowId: string;              // Unique identifier
  WorkflowName: string;            // Human-readable name
  Aggregates: string[];            // Which aggregates this workflow operates on
  StateMachine: StateMachineDefinition;  // Allowed state transitions
  AuthorityRequirements: Record<string, string>;  // Operation → RequiredAuthority
  DecisionChecks: string[];        // Which decision checks are required
  EventTypes: string[];            // Which events this workflow emits
  Engines: string[];               // Which engines this workflow calls
}
```

### Key Workflows

#### 1. Assignment Lifecycle (Workflow #70)

**Purpose:** Core assignment workflow (propose → validate → publish → override)

**Steps:**
1. Propose assignment (with eligibility evaluation)
2. Validate assignment (re-evaluate eligibility)
3. Publish assignment (make visible to employee)
4. Override BLOCKED assignment (requires ManagerL2+)

**State Machine:**
- Draft → Proposed (requires eligibility evaluation)
- Proposed → Validated (requires re-evaluation)
- Validated → Published (requires supervisor authority)
- Proposed → Overridden (requires ManagerL2+ authority)
- Overridden → Published (requires supervisor authority)

**APIs:**
- `POST /api/v1/assignments/propose`
- `POST /api/v1/assignments/{id}/validate`
- `POST /api/v1/assignments/{id}/publish`
- `POST /api/v1/assignments/{id}/override`

**Engines Used:**
- Eligibility & Rules Engine (evaluate eligibility)
- Scheduling Kernel (assignment operations)
- Audit & Decision Ledger (emit events/decisions)

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Assignment Lifecycle section

---

#### 2. Schedule Creation & Publication (Workflow #54)

**Purpose:** Create and publish schedules

**Steps:**
1. Create schedule version
2. Add shifts to schedule
3. Validate schedule
4. Publish schedule (make visible to employees)

**APIs:**
- `POST /api/v1/schedules`
- `POST /api/v1/schedules/{id}/versions`
- `POST /api/v1/schedules/{id}/versions/{versionId}/publish`

**Engines Used:**
- Scheduling Kernel (schedule operations)
- Eligibility & Rules Engine (validate assignments)
- Audit & Decision Ledger (emit events)

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Schedule Creation & Publication section

---

#### 3. Shift Swap Request (Workflow #74)

**Purpose:** Employee requests to swap shifts with another employee

**Steps:**
1. Employee submits swap request (via OperationalRequest)
2. System validates both employees eligible
3. Supervisor approves/rejects
4. If approved, system creates new assignments

**APIs:**
- `POST /api/v1/requests/shift-swap`
- `POST /api/v1/requests/{id}/approve`
- `POST /api/v1/requests/{id}/reject`

**Engines Used:**
- Request Orchestration Engine (request lifecycle)
- Eligibility & Rules Engine (validate both employees)
- Scheduling Kernel (create new assignments)
- Notification & Signal Engine (notify employees)

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Shift Swap Request section

---

**For all 113 workflows, see:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Complete Workflow Inventory section

---

## FRONTEND ARCHITECTURE

### Monorepo Structure

```
shiftro-frontend/
├── apps/
│   ├── employee/          # Mobile-first employee app
│   ├── supervisor/        # Operations console
│   ├── scheduler/         # ATC cockpit
│   ├── owner/             # Control plane
│   └── super-admin/       # Shiftro Tek support
├── packages/
│   ├── ui/                # Shared component library
│   ├── design-tokens/     # Design system tokens
│   ├── contracts/         # Zod schemas + API types
│   ├── auth/              # Authentication + RBAC
│   ├── data/              # API client + caching
│   └── testkit/           # Test fixtures + helpers
```

### Shared Packages

#### packages/design-tokens
**Purpose:** Single source of truth for visual design

**Exports:**
- Colors (brand, semantic, neutral)
- Typography (fonts, sizes, weights)
- Spacing scale
- Motion (durations, easing)
- Z-index layers

**Usage:**
```typescript
import { colors, typography, spacing } from '@shiftro/design-tokens';

const buttonStyle = {
  backgroundColor: colors.brand.primary,
  fontSize: typography.fontSize.base,
  padding: spacing[4],
};
```

---

#### packages/ui
**Purpose:** Shared component library

**Components:**
- Primitives (Button, Input, Select, etc.)
- Layout (Container, Stack, Grid, Card)
- Data Display (Table, Badge, Timeline)
- Forms (FormField, DatePicker, FileUpload)
- Feedback (LoadingSpinner, Alert, Toast)
- Scheduler-Specific (TimelineBar, AssignmentCard, CoverageHeatmap)

**Usage:**
```typescript
import { Button, Card, Table } from '@shiftro/ui';

function MyComponent() {
  return (
    <Card>
      <Button variant="primary">Click me</Button>
      <Table data={data} />
    </Card>
  );
}
```

---

#### packages/auth
**Purpose:** Authentication and persona-based routing

**Exports:**
- `useAuth()` hook
- `ProtectedRoute` component
- Persona checks
- Capability checks

**Usage:**
```typescript
import { useAuth, ProtectedRoute } from '@shiftro/auth';

function MyComponent() {
  const { user, hasPersona, hasCapability } = useAuth();
  
  if (!hasPersona('Scheduler')) {
    return <NoAccessState />;
  }
  
  return <SchedulerDashboard />;
}

// In routes
<Route
  path="/schedules/publish"
  element={
    <ProtectedRoute requiredPersona="Scheduler" requiredCapability="schedules:publish">
      <PublishSchedulePage />
    </ProtectedRoute>
  }
/>
```

---

#### packages/data
**Purpose:** API client and data fetching

**Exports:**
- API client
- Query hooks (React Query)
- Mutation hooks

**Usage:**
```typescript
import { useAssignments, useProposeAssignment } from '@shiftro/data';

function MyComponent() {
  const { data: assignments, isLoading } = useAssignments({ ScheduleVersionId: '123' });
  const proposeAssignment = useProposeAssignment();
  
  const handlePropose = async () => {
    await proposeAssignment.mutate({
      ShiftId: 'shift-123',
      EmployeeId: 'emp-456',
    });
  };
  
  return <AssignmentList assignments={assignments} />;
}
```

---

**See:** FRONTEND_MASTER_SPEC.md for complete frontend architecture

---

## PATTERNS & CONVENTIONS

### Time-Versioning Pattern

**Query Predicate:**
```sql
WHERE EffectiveFrom <= @EvaluationTime 
  AND @EvaluationTime < EffectiveTo
```

**Sentinel Value:**
- Use `9999-12-31 23:59:59 UTC` for "current, never expires"
- Never use `null` or `DateTime.MaxValue`

**Example:**
```typescript
// Query current employee role
const role = await db.employeeRoles.findFirst({
  where: {
    EmployeeId: employeeId,
    EffectiveFrom: { lte: new Date() },
    EffectiveTo: { gt: new Date() },
  },
});
```

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Universal Time-Versioning Contract section

---

### State Machine Pattern

**Enforcement:**
- State machines are enforced in **application code**, not database
- Use state machine library (e.g., XState) or custom implementation
- Invalid transitions throw errors

**Example:**
```typescript
const stateMachine = {
  Draft: {
    Proposed: ['EligibilityEvaluation'],
  },
  Proposed: {
    Validated: ['EligibilityReEvaluation'],
    Overridden: ['ManagerL2Authority', 'OverrideJustification'],
  },
  Validated: {
    Published: ['SupervisorAuthority'],
  },
};

function transitionAssignment(assignment: Assignment, newState: string) {
  const allowedTransitions = stateMachine[assignment.State];
  if (!allowedTransitions[newState]) {
    throw new Error(`Invalid transition: ${assignment.State} → ${newState}`);
  }
  // Execute transition
}
```

---

### Audit Event Pattern

**Every mutation must emit an AuditEvent:**

```typescript
// In workflow
await auditLedger.appendAuditEvent({
  AuditEventId: uuid(),
  TenantId: tenantId,
  EventType: 'AssignmentProposed',
  OccurredAt: new Date(),
  ActorType: 'User',
  ActorId: userId,
  CorrelationId: correlationId,
  SourceDomain: 'Scheduling',
  Payload: { AssignmentId: assignmentId },
  PayloadHash: hash(payload),
  AuthoritySnapshotJson: authoritySnapshot, // For critical operations
});
```

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Event & Decision Spine section

---

### Decision Record Pattern

**Every eligibility evaluation must create a DecisionRecord:**

```typescript
// In workflow
const eligibilityResult = await eligibilityEngine.evaluateEligibility({
  TenantId: tenantId,
  EmployeeId: employeeId,
  ShiftId: shiftId,
  EvaluationTime: new Date(),
  IncludeTrace: true,
});

await auditLedger.appendDecisionRecord({
  DecisionId: uuid(),
  TenantId: tenantId,
  DecisionType: 'Eligibility',
  DecisionOutcome: {
    Outcome: eligibilityResult.Outcome,
    Reasons: eligibilityResult.Reasons,
  },
  RuleTraceJson: eligibilityResult.RuleTrace,
  InputSnapshotHash: eligibilityResult.InputSnapshotHash,
  OccurredAt: new Date(),
  AuditEventId: auditEventId,
});
```

---

### Error Handling Pattern

**Custom Error Classes:**
```typescript
class WorkflowError extends Error {
  constructor(
    message: string,
    public code: string,
    public correlationId: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WorkflowError';
  }
}

// Usage
throw new WorkflowError(
  'Invalid state transition',
  'INVALID_TRANSITION',
  correlationId,
  { from: 'Draft', to: 'Published' }
);
```

**Error Logging:**
```typescript
try {
  // Workflow execution
} catch (error) {
  logger.error('Workflow execution failed', {
    error: error.message,
    code: error.code,
    correlationId: correlationId,
    stack: error.stack,
  });
  throw error;
}
```

---

### Testing Pattern

**Test Structure (AAA Pattern):**
```typescript
describe('Assignment Lifecycle Workflow', () => {
  it('should propose assignment with valid eligibility', async () => {
    // Arrange
    const tenant = await testHarness.createTestTenant();
    const user = await testHarness.createTestUser('Supervisor', tenant.TenantId);
    const shift = await createTestShift(tenant.TenantId);
    const employee = await createTestEmployee(tenant.TenantId);
    
    // Act
    const result = await workflowKernel.executeWorkflow({
      WorkflowId: 'assignment-lifecycle',
      CommandType: 'ProposeAssignment',
      Payload: { ShiftId: shift.ShiftId, EmployeeId: employee.EmployeeId },
      AuthorityContext: await identityKernel.resolveAuthority({ UserId: user.UserId, TenantId: tenant.TenantId, AtTime: new Date() }),
      CorrelationId: uuid(),
    });
    
    // Assert
    expect(result.Success).toBe(true);
    expect(result.EmittedEvents).toHaveLength(1);
    expect(result.EmittedEvents[0].EventType).toBe('AssignmentProposed');
  });
});
```

**See:** WORKFLOW_COVERAGE_MATRIX.md for test tier requirements

---

## COMMON TASKS

### How to Add a New Workflow

1. **Define Workflow**
   - Create `packages/contracts/workflows/{workflow-id}.ts`
   - Define WorkflowDefinition
   - Register in workflow registry

2. **Implement Workflow**
   - Create `apps/backend/workflows/{workflow-id}.ts`
   - **Use TimeSafePrismaClient** 🔴 **CONSTITUTIONAL** (not raw PrismaClient)
     - Constructor accepts `TimeSafePrismaClient` (not `PrismaClient`)
     - All database operations use injected time-safe client
     - Never create raw PrismaClient instance
   - Implement workflow logic
   - Call appropriate kernels
   - Emit events/decisions

3. **Create API Endpoint**
   - Create route in Control Plane
   - Add middleware (auth, authorization, tier enforcement)
   - Call Workflow Kernel

4. **Write Tests**
   - Unit tests (Tier A)
   - API contract tests (Tier B)
   - E2E tests (Tier C)
   - Security tests (Tier D) - if multi-tenant
   - Audit tests (Tier E) - if decisions created

5. **Update Documentation**
   - Add to SHIFTRO_BIBLE.md
   - Add to Workflow Coverage Matrix
   - Update API documentation

**See:** BUILD_PLAN_CHECKLIST.md - Phase 4: Workflows section

---

### How to Add a New Table

**CRITICAL:** Only add tables for **new domain concepts**. Do NOT add tables for workflow-specific needs.

**Process:**
1. **Justify Domain Concept**
   - What real-world fact does this table represent?
   - Does this fact already exist in another table?
   - Can this be modeled using generic frameworks (OperationalRequest, DecisionRecord, AuditEvent)?

2. **If Justified:**
   - Create migration
   - Add to Canonical Data Model documentation
   - Add RLS policies (if tenant-scoped)
   - Add time-versioning (if eligibility data)
   - Add indexes
   - Update SHIFTRO_BIBLE.md

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Schema Design Philosophy section

---

### How to Query Time-Versioned Data

**Pattern:**
```typescript
// Query current (as of now)
const current = await db.employeeRoles.findMany({
  where: {
    EmployeeId: employeeId,
    EffectiveFrom: { lte: new Date() },
    EffectiveTo: { gt: new Date() },
  },
});

// Query historical (as of specific time)
const historical = await db.employeeRoles.findMany({
  where: {
    EmployeeId: employeeId,
    EffectiveFrom: { lte: evaluationTime },
    EffectiveTo: { gt: evaluationTime },
  },
});

// Query future (as of future time)
const future = await db.employeeRoles.findMany({
  where: {
    EmployeeId: employeeId,
    EffectiveFrom: { lte: futureTime },
    EffectiveTo: { gt: futureTime },
  },
});
```

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Universal Time-Versioning Contract section

---

### How to Emit Audit Events

**Pattern:**
```typescript
// In workflow
const auditEvent: AuditEvent = {
  AuditEventId: uuid(),
  TenantId: tenantId,
  EventType: 'AssignmentProposed',
  OccurredAt: new Date(),
  ActorType: 'User',
  ActorId: userId,
  CorrelationId: correlationId,
  SourceDomain: 'Scheduling',
  Payload: { AssignmentId: assignmentId },
  PayloadHash: sha256(JSON.stringify(payload)),
  AuthoritySnapshotJson: authoritySnapshot, // For critical operations
};

await auditLedger.appendAuditEvent(auditEvent);
```

**See:** SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md - Event & Decision Spine section

---

### How to Evaluate Eligibility

**Pattern:**
```typescript
// In workflow
const eligibilityResult = await eligibilityEngine.evaluateEligibility({
  TenantId: tenantId,
  EmployeeId: employeeId,
  ShiftId: shiftId,
  EvaluationTime: new Date(),
  IncludeTrace: true,
});

// Check outcome
if (eligibilityResult.Outcome === 'BLOCKED') {
  // Handle blocked
} else if (eligibilityResult.Outcome === 'WARN') {
  // Handle warning
} else {
  // Handle allowed
}

// Create decision record
await auditLedger.appendDecisionRecord({
  DecisionId: uuid(),
  TenantId: tenantId,
  DecisionType: 'Eligibility',
  DecisionOutcome: {
    Outcome: eligibilityResult.Outcome,
    Reasons: eligibilityResult.Reasons,
  },
  RuleTraceJson: eligibilityResult.RuleTrace,
  InputSnapshotHash: eligibilityResult.InputSnapshotHash,
  OccurredAt: new Date(),
  AuditEventId: auditEventId,
});
```

**See:** SYSTEM_ARCHITECTURE_SPEC.md - Eligibility & Rules Engine section

---

## TROUBLESHOOTING GUIDE

### Common Issues

#### Issue: "Invalid state transition" error

**Cause:** Trying to transition to invalid state

**Solution:**
1. Check state machine definition
2. Verify required conditions are met
3. Check authority requirements

**Example:**
```typescript
// Error: Cannot transition from Draft to Published
// Solution: Must go through Proposed → Validated → Published
```

---

#### Issue: "Time-versioning query returns no results"

**Cause:** Incorrect time predicate or sentinel value

**Solution:**
1. Check EffectiveFrom/EffectiveTo values
2. Verify sentinel value (9999-12-31, not null)
3. Check time predicate: `EffectiveFrom <= time AND time < EffectiveTo`

**Example:**
```typescript
// Wrong
WHERE EffectiveTo IS NULL

// Correct
WHERE EffectiveTo = '9999-12-31 23:59:59 UTC'
```

---

#### Issue: "Cross-tenant access" error

**Cause:** RLS policy blocking access or missing TenantId in query

**Solution:**
1. Verify TenantId is included in query
2. Check RLS policies are enabled
3. Verify user has access to tenant

**Example:**
```typescript
// Wrong
SELECT * FROM Employees WHERE EmployeeId = $1;

// Correct
SELECT * FROM Employees WHERE TenantId = $1 AND EmployeeId = $2;
```

---

#### Issue: "Decision replay mismatch"

**Cause:** Non-deterministic evaluation or changed inputs

**Solution:**
1. Verify InputSnapshotHash matches
2. Check time-versioned data hasn't changed
3. Verify evaluation logic is deterministic

**Example:**
```typescript
// Check hash
const originalHash = decisionRecord.InputSnapshotHash;
const replayedHash = hash(inputSnapshot);
expect(originalHash).toBe(replayedHash);
```

---

#### Issue: "Workflow not found" error

**Cause:** Workflow not registered in Workflow Kernel

**Solution:**
1. Verify workflow is registered
2. Check WorkflowId matches
3. Verify workflow definition is correct

**Example:**
```typescript
// Register workflow
workflowKernel.registerWorkflow({
  WorkflowId: 'my-workflow',
  // ... definition
});
```

---

## GLOSSARY

**Aggregate** - A cluster of domain objects treated as a single unit

**Authority** - User's role and scope in tenant context

**Capability** - Named permission (e.g., "schedules:publish")

**CorrelationId** - Unique identifier linking related operations

**DecisionRecord** - Immutable record of eligibility/rule evaluation

**EffectiveFrom/EffectiveTo** - Time-versioning pattern for historical queries

**Eligibility** - Evaluation of whether employee can be assigned to shift

**Kernel** - Core business logic component with explicit interface

**Persona** - User role type (Employee, Supervisor, Scheduler, Owner, SuperAdmin)

**RLS** - Row-Level Security (database-level tenant isolation)

**Scope** - Authority scope (tenant/facility/department/time window)

**Sentinel Value** - Special value representing "current, never expires" (9999-12-31)

**State Machine** - Enforced state transitions (Draft → Proposed → Validated → Published)

**Tenant** - Customer organization (multi-tenancy)

**Time-Versioning** - Historical data pattern using EffectiveFrom/EffectiveTo

**Workflow** - Sequence of operations on shared tables (not a table itself)

---

## APPENDIX

### File Reference

- **SHIFTRO_WORKFLOW_COMPREHENSIVE_REPORT.md** - Complete workflow and schema specification
- **SYSTEM_ARCHITECTURE_SPEC.md** - Kernel and engine specifications
- **FRONTEND_MASTER_SPEC.md** - Frontend architecture specification
- **WORKFLOW_COVERAGE_MATRIX.md** - Test coverage requirements
- **IMPLEMENTATION_ROADMAP.md** - Phase-by-phase implementation plan
- **BUILD_PLAN_CHECKLIST.md** - Step-by-step build checklist

### Quick Links

- [All 48 Tables](#data-model-48-tables)
- [All 8 Kernels/Engines](#kernels--engines)
- [All 113 Workflows](#workflows-113)
- [Time-Versioning Pattern](#time-versioning-pattern)
- [State Machine Pattern](#state-machine-pattern)
- [Audit Event Pattern](#audit-event-pattern)

---

**Last Updated:** 2024-12-23  
**Status:** Living document - update as system evolves  
**Contributors:** All developers working on Shiftro
