import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");
  return (
    <>
      <Header title="Dashboard" />
      <div className="p-6">
        <div className="rounded-xl border border-[oklch(var(--border))] bg-[oklch(var(--card))] p-6">
          <h3 className="text-lg font-semibold">Welcome to Cogna8 OpenClaw</h3>
          <p className="mt-2 text-sm text-[oklch(var(--muted-foreground))]">Your OpenClaw account is ready.</p>
          <div className="mt-6 rounded-md border border-[oklch(var(--border))] p-4">
            <p className="text-sm font-medium">Next step: API Keys</p>
            <p className="mt-1 text-xs text-[oklch(var(--muted-foreground))]">API key management is coming in Pack 6.2.</p>
          </div>
        </div>
      </div>
    </>
  );
}
