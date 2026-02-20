# Comprehensive Test Plan

**Purpose:** Test harness and tests for every workflow and function in the portal, ensuring it can handle 500+ concurrent users.

**Generated:** February 2026

---

## Test Coverage Overview

### 1. Unit Tests (Vitest)
- Server actions (job, invoice, payout, checklist, upload)
- State machine transitions
- Validation schemas
- RBAC guards
- Utility functions

### 2. Integration Tests (Vitest)
- API routes
- Database operations
- File upload/download
- PDF generation
- Rate limiting

### 3. E2E Tests (Playwright)
- Complete user workflows
- Admin workflows
- Worker workflows
- Vendor owner workflows
- Form submissions
- Navigation flows

### 4. Load Tests (k6)
- 500+ concurrent users
- Stress testing
- Performance benchmarks
- Rate limit validation

---

## Test Structure

```
portal/src/__tests__/
├── setup.ts                    # Test database setup
├── unit/                       # Unit tests
│   ├── actions/               # Server action tests
│   ├── guards/                # RBAC guard tests
│   ├── state-machine/         # State machine tests
│   └── utils/                # Utility function tests
├── integration/               # Integration tests
│   ├── api/                  # API route tests
│   ├── database/             # Database operation tests
│   └── storage/              # File storage tests
├── e2e/                       # E2E tests
│   ├── admin/                # Admin workflow tests
│   ├── worker/               # Worker workflow tests
│   └── auth/                 # Authentication tests
└── utils/                     # Test utilities
    └── test-helpers.ts       # Helper functions
```

---

## Test Execution

```bash
# Unit and integration tests
npm run test

# E2E tests
npm run test:e2e

# Load tests
npm run test:load

# All tests
npm run test:all

# Coverage
npm run test:coverage
```

---

## Load Test Scenarios

### Scenario 1: Worker Job Completion Flow
- 200 workers completing jobs simultaneously
- Uploading photos
- Submitting checklists
- Expected: < 2s response time, < 1% errors

### Scenario 2: Admin Approval Flow
- 50 admins reviewing completions
- Approving/rejecting jobs
- Creating invoices
- Expected: < 1s response time, < 0.5% errors

### Scenario 3: Mixed Workload
- 300 workers viewing jobs
- 100 workers submitting completions
- 50 admins managing operations
- 50 public users submitting contact forms
- Expected: System remains responsive, < 2s p95 latency

### Scenario 4: Peak Load
- 500 concurrent users
- All workflows active simultaneously
- Expected: System handles load gracefully, no crashes

---

## Performance Targets

- **API Response Time:** p95 < 2s, p99 < 5s
- **Database Queries:** < 100ms average
- **File Uploads:** < 5s for 10MB files
- **PDF Generation:** < 2s per PDF
- **Error Rate:** < 1% under load
- **Concurrent Users:** Support 500+ simultaneously

---

## Test Data Management

- Each test uses isolated test database
- Tests clean up after themselves
- Fixtures for common scenarios
- Load tests use realistic data volumes
