import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockListPolicies, mockEnablePolicy } = vi.hoisted(() => ({
  mockListPolicies: vi.fn(),
  mockEnablePolicy: vi.fn(),
}));

vi.mock("../src/lib/policies-service", () => ({
  listPolicies: mockListPolicies,
  enablePolicy: mockEnablePolicy,
}));

import { enableDefaultPoliciesForNewAccount } from "../src/lib/policies-bootstrap";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("enableDefaultPoliciesForNewAccount", () => {
  it("enables every default-flagged template", async () => {
    mockListPolicies.mockResolvedValue({
      policies: [
        { id: "t1", default_enabled: true },
        { id: "t2", default_enabled: true },
        { id: "t3", default_enabled: false },
      ],
    });
    mockEnablePolicy.mockResolvedValue({});

    const result = await enableDefaultPoliciesForNewAccount({
      accountId: "a1",
      userId: "u1",
    });

    expect(result.enabledTemplates).toEqual(["t1", "t2"]);
    expect(result.errors).toEqual([]);
    expect(mockEnablePolicy).toHaveBeenCalledTimes(2);
    expect(mockEnablePolicy).toHaveBeenCalledWith({
      accountId: "a1",
      userId: "u1",
      templateId: "t1",
    });
    expect(mockEnablePolicy).toHaveBeenCalledWith({
      accountId: "a1",
      userId: "u1",
      templateId: "t2",
    });
  });

  it("returns empty enabled list and surfaces error when listPolicies throws", async () => {
    mockListPolicies.mockRejectedValue(new Error("service down"));

    const result = await enableDefaultPoliciesForNewAccount({
      accountId: "a1",
      userId: "u1",
    });

    expect(result.enabledTemplates).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("listPolicies");
    expect(result.errors[0]).toContain("service down");
    expect(mockEnablePolicy).not.toHaveBeenCalled();
  });

  it("tolerates partial failure: records successes and errors per template", async () => {
    mockListPolicies.mockResolvedValue({
      policies: [
        { id: "t1", default_enabled: true },
        { id: "t2", default_enabled: true },
        { id: "t3", default_enabled: true },
      ],
    });
    mockEnablePolicy
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("t2 failed"))
      .mockResolvedValueOnce({});

    const result = await enableDefaultPoliciesForNewAccount({
      accountId: "a1",
      userId: "u1",
    });

    expect(result.enabledTemplates).toEqual(["t1", "t3"]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("t2");
    expect(result.errors[0]).toContain("t2 failed");
  });

  it("is a no-op when no templates are default_enabled", async () => {
    mockListPolicies.mockResolvedValue({
      policies: [{ id: "t1", default_enabled: false }],
    });

    const result = await enableDefaultPoliciesForNewAccount({
      accountId: "a1",
      userId: "u1",
    });

    expect(result.enabledTemplates).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(mockEnablePolicy).not.toHaveBeenCalled();
  });
});
