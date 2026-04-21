"use client";

import { useEffect, useState } from "react";

type AgentDto = {
  publicId: string;
  externalId: string;
  name: string;
  source: "openclaw";
  status: "active" | "archived";
  pluginVersion: string | null;
  agentVersion: string | null;
  toolsRegisteredCount: number;
  activeRulesCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.round((now - then) / 1000));
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isRecentlyActive(iso: string): boolean {
  const diffMin = (Date.now() - new Date(iso).getTime()) / 1000 / 60;
  return diffMin < 15;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
    >
      {copied ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function AgentsClient() {
  const [agents, setAgents] = useState<AgentDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [pendingPublicId, setPendingPublicId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const query = showArchived ? "?status=all" : "?status=active";
        const res = await fetch(`/api/agents${query}`, { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data.error || "Failed to load agents");
        setAgents(data.agents ?? []);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load agents");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    void load();
    const interval = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [showArchived]);

  async function archiveAgent(publicId: string, next: "archive" | "unarchive") {
    setPendingPublicId(publicId);
    try {
      const res = await fetch(
        `/api/agents/${encodeURIComponent(publicId)}/${next}`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${next} agent`);

      const query = showArchived ? "?status=all" : "?status=active";
      const refetch = await fetch(`/api/agents${query}`, { cache: "no-store" });
      const refetchData = await refetch.json();
      if (!refetch.ok) {
        throw new Error(refetchData.error || "Failed to refresh agents");
      }
      setAgents(refetchData.agents ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${next} agent`);
    } finally {
      setPendingPublicId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Agents</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Agents registered by Cogna8 plugins installed in OpenClaw. Agents appear here
            automatically when a plugin makes its first request.
          </p>
        </div>
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-zinc-300"
          />
          Show archived
        </label>
      </div>

      {loading && !agents && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
          Loading agents...
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-900 bg-red-950/30 p-6 text-red-200">
          {error}
        </div>
      )}

      {agents && agents.length === 0 && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
          <div className="text-base font-medium text-white">
            {showArchived ? "No agents" : "No agents yet"}
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Install the Cogna8 OpenClaw plugin, configure it with an API key, and make a
            tool call in OpenClaw. Your agent will appear here within a few seconds.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://github.com/Cogna8/openclaw-plugin"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              Plugin on GitHub
            </a>
            <a
              href="/dashboard/keys"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-900"
            >
              Get an API key
            </a>
          </div>
        </div>
      )}

      {agents && agents.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-900/60 text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Agent</th>
                <th className="px-4 py-3 text-left font-medium">Public ID</th>
                <th className="px-4 py-3 text-left font-medium">Source</th>
                <th className="px-4 py-3 text-left font-medium">Plugin</th>
                <th className="px-4 py-3 text-left font-medium">Last seen</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {agents.map((a) => {
                const recent = isRecentlyActive(a.lastSeenAt);
                const isArchived = a.status === "archived";
                const pending = pendingPublicId === a.publicId;
                return (
                  <tr
                    key={a.publicId}
                    className={isArchived ? "opacity-60" : undefined}
                  >
                    <td className="px-4 py-3">
                      <div className="text-white">{a.name}</div>
                      <div className="text-xs text-zinc-500">
                        external_id: {a.externalId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center font-mono text-xs text-zinc-300">
                        {a.publicId}
                        <CopyButton value={a.publicId} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{a.source}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      {a.pluginVersion ? (
                        <span className="font-mono text-xs">v{a.pluginVersion}</span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="text-zinc-200"
                        title={formatAbsolute(a.lastSeenAt)}
                      >
                        {formatRelative(a.lastSeenAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-950 px-2.5 py-1 text-xs leading-none text-emerald-300">
                          {recent && (
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
                              aria-hidden="true"
                            />
                          )}
                          {recent ? "Live" : "Active"}
                        </span>
                      ) : (
                        <span className="inline-block whitespace-nowrap rounded-full bg-zinc-800 px-2.5 py-1 text-xs leading-none text-zinc-400">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          archiveAgent(
                            a.publicId,
                            isArchived ? "unarchive" : "archive",
                          )
                        }
                        disabled={pending}
                        className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-200 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {pending
                          ? "..."
                          : isArchived
                            ? "Unarchive"
                            : "Archive"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
