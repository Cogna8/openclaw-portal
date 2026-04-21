import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCurrentAccountContext,
  mockFindMany,
  mockFindFirst,
  mockUpdate,
  MockAuthRequiredError,
  MockAccountLinkError,
} = vi.hoisted(() => {
  class MockAuthRequiredError extends Error {}
  class MockAccountLinkError extends Error {}
  return {
    mockGetCurrentAccountContext: vi.fn(),
    mockFindMany: vi.fn(),
    mockFindFirst: vi.fn(),
    mockUpdate: vi.fn(),
    MockAuthRequiredError,
    MockAccountLinkError,
  };
});

vi.mock("@/lib/auth/session-account", () => ({
  getCurrentAccountContext: mockGetCurrentAccountContext,
  AuthRequiredError: MockAuthRequiredError,
  AccountLinkError: MockAccountLinkError,
}));

vi.mock("@/lib/db/service", () => ({
  getServiceDb: () => ({
    agent: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      update: mockUpdate,
    },
  }),
}));

import { GET as listGET } from "../app/api/agents/route";
import { POST as archivePOST } from "../app/api/agents/[publicId]/archive/route";
import { POST as unarchivePOST } from "../app/api/agents/[publicId]/unarchive/route";

const ctx = {
  sessionUserEmail: "u@x.com",
  portalUserId: "u1",
  portalUserEmail: "u@x.com",
  openclawAccountId: "acct-1",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/agents filter", () => {
  beforeEach(() => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockFindMany.mockResolvedValue([]);
  });

  it("defaults to active-only when no status param is given", async () => {
    const res = await listGET(new Request("http://x/api/agents"));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accountId: "acct-1", status: "active" },
      }),
    );
  });

  it("returns active-only for ?status=active", async () => {
    const res = await listGET(
      new Request("http://x/api/agents?status=active"),
    );
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accountId: "acct-1", status: "active" },
      }),
    );
  });

  it("returns all agents for ?status=all (no status filter)", async () => {
    const res = await listGET(new Request("http://x/api/agents?status=all"));
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accountId: "acct-1" },
      }),
    );
  });

  it("treats unknown status values as active-only", async () => {
    const res = await listGET(
      new Request("http://x/api/agents?status=banana"),
    );
    expect(res.status).toBe(200);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { accountId: "acct-1", status: "active" },
      }),
    );
  });
});

describe("POST /api/agents/:publicId/archive", () => {
  const params = () => Promise.resolve({ publicId: "agent_pub_1" });

  it("archives an active agent and returns { ok: true } with status 200", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockFindFirst.mockResolvedValue({ id: "uuid-1", status: "active" });
    mockUpdate.mockResolvedValue({});

    const res = await archivePOST(new Request("http://x"), { params: params() });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { publicId: "agent_pub_1", accountId: "acct-1" },
      select: { id: true, status: true },
    });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "uuid-1" },
      data: { status: "archived" },
    });
  });

  it("returns 200 + { ok: true, already: true } when agent is already archived", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockFindFirst.mockResolvedValue({ id: "uuid-1", status: "archived" });

    const res = await archivePOST(new Request("http://x"), { params: params() });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, already: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when publicId belongs to a different account (findFirst scoped by accountId returns null)", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockFindFirst.mockResolvedValue(null);

    const res = await archivePOST(new Request("http://x"), { params: params() });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Agent not found" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 401 on AuthRequiredError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAuthRequiredError("nope"),
    );

    const res = await archivePOST(new Request("http://x"), { params: params() });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 on AccountLinkError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAccountLinkError("nope"),
    );

    const res = await archivePOST(new Request("http://x"), { params: params() });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });
});

describe("POST /api/agents/:publicId/unarchive", () => {
  const params = () => Promise.resolve({ publicId: "agent_pub_1" });

  it("unarchives an archived agent and returns { ok: true } with status 200", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockFindFirst.mockResolvedValue({ id: "uuid-1", status: "archived" });
    mockUpdate.mockResolvedValue({});

    const res = await unarchivePOST(new Request("http://x"), {
      params: params(),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "uuid-1" },
      data: { status: "active" },
    });
  });

  it("returns 200 + { ok: true, already: true } when agent is already active", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockFindFirst.mockResolvedValue({ id: "uuid-1", status: "active" });

    const res = await unarchivePOST(new Request("http://x"), {
      params: params(),
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, already: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when publicId belongs to a different account", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockFindFirst.mockResolvedValue(null);

    const res = await unarchivePOST(new Request("http://x"), {
      params: params(),
    });
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Agent not found" });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 401 on AuthRequiredError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAuthRequiredError("nope"),
    );

    const res = await unarchivePOST(new Request("http://x"), {
      params: params(),
    });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 on AccountLinkError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAccountLinkError("nope"),
    );

    const res = await unarchivePOST(new Request("http://x"), {
      params: params(),
    });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });
});
