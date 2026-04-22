import { Header } from "@/components/header";
import StatsClient from "./_components/stats-client";

export default function AdminStatsPage() {
  return (
    <>
      <Header title="Stats" subtitle="Account, key, and evaluation totals" />
      <div className="p-8">
        <StatsClient />
      </div>
    </>
  );
}
