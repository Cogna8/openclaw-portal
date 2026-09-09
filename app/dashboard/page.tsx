import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import OverviewClient from "./_components/overview-client";
import { getSessionRole } from "@/lib/session-role";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/");
  const role = getSessionRole(session);
  const userName = session?.user?.name ?? null;
  return (
    <>
      <Header title="Portal" subtitle="Agent policy enforcement for OpenClaw" />
      <div className="p-6">
        <OverviewClient role={role} userName={userName} />
      </div>
    </>
  );
}
