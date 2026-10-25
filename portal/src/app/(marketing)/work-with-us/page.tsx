import type { Metadata } from "next";
import ApplicationForm from "./ApplicationForm";

export const metadata: Metadata = {
  title: "Careers — Work With BLVCKSHELL",
  description:
    "Employee-led commercial cleaning careers in Windsor–Essex. Cleaning Technician, Team Lead, and future supervisor paths.",
};

const roles = [
  "Cleaning Technician",
  "Senior Cleaning Technician",
  "Team Lead",
  "Future Site Supervisor",
] as const;

export default function WorkWithUsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Careers at BLVCKSHELL</h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          BLVCKSHELL welcomes expressions of interest from qualified cleaning professionals as our client portfolio
          develops. Employment opportunities depend on available contracts and operational requirements—not every
          submission represents an immediate opening.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-white">Potential roles</h2>
        <ul className="mt-4 flex flex-wrap justify-center gap-3">
          {roles.map((role) => (
            <li
              key={role}
              className="rounded-full border border-[var(--brand-gold-dark)]/50 px-4 py-2 text-sm text-[var(--brand-gold-light)]"
            >
              {role}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-left">
        <h2 className="text-lg font-semibold text-white">Employee-led operations</h2>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          Our primary delivery model is employee-led local service with standardized training and site-specific work
          instructions. Subcontractor applications may be accepted separately where explicitly authorized—they are not
          the default path presented on this page.
        </p>
      </section>

      <section className="mt-12">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-5">
          <p className="text-sm font-medium text-amber-300">Applicant pool notice</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-300">
            Submitting an application creates an expression of interest. If an opening matches your qualifications and
            location, our team will contact you. Please distinguish employee applications from separately authorized
            subcontractor submissions in the form.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-semibold text-white">Apply</h2>
        <p className="mt-2 text-zinc-400">
          Complete the form below. Do not include sensitive personal data beyond what is requested.
        </p>
        <div className="mt-8">
          <ApplicationForm />
        </div>
      </section>
    </div>
  );
}
