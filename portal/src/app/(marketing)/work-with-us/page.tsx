import type { Metadata } from "next";
import ApplicationForm from "./ApplicationForm";

export const metadata: Metadata = {
  title: "Work With Us | BLVCKSHELL",
  description:
    "Apply to join BLVCKSHELL as a cleaning professional or subcontractor company. Structured work, fair pay, professional tools, and a growth path.",
};

export default function WorkWithUsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Work With BLVCKSHELL
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Join a growing facilities services company that values reliability,
          professionalism, and merit-based advancement. We&apos;re building a
          workforce of dedicated cleaning and maintenance professionals across
          Ontario.
        </p>
      </section>

      {/* What we offer */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">What We Offer</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {[
            {
              title: "Structured Work",
              description:
                "Consistent schedules with recurring sites. Know where you're going and what's expected before you arrive.",
            },
            {
              title: "Fair Pay",
              description:
                "Transparent compensation based on job scope and performance. No hidden deductions, no surprises.",
            },
            {
              title: "Professional Tools",
              description:
                "A digital portal for job management, checklists, time tracking, and direct communication with the operations team.",
            },
            {
              title: "Growth Path",
              description:
                "Start part-time, prove your reliability, and advance to more hours, more sites, and leadership opportunities.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <h3 className="text-lg font-medium text-emerald-400">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* What we expect */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">What We Expect</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Reliability",
              description:
                "Show up on time, complete your assignments, and communicate proactively if anything changes.",
            },
            {
              title: "Quality Standards",
              description:
                "Follow checklists, use proper techniques, and take pride in delivering consistent results.",
            },
            {
              title: "Documentation Compliance",
              description:
                "Maintain valid insurance and certifications. Submit completion evidence through the portal.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <h3 className="text-lg font-medium text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Important notice */}
      <section className="mt-16">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-5">
          <p className="text-sm font-medium text-amber-300">Important Notice</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            All roles begin as temporary part-time contracts and evolve with
            demonstrated performance toward full-time opportunities. This is a
            merit-based progression — your reliability, quality of work, and
            professionalism determine your path forward.
          </p>
        </div>
      </section>

      {/* Application form */}
      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Apply Now</h2>
        <p className="mt-2 text-zinc-400">
          Complete the form below to start your application. We review
          applications within 3 business days.
        </p>
        <div className="mt-8">
          <ApplicationForm />
        </div>
      </section>
    </div>
  );
}
