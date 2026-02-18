import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-white">BLVCKSHELL</p>
            <p className="mt-1 text-sm text-zinc-500">
              Facilities services for condos and commercial properties.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/services" className="text-zinc-400 hover:text-white">
              Services
            </Link>
            <Link href="/about" className="text-zinc-400 hover:text-white">
              About
            </Link>
            <Link href="/contact" className="text-zinc-400 hover:text-white">
              Contact
            </Link>
            <Link href="/privacy" className="text-zinc-400 hover:text-white">
              Privacy
            </Link>
            <Link href="/login" className="text-zinc-400 hover:text-white">
              Portal / Log in
            </Link>
          </div>
        </div>
        <p className="mt-8 border-t border-zinc-800 pt-8 text-xs text-zinc-600">
          © {new Date().getFullYear()} BLVCKSHELL. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
