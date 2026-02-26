import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Column 1: Brand */}
          <div>
            <p className="text-lg font-semibold text-white">BLVCKSHELL</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Facilities services for condos and commercial properties.
            </p>
            <p className="mt-3 text-sm text-zinc-600">Windsor-Essex, Ontario</p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Navigation</p>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm">
              <Link href="/services" className="text-zinc-400 transition hover:text-white">Services</Link>
              <Link href="/compliance" className="text-zinc-400 transition hover:text-white">Compliance &amp; Risk</Link>
              <Link href="/pilots" className="text-zinc-400 transition hover:text-white">Pilots</Link>
              <Link href="/about" className="text-zinc-400 transition hover:text-white">About</Link>
              <Link href="/contact" className="text-zinc-400 transition hover:text-white">Contact</Link>
              <Link href="/privacy" className="text-zinc-400 transition hover:text-white">Privacy</Link>
              <Link href="/portal" className="text-zinc-400 transition hover:text-white">Portal / Log in</Link>
            </nav>
          </div>

          {/* Column 3: Contact */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a href="mailto:hello@blvckshell.com" className="text-zinc-400 transition hover:text-white">
                  hello@blvckshell.com
                </a>
              </li>
              <li>
                <a href="tel:+12269462558" className="text-zinc-400 transition hover:text-white">
                  (226) 946-BLVK
                </a>
              </li>
              <li className="text-zinc-500">Windsor-Essex, Ontario</li>
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-zinc-800 pt-8 text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} BLVCKSHELL. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
