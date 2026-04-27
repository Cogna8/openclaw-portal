"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@cogna8/ui/components/ui/alert";
import { Button } from "@cogna8/ui/components/ui/button";

type PolicySummary = {
  id: string;
  name: string;
  default_enabled: boolean;
  enabled: boolean;
};

export function RecommendedPoliciesBanner() {
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "hidden" }
    | { kind: "visible"; missing: PolicySummary[] }
    | { kind: "enabling" }
    | { kind: "error"; message: string }
  >({ kind: "loading" });

  async function loadInitial() {
    try {
      const res = await fetch("/api/policies", { cache: "no-store" });
      if (!res.ok) {
        // Silent hide — banner is a soft nudge, not a critical failure surface.
        // The user can still navigate to /dashboard/policies and see the real error there.
        setState({ kind: "hidden" });
        return;
      }
      const data = await res.json();
      const policies: PolicySummary[] = data.policies ?? [];
      const missing = policies.filter((p) => p.default_enabled && !p.enabled);
      if (missing.length === 0) {
        setState({ kind: "hidden" });
      } else {
        setState({ kind: "visible", missing });
      }
    } catch (error) {
      console.warn("[recommended-policies-banner] initial load failed", error);
      setState({ kind: "hidden" });
    }
  }

  useEffect(() => {
    loadInitial();
  }, []);

  async function enableAll(missing: PolicySummary[]) {
    setState({ kind: "enabling" });
    const errors: string[] = [];
    for (const p of missing) {
      try {
        const res = await fetch(
          `/api/policies/${encodeURIComponent(p.id)}/enable`,
          { method: "POST" },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          errors.push(`${p.name}: ${body.error ?? res.statusText}`);
        }
      } catch (e) {
        console.warn("[recommended-policies-banner] enable failed", e);
        errors.push(
          `${p.name}: ${e instanceof Error ? e.message : "network error"}`,
        );
      }
    }
    if (errors.length > 0) {
      setState({ kind: "error", message: errors.join("; ") });
    } else {
      // Re-read so the banner hides if everything succeeded.
      await loadInitial();
    }
  }

  if (state.kind === "loading" || state.kind === "hidden") return null;

  if (state.kind === "error") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not enable all recommended policies</AlertTitle>
        <AlertDescription>
          {state.message}. You can retry from the{" "}
          <Link
            href="/dashboard/policies"
            className="underline underline-offset-2"
          >
            Policies page
          </Link>
          .
        </AlertDescription>
      </Alert>
    );
  }

  if (state.kind === "enabling") {
    return (
      <Alert>
        <AlertTitle>Enabling recommended policies</AlertTitle>
        <AlertDescription>
          Applying recommended protections to your connected agents...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="flex items-start gap-4">
      <div className="flex-1">
        <AlertTitle className="text-base">
          No recommended policies are active
        </AlertTitle>
        <AlertDescription className="mt-1">
          {state.missing.length} recommended{" "}
          {state.missing.length === 1 ? "policy" : "policies"} can protect your
          agents from risky actions like shell command execution, file deletion,
          file writes, and code execution.
        </AlertDescription>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/policies">Review</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => enableAll(state.missing)}
        >
          Enable recommended
        </Button>
      </div>
    </Alert>
  );
}
