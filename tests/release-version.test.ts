import { describe, expect, it } from "vitest";
import { RELEASE_VERSION, RELEASE_VERSIONS } from "../src/lib/release";

describe("release version constants", () => {
  it("RELEASE_VERSION matches the latest entry in RELEASE_VERSIONS", () => {
    expect(RELEASE_VERSION).toBe(RELEASE_VERSIONS[RELEASE_VERSIONS.length - 1]);
  });

  it("RELEASE_VERSIONS is sorted ascending", () => {
    expect([...RELEASE_VERSIONS]).toEqual([...RELEASE_VERSIONS].sort());
  });
});
