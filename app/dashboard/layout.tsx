import { Sidebar } from "@/components/sidebar";
import { MobileNavProvider } from "@/components/mobile-nav-context";
import { auth } from "@/lib/auth";
import { getSessionRole } from "@/lib/session-role";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = getSessionRole(session);

  return (
    <MobileNavProvider>
      <div className="flex h-screen">
        <Sidebar role={role} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </MobileNavProvider>
  );
}
