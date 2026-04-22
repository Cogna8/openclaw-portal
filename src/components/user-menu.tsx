"use client";
import { signOut, useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session } = useSession();
  if (!session?.user) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      {session.user.image && <img src={session.user.image} alt="" className="h-8 w-8 rounded-full" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
      </div>
      <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-muted-foreground hover:text-foreground">Sign out</button>
    </div>
  );
}
