import type { ButtonHTMLAttributes } from "react";

const variants = {
  primary:
    "bg-[var(--brand-gold)] text-[var(--brand-black)] hover:bg-[var(--brand-gold-light)]",
  secondary:
    "border border-zinc-600 bg-transparent text-[var(--brand-white)] hover:border-[var(--brand-gold)]",
  danger: "bg-red-600 text-white hover:bg-red-500",
} as const;

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--brand-black)] disabled:opacity-50 ${variants[variant]} ${className}`}
    />
  );
}
