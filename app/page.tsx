import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HexGridBackground } from "@/components/hex-grid-background";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <HexGridBackground />

      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 10 }}>
        <ThemeToggle />
      </div>

      <div className="relative z-[1] w-full max-w-[560px] px-6">
        <div className="rounded-[var(--radius)] border border-[oklch(var(--border))] bg-[oklch(var(--card))] p-12 text-center backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[oklch(var(--primary))] text-base font-semibold text-[oklch(var(--primary-foreground))]">
              C8
            </div>
            <span className="text-base font-semibold">Cogna8 · OpenClaw</span>
          </div>

          <h1 className="mb-3 mt-2 text-[28px] font-semibold leading-tight">
            Safety and Action Control for AI Agents
          </h1>

          <p className="mx-auto max-w-[480px] text-[15px] leading-[1.65] text-[oklch(var(--muted-foreground))]">
            OpenClaw is a free, open-source plugin that blocks risky actions before your agents can run them. Stop accidental and unwanted file overwrites, rogue commands, and anything else you&apos;d rather your agents not touch. Installs in two minutes.
          </p>

          <div className="mt-5 flex justify-center">
            <SignInButton />
          </div>

          <p className="mt-3 text-xs text-[oklch(var(--muted-foreground))]">
            Free · No credit card ·{" "}
            <a
              href="https://github.com/cogna8/openclaw"
              target="_blank"
              rel="noreferrer"
              className="underline hover:no-underline"
            >
              Read the guide on GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
