import type { ReactNode } from "react";

export const fieldControlClass =
  "mt-1 block w-full min-h-11 rounded-md border border-zinc-600 bg-[var(--brand-black)] px-3 py-2 text-[var(--brand-white)] shadow-sm placeholder:text-zinc-500 focus:border-[var(--brand-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-gold)]";

export default function Field({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--brand-white)]">
        {label}
      </label>
      {children}
      {hint}
    </div>
  );
}
