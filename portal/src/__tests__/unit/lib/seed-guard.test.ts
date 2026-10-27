import { describe, it, expect } from "vitest";
import { assertSeedAllowed, isLocalDatabaseUrl } from "@/lib/seed-guard";

const base = {
  NODE_ENV: "development",
  DATABASE_URL: "postgresql://portaldev:portaldev@localhost:5432/portal_dev",
} as NodeJS.ProcessEnv;

describe("assertSeedAllowed", () => {
  it("allows a localhost database outside production", () => {
    expect(() => assertSeedAllowed(base)).not.toThrow();
    expect(
      isLocalDatabaseUrl("postgresql://portaldev:portaldev@127.0.0.1:5432/portal_dev")
    ).toBe(true);
  });

  it("refuses when NODE_ENV is production even for localhost and ALLOW_SEED", () => {
    expect(() =>
      assertSeedAllowed({
        ...base,
        NODE_ENV: "production",
        ALLOW_SEED: "1",
      })
    ).toThrow(/NODE_ENV=production/);
  });

  it("refuses a remote database unless ALLOW_SEED=1", () => {
    const remote = {
      ...base,
      DATABASE_URL:
        "postgresql://postgres.example:secret@aws-0-us-east-1.pooler.supabase.com:6543/postgres",
    };
    expect(() => assertSeedAllowed(remote)).toThrow(/non-local database/);
    expect(() => assertSeedAllowed({ ...remote, ALLOW_SEED: "1" })).not.toThrow();
  });

  it("refuses when DATABASE_URL is missing", () => {
    expect(() => assertSeedAllowed({ NODE_ENV: "development" })).toThrow(/DATABASE_URL is not set/);
  });
});
