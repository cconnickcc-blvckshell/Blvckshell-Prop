import type { ReactNode } from "react";
import Link from "next/link";

export default function NavLink({
  href,
  active,
  children,
  onClick,
  className = "",
}: {
  href: string;
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)] ${
        active ? "text-[var(--brand-gold)]" : "text-zinc-300 hover:text-white"
      } ${className}`}
    >
      {children}
    </Link>
  );
}
