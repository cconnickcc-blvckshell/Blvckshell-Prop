/**
 * Open-redirect and credential-in-URL guards.
 * Paths are accepted only when they stay on this host after decoding.
 * Credential query keys are removed and never copied into a redirect.
 */

const CREDENTIAL_KEYS = new Set([
  "password",
  "passwd",
  "pwd",
  "currentpassword",
  "newpassword",
  "nextpassword",
  "confirmpassword",
  "passwordconfirmation",
  "credential",
  "credentials",
  "secret",
]);

const IDENTITY_KEYS = new Set(["email", "username", "user"]);

export const LOGIN_ERROR_CODES = new Set([
  "RateLimit",
  "CredentialsSignin",
  "Configuration",
  "AccessDenied",
  "Verification",
  "method",
]);

export const LOGIN_NOTICE_CODES = new Set(["password-set"]);

export const FORGOT_STATUS_CODES = new Set(["sent", "unavailable"]);

export const RESET_ERROR_CODES = new Set(["invalid", "mismatch", "weak", "rate"]);

export const CHANGE_ERROR_CODES = new Set(["incorrect", "weak", "invalid"]);

const AUTH_PATHS = new Set([
  "/login",
  "/forgot-password",
  "/reset-password",
  "/account/password",
]);

const RESET_TOKEN = /^[A-Za-z0-9_-]{20,256}$/;

export function normalizeQueryKey(key: string): string {
  return key.toLowerCase().replace(/[-_\s]/g, "");
}

export function isCredentialQueryKey(key: string): boolean {
  const normalized = normalizeQueryKey(key);
  return CREDENTIAL_KEYS.has(normalized) || normalized.includes("password");
}

function isIdentityQueryKey(key: string): boolean {
  return IDENTITY_KEYS.has(normalizeQueryKey(key));
}

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function decodedPath(value: string): string | null {
  let current = value;
  for (let i = 0; i < 2; i++) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      return null;
    }
  }
  return current;
}

