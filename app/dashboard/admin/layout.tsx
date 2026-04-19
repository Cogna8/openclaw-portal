import { requireAdminContext } from "@/lib/auth/admin-context";
import { redirect } from "next/navigation";
import AdminSubnav from "./_components/admin-subnav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdminContext();
  } catch {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-full flex-col">
      <AdminSubnav />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
