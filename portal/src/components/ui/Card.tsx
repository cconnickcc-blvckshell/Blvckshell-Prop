import type { HTMLAttributes } from "react";

export default function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={`rounded-xl border border-zinc-800 bg-[var(--brand-charcoal)] text-[var(--brand-white)] shadow-xl ${className}`}
    />
  );
}
