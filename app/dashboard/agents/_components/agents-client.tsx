"use client";

import { useEffect, useRef, useState } from "react";

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

type AgentArchiveOp = {
  opId: number;
  publicId: string;
  next: "archive" | "unarchive";
  snapshot: AgentDto | null;
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [pendingAgentIds, setPendingAgentIds] = useState<Set<string>>(
    () => new Set(),
  );
  const loadRef = useRef<((options?: { background?: boolean }) => Promise<void>) | null>(null);

  const nextAgentOpId = useRef(1);
  const agentsRef = useRef<AgentDto[] | null>(null);
  const agentOpsRef = useRef<Map<string, AgentArchiveOp>>(new Map());

  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  function updateAgents(
    updater: (current: AgentDto[] | null) => AgentDto[] | null,
  ) {
    setAgents((current) => {
      const next = updater(current);
      agentsRef.current = next;
      return next;
    });
  }

  function addPendingAgentId(publicId: string) {
    setPendingAgentIds((current) => {
      const next = new Set(current);
      next.add(publicId);
      return next;
    });
  }

  function removePendingAgentId(publicId: string) {
    setPendingAgentIds((current) => {
      const next = new Set(current);
      next.delete(publicId);
      return next;
    });
  }

  function isCurrentAgentOp(op: AgentArchiveOp): boolean {
    return agentOpsRef.current.get(op.publicId)?.opId === op.opId;
  }

  function applyPendingAgentPatches(serverAgents: AgentDto[]): AgentDto[] {
    let result = [...serverAgents];

    for (const op of agentOpsRef.current.values()) {
      if (!showArchived && op.next === "archive") {
        result = result.filter((agent) => agent.publicId !== op.publicId);
        continue;
      }

      result = result.map((agent) =>
        agent.publicId === op.publicId
          ? {
              ...agent,
              status: op.next === "archive" ? "archived" : "active",
            }
          : agent,
      );
    }

    return result;
  }

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
        const query = showArchived ? "?status=all" : "?status=active";
        const res = await fetch(`/api/agents${query}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load agents");
        if (!cancelled) {
          updateAgents(() => applyPendingAgentPatches(data.agents ?? []));
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load agents");
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadRef.current = load;
    void load();
    const interval = setInterval(() => void load({ background: true }), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [showArchived]);

  async function archiveAgent(publicId: string, next: "archive" | "unarchive") {
    if (
      pendingAgentIds.has(publicId) ||
      agentOpsRef.current.has(publicId)
    ) {
      return;
    }

    const snapshot =
      agentsRef.current?.find((agent) => agent.publicId === publicId) ?? null;

    const op: AgentArchiveOp = {
      opId: nextAgentOpId.current++,
      publicId,
      next,
      snapshot,
    };

    agentOpsRef.current.set(publicId, op);
    addPendingAgentId(publicId);
    setError(null);

    updateAgents((current) => {
      if (!current) return current;

      if (!showArchived && next === "archive") {
        return current.filter((agent) => agent.publicId !== publicId);
      }

      return current.map((agent) =>
        agent.publicId === publicId
          ? {
              ...agent,
              status: next === "archive" ? "archived" : "active",
            }
          : agent,
      );
    });

    try {
      const res = await fetch(
        `/api/agents/${encodeURIComponent(publicId)}/${next}`,
        { method: "POST" },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${next} agent`);

      if (isCurrentAgentOp(op)) {
        agentOpsRef.current.delete(publicId);
        removePendingAgentId(publicId);
      }

      void loadRef.current?.({ background: true });
    } catch (e) {
      if (isCurrentAgentOp(op)) {
        agentOpsRef.current.delete(publicId);
        removePendingAgentId(publicId);

        if (op.snapshot) {
          updateAgents((current) => {
            if (!current) return [op.snapshot!];

            const without = current.filter(
              (agent) => agent.publicId !== publicId,
            );

            const shouldShowSnapshot =
              showArchived || op.snapshot!.status === "active";

            return shouldShowSnapshot ? [op.snapshot!, ...without] : without;
          });
        } else {
          void loadRef.current?.({ background: true });
        }

        setError(e instanceof Error ? e.message : `Failed to ${next} agent`);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        {refreshing && agents ? (
          <span className="text-xs text-muted-foreground">Refreshing…</span>
        ) : (
          <span />
        )}
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
          Show archived
        </label>
      </div>

      {initialLoading && !agents && (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground shadow-sm">
          Loading agents...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {agents && agents.length === 0 && (
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="text-base font-medium">
            {showArchived ? "No agents" : "No agents yet"}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Install the Cogna8 OpenClaw plugin, configure it with an API key, and make a
            tool call in OpenClaw. Your agent will appear here within a few seconds.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="https://github.com/Cogna8/openclaw-plugin"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent"
            >
              Plugin on GitHub
            </a>
            <a
              href="/dashboard/keys"
              className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm hover:bg-accent"
            >
              Get an API key
            </a>
          </div>
        </div>
      )}

      {agents && agents.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
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
            <tbody className="divide-y divide-border">
              {agents.map((a) => {
                const recent = isRecentlyActive(a.lastSeenAt);
                const isArchived = a.status === "archived";
                const pending = pendingAgentIds.has(a.publicId);
                return (
                  <tr
                    key={a.publicId}
                    className={isArchived ? "opacity-60" : undefined}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{a.name}</div>
                      <div className="text-xs text-muted-foreground">
                        external_id: {a.externalId}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex items-center font-mono text-xs text-muted-foreground">
                        {a.publicId}
                        <CopyButton value={a.publicId} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{a.source}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.pluginVersion ? (
                        <span className="font-mono text-xs">v{a.pluginVersion}</span>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="text-foreground"
                        title={formatAbsolute(a.lastSeenAt)}
                      >
                        {formatRelative(a.lastSeenAt)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {a.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {recent && (
                            <span
                              className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
                              aria-hidden="true"
                            />
                          )}
                          {recent ? "Live" : "Active"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center whitespace-nowrap rounded-full border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
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
                        className="rounded-md border bg-background px-3 py-1 text-xs transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
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
