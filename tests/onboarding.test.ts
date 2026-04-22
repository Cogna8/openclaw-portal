import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPortalFindUnique,
  mockPortalUpdate,
  mockAgentCount,
  mockListPolicies,
} = vi.hoisted(() => ({
  mockPortalFindUnique: vi.fn(),
  mockPortalUpdate: vi.fn(),
  mockAgentCount: vi.fn(),
  mockListPolicies: vi.fn(),
}));

vi.mock("@/lib/portal-db", () => ({
  getPortalDb: () => ({
    portalUser: {
      findUnique: mockPortalFindUnique,
      update: mockPortalUpdate,
    },
  }),
}));

vi.mock("@/lib/db/service", () => ({
  getServiceDb: () => ({
    agent: { count: mockAgentCount },
  }),
}));

vi.mock("@/lib/policies-service", () => ({
  listPolicies: mockListPolicies,
}));

import { resolveOnboardingStatus } from "../src/lib/services/onboarding";

const args = {
  portalUserId: "user-1",
  openclawAccountId: "acct-1",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveOnboardingStatus", () => {
  it("returns { completed: true } immediately when flag is set, without hitting the service DB", async () => {
    mockPortalFindUnique.mockResolvedValue({
      onboardingCompletedAt: new Date("2026-01-01T00:00:00Z"),
    });

    const result = await resolveOnboardingStatus(args);

    expect(result).toEqual({ completed: true });
    expect(mockAgentCount).not.toHaveBeenCalled();
    expect(mockListPolicies).not.toHaveBeenCalled();
    expect(mockPortalUpdate).not.toHaveBeenCalled();
  });

  it("returns { completed: false } when counts are both zero and flag is null, without writing", async () => {
    mockPortalFindUnique.mockResolvedValue({ onboardingCompletedAt: null });
    mockAgentCount.mockResolvedValue(0);
    mockListPolicies.mockResolvedValue({ policies: [] });

    const result = await resolveOnboardingStatus(args);

    expect(result).toEqual({ completed: false });
    expect(mockPortalUpdate).not.toHaveBeenCalled();
  });

  it("returns { completed: true } and sets the flag when agents > 0 and enabledPolicies > 0", async () => {
    mockPortalFindUnique.mockResolvedValue({ onboardingCompletedAt: null });
    mockAgentCount.mockResolvedValue(2);
    mockListPolicies.mockResolvedValue({
      policies: [
        { id: "p1", enabled: true },
        { id: "p2", enabled: false },
        { id: "p3", enabled: true },
      ],
    });

    const result = await resolveOnboardingStatus(args);

    expect(result).toEqual({ completed: true });
    expect(mockPortalUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { onboardingCompletedAt: expect.any(Date) },
    });
  });

  it("returns { completed: false } when only agents > 0 (no enabled policies)", async () => {
    mockPortalFindUnique.mockResolvedValue({ onboardingCompletedAt: null });
    mockAgentCount.mockResolvedValue(3);
    mockListPolicies.mockResolvedValue({
      policies: [
        { id: "p1", enabled: false },
        { id: "p2", enabled: false },
      ],
    });

    const result = await resolveOnboardingStatus(args);

    expect(result).toEqual({ completed: false });
    expect(mockPortalUpdate).not.toHaveBeenCalled();
  });

  it("returns { completed: false } when only enabled policies > 0 (no active agents)", async () => {
    mockPortalFindUnique.mockResolvedValue({ onboardingCompletedAt: null });
    mockAgentCount.mockResolvedValue(0);
    mockListPolicies.mockResolvedValue({
      policies: [{ id: "p1", enabled: true }],
    });

    const result = await resolveOnboardingStatus(args);

    expect(result).toEqual({ completed: false });
    expect(mockPortalUpdate).not.toHaveBeenCalled();
  });

  it("queries agent count scoped to account and active status", async () => {
    mockPortalFindUnique.mockResolvedValue({ onboardingCompletedAt: null });
    mockAgentCount.mockResolvedValue(0);
    mockListPolicies.mockResolvedValue({ policies: [] });

    await resolveOnboardingStatus(args);

    expect(mockAgentCount).toHaveBeenCalledWith({
      where: { accountId: "acct-1", status: "active" },
    });
  });
});
