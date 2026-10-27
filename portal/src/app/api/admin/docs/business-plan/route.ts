import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/guards/rbac";
import { readBusinessPlanHtml } from "@/server/docs/business-plan";

const ROBOTS = "noindex, nofollow, noarchive";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.role !== "FOUNDER")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "X-Robots-Tag": ROBOTS, "Cache-Control": "private, no-store" } }
    );
  }

  let html: string;
  try {
    html = await readBusinessPlanHtml();
  } catch {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404, headers: { "X-Robots-Tag": ROBOTS, "Cache-Control": "private, no-store" } }
    );
  }

  const download = request.nextUrl.searchParams.get("download") === "1";

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": ROBOTS,
      "Content-Disposition": download
        ? 'attachment; filename="Blvckshell_Business_Plan.html"'
        : "inline",
    },
  });
}
