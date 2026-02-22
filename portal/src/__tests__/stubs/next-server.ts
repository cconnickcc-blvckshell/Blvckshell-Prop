/**
 * Stub for next/server so next-auth and other Next code load under Vitest.
 * Not used at runtime in tests; only to satisfy imports.
 */
export class NextRequest extends Request {}
export class NextResponse extends Response {
  static redirect() {
    return new Response(null, { status: 302 });
  }
  static json(body: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  }
}
export type NextMiddleware = (req: NextRequest, context: { nextUrl: URL }) => Promise<Response | NextResponse> | Response | NextResponse;
export type NextFetchEvent = { request: NextRequest };
export function headers() {
  return new Headers();
}
export function cookies() {
  return { get: () => undefined, getAll: () => [], set: () => {}, delete: () => {} };
}
