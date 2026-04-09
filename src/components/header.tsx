export function Header({ title }: { title: string }) {
  return (
    <header className="border-b border-[oklch(var(--border))] bg-[oklch(var(--background))] px-6 py-4">
      <h2 className="text-lg font-semibold">{title}</h2>
    </header>
  );
}
