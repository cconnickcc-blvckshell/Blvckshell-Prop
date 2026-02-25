"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/notifications/count")
      .then((r) => r.json())
      .then((d) => setCount(d.count ?? 0))
      .catch(() => {});
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-zinc-700 bg-zinc-900 p-3 shadow-2xl">
          <p className="text-xs font-medium text-zinc-400 mb-2">Notifications</p>
          {count === 0 ? (
            <p className="py-4 text-center text-xs text-zinc-500">All caught up</p>
          ) : (
            <div className="space-y-1">
              {count > 0 && (
                <Link
                  href="/admin/jobs"
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-lg p-2 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  {count} item{count > 1 ? "s" : ""} need{count === 1 ? "s" : ""} attention
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
