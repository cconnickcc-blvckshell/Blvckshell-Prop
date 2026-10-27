/**
 * Prisma engine query params that Postgres and node-postgres reject as startup
 * parameters. The app honors them, then strips them before opening a connection.
 */
const PRISMA_ONLY_PARAMS = [
  "pgbouncer",
  "connection_limit",
  "pool_timeout",
  "statement_cache_size",
] as const;

export type PreparedDatabaseUrl = {
  connectionString: string;
  /** Supavisor transaction mode (port 6543) or an explicit pgbouncer=true flag. */
  transactionPooler: boolean;
};

function stripParams(raw: string): string {
  let connectionString = raw;
  for (const key of PRISMA_ONLY_PARAMS) {
    connectionString = connectionString.replace(
      new RegExp(`([?&])${key}=[^&]*`, "g"),
      "$1",
    );
  }
  return connectionString
    .replace(/\?&/g, "?")
    .replace(/&&+/g, "&")
    .replace(/[?&]$/, "");
}

/**
 * Prepare DATABASE_URL for the `pg` driver.
 * Transaction-pooler URLs (port 6543, or pgbouncer=true) must not be handed to
 * Postgres as-is: `pgbouncer` and `connection_limit` are Prisma-only.
 */
export function prepareDatabaseUrl(raw: string): PreparedDatabaseUrl {
  try {
    const url = new URL(raw);
    const transactionPooler =
      url.port === "6543" || url.searchParams.get("pgbouncer") === "true";
    for (const key of PRISMA_ONLY_PARAMS) {
      url.searchParams.delete(key);
    }
    return { connectionString: url.toString(), transactionPooler };
  } catch {
    const transactionPooler =
      /:6543(?:\/|\?|$)/.test(raw) ||
      /(?:\?|&)pgbouncer=true(?:&|$)/.test(raw);
    return { connectionString: stripParams(raw), transactionPooler };
  }
}
