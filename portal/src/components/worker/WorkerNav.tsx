"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const workerTabs = [
  { href: "/jobs", label: "Jobs", icon: "briefcase" },
  { href: "/schedule", label: "Schedule", icon: "calendar" },
  { href: "/map", label: "Map", icon: "map" },
  { href: "/earnings", label: "Earnings", icon: "dollar" },
  { href: "/profile", label: "Profile", icon: "user" },
] as const;

const vendorTabs = [
  { href: "/vendor/team", label: "Team" },
  { href: "/vendor/jobs", label: "All Jobs" },
  { href: "/vendor/earnings", label: "Payouts" },
];

function TabIcon({ name, className }: { name: string; className?: string }) {
  const cn = className ?? "h-6 w-6";
  switch (name) {
    case "briefcase":
      return <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
    case "calendar":
      return <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
    case "dollar":
      return <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    case "user":
      return <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
    case "map":
      return <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>;
    case "more":
      return <svg className={cn} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
    default:
      return null;
  }
}

export default function WorkerNav({ userName, role, jobsBadge = 0 }: { userName: string; role: string; jobsBadge?: number }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isVendorOwner = role === "VENDOR_OWNER";

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Top bar */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950">
        <div className="flex h-12 items-center justify-between px-4">
          <Link href="/jobs" className="text-base font-bold tracking-tight text-white">
            BLVCKSHELL
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500">{userName}</span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Vendor owner "More" panel */}
      {moreOpen && isVendorOwner && (
        <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)}>
          <div className="absolute bottom-20 left-0 right-0 border-t border-zinc-800 bg-zinc-900 p-4" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Vendor Management</p>
            <div className="grid grid-cols-3 gap-3">
              {vendorTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMoreOpen(false)}
                  className={`rounded-xl p-3 text-center text-sm font-medium ${
                    isActive(tab.href)
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {workerTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive(tab.href) ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              <TabIcon name={tab.icon} />
              {tab.href === "/jobs" && jobsBadge > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                  {jobsBadge > 9 ? "9+" : jobsBadge}
                </span>
              )}
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          ))}
          {isVendorOwner && (
            <button
              type="button"
              onClick={() => setMoreOpen(!moreOpen)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                moreOpen || vendorTabs.some((t) => isActive(t.href))
                  ? "text-emerald-400"
                  : "text-zinc-500"
              }`}
            >
              <TabIcon name="more" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
