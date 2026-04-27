export type ArticleVisibility = "all" | "admin" | "super_admin";

export type Article = {
  slug: string;
  title: string;
  description: string;
  visibility: ArticleVisibility;
  file: string;
};

export const articles: Article[] = [
  {
    slug: "setup-guide",
    title: "Setup Guide",
    description:
      "Install the Cogna8 plugin and connect it to your OpenClaw gateway.",
    visibility: "all",
    file: "setup-guide.mdx",
  },
  {
    slug: "release-notes",
    title: "Release Notes",
    description: "What shipped in each Cogna8 OpenClaw release.",
    visibility: "all",
    file: "release-notes.mdx",
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

export function getArticlesForRole(
  role: "user" | "admin" | "super_admin",
): Article[] {
  return articles.filter((a) => {
    if (a.visibility === "all") return true;
    if (a.visibility === "admin") return role === "admin" || role === "super_admin";
    if (a.visibility === "super_admin") return role === "super_admin";
    return false;
  });
}

export function canUserSeeArticle(
  article: Article,
  role: "user" | "admin" | "super_admin",
): boolean {
  if (article.visibility === "all") return true;
  if (article.visibility === "admin") return role === "admin" || role === "super_admin";
  if (article.visibility === "super_admin") return role === "super_admin";
  return false;
}
