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
        <h1 className="text-2xl font-semibold text-foreground">Global stats</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Portal-wide users, accounts, and evaluation usage.
        </p>
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
          Loading stats...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
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
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground">Accounts by plan</h3>
              <div className="mt-3 space-y-2 text-sm text-foreground">
                <Row label="Free" value={stats.accounts.byPlan.free} />
                <Row label="Paid" value={stats.accounts.byPlan.paid} />
                <Row label="Enterprise" value={stats.accounts.byPlan.enterprise} />
              </div>
            </section>
            <section className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground">Accounts by status</h3>
              <div className="mt-3 space-y-2 text-sm text-foreground">
                <Row label="Active" value={stats.accounts.byStatus.active} />
                <Row label="Suspended" value={stats.accounts.byStatus.suspended} />
                <Row label="Closed" value={stats.accounts.byStatus.closed} />
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Top accounts by usage</h3>
            {stats.topAccounts.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground/70">No usage data yet.</p>
            ) : (
              <table className="mt-3 min-w-full text-sm">
                <thead className="text-muted-foreground/70">
                  <tr>
                    <th className="py-2 text-left font-medium">Account</th>
                    <th className="py-2 text-left font-medium">Evaluations</th>
                    <th className="py-2 text-left font-medium">Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.topAccounts.map((a) => (
                    <tr key={a.publicId}>
                      <td className="py-2 text-foreground">{a.publicId}</td>
                      <td className="py-2 text-foreground">
                        {a.evaluationsUsed.toLocaleString()}
                      </td>
                      <td className="py-2">
                        <span
                          className={
                            a.mode === "normal"
                              ? "inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                              : "inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
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
            <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                Accounts in degraded mode
              </h3>
              <ul className="mt-3 space-y-1 text-sm text-amber-700 dark:text-amber-200">
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
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div
        className={
          tone === "red"
            ? "mt-2 text-2xl font-semibold text-destructive"
            : "mt-2 text-2xl font-semibold text-foreground"
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
      <span className="font-medium text-foreground">{value.toLocaleString()}</span>
    </div>
  );
}
