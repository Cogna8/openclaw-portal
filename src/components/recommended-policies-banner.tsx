"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PolicySummary = {
  id: string;
  name: string;
  default_enabled: boolean;
  enabled: boolean;
};

export function RecommendedPoliciesBanner() {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "hidden" }
    | { kind: "visible"; missing: PolicySummary[] }
    | { kind: "enabling" }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  async function loadInitial() {
    try {
      const res = await fetch("/api/policies", { cache: "no-store" });
      if (!res.ok) {
        // Silent hide — banner is a soft nudge, not a critical failure surface.
        // The user can still navigate to /dashboard/policies and see the real error there.
        setState({ kind: "hidden" });
        return;
      }
      const data = await res.json();
      const policies: PolicySummary[] = data.policies ?? [];
      const missing = policies.filter((p) => p.default_enabled && !p.enabled);
      if (missing.length === 0) {
        setState({ kind: "hidden" });
      } else {
        setState({ kind: "visible", missing });
      }
    } catch {
      setState({ kind: "hidden" });
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  async function enableAll(missing: PolicySummary[]) {
    setState({ kind: "enabling" });
    const errors: string[] = [];
    for (const p of missing) {
      try {
        const res = await fetch(
          `/api/policies/${encodeURIComponent(p.id)}/enable`,
          { method: "POST" },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          errors.push(`${p.name}: ${body.error ?? res.statusText}`);
        }
      } catch (e) {
        errors.push(
          `${p.name}: ${e instanceof Error ? e.message : "network error"}`,
        );
      }
    }
    if (errors.length > 0) {
      setState({ kind: "error", message: errors.join("; ") });
    } else {
      // Re-read so the banner hides if everything succeeded.
      await loadInitial();
    }
  }

  if (state.kind === "loading" || state.kind === "hidden") return null;

  if (state.kind === "error") {
    return (
      <div className="rounded-2xl border border-red-900 bg-red-950/30 p-5 text-sm text-red-200">
        Could not enable all recommended policies: {state.message}. You can retry
        from the{" "}
        <Link
          href="/dashboard/policies"
          className="underline underline-offset-2 hover:text-red-100"
        >
          Policies page
        </Link>
        .
      </div>
    );
  }

  if (state.kind === "enabling") {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-300">
        Enabling recommended policies...
      </div>
    );
  }

  // kind === "visible"
  return (
    <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-5">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-amber-100">
              No recommended policies are active
            </h3>
          </div>
          <p className="mt-1 text-sm text-amber-200/80">
            {state.missing.length} recommended{" "}
            {state.missing.length === 1 ? "policy" : "policies"} can protect your
            agents from risky actions like shell command execution, file deletion,
            file writes, and code execution.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href="/dashboard/policies"
            className="rounded-lg border border-amber-800 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-950/40"
          >
            Review
          </Link>
          <button
            type="button"
            onClick={() => enableAll(state.missing)}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-amber-50 hover:bg-amber-500"
          >
            Enable recommended
          </button>
        </div>
      </div>
    </div>
  );
}
