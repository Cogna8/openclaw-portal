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
          <h1 className="text-2xl font-semibold text-white">API Keys</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Create and manage the keys your OpenClaw plugin uses to talk to Cogna8.
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Generate key
          </button>
        )}
      </div>

      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
          Loading keys...
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-200">
          {error}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#C65A20]/15" />
          <h2 className="text-xl font-semibold text-white">Generate your first key</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-400">
            Your plugin uses an API key to send evaluation requests to Cogna8. Create a key,
            copy it once, and paste it into your OpenClaw plugin config.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="mt-6 rounded-xl bg-[#C65A20] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Generate key
          </button>
        </div>
      )}

      {!loading && !error && keys.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Label</th>
                <th className="px-4 py-3 text-left font-medium">Key</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {keys.map((key) => (
                <tr key={key.publicId}>
                  <td className="px-4 py-3 text-white">{key.label}</td>
                  <td className="px-4 py-3 text-zinc-300">•••• {key.lastFour}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        key.status === "active"
                          ? "rounded-full bg-emerald-950 px-2.5 py-1 text-xs text-emerald-300"
                          : "rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300"
                      }
                    >
                      {key.status === "active" ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {key.status === "active" ? (
                      <button
                        onClick={() => setRevokeTarget(key)}
                        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-900"
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
