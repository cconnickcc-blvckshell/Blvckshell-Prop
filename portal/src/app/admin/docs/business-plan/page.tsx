import { requireAdmin } from "@/server/guards/rbac";
import Link from "next/link";

export default async function BusinessPlanPage() {
  await requireAdmin();

  return (
    <div className="flex h-[calc(100vh-80px)] w-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link
            href="/admin/docs"
            className="mb-2 inline-flex items-center text-sm text-zinc-400 hover:text-white"
          >
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Docs
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">Business Plan</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Ontario Regional Business Plan - Q1 2026 | Confidential
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/docs/business-plan.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in New Tab
          </a>
          <a
            href="/docs/business-plan.html"
            download="Blvckshell_Business_Plan.html"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </a>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden rounded-xl border border-zinc-800 bg-white">
        <iframe
          src="/docs/business-plan.html"
          className="h-full w-full"
          title="Blvckshell Business Plan"
        />
      </div>
      
      <p className="mt-3 text-center text-xs text-zinc-500">
        To save as PDF: Open in new tab → Print (Ctrl/Cmd + P) → Save as PDF
      </p>
    </div>
  );
}
