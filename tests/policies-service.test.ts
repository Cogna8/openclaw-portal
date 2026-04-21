import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  listPolicies,
  enablePolicy,
  disablePolicy,
  deleteTemplateVariantRule,
} from "../src/lib/policies-service";

const BASE = "https://openclaw.example";
const TOKEN = "test-token";

beforeEach(() => {
  vi.stubEnv("CG8_OPENCLAW_SERVICE_URL", BASE);
  vi.stubEnv("CG8_PORTAL_SERVICE_TOKEN", TOKEN);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function mockFetchOk(body: unknown): ReturnType<typeof vi.fn> {
  const fn = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

function mockFetchErr(status: number, body: unknown): ReturnType<typeof vi.fn> {
  const fn = vi.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status,
        statusText: "Error",
        headers: { "content-type": "application/json" },
      }),
  );
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("policies-service", () => {
  describe("listPolicies", () => {
    it("returns the parsed body on 200", async () => {
      mockFetchOk({ policies: [] });
      const result = await listPolicies({ accountId: "a1", userId: "u1" });
      expect(result).toEqual({ policies: [] });
    });

    it("sends account + user + token headers", async () => {
      const fetchFn = mockFetchOk({ policies: [] });
      await listPolicies({ accountId: "a1", userId: "u1" });
      const init = fetchFn.mock.calls[0]?.[1] as RequestInit;
      const headers = init.headers as Record<string, string>;
      expect(headers["x-cg8-portal-token"]).toBe(TOKEN);
      expect(headers["x-cg8-account-id"]).toBe("a1");
      expect(headers["x-cg8-user-id"]).toBe("u1");
    });

    it("throws an error carrying status and body on non-2xx", async () => {
      mockFetchErr(500, { error: "boom" });
      await expect(
        listPolicies({ accountId: "a1", userId: "u1" }),
      ).rejects.toMatchObject({ status: 500, body: { error: "boom" } });
    });
  });

  describe("enablePolicy", () => {
    it("POSTs to the enable endpoint and returns the parsed body", async () => {
      const fetchFn = mockFetchOk({
        template_id: "t1",
        enabled: true,
        agents_touched: 2,
        rules_created: 4,
      });
      const result = await enablePolicy({
        accountId: "a1",
        userId: "u1",
        templateId: "t1",
      });
      expect(result).toEqual({
        template_id: "t1",
        enabled: true,
        agents_touched: 2,
        rules_created: 4,
      });
      const [url, init] = fetchFn.mock.calls[0];
      expect(String(url)).toBe(`${BASE}/api/v1/portal/policies/t1/enable`);
      expect((init as RequestInit).method).toBe("POST");
    });

    it("propagates downstream status + body on failure", async () => {
      mockFetchErr(409, { error: "Already enabled" });
      await expect(
        enablePolicy({ accountId: "a1", userId: "u1", templateId: "t1" }),
      ).rejects.toMatchObject({
        status: 409,
        body: { error: "Already enabled" },
      });
    });
  });

  describe("disablePolicy", () => {
    it("POSTs to the disable endpoint", async () => {
      const fetchFn = mockFetchOk({
        template_id: "t1",
        enabled: false,
        rules_removed: 3,
      });
      const result = await disablePolicy({
        accountId: "a1",
        userId: "u1",
        templateId: "t1",
      });
      expect(result.enabled).toBe(false);
      const [url, init] = fetchFn.mock.calls[0];
      expect(String(url)).toBe(`${BASE}/api/v1/portal/policies/t1/disable`);
      expect((init as RequestInit).method).toBe("POST");
    });

    it("propagates downstream error body", async () => {
      mockFetchErr(404, { error: "unknown template" });
      await expect(
        disablePolicy({ accountId: "a1", userId: "u1", templateId: "t1" }),
      ).rejects.toMatchObject({
        status: 404,
        body: { error: "unknown template" },
      });
    });
  });

  describe("deleteTemplateVariantRule", () => {
    it("DELETEs the rule and returns the parsed body", async () => {
      const fetchFn = mockFetchOk({ rule_id: "r1", removed: true });
      const result = await deleteTemplateVariantRule({
        accountId: "a1",
        userId: "u1",
        rulePublicId: "r1",
      });
      expect(result).toEqual({ rule_id: "r1", removed: true });
      const [url, init] = fetchFn.mock.calls[0];
      expect(String(url)).toBe(`${BASE}/api/v1/portal/rules/r1`);
      expect((init as RequestInit).method).toBe("DELETE");
    });

    it("propagates downstream error body", async () => {
      mockFetchErr(403, { error: "not your rule" });
      await expect(
        deleteTemplateVariantRule({
          accountId: "a1",
          userId: "u1",
          rulePublicId: "r1",
        }),
      ).rejects.toMatchObject({
        status: 403,
        body: { error: "not your rule" },
      });
    });
  });
});
