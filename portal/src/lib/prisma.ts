import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool, type QueryConfig } from "pg";
import { prepareDatabaseUrl } from "@/lib/db-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Two connections per serverless isolate. Supavisor session mode only allows
 * about 15 clients; the pg default of 10 exhausts that across a few instances.
 * One connection is not enough: an interactive transaction holds a connection,
 * and some callbacks still query through the root client (which needs another).
 * A warm isolate reuses this client via globalThis instead of opening another pool.
 */
function poolMax(): number {
  const fromEnv = Number(process.env.PG_POOL_MAX);
  if (Number.isFinite(fromEnv) && fromEnv >= 1 && fromEnv <= 10) {
    return Math.floor(fromEnv);
  }
  return 2;
}

/**
 * Transaction mode (port 6543) cannot keep named prepared statements.
 * The adapter already sends unnamed queries; drop `name` if one is ever set.
 */
function stripNamedStatements(pool: Pool): void {
  const original = pool.query.bind(pool);
  pool.query = ((config: unknown, values?: unknown) => {
    if (config && typeof config === "object" && "name" in config) {
      const { name: _name, ...rest } = config as QueryConfig & { name?: string };
      return original(rest, values as never);
    }
    return original(config as never, values as never);
  }) as Pool["query"];
}

function createPrismaClient() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }

  const { connectionString, transactionPooler } = prepareDatabaseUrl(raw);
  const pool = new Pool({
    connectionString,
    max: poolMax(),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });

  if (transactionPooler) {
    stripNamedStatements(pool);
  }

  const adapter = new PrismaPg(pool, { disposeExternalPool: true });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
