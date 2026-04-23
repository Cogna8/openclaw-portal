import { Header } from "@/components/header";
import UsageClient from "./_components/usage-client";

export default function DashboardUsagePage() {
  return (
    <>
      <Header title="Usage" subtitle="Evaluation counts and billing period" />
      <div className="p-4 sm:p-6 md:p-8">
        <UsageClient />
      </div>
    </>
  );
}
