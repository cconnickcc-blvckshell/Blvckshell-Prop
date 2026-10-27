import { NextResponse } from "next/server";

export function pdfResponse(buffer: Buffer, filename: string, inline = false): NextResponse {
  const safe = filename.replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "") || "document.pdf";
  const disposition = inline ? "inline" : "attachment";
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${safe}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
