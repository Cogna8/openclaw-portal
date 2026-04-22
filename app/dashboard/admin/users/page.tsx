import { auth } from "@/lib/auth";
import { Header } from "@/components/header";
import UsersClient from "./_components/users-client";

export default async function AdminUsersPage() {
  const session = await auth();
  const viewerRole = ((session as any)?.role ?? "user") as
    | "user"
    | "admin"
    | "super_admin";
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
