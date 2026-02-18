"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

interface WorkerNavProps {
  userName: string;
  role: string;
}

export default function WorkerNav({ userName, role }: WorkerNavProps) {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/jobs" className="text-xl font-bold text-gray-900">
              BLVCKSHELL Portal
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/jobs" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Jobs
            </Link>
            {role === "VENDOR_OWNER" && (
              <>
                <Link href="/vendor/team" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Team
                </Link>
                <Link href="/vendor/jobs" className="text-sm font-medium text-gray-700 hover:text-gray-900">
                  Vendor Jobs
                </Link>
              </>
            )}
            <Link href="/earnings" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Earnings
            </Link>
            <Link href="/profile" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Profile
            </Link>
            <span className="text-sm text-gray-500">{userName}</span>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
