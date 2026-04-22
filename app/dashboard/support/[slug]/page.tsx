import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import {
  canUserSeeArticle,
  getArticleBySlug,
} from "@/lib/support/articles";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) {
    return { title: "Support - Cogna8 OpenClaw Portal" };
  }
  return {
    title: `${article.title} - Support - Cogna8 OpenClaw Portal`,
    description: article.description,
  };
}

export default async function SupportArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const session = await auth();
  const role = (((session as any)?.role ??
    (session as any)?.user?.role ??
    "user") as "user" | "admin" | "super_admin");

  if (!canUserSeeArticle(article, role)) {
    redirect("/dashboard");
  }

  let MDXContent: React.ComponentType | null = null;
  try {
    const mdxModule = await import(`../articles/${article.file}`);
    MDXContent = mdxModule.default;
  } catch (error) {
    console.error(`[support] failed to load article ${article.slug}`, error);
  }

  if (!MDXContent) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <div className="rounded-md border border-border bg-card p-6 text-card-foreground">
          <h1 className="text-lg font-semibold">Article unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We could not load this support article. Please try again later or
            contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl p-8">
      <MDXContent />
    </article>
  );
}
