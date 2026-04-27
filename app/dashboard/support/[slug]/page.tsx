import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Header } from "@/components/header";
import {
  canUserSeeArticle,
  getArticleBySlug,
} from "@/lib/support/articles";
import { FromTheTeam } from "../_components/from-the-team";

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
      <>
        <Header title="Support" subtitle="Article unavailable" />
        <div className="mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
          <div className="rounded-md border border-border bg-card p-6 text-card-foreground">
            <h2 className="text-lg font-semibold">Article unavailable</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We could not load this support article. Please try again later or
              contact support if the problem persists.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={article.title} subtitle={article.description} />
      <article className="mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
        <FromTheTeam />
        <MDXContent />
      </article>
    </>
  );
}
