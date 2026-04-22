"use client";

import { useEffect, useState } from "react";
import type { UserRow } from "./users-client";

type Props = {
  user: UserRow | null;
  onClose: () => void;
  onChanged: () => void;
};

export default function RoleChangeDialog({ user, onClose, onChanged }: Props) {
  const [role, setRole] = useState<"user" | "admin">("user");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setRole(user.role === "admin" ? "admin" : "user");
      setError(null);
    }
  }, [user]);

  if (!user) return null;
  const target = user;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${target.id}/role`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to change role");
      onChanged();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change role");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-foreground">Change role</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the portal role for <span className="text-foreground">{target.email}</span>.
        </p>

        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-3 rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground">
            <input
              type="radio"
              name="role"
              value="user"
              checked={role === "user"}
              onChange={() => setRole("user")}
            />
            <span>User</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground">
            <input
              type="radio"
              name="role"
              value="admin"
              checked={role === "admin"}
              onChange={() => setRole("admin")}
            />
            <span>Admin</span>
          </label>
        </div>

        {error && <div className="mt-3 text-sm text-destructive">{error}</div>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-sm text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={() => void save()}
            disabled={saving || role === target.role}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
