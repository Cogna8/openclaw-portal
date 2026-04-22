"use client";

import Link from "next/link";

type Props = {
  userName: string | null;
  agentsCount: number;
  enabledPoliciesCount: number;
};

export function StartHerePanel({
  userName,
  agentsCount,
  enabledPoliciesCount,
}: Props) {
  const step2Done = agentsCount > 0;
  const step3Done = enabledPoliciesCount > 0;
  const allDone = step2Done && step3Done;

  if (allDone) return null;

  const firstName = userName?.split(" ")[0] ?? "there";

  return (
    <div
      className="mb-5 rounded-[var(--radius)] p-6"
      style={{
        border: "1px solid oklch(var(--primary) / 0.4)",
        background: "oklch(var(--primary) / 0.05)",
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className="h-2 w-2 rounded-full"
          style={{ background: "oklch(var(--primary))" }}
        />
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "oklch(var(--primary))" }}
        >
          Start here
        </span>
      </div>

      <h3 className="mb-1 text-[17px] font-semibold">
        Welcome{userName ? `, ${firstName}` : ""}. Let&apos;s get your first agent protected.
      </h3>

      <p className="mb-3 text-sm text-[oklch(var(--muted-foreground))]">
        Three quick steps. Most people finish in under five minutes.
      </p>

      <Step n={1} done={step2Done} title="Install the OpenClaw plugin">
        Follow the readme on{" "}
        <a
          href="https://github.com/cogna8/openclaw"
          target="_blank"
          rel="noreferrer"
          className="underline hover:no-underline"
          style={{ color: "oklch(var(--primary))" }}
        >
          github.com/cogna8/openclaw
        </a>
        . Works with Claude Code and any MCP-compatible agent.
      </Step>

      <Step n={2} done={step2Done} title="Connect your agent with an API key">
        Create a key on the{" "}
        <Link
          href="/dashboard/keys"
          className="underline hover:no-underline"
          style={{ color: "oklch(var(--primary))" }}
        >
          API Keys
        </Link>{" "}
        page, paste it into the plugin config. Your agent will show up on the Agents page within a minute.
      </Step>

      <Step n={3} done={step3Done} title="Turn on the policies you want">
        Head to{" "}
        <Link
          href="/dashboard/policies"
          className="underline hover:no-underline"
          style={{ color: "oklch(var(--primary))" }}
        >
          Policies
        </Link>{" "}
        and toggle on what matters. Shell, file delete, file write, and code exec are recommended.
      </Step>

      <div className="border-t border-[oklch(var(--border))] pt-3 text-xs text-[oklch(var(--muted-foreground))]">
        Stuck?{" "}
        <a
          href="https://github.com/cogna8/openclaw/issues"
          target="_blank"
          rel="noreferrer"
          className="underline hover:no-underline"
        >
          Open an issue on GitHub
        </a>
        . This panel hides once all steps are done.
      </div>
    </div>
  );
}

function Step({
  n,
  done,
  title,
  children,
}: {
  n: number;
  done: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 border-t border-[oklch(var(--border))] py-3">
      <div
        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium"
        style={
          done
            ? {
                background: "oklch(var(--primary))",
                color: "oklch(var(--primary-foreground))",
              }
            : {
                border: "1.5px solid oklch(var(--border))",
                color: "oklch(var(--muted-foreground))",
              }
        }
      >
        {done ? "✓" : n}
      </div>

      <div className="flex-1">
        <p className="mb-0.5 text-sm font-medium">{title}</p>
        <p className="text-[13px] leading-[1.6] text-[oklch(var(--muted-foreground))]">
          {children}
        </p>
      </div>
    </div>
  );
}
