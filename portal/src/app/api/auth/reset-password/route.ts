import { completePasswordReset } from "@/server/actions/password-actions";
import { field, isNextRedirect, logAuthFailure, rejectCrossSite, seeOther } from "@/lib/auth-post";

export const dynamic = "force-dynamic";

const TOKEN = /^[A-Za-z0-9_-]{20,256}$/;

export function GET(request: Request) {
  return seeOther(request, "/reset-password");
}

function resetLocation(token: string, error: string): string {
  const url = new URL("http://internal.invalid/reset-password");
  if (TOKEN.test(token)) url.searchParams.set("token", token);
  url.searchParams.set("error", error);
  return `${url.pathname}${url.search}`;
}

function resetErrorCode(error: string): "rate" | "invalid" | "weak" {
  if (error.startsWith("Too many")) return "rate";
  if (error.startsWith("This link")) return "invalid";
  return "weak";
}

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return seeOther(request, "/reset-password?error=invalid");
  }

  const token = field(form, "token").trim();
  const password = field(form, "password");
  const confirm = field(form, "confirm");
  if (!password || password !== confirm) {
    return seeOther(request, resetLocation(token, "mismatch"));
  }

  try {
    const result = await completePasswordReset(token, password);
    if (!result.ok) {
      return seeOther(request, resetLocation(token, resetErrorCode(result.error)));
    }
    return seeOther(request, "/login?notice=password-set");
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    logAuthFailure("auth.reset-password");
    return seeOther(request, resetLocation(token, "invalid"));
  }
}
