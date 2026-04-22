"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Article } from "@/lib/support/articles";

export default function ArticleSubnav({ articles }: { articles: Article[] }) {
  const pathname = usePathname();

  return (
    <nav className="w-64 shrink-0 overflow-y-auto border-r border-border bg-background p-4">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Support
      </p>
      <ul className="space-y-1">
        {articles.map((article) => {
          const href = `/dashboard/support/${article.slug}`;
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={article.slug}>
              <Link
                href={href}
                className={
                  active
                    ? "block rounded-md bg-muted px-3 py-2 text-sm font-medium text-foreground"
                    : "block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }
              >
                {article.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
