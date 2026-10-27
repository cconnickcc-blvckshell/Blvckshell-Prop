import { signOut } from "@/lib/auth";
import { isNextRedirect, logAuthFailure, rejectCrossSite, seeOther } from "@/lib/auth-post";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return seeOther(request, "/");
}

export function HEAD(request: Request) {
  return seeOther(request, "/");
}

export async function POST(request: Request) {
  const blocked = rejectCrossSite(request);
  if (blocked) return blocked;

  try {
    await signOut({ redirectTo: "/", redirect: false });
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    logAuthFailure("auth.logout");
  }
  return seeOther(request, "/");
}
