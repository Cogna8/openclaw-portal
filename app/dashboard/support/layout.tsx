import { auth } from "@/lib/auth";
import { getArticlesForRole } from "@/lib/support/articles";
import { getSessionRole } from "@/lib/session-role";
import ArticleSubnav from "./_components/article-subnav";

export default async function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = getSessionRole(session);

  const articles = getArticlesForRole(role);

  return (
    <div className="flex h-full flex-col bg-background md:flex-row">
      <ArticleSubnav articles={articles} />
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
