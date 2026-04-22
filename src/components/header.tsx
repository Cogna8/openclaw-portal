import { ThemeToggle } from "@/components/theme-toggle";

export function Header({ title }: { title: string }) {
  return (
    <header className="flex items-center justify-between border-b border-[oklch(var(--border))] bg-[oklch(var(--background))] px-6 py-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <ThemeToggle />
    </header>
  );
}
