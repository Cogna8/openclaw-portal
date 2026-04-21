import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetCurrentAccountContext,
  mockListPolicies,
  mockEnablePolicy,
  mockDisablePolicy,
  mockDeleteTemplateVariantRule,
  MockAuthRequiredError,
  MockAccountLinkError,
} = vi.hoisted(() => {
  class MockAuthRequiredError extends Error {}
  class MockAccountLinkError extends Error {}
  return {
    mockGetCurrentAccountContext: vi.fn(),
    mockListPolicies: vi.fn(),
    mockEnablePolicy: vi.fn(),
    mockDisablePolicy: vi.fn(),
    mockDeleteTemplateVariantRule: vi.fn(),
    MockAuthRequiredError,
    MockAccountLinkError,
  };
});

vi.mock("@/lib/auth/session-account", () => ({
  getCurrentAccountContext: mockGetCurrentAccountContext,
  AuthRequiredError: MockAuthRequiredError,
  AccountLinkError: MockAccountLinkError,
}));

vi.mock("@/lib/policies-service", () => ({
  listPolicies: mockListPolicies,
  enablePolicy: mockEnablePolicy,
  disablePolicy: mockDisablePolicy,
  deleteTemplateVariantRule: mockDeleteTemplateVariantRule,
}));

import { GET as listGET } from "../app/api/policies/route";
import { POST as enablePOST } from "../app/api/policies/[templateId]/enable/route";
import { POST as disablePOST } from "../app/api/policies/[templateId]/disable/route";
import { DELETE as ruleDELETE } from "../app/api/policies/rules/[rulePublicId]/route";

const ctx = {
  sessionUserEmail: "u@x.com",
  portalUserId: "u1",
  portalUserEmail: "u@x.com",
  openclawAccountId: "a1",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function downstreamError(status: number, message: string): Error {
  const err: any = new Error(`downstream ${status}`);
  err.status = status;
  err.body = { error: message };
  return err;
}

describe("GET /api/policies", () => {
  it("returns 200 with service result on happy path", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockListPolicies.mockResolvedValue({ policies: [{ id: "t1" }] });

    const res = await listGET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ policies: [{ id: "t1" }] });
  });

  it("returns 401 on AuthRequiredError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAuthRequiredError("nope"),
    );

    const res = await listGET();
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 on AccountLinkError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAccountLinkError("nope"),
    );

    const res = await listGET();
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("normalizes opaque service failure to 500 with { error }", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockListPolicies.mockRejectedValue(new Error("boom"));

    const res = await listGET();
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });

  it("passes downstream error status + body through", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockListPolicies.mockRejectedValue(downstreamError(409, "Already enabled"));

    const res = await listGET();
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "Already enabled" });
  });
});

describe("POST /api/policies/[templateId]/enable", () => {
  const params = Promise.resolve({ templateId: "t1" });

  it("returns 200 with service result", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockEnablePolicy.mockResolvedValue({
      template_id: "t1",
      enabled: true,
      agents_touched: 1,
      rules_created: 2,
    });

    const res = await enablePOST(new Request("http://x"), { params });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      template_id: "t1",
      enabled: true,
    });
  });

  it("returns 401 on AuthRequiredError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAuthRequiredError("nope"),
    );
    const res = await enablePOST(new Request("http://x"), { params });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 on AccountLinkError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAccountLinkError("nope"),
    );
    const res = await enablePOST(new Request("http://x"), { params });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("normalizes opaque service failure to 500", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockEnablePolicy.mockRejectedValue(new Error("boom"));
    const res = await enablePOST(new Request("http://x"), { params });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });

  it("passes downstream 409 with { error } through unchanged", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockEnablePolicy.mockRejectedValue(
      downstreamError(409, "Already enabled"),
    );
    const res = await enablePOST(new Request("http://x"), { params });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "Already enabled" });
  });
});

describe("POST /api/policies/[templateId]/disable", () => {
  const params = Promise.resolve({ templateId: "t1" });

  it("returns 200 with service result", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockDisablePolicy.mockResolvedValue({
      template_id: "t1",
      enabled: false,
      rules_removed: 3,
    });

    const res = await disablePOST(new Request("http://x"), { params });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      template_id: "t1",
      enabled: false,
    });
  });

  it("returns 401 on AuthRequiredError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAuthRequiredError("nope"),
    );
    const res = await disablePOST(new Request("http://x"), { params });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 on AccountLinkError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAccountLinkError("nope"),
    );
    const res = await disablePOST(new Request("http://x"), { params });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("normalizes opaque service failure to 500", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockDisablePolicy.mockRejectedValue(new Error("boom"));
    const res = await disablePOST(new Request("http://x"), { params });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });

  it("passes downstream 409 with { error } through unchanged", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockDisablePolicy.mockRejectedValue(
      downstreamError(409, "Already enabled"),
    );
    const res = await disablePOST(new Request("http://x"), { params });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "Already enabled" });
  });
});

describe("DELETE /api/policies/rules/[rulePublicId]", () => {
  const params = Promise.resolve({ rulePublicId: "r1" });

  it("returns 200 with service result", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockDeleteTemplateVariantRule.mockResolvedValue({
      rule_id: "r1",
      removed: true,
    });

    const res = await ruleDELETE(new Request("http://x"), { params });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      rule_id: "r1",
      removed: true,
    });
  });

  it("returns 401 on AuthRequiredError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAuthRequiredError("nope"),
    );
    const res = await ruleDELETE(new Request("http://x"), { params });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 403 on AccountLinkError", async () => {
    mockGetCurrentAccountContext.mockRejectedValue(
      new MockAccountLinkError("nope"),
    );
    const res = await ruleDELETE(new Request("http://x"), { params });
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Forbidden" });
  });

  it("normalizes opaque service failure to 500", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockDeleteTemplateVariantRule.mockRejectedValue(new Error("boom"));
    const res = await ruleDELETE(new Request("http://x"), { params });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });

  it("passes downstream 409 with { error } through unchanged", async () => {
    mockGetCurrentAccountContext.mockResolvedValue(ctx);
    mockDeleteTemplateVariantRule.mockRejectedValue(
      downstreamError(409, "Already enabled"),
    );
    const res = await ruleDELETE(new Request("http://x"), { params });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "Already enabled" });
  });
});
