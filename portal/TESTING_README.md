# Testing Guide

This document describes the comprehensive test harness for the Blvckshell portal.

## Test Structure

### Unit Tests (`src/__tests__/unit/`)
- **Actions**: Server action tests (job, invoice, payout, checklist, upload)
- **Guards**: RBAC permission tests
- **State Machine**: State transition tests
- **Utils**: Utility function tests

### Integration Tests (`src/__tests__/integration/`)
- **API**: API route tests
- **Database**: Database operation tests
- **Storage**: File storage tests

### E2E Tests (`src/__tests__/e2e/`)
- **Admin**: Admin workflow tests
- **Worker**: Worker workflow tests
- **Auth**: Authentication flow tests

### Load Tests (`src/__tests__/load/`)
- **worker-workflow.js**: Worker job completion load test
- **mixed-workload.js**: Mixed user type load test (500+ concurrent users)

## Setup

### Install Dependencies

```bash
cd portal
npm install
```

### Environment Variables

Create `.env.test`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/blvckshell_test"
TEST_DATABASE_URL="postgresql://user:password@localhost:5432/blvckshell_test"
TEST_BASE_URL="http://localhost:3000"
```

### Database Setup

```bash
# Create test database
createdb blvckshell_test

# Run migrations
npm run db:migrate
```

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Watch mode
npm run test -- --watch
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test
npm run test:e2e -- worker/job-completion.spec.ts
```

### Load Tests

**Prerequisites:** Install k6
- macOS: `brew install k6`
- Linux: See [k6 installation guide](https://k6.io/docs/getting-started/installation/)
- Windows: Download from [k6 releases](https://github.com/grafana/k6/releases)

```bash
# Run mixed workload (500+ users)
npm run test:load

# Run worker workflow load test
npm run test:load:worker

# Custom base URL
BASE_URL=https://your-app.vercel.app npm run test:load
```

## Test Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: All API routes covered
- **E2E Tests**: All critical user workflows covered
- **Load Tests**: 500+ concurrent users supported

## Performance Targets

- **API Response Time**: p95 < 2s, p99 < 5s
- **Database Queries**: < 100ms average
- **File Uploads**: < 5s for 10MB files
- **PDF Generation**: < 2s per PDF
- **Error Rate**: < 1% under load
- **Concurrent Users**: Support 500+ simultaneously

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "@/server/actions/my-actions";

describe("myFunction", () => {
  it("should do something", async () => {
    const result = await myFunction({ input: "test" });
    expect(result.success).toBe(true);
  });
});
```

### Integration Test Example

```typescript
import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/my-route/route";

describe("POST /api/my-route", () => {
  it("should handle request", async () => {
    const request = new Request("http://localhost:3000/api/my-route", {
      method: "POST",
      body: JSON.stringify({ data: "test" }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";

test("should complete workflow", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/jobs");
});
```

### Load Test Example

```javascript
import http from "k6/http";
import { check } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 100 },
    { duration: "2m", target: 500 },
  ],
};

export default function () {
  const res = http.get("http://localhost:3000/api/health");
  check(res, {
    "status is 200": (r) => r.status === 200,
  });
}
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Scheduled nightly runs

See `.github/workflows/test.yml` for CI configuration.

## Troubleshooting

### Tests failing with database errors
- Ensure test database exists
- Run migrations: `npm run db:migrate`
- Check `TEST_DATABASE_URL` in `.env.test`

### E2E tests timing out
- Ensure dev server is running: `npm run dev`
- Check `TEST_BASE_URL` in `.env.test`
- Increase timeout in `playwright.config.ts`

### Load tests failing
- Ensure app is deployed/running
- Check `BASE_URL` environment variable
- Verify k6 is installed: `k6 version`

## Test Maintenance

- Update tests when adding new features
- Keep test data isolated (use beforeEach cleanup)
- Use realistic test data
- Document test scenarios in test files
