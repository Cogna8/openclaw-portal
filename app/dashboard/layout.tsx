import { Sidebar } from "@/components/sidebar";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = (((session as any)?.role ?? (session as any)?.user?.role ?? "user") as
    | "user"
    | "admin"
    | "super_admin");

  return (
    <div className="flex h-screen">
      <Sidebar role={role} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
