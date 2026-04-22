import { Header } from "@/components/header";
import PoliciesClient from "./_components/policies-client";

export default function DashboardPoliciesPage() {
  return (
    <>
      <Header title="Policies" subtitle="Predefined rules that block risky agent actions" />
      <div className="p-8">
        <PoliciesClient />
      </div>
    </>
  );
}
