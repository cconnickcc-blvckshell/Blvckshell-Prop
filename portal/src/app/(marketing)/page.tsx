import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <section className="border-b border-zinc-800 px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Facilities services that scale with your properties
          </h1>
          <p className="mt-6 text-lg text-zinc-400">
            BLVCKSHELL delivers consistent cleaning, light maintenance, and site
            management for condos and commercial buildings. Quality you can
            measure.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200">
              Request a quote
            </Link>
            <Link href="/services" className="rounded-md border border-zinc-600 px-6 py-3 text-sm font-medium text-white transition hover:border-zinc-500">
              View services
            </Link>
          </div>
        </div>
      </section>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-white">Who we serve</h2>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Property managers, condo boards, and commercial building operators
            who need reliable, auditable facilities work. We serve multi-site
            portfolios across the GTA and beyond.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["Condo corporations", "Commercial property managers", "Multi-site portfolios"].map((item) => (
              <li key={item} className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-zinc-300">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="border-y border-zinc-800 bg-zinc-900/30 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-white">How it works</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { step: "1", title: "Scope & quote", body: "We align on scope, checklists, and frequency. You get a clear quote and schedule." },
              { step: "2", title: "Scheduled service", body: "Assigned crews complete work on schedule. Evidence and checklists are captured in our portal." },
              { step: "3", title: "Review & approve", body: "You review completions and approve. Invoicing and payouts are handled in one place." },
            ].map(({ step, title, body }) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-zinc-900">
                  {step}
                </span>
                <div>
                  <h3 className="font-medium text-white">{title}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold text-white">Services</h2>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Cleaning, light maintenance, and site support tailored to your buildings and contracts.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/services", label: "Overview" },
              { href: "/condo-cleaning", label: "Condo cleaning" },
              { href: "/commercial-cleaning", label: "Commercial cleaning" },
              { href: "/light-maintenance", label: "Light maintenance" },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="block rounded-lg border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-white transition hover:border-zinc-600">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="border-y border-zinc-800 bg-zinc-900/30 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold text-white">FAQ</h2>
          <dl className="mt-10 space-y-8">
            {[
              { q: "What areas do you serve?", a: "We serve the Greater Toronto Area and can discuss other regions for multi-site portfolios." },
              { q: "How is quality assured?", a: "Every job uses site-specific checklists. Completion evidence and photos are captured in our portal and available for your review." },
              { q: "Who performs the work?", a: "Our network includes internal crews and vetted subcontractors. All are onboarded with compliance (COI, WSIB) and trained on your scope." },
            ].map(({ q, a }) => (
              <div key={q}>
                <dt className="font-medium text-white">{q}</dt>
                <dd className="mt-2 text-zinc-400">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-white">Ready to get started?</h2>
          <p className="mt-4 text-zinc-400">Request a quote or book a site walk. We’ll respond within one business day.</p>
          <Link href="/contact" className="mt-8 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200">
            Contact us
          </Link>
        </div>
      </section>
    </div>
  );
}
