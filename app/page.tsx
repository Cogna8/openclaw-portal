import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import { SignInButton } from "@/components/sign-in-button";
import { ThemeToggle } from "@cogna8/ui/components/brand/theme-toggle";
import { HexGridBackground } from "@cogna8/ui/components/brand/hex-grid-background";
import { Card, CardContent } from "@cogna8/ui/components/ui/card";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <HexGridBackground />
      <div className="fixed top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="relative z-[1] w-full max-w-[560px] px-6">
        <Card className="backdrop-blur-sm shadow-lg transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl">
          <CardContent className="flex flex-col items-center gap-5 p-12 text-center">
            <Image src="/openclaw-mascot.png" alt="OpenClaw" width={140} height={132} priority />
            <span className="text-base font-semibold">Cogna8 · OpenClaw</span>
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
              Safety and Action Control for
              <br />
              AI Agents
            </h1>
            <p className="max-w-[480px] text-[15px] leading-[1.65] text-muted-foreground">
              OpenClaw is a free, open-source plugin that blocks risky actions. Stop accidental and unwanted file overwrites, rogue commands, and anything else you&apos;d rather your agents not touch.
            </p>
            <p className="text-[15px] leading-[1.65] text-muted-foreground">
              Installs in two minutes.
            </p>
            <SignInButton />
            <p className="text-xs text-muted-foreground">
              Free · No credit card ·{" "}
              <a href="https://github.com/cogna8/openclaw" target="_blank" rel="noreferrer" className="underline hover:no-underline">
                Read the guide on GitHub
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
