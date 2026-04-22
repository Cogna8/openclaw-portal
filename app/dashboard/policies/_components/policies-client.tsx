"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { buildVariantRows } from "@/lib/policy-variants";

type VariantRule = {
  public_id: string;
  agent_public_id: string;
  tool_match: string;
  status: "active" | "disabled" | "removed";
};

type VariantDetailed = {
  pattern: string;
  description: string;
};

type PolicyItem = {
  id: string;
  name: string;
  description: string;
  default_enabled: boolean;
  enabled: boolean;
  enabled_at: string | null;
  variants: string[];
  variants_detailed?: VariantDetailed[];
  rules: VariantRule[];
};

type ListResponse = { policies: PolicyItem[] };

function countActiveRules(policy: PolicyItem): number {
  return policy.rules.filter((r) => r.status === "active").length;
}

/* ───────── Components ───────── */

function Toggle({
  checked,
  disabled,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 focus-visible:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-emerald-600" : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm text-zinc-400">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PolicyCard({
  policy,
  onToggle,
  onDeleteVariant,
  pending,
}: {
  policy: PolicyItem;
  onToggle: (templateId: string, nextEnabled: boolean) => Promise<void>;
  onDeleteVariant: (rulePublicId: string) => Promise<void>;
  pending: { toggling: boolean; deletingRuleId: string | null };
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const rows = useMemo(() => buildVariantRows(policy), [policy]);
  const activeCount = countActiveRules(policy);

  async function handleToggleChange(next: boolean) {
    if (next) {
      await onToggle(policy.id, true);
    } else {
      setConfirmDisable(true);
    }
  }

  async function confirmDisableNow() {
    try {
      await onToggle(policy.id, false);
    } finally {
      setConfirmDisable(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950">
        <div className="flex items-start gap-4 p-5">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-zinc-100">{policy.name}</h3>
              {policy.default_enabled && (
                <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                  Recommended
                </span>
              )}
              {policy.enabled && (
                <span className="rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400">
                  Active
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-400">{policy.description}</p>
            <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
              <span>{policy.variants.length} variants defined</span>
              {policy.enabled && (
                <>
                  <span>·</span>
                  <span>{activeCount} active rule{activeCount === 1 ? "" : "s"}</span>
                </>
              )}
            </div>
          </div>
          <Toggle
            checked={policy.enabled}
            disabled={pending.toggling}
            onChange={handleToggleChange}
            ariaLabel={policy.enabled ? `Disable ${policy.name}` : `Enable ${policy.name}`}
          />
        </div>

        {policy.enabled && (
          <div className="border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="flex w-full items-center justify-between px-5 py-3 text-sm hover:bg-zinc-900"
              style={{ color: "oklch(var(--primary))" }}
              aria-expanded={expanded}
            >
              <span>{expanded ? "Hide" : "Show"} variant rules</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {expanded && (
              <div className="divide-y divide-zinc-900 border-t border-zinc-900">
                {rows.map((row) => (
                  <div key={row.tool_match} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <code className="rounded bg-zinc-900 px-2 py-0.5 font-mono text-xs text-zinc-200">
                          {row.tool_match}
                        </code>
                        {row.description && (
                          <div className="mt-1 text-xs text-zinc-500">{row.description}</div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {row.rules.length === 0 ? (
                          <span className="text-xs text-zinc-500">No active rule</span>
                        ) : (
                          <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-400">
                            Blocked on {row.rules.length} agent{row.rules.length === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>

                    {row.rules.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {row.rules.map((r) => (
                          <li
                            key={r.public_id}
                            className="flex items-center justify-between text-xs text-zinc-400"
                          >
                            <span className="font-mono">{r.agent_public_id}</span>
                            <button
                              type="button"
                              onClick={() => onDeleteVariant(r.public_id)}
                              disabled={pending.deletingRuleId === r.public_id}
                              className="rounded px-2 py-1 text-zinc-500 transition-colors hover:bg-red-950 hover:text-red-400 disabled:opacity-50"
                              aria-label={`Delete rule for ${r.agent_public_id}`}
                              title="Delete this variant for this agent"
                            >
                              {pending.deletingRuleId === r.public_id ? "..." : "Delete"}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmDisable}
        title={`Disable "${policy.name}"?`}
        description={`Disabling will remove all ${activeCount} active rule${activeCount === 1 ? "" : "s"} for this policy across all connected agents. Agents will be allowed to use the matching tools again. You can re-enable at any time.`}
        confirmLabel="Disable policy"
        onConfirm={confirmDisableNow}
        onCancel={() => setConfirmDisable(false)}
        busy={pending.toggling}
      />
    </>
  );
}

/* ───────── Page ───────── */

export default function PoliciesClient() {
  const [policies, setPolicies] = useState<PolicyItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function load() {
    try {
      const res = await fetch("/api/policies", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load policies");
      if (!mountedRef.current) return;
      setPolicies((data as ListResponse).policies ?? []);
      setError(null);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Failed to load policies");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function togglePolicy(templateId: string, nextEnabled: boolean) {
    setTogglingId(templateId);
    try {
      const path = nextEnabled ? "enable" : "disable";
      const res = await fetch(
        `/api/policies/${encodeURIComponent(templateId)}/${path}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${path} policy`);
      await load();
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Toggle failed");
    } finally {
      if (mountedRef.current) setTogglingId(null);
    }
  }

  async function deleteVariantRule(rulePublicId: string) {
    setDeletingRuleId(rulePublicId);
    try {
      const res = await fetch(
        `/api/policies/rules/${encodeURIComponent(rulePublicId)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      await load();
    } catch (e) {
      if (!mountedRef.current) return;
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      if (mountedRef.current) setDeletingRuleId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-100">Policies</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Predefined rules that block risky agent actions. Toggle a policy on to apply it to all
          connected agents. New agents registered later inherit whatever is enabled here.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
          Loading policies...
        </div>
      )}

      {!loading && policies && policies.length === 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
          No policies available.
        </div>
      )}

      {!loading && policies && policies.length > 0 && (
        <div className="space-y-4">
          {policies.map((policy) => (
            <PolicyCard
              key={policy.id}
              policy={policy}
              onToggle={togglePolicy}
              onDeleteVariant={deleteVariantRule}
              pending={{
                toggling: togglingId === policy.id,
                deletingRuleId: deletingRuleId,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
