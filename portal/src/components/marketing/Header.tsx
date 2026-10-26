"use client";

import Link from "next/link";
import { useState } from "react";
import BrandLogo from "@/components/marketing/BrandLogo";
import MarketingButton from "@/components/marketing/MarketingButton";
import { contactHref, primaryNav, secondaryNav } from "@/config/marketing-site";

export default function MarketingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[var(--brand-black)]/95 backdrop-blur">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.5rem] sm:gap-4 sm:px-6">
        <BrandLogo variant="header" className="min-w-0 shrink-0" priority />

        <nav className="hidden items-center gap-5 lg:flex xl:gap-6" aria-label="Primary">
          {primaryNav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-zinc-400 transition hover:text-[var(--brand-gold-light)] focus:outline-none focus-visible:text-[var(--brand-gold)]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/portal"
            className="text-sm text-zinc-500 transition hover:text-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]"
          >
            Client Login
          </Link>
          <MarketingButton href={contactHref({ intent: "quote" })} className="px-4 py-2 text-sm">
            Request a Quote
          </MarketingButton>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/portal"
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300"
          >
            Login
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-md p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]"
            aria-expanded={mobileOpen}
            aria-controls="mobile-marketing-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <div id="mobile-marketing-nav" className="border-t border-zinc-800 bg-[var(--brand-black)] md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-4 py-3" aria-label="Primary mobile">
            {primaryNav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                {label}
              </Link>
            ))}
            <div className="my-2 border-t border-zinc-800 pt-2">
              {secondaryNav.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300"
                >
                  {label}
                </Link>
              ))}
            </div>
            <MarketingButton
              href={contactHref({ intent: "quote" })}
              className="mt-2 w-full"
              variant="primary"
            >
              Request a Quote
            </MarketingButton>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
