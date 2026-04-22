import { Header } from "@/components/header";
import KeysClient from "./_components/keys-client";

export default function DashboardKeysPage() {
  return (
    <>
      <Header title="API Keys" subtitle="Keys used by your OpenClaw plugins to authenticate" />
      <div className="p-8">
        <KeysClient />
      </div>
    </>
  );
}
