import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* Hero — mobile-first; placeholder for hero image */}
      <section className="relative border-b border-zinc-800 px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
          <div className="text-center text-zinc-500">
            <svg className="mx-auto h-16 w-16 text-zinc-600 sm:h-20 sm:w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="mt-2 text-xs font-medium sm:text-sm">Hero image placeholder</p>
          </div>
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Facilities services that scale with your properties
          </h1>
          <p className="mt-4 text-base text-zinc-400 sm:mt-6 sm:text-lg">
            BLVCKSHELL delivers consistent cleaning, light maintenance, and site
            management for condos and commercial buildings. Quality you can
            measure.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4">
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
            who need reliable, auditable facilities work. We launch in{" "}
            <strong className="text-white">Windsor–Essex</strong> and serve{" "}
            <strong className="text-white">Ontario-wide</strong>—multi-site portfolios welcome.
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
          <ol className="mt-10 grid list-none gap-8 pl-0 sm:grid-cols-3 [counter-reset:step]">
            {[
              { title: "Scope & quote", body: "We align on scope, checklists, and frequency. You get a clear quote and schedule." },
              { title: "Scheduled service", body: "Assigned crews complete work on schedule. Evidence and checklists are captured in our portal." },
              { title: "Review & approve", body: "You review completions and approve. Invoicing and payouts are handled in one place." },
            ].map(({ title, body }, i) => (
              <li key={i} className="flex gap-4 [counter-increment:step]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-zinc-900">
                  {i + 1}
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

      {/* Proof & Accountability */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-2xl font-semibold text-white">Proof & accountability</h2>
              <p className="mt-4 text-zinc-400">
                We don’t just show up—we document. Every job is tied to clear standards and your review.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Site-specific checklists so scope is clear and nothing is missed.",
                  "Photo evidence minimums per area (lobby, hallways, washrooms, etc.) so you see what was done.",
                  "Issue escalation SLA: safety and damage reported same day; reclean or credit when we fall short.",
                  "Re-clean policy: we return to fix it or you get credit—no runaround.",
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 text-zinc-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
              {/* Placeholder: replace with real "portal evidence" or team/site photo */}
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/80">
                <div className="text-center text-zinc-500">
                  <svg className="mx-auto h-16 w-16 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 text-sm font-medium">Portal evidence example</p>
                  <p className="text-xs">Replace with screenshot or photo</p>
                </div>
              </div>
            </div>
          </div>
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
              { q: "What areas do you serve?", a: "We launch in Windsor–Essex and serve Ontario-wide. Multi-site portfolios across the province are welcome." },
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
