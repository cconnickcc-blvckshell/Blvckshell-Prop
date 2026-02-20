"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navLinks = [
  { href: "/admin/clients", label: "Locations" },
  { href: "/admin/workforce", label: "Workforce" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/workorders", label: "Work Orders" },
  { href: "/admin/incidents", label: "Incidents" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/leads", label: "Leads" },
  { href: "/admin/docs", label: "Docs" },
] as const;

export default function AdminNav({ userName, userRole }: { userName: string; userRole: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950 shadow-lg">
      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between md:h-16">
          <div className="flex min-w-0 flex-1 items-center gap-6">
            <Link
              href="/admin/jobs"
              className="shrink-0 text-lg font-bold tracking-tight text-white md:text-xl"
            >
              BLVCKSHELL Admin
            </Link>
            {/* Desktop nav — wrap so Invoices/Payouts etc. stay visible on smaller desktop */}
            <div className="hidden gap-1 md:flex md:flex-wrap md:items-center">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === href || pathname.startsWith(href + "/")
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden truncate text-sm text-zinc-400 sm:inline">{userName}</span>
            <span className="rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300">
              {userRole}
            </span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Log out
            </button>
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white md:hidden"
              aria-expanded={mobileOpen}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav panel */}
        {mobileOpen && (
          <div className="border-t border-zinc-800 py-3 md:hidden">
            <div className="flex flex-col gap-0.5">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2.5 text-sm font-medium ${
                    pathname === href || pathname.startsWith(href + "/")
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-300 hover:bg-zinc-800/50"
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="mt-2 border-t border-zinc-800 pt-2">
                <p className="px-3 py-1 text-xs text-zinc-500">{userName}</p>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-zinc-300 hover:bg-zinc-800"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
