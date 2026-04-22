import { Header } from "@/components/header";
import AuditClient from "./_components/audit-client";

export default function AdminAuditPage() {
  return (
    <>
      <Header title="Audit log" subtitle="Sensitive admin actions across the portal" />
      <div className="p-8">
        <AuditClient />
      </div>
    </>
  );
}
