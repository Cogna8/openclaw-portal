"use client";

type AuditRow = {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  before: unknown;
  after: unknown;
  metadata: unknown;
  createdAt: string;
};

type Props = {
  row: AuditRow | null;
  onClose: () => void;
};

export default function AuditDetailModal({ row, onClose }: Props) {
  if (!row) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{row.action}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {new Date(row.createdAt).toLocaleString()} by {row.actorEmail}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200"
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <Pair label="Target" value={`${row.targetLabel || row.targetId} (${row.targetType})`} />
          <Block label="Before" json={row.before} />
          <Block label="After" json={row.after} />
          {row.metadata !== null && row.metadata !== undefined && (
            <Block label="Metadata" json={row.metadata} />
          )}
        </div>
      </div>
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 text-white">{value}</div>
    </div>
  );
}

function Block({ label, json }: { label: string; json: unknown }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <pre className="mt-1 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900 p-3 font-mono text-xs text-zinc-200">
        {JSON.stringify(json ?? null, null, 2)}
      </pre>
    </div>
  );
}
