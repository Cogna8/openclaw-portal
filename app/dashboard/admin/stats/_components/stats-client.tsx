"use client";

import { useEffect, useState } from "react";

type Stats = {
  users: {
    total: number;
    activeLast30Days: number;
    signedInLast7Days: number;
    blocked: number;
  };
  evaluations: {
    currentPeriodTotal: number;
    lifetimeTotal: number;
    byMode: { normal: number; degraded: number };
  };
  accounts: {
    total: number;
    byPlan: { free: number; paid: number; enterprise: number };
    byStatus: { active: number; suspended: number; closed: number };
  };
  topAccounts: Array<{
    publicId: string;
    evaluationsUsed: number;
    mode: "normal" | "degraded";
  }>;
  degradedAccounts: Array<{
    publicId: string;
    evaluationsUsed: number;
    mode: "normal" | "degraded";
  }>;
};

export default function StatsClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load stats");
        setStats(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Global stats</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Portal-wide users, accounts, and evaluation usage.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
          Loading stats...
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card label="Total users" value={stats.users.total} />
            <Card label="Active (30d)" value={stats.users.activeLast30Days} />
            <Card label="Signed in (7d)" value={stats.users.signedInLast7Days} />
            <Card label="Blocked" value={stats.users.blocked} tone="red" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card label="Accounts" value={stats.accounts.total} />
            <Card
              label="Evaluations this period"
              value={stats.evaluations.currentPeriodTotal}
            />
            <Card
              label="Lifetime evaluations"
              value={stats.evaluations.lifetimeTotal}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <h3 className="text-sm font-semibold text-white">Accounts by plan</h3>
              <div className="mt-3 space-y-2 text-sm text-zinc-300">
                <Row label="Free" value={stats.accounts.byPlan.free} />
                <Row label="Paid" value={stats.accounts.byPlan.paid} />
                <Row label="Enterprise" value={stats.accounts.byPlan.enterprise} />
              </div>
            </section>
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
              <h3 className="text-sm font-semibold text-white">Accounts by status</h3>
              <div className="mt-3 space-y-2 text-sm text-zinc-300">
                <Row label="Active" value={stats.accounts.byStatus.active} />
                <Row label="Suspended" value={stats.accounts.byStatus.suspended} />
                <Row label="Closed" value={stats.accounts.byStatus.closed} />
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="text-sm font-semibold text-white">Top accounts by usage</h3>
            {stats.topAccounts.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">No usage data yet.</p>
            ) : (
              <table className="mt-3 min-w-full text-sm">
                <thead className="text-zinc-500">
                  <tr>
                    <th className="py-2 text-left font-medium">Account</th>
                    <th className="py-2 text-left font-medium">Evaluations</th>
                    <th className="py-2 text-left font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {stats.topAccounts.map((a) => (
                    <tr key={a.publicId}>
                      <td className="py-2 text-white">{a.publicId}</td>
                      <td className="py-2 text-zinc-300">
                        {a.evaluationsUsed.toLocaleString()}
                      </td>
                      <td className="py-2">
                        <span
                          className={
                            a.mode === "normal"
                              ? "rounded-full bg-emerald-950 px-2.5 py-1 text-xs text-emerald-300"
                              : "rounded-full bg-amber-950 px-2.5 py-1 text-xs text-amber-300"
                          }
                        >
                          {a.mode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {stats.degradedAccounts.length > 0 && (
            <section className="rounded-3xl border border-amber-900 bg-amber-950/20 p-5">
              <h3 className="text-sm font-semibold text-amber-200">
                Accounts in degraded mode
              </h3>
              <ul className="mt-3 space-y-1 text-sm text-amber-100">
                {stats.degradedAccounts.map((a) => (
                  <li key={a.publicId}>
                    {a.publicId} - {a.evaluationsUsed.toLocaleString()} evaluations
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "red";
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="text-sm text-zinc-400">{label}</div>
      <div
        className={
          tone === "red"
            ? "mt-2 text-2xl font-semibold text-red-300"
            : "mt-2 text-2xl font-semibold text-white"
        }
      >
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-white">{value.toLocaleString()}</span>
    </div>
  );
}
