"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";

type SidebarRole = "user" | "admin" | "super_admin";

type NavItem = {
  name: string;
  href: string;
  disabled: boolean;
  roles?: SidebarRole[];
};

const navItems: NavItem[] = [
  { name: "Overview", href: "/dashboard", disabled: false },
  { name: "API Keys", href: "/dashboard/keys", disabled: false },
  { name: "Agents", href: "/dashboard/agents", disabled: false },
  { name: "Policies", href: "/dashboard/policies", disabled: false },
  { name: "Usage", href: "/dashboard/usage", disabled: false },
  { name: "Admin", href: "/dashboard/admin/users", disabled: false, roles: ["admin", "super_admin"] },
];

export function Sidebar({ role }: { role: SidebarRole }) {
  const pathname = usePathname();
  const visible = navItems.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-background p-4">
      <div className="mb-8 flex items-center gap-3 px-2">
        <Image src="/openclaw-mascot.png" alt="OpenClaw" width={48} height={48} />
        <div>
          <h1 className="text-lg font-semibold leading-tight">Cogna8</h1>
          <p className="text-xs text-muted-foreground">OpenClaw Portal</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {visible.map((item) => (
          <Link
            key={item.name}
            href={item.disabled ? "#" : item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              item.disabled
                ? "cursor-not-allowed opacity-40"
                : (item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/"))
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.name}
            {item.disabled && (
              <span className="ml-auto text-[10px] uppercase tracking-wider opacity-60">Soon</span>
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-auto">
        <UserMenu />
      </div>
    </aside>
  );
}
