"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="mb-4 mt-8 text-xl font-bold text-zinc-900 first:mt-0">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="mb-3 mt-6 text-lg font-semibold text-zinc-900">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="mb-2 mt-4 text-base font-semibold text-zinc-800">{children}</h3>,
  p: ({ children }: { children?: React.ReactNode }) => <p className="mb-3 leading-relaxed text-zinc-700 text-[15px] sm:text-base">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="mb-4 ml-4 list-disc space-y-1.5 text-zinc-700 sm:ml-5 text-[15px] sm:text-base">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="mb-4 ml-4 list-decimal space-y-1.5 text-zinc-700 sm:ml-5 text-[15px] sm:text-base">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-6 -mx-1 overflow-x-auto overscroll-x-contain sm:mx-0">
      <table className="min-w-full border-collapse border border-zinc-300 text-xs w-full sm:text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-zinc-100">{children}</thead>,
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="whitespace-nowrap border border-zinc-300 px-2 py-2 text-left font-semibold text-zinc-900 sm:px-3 sm:py-2.5">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border border-zinc-300 px-2 py-2 text-zinc-700 sm:px-3 sm:py-2.5">{children}</td>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => <tr className="border-b border-zinc-200 last:border-b-0">{children}</tr>,
  hr: () => <hr className="my-6 border-zinc-200" />,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-4 border-l-4 border-zinc-300 pl-4 italic text-zinc-600">{children}</blockquote>
  ),
};

export default function DocMarkdown({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{content}</ReactMarkdown>;
}
