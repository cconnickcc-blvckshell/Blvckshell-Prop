"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PortalBrandMark from "@/components/PortalBrandMark";
import SignOutForm from "@/components/auth/SignOutForm";

interface ClientNavProps {
  userName: string;
}

const navLinks = [
  { href: "/client", label: "Dashboard", short: "Dashboard" },
  { href: "/client/sites", label: "Sites", short: "Sites" },
  { href: "/client/jobs", label: "Job history", short: "Visits" },
  { href: "/client/invoices", label: "Invoices", short: "Invoices" },
] as const;

function linkActive(pathname: string, href: string) {
  return pathname === href || (href !== "/client" && pathname.startsWith(href));
}

export default function ClientNav({ userName }: ClientNavProps) {
  const pathname = usePathname();

  return (
    <>
      <nav className="border-b border-zinc-800 bg-zinc-950">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-6">
            <Link
              href="/client"
              className="flex shrink-0 items-center gap-2.5 hover:opacity-90"
              aria-label="BLVCKSHELL Client home"
            >
              <PortalBrandMark variant="crest" />
              <span className="text-sm font-semibold text-zinc-200">Client</span>
            </Link>
            <div className="hidden items-center gap-6 lg:flex">
              {navLinks.map(({ href, label }) => {
                const isActive = linkActive(pathname, href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`inline-flex min-h-11 items-center text-sm font-medium ${
                      isActive ? "text-emerald-400" : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden max-w-[10rem] truncate text-sm text-zinc-500 sm:inline">{userName}</span>
            <SignOutForm className="inline-flex min-h-11 items-center text-sm font-medium text-zinc-400 hover:text-zinc-200" />
          </div>
        </div>
      </nav>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950 pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Client"
      >
        <div className="grid h-16 grid-cols-4">
          {navLinks.map(({ href, short }) => {
            const isActive = linkActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-11 flex-col items-center justify-center px-1 text-xs font-medium ${
                  isActive ? "text-emerald-400" : "text-zinc-400"
                }`}
              >
                {short}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
