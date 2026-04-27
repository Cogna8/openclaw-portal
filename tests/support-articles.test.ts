import { describe, expect, it } from "vitest";
import { articles, getArticleBySlug } from "../src/lib/support/articles";

describe("support articles", () => {
  it("includes setup-guide and release-notes", () => {
    expect(getArticleBySlug("setup-guide")).toBeDefined();
    expect(getArticleBySlug("release-notes")).toBeDefined();
  });

  it("puts setup-guide before release-notes", () => {
    const slugs = articles.map((article) => article.slug);
    expect(slugs.indexOf("setup-guide")).toBeLessThan(
      slugs.indexOf("release-notes"),
    );
  });
});
