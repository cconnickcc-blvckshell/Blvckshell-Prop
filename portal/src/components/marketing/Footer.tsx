import Link from "next/link";
import BrandLogo from "@/components/marketing/BrandLogo";
import PhoneContact from "@/components/marketing/PhoneContact";
import { company, footerNav, serviceArea } from "@/config/marketing-site";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-800 bg-[var(--brand-black)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <BrandLogo variant="emblem" />
            <p className="mt-4 text-sm leading-relaxed text-[var(--brand-muted)]">
              {company.commercialLine}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              {company.primaryRegion} · {company.headquarters}
            </p>
            <p className="mt-2 text-xs text-zinc-600">
              {serviceArea.primaryCommunities.slice(0, 4).join(", ")} and surrounding communities.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Navigation</p>
            <nav className="mt-4 flex flex-col gap-2.5 text-sm" aria-label="Footer">
              {footerNav.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="text-zinc-400 transition hover:text-[var(--brand-gold-light)]"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Contact</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <a
                  href={`mailto:${company.email}`}
                  className="text-zinc-400 transition hover:text-white"
                >
                  {company.email}
                </a>
              </li>
              <li>
                <PhoneContact className="text-zinc-400" linkClassName="text-zinc-400 transition hover:text-white" />
              </li>
              <li className="text-zinc-500">{company.primaryRegion}, Ontario</li>
            </ul>
          </div>
        </div>
        <p className="mt-12 border-t border-zinc-800 pt-8 text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} {company.brandName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
