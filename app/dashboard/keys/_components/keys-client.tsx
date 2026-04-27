"use client";

import { useEffect, useMemo, useState } from "react";
import CreateKeyModal from "./create-key-modal";
import RevokeKeyDialog from "./revoke-key-dialog";

export type ApiKeyRow = {
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null);

  async function load(options?: { background?: boolean }) {
    if (options?.background) {
      setRefreshing(true);
    } else {
      setInitialLoading(true);
    }
    try {
      const res = await fetch("/api/keys", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load keys");
      setKeys(data.keys ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys");
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const isEmpty = useMemo(
    () => !initialLoading && !error && keys.length === 0,
    [initialLoading, error, keys.length]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">API Keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage the keys your OpenClaw plugin uses to talk to Cogna8.
          </p>
          {refreshing && keys.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">Refreshing…</p>
          )}
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

      {initialLoading && keys.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
          Loading keys...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {keys.length > 0 ? `Refresh failed: ${error}` : error}
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

      {keys.length > 0 && (
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
        onCreated={(key) => {
          setKeys((current) => {
            const withoutDuplicate = current.filter((k) => k.publicId !== key.publicId);
            return [key, ...withoutDuplicate];
          });
          void load({ background: true });
        }}
      />

      <RevokeKeyDialog
        keyRow={revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onRevoked={(publicId) => {
          const now = new Date().toISOString();
          setKeys((current) =>
            current.map((key) =>
              key.publicId === publicId
                ? { ...key, status: "revoked" as const, revokedAt: key.revokedAt ?? now }
                : key,
            ),
          );
          void load({ background: true });
        }}
      />
    </div>
  );
}
