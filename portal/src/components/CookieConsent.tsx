"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

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

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-zinc-800 bg-zinc-900/95 backdrop-blur-sm p-4 shadow-2xl">
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
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
