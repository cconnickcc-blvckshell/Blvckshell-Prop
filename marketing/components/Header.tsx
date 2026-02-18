import Link from "next/link";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-xl font-semibold tracking-tight text-white">
          BLVCKSHELL
        </Link>
        <nav className="flex items-center gap-8">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              {label}
            </Link>
          ))}
          <a
            href={process.env.NEXT_PUBLIC_PORTAL_URL ?? "/portal"}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:border-zinc-500 hover:bg-zinc-700"
          >
            Portal / Log in
          </a>
        </nav>
      </div>
    </header>
  );
}
