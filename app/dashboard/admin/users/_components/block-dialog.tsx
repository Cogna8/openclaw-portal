"use client";

import { useState } from "react";
import type { UserRow } from "./users-client";

type Props = {
  user: UserRow | null;
  onClose: () => void;
  onChanged: () => void;
};

export default function BlockDialog({ user, onClose, onChanged }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const target = user;
  const willBlock = !target.isBlocked;

  async function confirm() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${target.id}/block`, {
        method: willBlock ? "POST" : "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update status");
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-foreground">
          {willBlock ? "Block user" : "Unblock user"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {willBlock
            ? "Blocked users cannot sign in and their existing session is invalidated on next request."
            : "Unblocking restores sign-in access."}
        </p>
        <p className="mt-3 text-sm text-foreground">{target.email}</p>

        {error && <div className="mt-3 text-sm text-destructive">{error}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={() => void confirm()}
            disabled={saving}
            className={
              willBlock
                ? "rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                : "rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
            }
          >
            {saving
              ? "Saving..."
              : willBlock
                ? "Confirm block"
                : "Confirm unblock"}
          </button>
        </div>
      </div>
    </div>
  );
}
