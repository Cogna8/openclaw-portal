"use client";

import { useCallback, useEffect, useState } from "react";
import AuditDetailModal from "./audit-detail-modal";

type AuditRow = {
  id: string;
  actorPortalUserId: string;
  actorEmail: string;
  action:
    | "user_block"
    | "user_unblock"
    | "user_role_promote"
    | "user_role_demote"
    | "account_plan_change"
    | "account_limits_change"
    | "account_status_change";
  targetType: "portal_user" | "openclaw_account";
  targetId: string;
  targetLabel: string | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
  createdAt: string;
};

const ACTIONS: AuditRow["action"][] = [
  "user_block",
  "user_unblock",
  "user_role_promote",
  "user_role_demote",
  "account_plan_change",
  "account_limits_change",
  "account_status_change",
];

export default function AuditClient() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<AuditRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (actor) qs.set("actor", actor);
      if (action) qs.set("action", action);
      if (targetType) qs.set("targetType", targetType);
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const res = await fetch(`/api/admin/audit?${qs.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load audit log");
      setRows(data.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit log");
    } finally {
      setLoading(false);
    }
  }, [actor, action, targetType, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Audit log</h1>
        <p className="mt-1 text-sm text-zinc-400">
          All admin actions with before and after snapshots.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          placeholder="Actor email"
          className="w-60 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
        />
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
        >
          <option value="">All targets</option>
          <option value="portal_user">Portal user</option>
          <option value="openclaw_account">OpenClaw account</option>
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
        />
      </div>

      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
          Loading audit log...
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">When</th>
                <th className="px-4 py-3 text-left font-medium">Actor</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Target</th>
                <th className="px-4 py-3 text-right font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                    No audit entries match these filters.
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white">{r.actorEmail}</td>
                  <td className="px-4 py-3 text-zinc-200">{r.action}</td>
                  <td className="px-4 py-3">
                    <div className="text-zinc-200">{r.targetLabel || r.targetId}</div>
                    <div className="text-xs text-zinc-500">{r.targetType}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDetail(r)}
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-200 hover:bg-zinc-900"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AuditDetailModal row={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
