"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const APP_PREFIXES = ["/admin", "/client", "/jobs", "/schedule", "/map", "/earnings", "/profile", "/vendor", "/portal", "/account"];

export default function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const inApp = APP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  }

  if (!visible || inApp) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-zinc-800 bg-zinc-900/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <p className="text-sm text-zinc-300">
            We use essential cookies to keep you signed in and functional cookies to improve your experience.
          </p>
          <a href="/privacy" className="text-xs text-emerald-400 hover:text-emerald-300">
            Privacy policy
          </a>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brand-gold)] px-4 py-2 text-sm font-semibold text-[var(--brand-black)] hover:bg-[var(--brand-gold-light)]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
