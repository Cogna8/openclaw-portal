"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RoleChangeDialog from "./role-change-dialog";
import BlockDialog from "./block-dialog";
import AccountEditDrawer from "./account-edit-drawer";
import { UserRowMenu } from "./user-row-menu";

type Role = "user" | "admin" | "super_admin";

type AccountSummary = {
  id: string;
  publicId: string;
  plan: "free" | "paid" | "enterprise";
  status: "active" | "suspended" | "closed";
  evaluationsLimitMonthly: number;
  maxAgents: number;
  maxRulesPerAgent: number;
} | null;

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  openclawAccountId: string | null;
  account: AccountSummary;
};

type Props = {
  viewerRole: Role;
  viewerEmail: string;
};

export default function UsersClient({ viewerRole, viewerEmail }: Props) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [roleTarget, setRoleTarget] = useState<UserRow | null>(null);
  const [blockTarget, setBlockTarget] = useState<UserRow | null>(null);
  const [accountTarget, setAccountTarget] = useState<UserRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (roleFilter) qs.set("role", roleFilter);
      if (statusFilter) qs.set("status", statusFilter);
      const res = await fetch(`/api/admin/users?${qs.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const isSuperAdmin = viewerRole === "super_admin";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">User management</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage portal users, their roles, and linked OpenClaw accounts.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name"
          className="w-64 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-600"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {loading && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-400">
          Loading users...
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
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Account</th>
                <th className="px-4 py-3 text-left font-medium">Last login</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {users.map((u) => {
                const isSelf = u.email === viewerEmail;
                const isProtectedTarget =
                  u.role === "super_admin" || u.email === "admin@cogna8.io";
                const canBlock =
                  !isSelf &&
                  !isProtectedTarget &&
                  (u.role === "user" || (u.role === "admin" && isSuperAdmin));
                const canChangeRole = !isSelf && !isProtectedTarget && isSuperAdmin;

                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <div className="text-white">{u.name || u.email}</div>
                      <div className="text-xs text-zinc-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge blocked={u.isBlocked} />
                    </td>
                    <td className="px-4 py-3">
                      {u.account ? (
                        <div className="text-zinc-200">
                          <div>{u.account.publicId}</div>
                          <div className="text-xs text-zinc-500">
                            {u.account.plan} / {u.account.status}
                          </div>
                        </div>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString()
                        : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(() => {
                        const menuItems: Array<
                          | {
                              kind: "button";
                              label: string;
                              onClick: () => void;
                              variant?: "default" | "danger";
                            }
                          | { kind: "separator" }
                        > = [];

                        if (canChangeRole) {
                          menuItems.push({
                            kind: "button",
                            label: "Change role",
                            onClick: () => setRoleTarget(u),
                          });
                        }
                        if (u.account) {
                          menuItems.push({
                            kind: "button",
                            label: "Edit account",
                            onClick: () => setAccountTarget(u),
                          });
                        }
                        if (canBlock) {
                          if (menuItems.length > 0) {
                            menuItems.push({ kind: "separator" });
                          }
                          menuItems.push({
                            kind: "button",
                            label: u.isBlocked ? "Unblock user" : "Block user",
                            onClick: () => setBlockTarget(u),
                            variant: u.isBlocked ? "default" : "danger",
                          });
                        }

                        return menuItems.length > 0 ? (
                          <UserRowMenu
                            items={menuItems}
                            label={`Actions for ${u.email}`}
                          />
                        ) : (
                          <span className="text-zinc-600">-</span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                    No users match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <RoleChangeDialog
        user={roleTarget}
        onClose={() => setRoleTarget(null)}
        onChanged={() => void load()}
      />

      <BlockDialog
        user={blockTarget}
        onClose={() => setBlockTarget(null)}
        onChanged={() => void load()}
      />

      <AccountEditDrawer
        user={accountTarget}
        onClose={() => setAccountTarget(null)}
        onSaved={() => void load()}
      />
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const label = useMemo(() => {
    if (role === "super_admin") return "Super admin";
    if (role === "admin") return "Admin";
    return "User";
  }, [role]);

  const cls =
    role === "super_admin"
      ? "inline-block whitespace-nowrap rounded-full bg-[#C65A20]/20 px-2.5 py-1 text-xs leading-none text-[#F0A078]"
      : role === "admin"
        ? "inline-block whitespace-nowrap rounded-full bg-amber-950 px-2.5 py-1 text-xs leading-none text-amber-300"
        : "inline-block whitespace-nowrap rounded-full bg-zinc-800 px-2.5 py-1 text-xs leading-none text-zinc-300";

  return <span className={cls}>{label}</span>;
}

function StatusBadge({ blocked }: { blocked: boolean }) {
  return blocked ? (
    <span className="inline-block whitespace-nowrap rounded-full bg-red-950 px-2.5 py-1 text-xs leading-none text-red-300">
      Blocked
    </span>
  ) : (
    <span className="inline-block whitespace-nowrap rounded-full bg-emerald-950 px-2.5 py-1 text-xs leading-none text-emerald-300">
      Active
    </span>
  );
}
