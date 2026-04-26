import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildVariantRows } from "../src/lib/policy-variants";
import type { PolicyListItem, PolicyVariantRule } from "../src/lib/policies-service";

type MockPolicy = Pick<
  PolicyListItem,
  "variants" | "rules" | "variants_detailed"
>;

function rule(
  overrides: Partial<PolicyVariantRule> = {},
): PolicyVariantRule {
  return {
    public_id: "rule_1",
    agent_public_id: "agent_1",
    agent_name: "Test Agent",
    tool_match: "Bash",
    status: "active",
    ...overrides,
  };
}

describe("buildVariantRows", () => {
  it("uses variants_detailed when present and populates descriptions", () => {
    const policy: MockPolicy = {
      variants: ["Bash", "WebFetch"],
      variants_detailed: [
        { pattern: "Bash", description: "Run shell commands" },
        { pattern: "WebFetch", description: "Fetch arbitrary URLs" },
      ],
      rules: [
        rule({
          public_id: "r1",
          agent_public_id: "agent_1",
          tool_match: "Bash",
        }),
        rule({
          public_id: "r2",
          agent_public_id: "agent_2",
          tool_match: "Bash",
        }),
      ],
    };

    const rows = buildVariantRows(policy);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      tool_match: "Bash",
      description: "Run shell commands",
      isDefined: true,
    });
    expect(rows[0].rules).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      tool_match: "WebFetch",
      description: "Fetch arbitrary URLs",
      isDefined: true,
    });
    expect(rows[1].rules).toHaveLength(0);

    const withDescription = rows.filter((r) => r.description !== null);
    expect(withDescription.length).toBeGreaterThan(0);
  });

  it("falls back to variants string[] when variants_detailed is absent", () => {
    const policy: MockPolicy = {
      variants: ["Bash", "WebFetch"],
      rules: [
        rule({
          public_id: "r1",
          agent_public_id: "agent_1",
          tool_match: "Bash",
        }),
      ],
    };

    const rows = buildVariantRows(policy);

    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.description === null)).toBe(true);
    expect(rows.map((r) => r.tool_match)).toEqual(["Bash", "WebFetch"]);
    expect(rows.every((r) => r.isDefined)).toBe(true);
  });

  it("treats an empty variants_detailed array as 'absent' and falls back", () => {
    const policy: MockPolicy = {
      variants: ["Bash"],
      variants_detailed: [],
      rules: [],
    };

    const rows = buildVariantRows(policy);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tool_match: "Bash",
      description: null,
      isDefined: true,
    });
  });

  it("skips non-active rules when grouping", () => {
    const policy: MockPolicy = {
      variants: ["Bash"],
      rules: [
        rule({ public_id: "r1", tool_match: "Bash", status: "active" }),
        rule({ public_id: "r2", tool_match: "Bash", status: "removed" }),
        rule({ public_id: "r3", tool_match: "Bash", status: "disabled" }),
      ],
    };

    const rows = buildVariantRows(policy);
    expect(rows[0].rules.map((r) => r.public_id)).toEqual(["r1"]);
  });

  it("adds orphaned rule variants (not in detailed) with isDefined=false", () => {
    const policy: MockPolicy = {
      variants: ["Bash"],
      variants_detailed: [
        { pattern: "Bash", description: "Run shell commands" },
      ],
      rules: [
        rule({
          public_id: "r1",
          agent_public_id: "agent_1",
          tool_match: "LegacyTool",
        }),
      ],
    };

    const rows = buildVariantRows(policy);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ tool_match: "Bash", isDefined: true });
    expect(rows[1]).toMatchObject({
      tool_match: "LegacyTool",
      description: null,
      isDefined: false,
    });
  });

  it("adds orphaned rule variants (not in variants) with isDefined=false in fallback path", () => {
    const policy: MockPolicy = {
      variants: ["Bash"],
      rules: [
        rule({
          public_id: "r1",
          agent_public_id: "agent_1",
          tool_match: "LegacyTool",
        }),
      ],
    };

    const rows = buildVariantRows(policy);

    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      tool_match: "LegacyTool",
      isDefined: false,
    });
  });
});

describe("policies-client disclosure styling", () => {
  const clientPath = path.resolve(
    __dirname,
    "../app/dashboard/policies/_components/policies-client.tsx",
  );
  const source = readFileSync(clientPath, "utf8");

  it("renders the disclosure button with the portal primary (orange) token", () => {
    const disclosureMarker = '"Show"} blocked actions';
    const disclosureIndex = source.indexOf(disclosureMarker);
    expect(disclosureIndex).toBeGreaterThan(-1);

    const aboveDisclosure = source.slice(0, disclosureIndex);
    const lastButtonIndex = aboveDisclosure.lastIndexOf("<button");
    expect(lastButtonIndex).toBeGreaterThan(-1);

    const closingIndex = source.indexOf("</button>", lastButtonIndex);
    const buttonBlock = source.slice(
      lastButtonIndex,
      closingIndex + "</button>".length,
    );

    expect(buttonBlock).toContain("oklch(var(--primary))");
  });

  it("renders variant descriptions below the tool_match code", () => {
    expect(source).toContain("{row.description && (");
    expect(source).toContain("{row.description}</div>");
  });

  it("shows the 'Applied to N agents' badge when rules exist", () => {
    expect(source).toMatch(/Applied to \{row\.rules\.length\} agent/);
  });
});
