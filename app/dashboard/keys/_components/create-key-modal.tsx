"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateKeyModal({ open, onClose, onCreated }: Props) {
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawKey, setRawKey] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setLabel("");
      setLoading(false);
      setError(null);
      setRawKey(null);
    }
  }, [open]);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create key");
      setRawKey(data.rawKey);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!rawKey) return;
    await navigator.clipboard.writeText(rawKey);
  }

  function closeAndClear() {
    setRawKey(null);
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        {!rawKey ? (
          <>
            <h2 className="text-lg font-semibold text-foreground">Generate key</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Give this key a label so you can recognize it later.
            </p>
            <label className="mt-4 block text-sm text-foreground">
              Label
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={50}
                className="mt-2 w-full rounded-xl border border-border bg-muted px-3 py-2 text-foreground outline-none focus:border-border"
                placeholder="Production laptop"
              />
            </label>
            {error && <div className="mt-3 text-sm text-destructive">{error}</div>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2 text-sm text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => void submit()}
                disabled={loading || !label.trim()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate key"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground">Copy your key now</h2>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              This key will not be shown again. Copy it now.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-muted p-4 font-mono text-sm text-foreground break-all">
              {rawKey}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => void copy()}
                className="rounded-xl border border-border px-4 py-2 text-sm text-foreground"
              >
                Copy key
              </button>
              <button
                onClick={closeAndClear}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-foreground"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
