import { ThemeToggle } from "@/components/theme-toggle";

export function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-[oklch(var(--border))] bg-[oklch(var(--background))] px-6 py-4">
      <div className="flex items-baseline gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && (
          <span className="text-sm text-[oklch(var(--muted-foreground))]">
            · {subtitle}
          </span>
        )}
      </div>
      <ThemeToggle />
    </header>
  );
}
