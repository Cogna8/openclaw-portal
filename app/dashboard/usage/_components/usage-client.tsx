"use client";

import { useEffect, useMemo, useState } from "react";

type UsageDto = {
  limit: number;
  used: number;
  mode: "normal" | "degraded";
  periodStart: string | null;
  periodEnd: string | null;
};

type ApprovalsDto = {
  requested: number;
  resolved_allow: number;
  resolved_deny: number;
  resolved_timeout: number;
  unresolved: number;
};

type UsageResponse = {
  usage: UsageDto;
  approvals?: ApprovalsDto;
};

function formatPeriod(start: string | null, end: string | null) {
  if (!start || !end) return "No active period yet";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  })} - ${e.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

export default function UsageClient() {
  const [usage, setUsage] = useState<UsageDto | null>(null);
  const [approvals, setApprovals] = useState<ApprovalsDto | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/usage", { cache: "no-store" });
        const data: UsageResponse & { error?: string } = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to load usage");
        setUsage(data.usage);
        setApprovals(data.approvals);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load usage");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const percent = useMemo(() => {
    if (!usage || usage.limit <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((usage.used / usage.limit) * 100)));
  }, [usage]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Usage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your monthly evaluation usage and current service mode.
        </p>
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
          Loading usage...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && usage && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">Evaluations this period</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">
                {usage.used.toLocaleString()} / {usage.limit.toLocaleString()}
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">Current mode</div>
              <div className="mt-3">
                <span
                  className={
                    usage.mode === "normal"
                      ? "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-700 dark:text-emerald-400"
                      : "inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-700 dark:text-amber-400"
                  }
                >
                  {usage.mode === "normal" ? "Normal" : "Degraded"}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">Period</div>
              <div className="mt-2 text-lg font-medium text-foreground">
                {formatPeriod(usage.periodStart, usage.periodEnd)}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">Approvals this period</div>
              <div className="mt-2 text-2xl font-semibold text-foreground">
                {approvals ? approvals.requested.toLocaleString() : "—"}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {approvals
                  ? `${approvals.resolved_allow} allow / ${approvals.resolved_deny} deny / ${approvals.resolved_timeout} timeout / ${approvals.unresolved} unresolved`
                  : "— allow / — deny / — timeout / — unresolved"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 text-sm leading-6 text-foreground">
            <p>
              Normal mode means evaluations are fully available within your current monthly
              limit.
            </p>
            <p className="mt-3">
              Degraded mode means the service is protecting capacity after the current period
              limit is reached. Your period resets automatically at the start of the next usage
              window.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
