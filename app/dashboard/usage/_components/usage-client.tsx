"use client";

import { useEffect, useMemo, useState } from "react";

type UsageDto = {
  limit: number;
  used: number;
  mode: "normal" | "degraded";
  periodStart: string | null;
  periodEnd: string | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/usage", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load usage");
        setUsage(data.usage);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load usage");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const percent = useMemo(() => {
    if (!usage || usage.limit <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((usage.used / usage.limit) * 100)));
  }, [usage]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Usage</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Track your monthly evaluation usage and current service mode.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
          Loading usage...
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && usage && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-sm text-zinc-400">Evaluations this period</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {usage.used.toLocaleString()} / {usage.limit.toLocaleString()}
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-full rounded-full bg-[#C65A20]"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-sm text-zinc-400">Current mode</div>
              <div className="mt-3">
                <span
                  className={
                    usage.mode === "normal"
                      ? "rounded-full bg-emerald-950 px-3 py-1 text-sm text-emerald-300"
                      : "rounded-full bg-amber-950 px-3 py-1 text-sm text-amber-300"
                  }
                >
                  {usage.mode === "normal" ? "Normal" : "Degraded"}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-sm text-zinc-400">Period</div>
              <div className="mt-2 text-lg font-medium text-white">
                {formatPeriod(usage.periodStart, usage.periodEnd)}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-sm leading-6 text-zinc-300">
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
