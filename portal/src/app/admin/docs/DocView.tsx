"use client";

import Link from "next/link";
import { useCallback } from "react";

interface DocViewProps {
  title: string;
  subtitle: string;
  content: string;
  backHref: string;
}

export default function DocView({ title, subtitle, content, backHref }: DocViewProps) {
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href={backHref} className="text-sm text-zinc-400 hover:text-white">
          ← Docs
        </Link>
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
        >
          Print / Save as PDF
        </button>
      </div>

      <article className="doc-print rounded-xl border border-zinc-800 bg-white p-8 text-zinc-900 print:border-0 print:shadow-none">
        <header className="border-b border-zinc-200 pb-4 print:border-zinc-300">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">{subtitle}</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">{title}</h1>
          <p className="mt-2 text-sm text-zinc-600">BLVCKSHELL — Facilities Operations</p>
        </header>
        <div className="prose prose-zinc mt-6 max-w-none prose-headings:font-semibold prose-table:text-sm prose-th:border-b prose-th:border-zinc-300 prose-th:py-2 prose-th:pr-4 prose-td:border-b prose-td:border-zinc-200 prose-td:py-2 prose-td:pr-4">
          <MarkdownContent content={content} />
        </div>
        <footer className="mt-8 border-t border-zinc-200 pt-4 text-xs text-zinc-500 print:border-zinc-300">
          BLVCKSHELL — Confidential. For internal and contractor use only.
        </footer>
      </article>

      <style jsx global>{`
        @media print {
          body { background: #fff; }
          .doc-print { box-shadow: none !important; }
          nav, .print\\:hidden { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let inTable = false;
  let tableRows: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1];

    if (line.startsWith("# ")) {
      blocks.push(<h1 key={i} className="text-2xl font-bold mt-6 mb-2">{line.replace(/^# /, "")}</h1>);
    } else if (line.startsWith("## ")) {
      blocks.push(<h2 key={i} className="text-xl font-semibold mt-6 mb-2">{line.replace(/^## /, "")}</h2>);
    } else if (line.startsWith("### ")) {
      blocks.push(<h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.replace(/^### /, "")}</h3>);
    } else if (line.startsWith("---")) {
      blocks.push(<hr key={i} className="my-4 border-zinc-200" />);
    } else if (line.startsWith("|") && next?.startsWith("|")) {
      if (!inTable) {
        tableRows = [];
        inTable = true;
      }
      tableRows.push(line);
      if (next?.startsWith("|---") || !next?.startsWith("|")) {
        blocks.push(<Table key={i} rows={tableRows} />);
        inTable = false;
        if (next?.startsWith("|---")) i++;
      }
    } else {
      inTable = false;
      if (line.startsWith("- ")) {
        const listItems: string[] = [line];
        while (lines[i + 1]?.startsWith("- ") || lines[i + 1]?.startsWith("  - ")) {
          i++;
          listItems.push(lines[i]);
        }
        blocks.push(
          <ul key={i} className="list-disc pl-6 my-2 space-y-1">
            {listItems.map((item, j) => (
              <li key={j}>{item.replace(/^-\s*\[.\]\s*/, "").replace(/^-\s*/, "")}</li>
            ))}
          </ul>
        );
      } else if (line.startsWith("* ")) {
        blocks.push(<p key={i} className="my-1">{line.replace(/^\* /, "")}</p>);
      } else if (line.trim()) {
        blocks.push(<p key={i} className="my-2">{line}</p>);
      } else {
        blocks.push(<br key={i} />);
      }
    }
    i++;
  }

  return <>{blocks}</>;
}

function Table({ rows }: { rows: string[] }) {
  const isSeparator = (row: string) => /^\|[-:\s|]+\|$/.test(row);
  const cells = (row: string) => row.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map((c) => c.trim());
  const headerRow = rows[0];
  const dataRows = rows.filter((r) => !isSeparator(r)).slice(1);

  return (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            {cells(headerRow).map((h, j) => (
              <th key={j} className="border-b border-zinc-300 py-2 pr-4 text-left font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, i) => (
            <tr key={i}>
              {cells(row).map((cell, j) => (
                <td key={j} className="border-b border-zinc-200 py-2 pr-4">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
