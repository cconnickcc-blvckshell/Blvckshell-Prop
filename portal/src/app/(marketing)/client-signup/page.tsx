import type { Metadata } from "next";
import ClientSignupForm from "./ClientSignupForm";

export const metadata: Metadata = {
  title: "Client Sign Up | BLVCKSHELL",
  description:
    "Get started with BLVCKSHELL facilities services. Sign up for a client portal account to manage your properties.",
};

export default function ClientSignupPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Get Started with BLVCKSHELL
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          Access the BLVCKSHELL portal to manage your properties, view job
          completions, track compliance, and approve invoices — all in one place.
        </p>
      </section>

      <div className="mx-auto mt-12 max-w-xl">
        <ClientSignupForm />
      </div>
    </div>
  );
}
