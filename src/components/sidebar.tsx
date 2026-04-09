"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";

const navItems = [
  { name: "Dashboard", href: "/dashboard", disabled: false },
  { name: "API Keys", href: "/dashboard/api-keys", disabled: true },
  { name: "Setup Guide", href: "/dashboard/setup", disabled: true },
  { name: "Settings", href: "/dashboard/settings", disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-[oklch(var(--border))] bg-[oklch(var(--background))] p-4">
      <div className="mb-8 px-2">
        <h1 className="text-lg font-semibold">Cogna8</h1>
        <p className="text-xs text-[oklch(var(--muted-foreground))]">OpenClaw Portal</p>
      </div>
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.disabled ? "#" : item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              item.disabled ? "cursor-not-allowed opacity-40"
                : pathname === item.href ? "text-[oklch(var(--primary))]"
                : "text-[oklch(var(--muted-foreground))] hover:text-[oklch(var(--foreground))]"
            }`}
          >
            {item.name}
            {item.disabled && <span className="ml-auto text-[10px] uppercase tracking-wider opacity-60">Soon</span>}
          </Link>
        ))}
      </nav>
      <div className="mt-auto"><UserMenu /></div>
    </aside>
  );
}
