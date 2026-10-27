const tones: Record<string, string> = {
  SCHEDULED: "border-blue-500/40 bg-blue-500/20 text-blue-200",
  COMPLETED_PENDING_APPROVAL: "border-amber-500/40 bg-amber-500/20 text-amber-200",
  APPROVED_PAYABLE: "border-emerald-500/40 bg-emerald-500/20 text-emerald-200",
  PAID: "border-zinc-500/40 bg-zinc-600/30 text-zinc-200",
  CANCELLED: "border-red-500/40 bg-red-500/20 text-red-200",
  Draft: "border-zinc-500/40 bg-zinc-600/30 text-zinc-200",
  Sent: "border-amber-500/40 bg-amber-500/20 text-amber-200",
  Paid: "border-emerald-500/40 bg-emerald-500/20 text-emerald-200",
  Void: "border-red-500/40 bg-red-500/20 text-red-200",
  PASS: "text-emerald-300",
  FAIL: "text-red-300",
  NA: "text-zinc-400",
};

export default function Status({ value, label }: { value: string; label?: string }) {
  const tone = tones[value] ?? "border-zinc-500/40 bg-zinc-800 text-zinc-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {label ?? value}
    </span>
  );
}
