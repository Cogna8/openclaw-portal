import { Header } from "@/components/header";
import AgentsClient from "./_components/agents-client";

export default function DashboardAgentsPage() {
  return (
    <>
      <Header title="Agents" subtitle="Agents registered by your OpenClaw plugins" />
      <div className="p-8">
        <AgentsClient />
      </div>
    </>
  );
}
