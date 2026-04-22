"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RecommendedPoliciesBanner } from "@/components/recommended-policies-banner";
import { StartHerePanel } from "@/components/start-here-panel";

type UsageDto = {
  limit: number;
  used: number;
  mode: "normal" | "degraded";
  periodStart: string | null;
  periodEnd: string | null;
};

type KeyDto = {
  id: string;
  status: string;
};

type Role = "user" | "admin" | "super_admin";

function formatPeriod(start: string | null, end: string | null) {
  if (!start || !end) return "No active period";
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString(undefined, { day: "numeric", month: "short" })} - ${e.toLocaleDateString(
    undefined,
    { day: "numeric", month: "short", year: "numeric" },
  )}`;
}

export default function OverviewClient({
  role,
  userName,
}: {
  role: Role;
  userName: string | null;
}) {
  const [usage, setUsage] = useState<UsageDto | null>(null);
  const [activeKeys, setActiveKeys] = useState<number | null>(null);
  const [totalKeys, setTotalKeys] = useState<number | null>(null);
  const [agentsCount, setAgentsCount] = useState<number | null>(null);
  const [enabledPoliciesCount, setEnabledPoliciesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [usageRes, keysRes, agentsRes, policiesRes] = await Promise.all([
          fetch("/api/usage", { cache: "no-store" }),
          fetch("/api/keys", { cache: "no-store" }),
          fetch("/api/agents?status=active", { cache: "no-store" }),
          fetch("/api/policies", { cache: "no-store" }),
        ]);

        if (cancelled) return;

        if (!usageRes.ok) throw new Error("Failed to load usage");
        if (!keysRes.ok) throw new Error("Failed to load keys");
        if (!agentsRes.ok) throw new Error("Failed to load agents");
        if (!policiesRes.ok) throw new Error("Failed to load policies");

        const usageData = await usageRes.json();
        const keysData = await keysRes.json();
        const agentsData = await agentsRes.json();
        const policiesData = await policiesRes.json();

        if (cancelled) return;

        setUsage(usageData.usage);
        const keys = Array.isArray(keysData.keys) ? keysData.keys : [];
        setTotalKeys(keys.length);
        setActiveKeys(keys.filter((k: KeyDto) => k.status === "active").length);

        const agents = Array.isArray(agentsData.agents) ? agentsData.agents : [];
        setAgentsCount(agents.length);

        const policies = Array.isArray(policiesData.policies) ? policiesData.policies : [];
        setEnabledPoliciesCount(policies.filter((p: any) => p.enabled).length);

        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load overview");
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

  const percent =
    usage && usage.limit > 0
      ? Math.max(0, Math.min(100, Math.round((usage.used / usage.limit) * 100)))
      : 0;

  const showAdmin = role === "admin" || role === "super_admin";

  return (
    <div className="space-y-6">
      <StartHerePanel
        userName={userName}
        agentsCount={agentsCount ?? 0}
        enabledPoliciesCount={enabledPoliciesCount ?? 0}
      />
      <RecommendedPoliciesBanner />

      {loading && !usage && (
        <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
          Loading overview...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-200">
          {error}
        </div>
      )}

      {usage && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">
                Evaluations this period
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {usage.used.toLocaleString()} / {usage.limit.toLocaleString()}
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#C65A20]"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {formatPeriod(usage.periodStart, usage.periodEnd)}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">Service mode</div>
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
              <p className="mt-3 text-xs text-muted-foreground">
                {usage.mode === "normal"
                  ? "Evaluations are fully available within your monthly limit."
                  : "Service is protecting capacity after the current period limit was reached."}
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground">API keys</div>
              <div className="mt-2 text-2xl font-semibold">
                {activeKeys ?? 0}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  active
                </span>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {totalKeys ?? 0} total {(totalKeys ?? 0) === 1 ? "key" : "keys"} on this account
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Jump to
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Link
                href="/dashboard/usage"
                className="rounded-3xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <div className="text-base font-medium">Usage</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  See detailed evaluation counts and current billing period.
                </p>
              </Link>

              <Link
                href="/dashboard/keys"
                className="rounded-3xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <div className="text-base font-medium">API Keys</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create, label, and revoke keys used by your OpenClaw plugin.
                </p>
              </Link>

              {showAdmin ? (
                <Link
                  href="/dashboard/admin/users"
                  className="rounded-3xl border border-border bg-card p-5 transition-colors hover:border-primary"
                >
                  <div className="text-base font-medium">Admin</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage users, plans, and view audit logs.
                  </p>
                </Link>
              ) : (
                <div className="rounded-3xl border border-border bg-card p-5 opacity-60">
                  <div className="text-base font-medium">Install the plugin</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Setup guide coming soon. See openclaw-plugin on GitHub in the meantime.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
