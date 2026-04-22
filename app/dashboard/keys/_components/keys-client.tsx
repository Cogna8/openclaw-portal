"use client";

import { useEffect, useMemo, useState } from "react";
import CreateKeyModal from "./create-key-modal";
import RevokeKeyDialog from "./revoke-key-dialog";

type ApiKeyRow = {
  id: string;
  publicId: string;
  label: string;
  lastFour: string;
  status: "active" | "revoked";
  createdAt: string;
  issuedAt?: string;
  revokedAt?: string | null;
  lastUsedAt?: string | null;
};

export default function KeysClient() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load keys");
      const data = await res.json();
      setKeys(data.keys ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const isEmpty = useMemo(
    () => !loading && keys.length === 0,
    [loading, keys.length]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">API Keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage the keys your OpenClaw plugin uses to talk to Cogna8.
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Generate key
          </button>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
          Loading keys...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-xl bg-primary/15" />
          <h2 className="text-xl font-semibold text-foreground">Generate your first key</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Your plugin uses an API key to send evaluation requests to Cogna8. Create a key,
            copy it once, and paste it into your OpenClaw plugin config.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-6 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-foreground hover:opacity-90"
          >
            Generate key
          </button>
        </div>
      )}

      {!loading && !error && keys.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Label</th>
                <th className="px-4 py-3 text-left font-medium">Key</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {keys.map((key) => (
                <tr key={key.publicId}>
                  <td className="px-4 py-3 text-foreground">{key.label}</td>
                  <td className="px-4 py-3 text-foreground">•••• {key.lastFour}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        key.status === "active"
                          ? "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                          : "rounded-full bg-muted px-2.5 py-1 text-xs text-foreground"
                      }
                    >
                      {key.status === "active" ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {key.status === "active" ? (
                      <button
                        onClick={() => setRevokeTarget(key)}
                        className="rounded-lg border border-border px-3 py-1.5 text-foreground hover:bg-muted"
                      >
                        Revoke
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateKeyModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => void load()}
      />

      <RevokeKeyDialog
        keyRow={revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onRevoked={() => void load()}
      />
    </div>
  );
}
