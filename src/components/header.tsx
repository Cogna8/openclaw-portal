"use client";

import { List, X } from "@phosphor-icons/react";
import { ThemeToggle } from "./theme-toggle";
import { useMobileNav } from "./mobile-nav-context";

export function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { isOpen, toggle } = useMobileNav();

  return (
    <header className="flex items-center justify-between gap-3 border-b bg-background px-4 py-6 sm:px-6 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isOpen}
          className="-ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-foreground hover:bg-muted md:hidden"
        >
          {isOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
