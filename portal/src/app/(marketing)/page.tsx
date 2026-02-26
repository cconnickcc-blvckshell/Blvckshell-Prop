"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/animations/FadeIn";
import ScrollReveal from "@/components/animations/ScrollReveal";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";
import PremiumTile from "@/components/marketing/PremiumTile";
import ImageTreatment from "@/components/marketing/ImageTreatment";
import ProcessFlow from "@/components/marketing/ProcessFlow";
import { motionConfig } from "@/lib/animations";

const IMAGES = {
  hero: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80",
  condo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
  maintenance: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80",
  evidence: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
};

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ── Full viewport height with gradient overlay */}
      <section className="relative h-screen min-h-[600px] w-full">
        <img
          src={IMAGES.hero}
          alt="Premium commercial building"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-zinc-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        <div className="relative flex h-full flex-col items-center justify-center px-4 sm:px-6">
          <div className="mx-auto max-w-5xl text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-5xl font-bold tracking-tight text-white text-balance sm:text-6xl lg:text-7xl"
            >
              Facilities Services Built Deliberately
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="mx-auto mt-6 max-w-2xl text-xl text-zinc-400"
            >
              Checklists, photo verification, and compliance tracking designed into every visit.
              For property managers who need evidence, not excuses.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
            >
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:bg-emerald-500 hover:shadow-xl hover:scale-[1.02]"
              >
                Request a Site Evaluation
              </Link>
              <a
                href="#how-we-work"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-600 px-8 py-4 text-base font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-800/60"
              >
                See How It Works
              </a>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.svg
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="h-6 w-6 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </motion.svg>
          </motion.div>
        </div>
      </section>

      {/* ── Capability Strip ── */}
      <FadeIn>
        <section className="border-b border-zinc-800 bg-zinc-950 px-4 py-8 sm:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-4 sm:flex-row sm:gap-0 sm:divide-x sm:divide-zinc-800">
            {[
              "Photo-verified every visit",
              "Checklist-enforced standards",
              "Audit-ready documentation",
              "Real-time portal access",
            ].map((item) => (
              <p
                key={item}
                className="px-6 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                {item}
              </p>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── How We Operationalize Quality ── */}
      <section id="how-we-work" className="border-b border-zinc-800 bg-zinc-950 px-4 py-24 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-4xl">
          <FadeIn>
            <h2 className="text-headline font-semibold text-white">How We Operationalize Quality</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Not generic promises&mdash;a systematic flow. Every visit is structured to follow a documented process with accountability at every step.
            </p>
          </FadeIn>
          <div className="mt-14 space-y-10">
            {[
              {
                num: "1",
                title: "Scheduled Visits",
                description: "Checklist enforced. Every job tied to site-specific scope and frequency. No guesswork.",
              },
              {
                num: "2",
                title: "Photo Evidence Captured",
                description: "Timestamped and labeled. Minimum evidence per area so you see what was done, when.",
              },
              {
                num: "3",
                title: "Site Manager Review",
                description: "Approval required. You review completions, evidence, and checklists before sign-off.",
              },
              {
                num: "4",
                title: "Issue & Escalation",
                description: "We flag safety concerns instantly and deliver documented responses within the same business day.",
              },
              {
                num: "5",
                title: "Audit Trails",
                description: "Every change logged. Complete history of visits, approvals, issues, and resolutions. Board-ready reporting.",
              },
            ].map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.1}>
                <div className="flex gap-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white">
                    {step.num}
                  </div>
                  <div className="border-l-2 border-emerald-600/30 pl-6">
                    <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Services ── */}
      <section className="px-4 py-24 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <h2 className="text-headline font-semibold text-white">Our Services</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Cleaning, unit turnovers, light maintenance, and facilities support. Each service is structured with checklists, evidence, and accountability built in.
            </p>
          </FadeIn>
          <StaggerContainer className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <StaggerItem index={0}>
              <PremiumTile
                href="/condo-cleaning"
                image={IMAGES.condo}
                title="Condo Cleaning"
                description="Common areas, lobbies, washrooms, and shared spaces."
                label="Scope"
                imageAlt="Luxury condo lobby"
              />
            </StaggerItem>
            <StaggerItem index={1}>
              <PremiumTile
                href="/commercial-cleaning"
                image={IMAGES.commercial}
                title="Commercial Cleaning"
                description="Office, retail, and mixed-use. Scheduled and on-demand."
                label="Process"
                imageAlt="Modern commercial office space"
              />
            </StaggerItem>
            <StaggerItem index={2}>
              <PremiumTile
                href="/light-maintenance"
                image={IMAGES.maintenance}
                title="Light Maintenance"
                description="Minor repairs, paint touch-ups, caulking, and site support."
                label="Reporting"
                imageAlt="Professional facility maintenance"
              />
            </StaggerItem>
          </StaggerContainer>
          <FadeIn delay={0.2}>
            <div className="mt-14 text-center">
              <Link
                href="/pilots"
                className="inline-block rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
              >
                View Pilot Programs &rarr;
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Proof & Accountability ── */}
      <FadeIn>
        <section className="border-y border-zinc-800 bg-zinc-900/30 px-4 py-24 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-headline font-semibold text-white">Proof &amp; Accountability</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Our operations are structured to produce proof by default. Every job is tied to clear standards and your review&mdash;this isn&apos;t added later, it&apos;s built in from the start.
            </p>
            <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <div className="space-y-6">
                  {[
                    "Site-specific checklists so scope is clear and nothing is missed.",
                    "Photo evidence minimums per area\u2014structured to show what was done, not added as an afterthought.",
                    "We flag safety concerns instantly and deliver documented responses within the same business day.",
                    "Re-clean policy: we return to fix it or you get credit\u2014accountability designed in, not reactive.",
                  ].map((text, i) => (
                    <FadeIn key={i} delay={i * 0.1}>
                      <div className="flex gap-4">
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                        <p className="text-zinc-300">{text}</p>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-emerald-500/20 bg-zinc-900/50 shadow-lg shadow-emerald-900/10">
                  <ImageTreatment src={IMAGES.evidence} alt="Documented visit example — timestamped evidence and checklist sign-off" />
                </div>
                <p className="text-center text-sm text-zinc-500">
                  Every visit produces timestamped evidence and checklist sign-off.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/compliance"
                    className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    How we handle risk &amp; proof
                  </Link>
                  <Link
                    href="/contact?request=sample-report"
                    className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    Request a sample report
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* ── How It Works (1-2-3) ── */}
      <section className="border-b border-zinc-800 bg-zinc-950 px-4 py-24 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-5xl">
          <FadeIn>
            <h2 className="text-headline font-semibold text-white text-center">How It Works</h2>
          </FadeIn>
          <div className="relative mt-16">
            {/* Connecting line */}
            <div className="absolute left-1/2 top-6 hidden h-px w-[calc(100%-10rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-600/40 to-transparent sm:block" />
            <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
              {[
                { title: "Scope & Quote", body: "We align on scope, checklists, and frequency. You get a clear quote and schedule." },
                { title: "Scheduled Service", body: "We deliver verified, scheduled service\u2014every time. Evidence and checklists are captured in our portal." },
                { title: "Review & Approve", body: "You review completions and approve. Invoicing and payouts are handled in one place." },
              ].map(({ title, body }, i) => (
                <FadeIn key={i} delay={i * 0.15}>
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-emerald-600/40 bg-zinc-900">
                      <span className="text-4xl font-bold text-emerald-500">{i + 1}</span>
                    </div>
                    <h3 className="mt-6 text-lg font-semibold text-white">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-zinc-400">{body}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust & Compliance ── */}
      <section className="border-b border-zinc-800 bg-zinc-900/20 px-4 py-24 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <FadeIn>
            <h2 className="text-headline font-semibold text-white">Trust &amp; Compliance</h2>
          </FadeIn>
          <StaggerContainer className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: (
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: "Insurance & Compliance",
                items: ["COI on file", "WSIB coverage", "Compliance-ready", "HST registered"],
              },
              {
                icon: (
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: "Service-Level Expectations",
                items: ["Photo evidence per visit", "Site-specific checklists", "Completion reports", "Review & approve workflow"],
              },
              {
                icon: (
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ),
                title: "Issue Handling",
                items: ["Safety & damage reported same day", "Incident reports logged", "Response times documented", "Escalation workflow"],
              },
              {
                icon: (
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                title: "Operational Coverage",
                items: ["Backup cleaner plan", "Missed-visit make-good policy", "Key/FOB control", "Multi-site coordination"],
              },
              {
                icon: (
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                title: "Where We Operate",
                items: ["Based in Windsor-Essex", "Serving Ontario-wide", "Multi-site portfolios welcome", "Site walks available"],
              },
              {
                icon: (
                  <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                ),
                title: "Proof & Accountability",
                items: ["Site-specific checklists", "Photo evidence minimums", "Re-clean or credit policy", "Portal access for review"],
              },
            ].map((block, i) => (
              <StaggerItem key={i} index={i}>
                <div className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all duration-300 hover:border-zinc-600 hover:shadow-lg hover:shadow-emerald-900/5">
                  <div className="flex items-center gap-3">
                    {block.icon}
                    <h3 className="font-semibold text-white">{block.title}</h3>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                    {block.items.map((item, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="text-emerald-500">&bull;</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Ready to Get Started (CTA) ── */}
      <FadeIn>
        <section className="bg-gradient-to-b from-zinc-900 to-zinc-950 px-4 py-28 sm:px-6 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Ready to Get Started?</h2>
            <p className="mt-6 text-lg leading-relaxed text-zinc-400">
              Get a no-obligation site evaluation. See how we run your sites with a guided tour of our portal and process.
            </p>
            <p className="mt-4 text-sm font-medium uppercase tracking-wider text-emerald-500">
              Structured. Accountable. Evidence-first.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-900/30 transition-all duration-200 hover:bg-emerald-500 hover:shadow-xl hover:scale-[1.02]"
              >
                Request a Site Evaluation
              </Link>
              <Link
                href="/contact?request=quote"
                className="inline-flex items-center justify-center rounded-lg border border-zinc-600 px-8 py-4 text-base font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-400 hover:bg-zinc-800/60"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
