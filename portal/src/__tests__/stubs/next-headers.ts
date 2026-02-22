/**
 * Stub for next/headers so next-auth loads under Vitest.
 */
export function headers() {
  return new Headers();
}
export function cookies() {
  return { get: () => undefined, getAll: () => [], set: () => {}, delete: () => {} };
}
