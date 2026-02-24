"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ProfileEditor({
  userId,
  name,
  phone,
}: {
  userId: string;
  name: string;
  phone: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editName, setEditName] = useState(name);
  const [editPhone, setEditPhone] = useState(phone);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const res = await fetch("/api/worker/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName, phone: editPhone }),
        });
        const data = await res.json();
        if (data.success) {
          setSuccess(true);
          setEditing(false);
          router.refresh();
        } else {
          setError(data.error ?? "Failed to update");
        }
      } catch {
        setError("Network error");
      }
    });
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-400">Personal Info</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            Edit
          </button>
        )}
      </div>
      {error && (
        <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">{error}</div>
      )}
      {success && (
        <div className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-emerald-300">Profile updated</div>
      )}
      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-500">Phone</label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setEditName(name); setEditPhone(phone); }}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Name</span>
            <span className="text-zinc-200">{name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Phone</span>
            <span className="text-zinc-200">{phone || "Not set"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
