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
        <h1 className="text-2xl font-semibold text-foreground">User management</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage portal users, their roles, and linked OpenClaw accounts.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email or name"
          className="w-64 rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-border"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-border"
        >
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-border"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      {loading && (
        <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
          Loading users...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Account</th>
                <th className="px-4 py-3 text-left font-medium">Last login</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
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
                      <div className="text-foreground">{u.name || u.email}</div>
                      <div className="text-xs text-muted-foreground/70">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge blocked={u.isBlocked} />
                    </td>
                    <td className="px-4 py-3">
                      {u.account ? (
                        <div className="text-foreground">
                          <div>{u.account.publicId}</div>
                          <div className="text-xs text-muted-foreground/70">
                            {u.account.plan} / {u.account.status}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
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
                          <span className="text-muted-foreground/50">-</span>
                        );
                      })()}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground/70">
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
      ? "inline-block whitespace-nowrap rounded-full bg-primary/20 px-2.5 py-1 text-xs leading-none text-primary"
      : role === "admin"
        ? "inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
        : "inline-block whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-xs leading-none text-foreground";

  return <span className={cls}>{label}</span>;
}

function StatusBadge({ blocked }: { blocked: boolean }) {
  return blocked ? (
    <span className="inline-flex items-center rounded-full border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
      Blocked
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      Active
    </span>
  );
}
