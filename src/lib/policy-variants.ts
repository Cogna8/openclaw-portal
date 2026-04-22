import type {
  PolicyListItem,
  PolicyVariantDetailed,
  PolicyVariantRule,
} from "@/lib/policies-service";

export type VariantRow = {
  tool_match: string;
  description: string | null;
  rules: PolicyVariantRule[];
  isDefined: boolean;
};

type BuildInput = Pick<PolicyListItem, "variants" | "rules"> & {
  variants_detailed?: PolicyVariantDetailed[];
};

export function buildVariantRows(policy: BuildInput): VariantRow[] {
  const byMatch = new Map<string, PolicyVariantRule[]>();
  for (const rule of policy.rules) {
    if (rule.status !== "active") continue;
    const list = byMatch.get(rule.tool_match) ?? [];
    list.push(rule);
    byMatch.set(rule.tool_match, list);
  }

  const detailed = policy.variants_detailed;
  if (detailed && detailed.length > 0) {
    const rows: VariantRow[] = detailed.map((v) => ({
      tool_match: v.pattern,
      description: v.description,
      rules: byMatch.get(v.pattern) ?? [],
      isDefined: true,
    }));

    for (const [match, rules] of byMatch) {
      if (!detailed.some((v) => v.pattern === match)) {
        rows.push({
          tool_match: match,
          description: null,
          rules,
          isDefined: false,
        });
      }
    }

    return rows;
  }

  const rows: VariantRow[] = policy.variants.map((v) => ({
    tool_match: v,
    description: null,
    rules: byMatch.get(v) ?? [],
    isDefined: true,
  }));

  for (const [match, rules] of byMatch) {
    if (!policy.variants.includes(match)) {
      rows.push({
        tool_match: match,
        description: null,
        rules,
        isDefined: false,
      });
    }
  }

  return rows;
}
