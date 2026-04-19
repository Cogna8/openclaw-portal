"use client";

import { useEffect, useState } from "react";
import type { UserRow } from "./users-client";

type Props = {
  user: UserRow | null;
  onClose: () => void;
  onSaved: () => void;
};

type Plan = "free" | "paid" | "enterprise";

export default function AccountEditDrawer({ user, onClose, onSaved }: Props) {
  const [plan, setPlan] = useState<Plan>("free");
  const [evals, setEvals] = useState("10000");
  const [maxAgents, setMaxAgents] = useState("3");
  const [maxRules, setMaxRules] = useState("25");
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.account) {
      setPlan(user.account.plan);
      setEvals(String(user.account.evaluationsLimitMonthly));
      setMaxAgents(String(user.account.maxAgents));
      setMaxRules(String(user.account.maxRulesPerAgent));
      setError(null);
    }
  }, [user]);

  if (!user || !user.account) return null;
  const account = user.account;

  async function savePlan() {
    setSavingPlan(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts/${account.id}/plan`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update plan");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update plan");
    } finally {
      setSavingPlan(false);
    }
  }

  async function saveLimits() {
    setSavingLimits(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/accounts/${account.id}/limits`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          evaluationsLimitMonthly: Number(evals),
          maxAgents: Number(maxAgents),
          maxRulesPerAgent: Number(maxRules),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to update limits");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update limits");
    } finally {
      setSavingLimits(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70">
      <div className="flex h-full w-full max-w-lg flex-col border-l border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit account</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {account.publicId} (owner {user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-6 overflow-y-auto">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h3 className="text-sm font-semibold text-white">Plan</h3>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as Plan)}
              className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
            >
              <option value="free">Free</option>
              <option value="paid">Paid</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => void savePlan()}
                disabled={savingPlan || plan === account.plan}
                className="rounded-xl bg-[#C65A20] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingPlan ? "Saving..." : "Save plan"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
            <h3 className="text-sm font-semibold text-white">Limits</h3>

            <label className="mt-3 block text-xs text-zinc-400">
              Evaluations per month
              <input
                type="number"
                min={1}
                value={evals}
                onChange={(e) => setEvals(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              />
            </label>

            <label className="mt-3 block text-xs text-zinc-400">
              Max agents
              <input
                type="number"
                min={1}
                value={maxAgents}
                onChange={(e) => setMaxAgents(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              />
            </label>

            <label className="mt-3 block text-xs text-zinc-400">
              Max rules per agent
              <input
                type="number"
                min={1}
                value={maxRules}
                onChange={(e) => setMaxRules(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
              />
            </label>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => void saveLimits()}
                disabled={savingLimits}
                className="rounded-xl bg-[#C65A20] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingLimits ? "Saving..." : "Save limits"}
              </button>
            </div>
          </section>

          {error && <div className="text-sm text-red-300">{error}</div>}
        </div>
      </div>
    </div>
  );
}
