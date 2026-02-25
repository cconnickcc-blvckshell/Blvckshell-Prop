"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useCallback } from "react";

interface FilterOption {
  key: string;
  label: string;
  type: "select" | "text" | "date";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export default function FilterBar({ filters }: { filters: FilterOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  const handleSearch = useCallback(() => {
    updateParam("q", search.trim());
  }, [search, updateParam]);

  const clearAll = useCallback(() => {
    router.push(pathname);
    setSearch("");
  }, [router, pathname]);

  const hasFilters = Array.from(searchParams.entries()).length > 0;

  return (
    <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">Search</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by name, address..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </div>
        </div>

        {/* Filter selects/inputs */}
        {filters.map((filter) => (
          <div key={filter.key} className="min-w-[140px]">
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-zinc-500">{filter.label}</label>
            {filter.type === "select" && filter.options ? (
              <select
                value={searchParams.get(filter.key) ?? ""}
                onChange={(e) => updateParam(filter.key, e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              >
                <option value="">All</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : filter.type === "date" ? (
              <input
                type="date"
                value={searchParams.get(filter.key) ?? ""}
                onChange={(e) => updateParam(filter.key, e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              />
            ) : null}
          </div>
        ))}

        {hasFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
