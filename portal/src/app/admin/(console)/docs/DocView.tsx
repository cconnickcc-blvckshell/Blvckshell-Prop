"use client";

import Link from "next/link";
import { useCallback } from "react";
import DocMarkdown from "./DocMarkdown";

interface DocViewProps {
  title: string;
  subtitle: string;
  content: string;
  backHref: string;
  nextDoc?: { href: string; label: string } | null;
  prevDoc?: { href: string; label: string } | null;
}

export default function DocView(props: DocViewProps) {
  const { title, subtitle, content, backHref, nextDoc = null, prevDoc = null } = props;
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="w-full max-w-4xl">
      {/* Toolbar: touch-friendly min heights, matches admin CTA style */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden sm:gap-4">
        <Link
          href={backHref}
          className="inline-flex min-h-[44px] items-center rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
        >
          ← Back to docs
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-500 hover:shadow-xl active:scale-[0.98]"
        >
          Print / Save as PDF
        </button>
      </div>

      {/* Article: same card treatment as rest of admin (border, shadow); light inner for readability */}
      <article className="doc-print rounded-xl border border-zinc-800 bg-zinc-50 p-5 text-zinc-900 shadow-xl sm:p-8 print:border print:border-zinc-300 print:bg-white print:shadow-none">
        <header className="border-b border-zinc-200 pb-5 print:border-zinc-300 sm:pb-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-zinc-500">{subtitle}</p>
          <h1 className="mt-1 text-xl font-bold text-zinc-900 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm text-zinc-600">BLVCKSHELL — Facilities Operations</p>
        </header>

        <div className="doc-body mt-5 sm:mt-6">
          <DocMarkdown content={content} />
        </div>

        <footer className="mt-6 border-t border-zinc-200 pt-4 text-xs text-zinc-500 print:border-zinc-300 sm:mt-8">
          BLVCKSHELL — Confidential. For internal and contractor use only.
        </footer>
      </article>

      {/* Prev/Next: button-style links, thumb-friendly on mobile */}
      {(prevDoc || nextDoc) && (
        <nav className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-6 print:hidden sm:gap-4">
          {prevDoc ? (
            <Link
              href={prevDoc.href}
              className="inline-flex min-h-[44px] min-w-[100px] items-center rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              ← {prevDoc.label}
            </Link>
          ) : (
            <span />
          )}
          {nextDoc ? (
            <Link
              href={nextDoc.href}
              className="inline-flex min-h-[44px] min-w-[100px] items-center justify-end rounded-lg border border-zinc-700 bg-zinc-800/80 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              {nextDoc.label} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
