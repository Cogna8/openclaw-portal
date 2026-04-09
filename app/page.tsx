import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";

export default async function SignInPage() {
  const session = await auth();
  if (session) redirect("/dashboard");
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OpenClaw Portal</h1>
          <p className="mt-2 text-sm text-[oklch(var(--muted-foreground))]">Sign in to manage your agent governance</p>
        </div>
        <SignInButton />
        <p className="text-xs text-[oklch(var(--muted-foreground))]">Powered by Cogna8</p>
      </div>
    </div>
  );
}
