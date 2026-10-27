import { describe, expect, it } from "vitest";
import { prepareDatabaseUrl } from "@/lib/db-url";

describe("prepareDatabaseUrl", () => {
  it("strips Prisma-only params and detects the transaction pooler", () => {
    const prepared = prepareDatabaseUrl(
      "postgresql://postgres.ref:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require",
    );
    expect(prepared.transactionPooler).toBe(true);
    expect(prepared.connectionString).not.toContain("pgbouncer");
    expect(prepared.connectionString).not.toContain("connection_limit");
    expect(prepared.connectionString).toContain("sslmode=require");
    expect(prepared.connectionString).toContain(":6543");
  });

  it("treats a session-pooler URL as a normal connection", () => {
    const prepared = prepareDatabaseUrl(
      "postgresql://postgres.ref:secret@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require",
    );
    expect(prepared.transactionPooler).toBe(false);
    expect(prepared.connectionString).toContain(":5432");
  });

  it("detects pgbouncer=true even when the port is not 6543", () => {
    const prepared = prepareDatabaseUrl(
      "postgresql://user:pass@localhost:5432/portal_dev?pgbouncer=true&pool_timeout=10",
    );
    expect(prepared.transactionPooler).toBe(true);
    expect(prepared.connectionString).not.toContain("pool_timeout");
    expect(prepared.connectionString).not.toContain("pgbouncer");
  });
});
