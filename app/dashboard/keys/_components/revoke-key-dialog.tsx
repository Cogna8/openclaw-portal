"use client";

type KeyRow = {
  publicId: string;
  label: string;
} | null;

type Props = {
  keyRow: KeyRow;
  onClose: () => void;
  onRevoked: () => void;
};

export default function RevokeKeyDialog({ keyRow, onClose, onRevoked }: Props) {
  if (!keyRow) return null;

  const target = keyRow;

  async function revoke() {
    const res = await fetch(`/api/keys/${target.publicId}`, { method: "DELETE" });
    if (res.ok) {
      onClose();
      onRevoked();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-white">Revoke {target.label}?</h2>
        <p className="mt-2 text-sm text-zinc-400">
          This key will stop working immediately. Revoked keys stay in the list for reference.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={() => void revoke()}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Confirm revoke
          </button>
        </div>
      </div>
    </div>
  );
}
