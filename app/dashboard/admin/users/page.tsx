import { auth } from "@/lib/auth";
import { Header } from "@/components/header";
import UsersClient from "./_components/users-client";
import { getSessionRole } from "@/lib/session-role";

export default async function AdminUsersPage() {
  const session = await auth();
  const viewerRole = getSessionRole(session);
  const viewerEmail = session?.user?.email ?? "";

  return (
    <>
      <Header title="Users" subtitle="Accounts, roles, and portal access" />
      <div className="p-8">
        <UsersClient viewerRole={viewerRole} viewerEmail={viewerEmail} />
      </div>
    </>
  );
}
