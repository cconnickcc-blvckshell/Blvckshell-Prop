"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import PortalBrandMark from "@/components/PortalBrandMark";

interface ClientNavProps {
  userName: string;
}

const navLinks = [
  { href: "/client", label: "Dashboard" },
  { href: "/client/sites", label: "Sites" },
  { href: "/client/jobs", label: "Job history" },
  { href: "/client/invoices", label: "Invoices" },
] as const;

export default function ClientNav({ userName }: ClientNavProps) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-900/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/client"
              className="flex items-center gap-2.5 hover:opacity-90"
              aria-label="BLVCKSHELL Client home"
            >
              <PortalBrandMark variant="crest" />
              <span className="text-sm font-semibold text-zinc-200">Client</span>
            </Link>
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/client" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={`text-sm font-medium ${
                    isActive ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{userName}</span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm font-medium text-zinc-400 hover:text-zinc-200"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
