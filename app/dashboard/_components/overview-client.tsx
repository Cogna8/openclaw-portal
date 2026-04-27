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
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(options?: { background?: boolean }) {
      if (cancelled) return;
      if (options?.background) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }
      try {
        const [usageRes, keysRes, onboardingRes] = await Promise.all([
          fetch("/api/usage", { cache: "no-store" }),
          fetch("/api/keys", { cache: "no-store" }),
          fetch("/api/onboarding", { cache: "no-store" }),
        ]);

        if (cancelled) return;

        if (!usageRes.ok) throw new Error("Failed to load usage");
        if (!keysRes.ok) throw new Error("Failed to load keys");

        const usageData: UsageResponse = await usageRes.json();
        const keysData = await keysRes.json();

        if (cancelled) return;

        setUsage(usageData.usage);
        const keys = Array.isArray(keysData.keys) ? keysData.keys : [];
        setTotalKeys(keys.length);
        setActiveKeys(keys.filter((k: KeyDto) => k.status === "active").length);

        // Onboarding is optional - failure hides the panel, never blocks the dashboard
        if (onboardingRes.ok) {
          try {
            const onboardingData = await onboardingRes.json();
            setOnboardingCompleted(Boolean(onboardingData.completed));
          } catch {
            setOnboardingCompleted(true);
          }
        } else {
          setOnboardingCompleted(true);
        }

        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load overview");
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      }
    }

    void load();
    const interval = setInterval(() => void load({ background: true }), 5000);
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
      {onboardingCompleted === false && (
        <StartHerePanel userName={userName} />
      )}
      <RecommendedPoliciesBanner />

      {refreshing && usage && (
        <p className="text-xs text-muted-foreground">Refreshing…</p>
      )}

      {initialLoading && !usage && (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Loading overview...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {usage && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="text-sm text-muted-foreground">
                Evaluations this period
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
                {usage.used.toLocaleString()}
                <span className="ml-1 text-lg font-normal text-muted-foreground">
                  / {usage.limit.toLocaleString()}
                </span>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {formatPeriod(usage.periodStart, usage.periodEnd)}
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="text-sm text-muted-foreground">Service mode</div>
              <div className="mt-3">
                <span
                  className={
                    usage.mode === "normal"
                      ? "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
                      : "inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
                  }
                >
                  <span
                    className={
                      usage.mode === "normal"
                        ? "h-1.5 w-1.5 rounded-full bg-emerald-500"
                        : "h-1.5 w-1.5 rounded-full bg-amber-500"
                    }
                  />
                  {usage.mode === "normal" ? "Normal" : "Degraded"}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {usage.mode === "normal"
                  ? "Evaluations are fully available within your monthly limit."
                  : "Service is protecting capacity after the current period limit was reached."}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="text-sm text-muted-foreground">API keys</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight">
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
                className="rounded-xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <div className="text-base font-medium">Usage</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  See detailed evaluation counts and current billing period.
                </p>
              </Link>

              <Link
                href="/dashboard/keys"
                className="rounded-xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent"
              >
                <div className="text-base font-medium">API Keys</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create, label, and revoke keys used by your OpenClaw plugin.
                </p>
              </Link>

              {showAdmin ? (
                <Link
                  href="/dashboard/admin/users"
                  className="rounded-xl border bg-card p-6 shadow-sm transition-colors hover:border-primary/40 hover:bg-accent"
                >
                  <div className="text-base font-medium">Admin</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Manage users, plans, and view audit logs.
                  </p>
                </Link>
              ) : (
                <div className="rounded-xl border bg-card p-6 opacity-60 shadow-sm">
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
