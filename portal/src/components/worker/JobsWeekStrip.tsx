"use client";

import { useRouter } from "next/navigation";

export default function JobsWeekStrip({
  selectedDate,
  jobDates,
}: {
  selectedDate: string;
  jobDates: string[];
}) {
  const router = useRouter();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days: { date: string; label: string; dayName: string; isToday: boolean; hasJobs: boolean }[] = [];
  for (let i = -1; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    days.push({
      date: iso,
      label: d.getDate().toString(),
      dayName: d.toLocaleDateString("en", { weekday: "short" }),
      isToday: i === 0,
      hasJobs: jobDates.includes(iso),
    });
  }

  return (
    <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-2">
      <button
        onClick={() => router.push("/jobs")}
        className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium ${
          !selectedDate || selectedDate === "" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
        }`}
      >
        All
      </button>
      {days.map((day) => (
        <button
          key={day.date}
          onClick={() => router.push(`/jobs?date=${day.date}`)}
          className={`relative flex shrink-0 flex-col items-center rounded-xl px-3 py-2 text-xs transition-colors ${
            selectedDate === day.date
              ? "bg-emerald-600 text-white"
              : day.isToday
              ? "bg-zinc-800 text-white ring-1 ring-emerald-500/50"
              : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700"
          }`}
        >
          <span className="text-[10px] uppercase">{day.dayName}</span>
          <span className="font-semibold">{day.label}</span>
          {day.hasJobs && selectedDate !== day.date && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400" />
          )}
        </button>
      ))}
    </div>
  );
}
