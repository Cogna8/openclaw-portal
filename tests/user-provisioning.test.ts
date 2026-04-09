import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPortalUser = { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() };
vi.mock("../src/lib/portal-db", () => ({ getPortalDb: () => ({ portalUser: mockPortalUser }) }));
vi.mock("../src/lib/openclaw-db", () => ({ createOpenClawAccount: vi.fn().mockResolvedValue({ id: "uuid-123", publicId: "acct_Test1234" }) }));
vi.mock("../src/lib/ids", () => ({ generateAccountId: () => "acct_Test1234" }));

import { handleSignIn } from "../src/services/user-provisioning";

describe("user-provisioning", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates PortalUser for new user", async () => {
    mockPortalUser.findUnique.mockResolvedValue(null);
    mockPortalUser.create.mockResolvedValue({ id: "user-1", email: "test@example.com", role: "user", openclawAccountId: "uuid-123" });
    const result = await handleSignIn({ email: "test@example.com", name: "Test", googleId: "g-1" });
    expect(result.allowed).toBe(true);
    expect(result.role).toBe("user");
    expect(mockPortalUser.create).toHaveBeenCalled();
  });

  it("provisions OpenClaw account for new user", async () => {
    const { createOpenClawAccount } = await import("../src/lib/openclaw-db");
    mockPortalUser.findUnique.mockResolvedValue(null);
    mockPortalUser.create.mockResolvedValue({ id: "user-1", email: "test@example.com", role: "user", openclawAccountId: "uuid-123" });
    await handleSignIn({ email: "test@example.com", googleId: "g-2" });
    expect(createOpenClawAccount).toHaveBeenCalledWith("acct_Test1234");
  });

  it("stores openclawAccountId on user", async () => {
    mockPortalUser.findUnique.mockResolvedValue(null);
    mockPortalUser.create.mockResolvedValue({ id: "user-1", email: "test@example.com", role: "user", openclawAccountId: "uuid-123" });
    const result = await handleSignIn({ email: "test@example.com", googleId: "g-3" });
    expect(result.openclawAccountId).toBe("uuid-123");
  });

  it("admin@cogna8.io becomes super_admin", async () => {
    mockPortalUser.findUnique.mockResolvedValue(null);
    mockPortalUser.create.mockResolvedValue({ id: "a-1", email: "admin@cogna8.io", role: "super_admin", openclawAccountId: "uuid-a" });
    const result = await handleSignIn({ email: "admin@cogna8.io", googleId: "g-admin" });
    expect(result.role).toBe("super_admin");
  });

  it("existing user updates lastLoginAt", async () => {
    mockPortalUser.findUnique.mockResolvedValue({ id: "user-1", email: "test@example.com", role: "user", isBlocked: false, openclawAccountId: "uuid-123" });
    mockPortalUser.update.mockResolvedValue({});
    const result = await handleSignIn({ email: "test@example.com", googleId: "g-1" });
    expect(result.allowed).toBe(true);
    expect(mockPortalUser.update).toHaveBeenCalled();
  });

  it("blocked user is rejected", async () => {
    mockPortalUser.findUnique.mockResolvedValue({ id: "user-1", email: "blocked@example.com", role: "user", isBlocked: true, openclawAccountId: "uuid-123" });
    const result = await handleSignIn({ email: "blocked@example.com", googleId: "g-blocked" });
    expect(result.allowed).toBe(false);
  });

  it("super-admin cannot be blocked", async () => {
    mockPortalUser.findUnique.mockResolvedValue({ id: "a-1", email: "admin@cogna8.io", role: "super_admin", isBlocked: true, openclawAccountId: "uuid-a" });
    mockPortalUser.update.mockResolvedValue({});
    const result = await handleSignIn({ email: "admin@cogna8.io", googleId: "g-admin" });
    expect(result.allowed).toBe(true);
  });

  it("super-admin role re-enforced on repeated sign-ins", async () => {
    mockPortalUser.findUnique.mockResolvedValue({ id: "a-1", email: "admin@cogna8.io", role: "user", isBlocked: false, openclawAccountId: "uuid-a" });
    mockPortalUser.update.mockResolvedValue({});
    const result = await handleSignIn({ email: "admin@cogna8.io", googleId: "g-admin" });
    expect(result.role).toBe("super_admin");
    expect(mockPortalUser.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ role: "super_admin" }) }));
  });
});
