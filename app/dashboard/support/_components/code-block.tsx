import { CopyButton } from "./copy-button";

export function CodeBlock({ code }: { code: string }) {
  const trimmed = code.replace(/^\n+|\n+$/g, "");
  return (
    <div className="relative my-6 rounded-md border border-border bg-muted">
      <div className="absolute right-2 top-2">
        <CopyButton text={trimmed} />
      </div>
      <pre className="overflow-x-auto p-4 pr-20 text-sm">
        <code className="font-mono text-foreground">{trimmed}</code>
      </pre>
    </div>
  );
}

export default CodeBlock;