/** Relative same-origin path, or null when the value is not safe to follow. */
export function parseInternalPath(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("\\") || /[\u0000-\u001F\u007F]/.test(trimmed)) return null;

  const decoded = decodedPath(trimmed);
  if (!decoded) return null;
  if (!decoded.startsWith("/") || decoded.startsWith("//")) return null;
  if (decoded.includes("\\") || decoded.includes("://") || decoded.includes("@")) return null;
  if (/[<>"'`]/.test(decoded)) return null;

  let url: URL;
  try {
    url = new URL(trimmed, "http://internal.invalid");
  } catch {
    return null;
  }
  if (url.origin !== "http://internal.invalid") return null;
  if (url.username || url.password || url.hash) return null;

  for (const key of [...url.searchParams.keys()]) {
    if (isCredentialQueryKey(key)) url.searchParams.delete(key);
  }

  const search = url.searchParams.toString();
  const path = `${url.pathname}${search ? `?${search}` : ""}`;
  if (!path.startsWith("/") || path.startsWith("//") || path.length > 512) return null;
  return path;
}

export function safeInternalPath(input: unknown, fallback = "/portal"): string {
  return parseInternalPath(input) ?? parseInternalPath(fallback) ?? "/portal";
}

function sameParams(left: URLSearchParams, right: URLSearchParams): boolean {
  const leftKeys = [...new Set(left.keys())].sort();
  const rightKeys = [...new Set(right.keys())].sort();
  if (leftKeys.join("\n") !== rightKeys.join("\n")) return false;
  for (const key of leftKeys) {
    const a = left.getAll(key);
    const b = right.getAll(key);
    if (a.length !== b.length || a.some((value, index) => value !== b[index])) return false;
  }
  return true;
}

function replaceSearch(url: URL, next: URLSearchParams): boolean {
  const changed = !sameParams(url.searchParams, next);
  if (changed) {
    const search = next.toString();
    url.search = search ? `?${search}` : "";
  }
  return changed;
}

/**
 * Mutates the URL in place. Returns true when the browser should be redirected
 * to the cleaned URL. Idempotent: a cleaned URL returns false.
 */
export function sanitizeRequestUrl(url: URL): boolean {
  let changed = false;
  for (const key of [...url.searchParams.keys()]) {
    if (isCredentialQueryKey(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }

  if (!AUTH_PATHS.has(url.pathname)) return changed;

  const next = new URLSearchParams();
  if (url.pathname === "/login") {
    const error = url.searchParams.get("error");
    const notice = url.searchParams.get("notice");
    const callback = url.searchParams.get("callbackUrl");
    if (error && LOGIN_ERROR_CODES.has(error)) next.set("error", error);
    if (notice && LOGIN_NOTICE_CODES.has(notice)) next.set("notice", notice);
    const safeCallback = callback ? parseInternalPath(callback) : null;
    if (safeCallback) next.set("callbackUrl", safeCallback);
  } else if (url.pathname === "/forgot-password") {
    const status = url.searchParams.get("status");
    if (status && FORGOT_STATUS_CODES.has(status)) next.set("status", status);
  } else if (url.pathname === "/reset-password") {
    const token = url.searchParams.get("token") ?? "";
    const error = url.searchParams.get("error");
    if (RESET_TOKEN.test(token)) next.set("token", token);
    if (error && RESET_ERROR_CODES.has(error)) next.set("error", error);
  } else if (url.pathname === "/account/password") {
    const updated = url.searchParams.get("updated");
    const error = url.searchParams.get("error");
    if (updated === "1") next.set("updated", "1");
    if (error && CHANGE_ERROR_CODES.has(error)) next.set("error", error);
  }

  if (replaceSearch(url, next)) changed = true;
  return changed;
}

export function safeRedirectTarget(input: unknown, allowedOrigin: string, fallback = "/portal"): string {
  const fallbackPath = safeInternalPath(fallback, "/portal");
  if (typeof input !== "string") return fallbackPath;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 2048) return fallbackPath;
  if (trimmed.startsWith("//") || trimmed.includes("\\")) return fallbackPath;

  let base: URL;
  try {
    base = new URL(allowedOrigin);
  } catch {
    return fallbackPath;
  }

  let url: URL;
  try {
    url = new URL(trimmed, base);
  } catch {
    return fallbackPath;
  }
  if (url.origin !== base.origin) return fallbackPath;
  sanitizeRequestUrl(url);
  return parseInternalPath(`${url.pathname}${url.search}`) ?? fallbackPath;
}

export function urlHasCredential(input: string): boolean {
  try {
    const url = new URL(input, "http://internal.invalid");
    for (const key of url.searchParams.keys()) {
      if (isCredentialQueryKey(key) || (AUTH_PATHS.has(url.pathname) && isIdentityQueryKey(key))) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

type QueryBag = Record<string, string | string[] | undefined>;

export function loginPageState(params: QueryBag): {
  href: string;
  changed: boolean;
  error: string | null;
  notice: string | null;
  callbackUrl: string;
} {
  const url = new URL("http://internal.invalid/login");
  for (const [key, value] of Object.entries(params)) {
    const first = firstValue(value);
    if (first !== undefined) url.searchParams.append(key, first);
  }
  const changed = sanitizeRequestUrl(url);
  return {
    href: `${url.pathname}${url.search}`,
    changed,
    error: url.searchParams.get("error"),
    notice: url.searchParams.get("notice"),
    callbackUrl: parseInternalPath(url.searchParams.get("callbackUrl")) ?? "/portal",
  };
}

export function forgotPageState(params: QueryBag): { href: string; changed: boolean; status: string | null } {
  const url = new URL("http://internal.invalid/forgot-password");
  for (const [key, value] of Object.entries(params)) {
    const first = firstValue(value);
    if (first !== undefined) url.searchParams.append(key, first);
  }
  const changed = sanitizeRequestUrl(url);
  return { href: `${url.pathname}${url.search}`, changed, status: url.searchParams.get("status") };
}

export function resetPageState(params: QueryBag): {
  href: string;
  changed: boolean;
  token: string;
  error: string | null;
} {
  const url = new URL("http://internal.invalid/reset-password");
  for (const [key, value] of Object.entries(params)) {
    const first = firstValue(value);
    if (first !== undefined) url.searchParams.append(key, first);
  }
  const changed = sanitizeRequestUrl(url);
  return {
    href: `${url.pathname}${url.search}`,
    changed,
    token: url.searchParams.get("token") ?? "",
    error: url.searchParams.get("error"),
  };
}

export function changePasswordPageState(params: QueryBag): {
  href: string;
  changed: boolean;
  updated: boolean;
  error: string | null;
} {
  const url = new URL("http://internal.invalid/account/password");
  for (const [key, value] of Object.entries(params)) {
    const first = firstValue(value);
    if (first !== undefined) url.searchParams.append(key, first);
  }
  const changed = sanitizeRequestUrl(url);
  return {
    href: `${url.pathname}${url.search}`,
    changed,
    updated: url.searchParams.get("updated") === "1",
    error: url.searchParams.get("error"),
  };
}
