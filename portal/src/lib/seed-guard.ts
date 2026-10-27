/**
 * Seed may run only against a local database, and never in production.
 * ALLOW_SEED=1 permits a non-local URL for an explicit disposable database.
 * NODE_ENV=production always refuses, even when ALLOW_SEED=1.
 */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function databaseHost(connectionString: string): string | null {
  try {
    const host = new URL(connectionString).hostname;
    if (host) return host;
  } catch {
    // Passwords with unescaped characters are not valid WHATWG URLs.
  }

  const match = connectionString.match(/@([^/?#]+)/);
  if (!match) return null;
  const hostPort = match[1];
  if (hostPort.startsWith("[")) {
    const end = hostPort.indexOf("]");
    return end > 1 ? hostPort.slice(1, end) : null;
  }
  return hostPort.split(":")[0] || null;
}

export function isLocalDatabaseUrl(connectionString: string): boolean {
  const host = databaseHost(connectionString);
  return host != null && LOCAL_HOSTS.has(host);
}

export function assertSeedAllowed(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV === "production") {
    throw new Error("Refusing to seed when NODE_ENV=production.");
  }

  const connectionString = env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (isLocalDatabaseUrl(connectionString)) return;

  if (env.ALLOW_SEED === "1") return;

  throw new Error(
    "Refusing to seed a non-local database. Point DATABASE_URL at localhost, or set ALLOW_SEED=1 for an explicit disposable database. Never seed production."
  );
}
