import { checkJobApprovalPreconditions } from "@/lib/preconditions";

export default async function JobPreflightPanel({ jobId }: { jobId: string }) {
  const result = await checkJobApprovalPreconditions(jobId);
  
  if (result.passed) return null; // Don't show if everything passes
  
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 shadow-xl">
      <h3 className="text-sm font-semibold text-amber-300">Approval blocked</h3>
      <ul className="mt-2 space-y-1">
        {result.failures.map((f) => (
          <li key={f.code} className="flex items-start gap-2 text-sm text-amber-200/80">
            <span className="mt-0.5 shrink-0">✕</span>
            <span>{f.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
