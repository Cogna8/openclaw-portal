"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard/admin/users", label: "Users" },
  { href: "/dashboard/admin/stats", label: "Stats" },
  { href: "/dashboard/admin/audit", label: "Audit" },
];

export default function AdminSubnav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-2 border-b border-zinc-900 bg-zinc-950 px-8 py-3">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={
              active
                ? "rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-white"
            }
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
