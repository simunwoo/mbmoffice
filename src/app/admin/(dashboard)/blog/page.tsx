import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { deleteBlogPost } from "@/lib/actions/admin/blog";
import type { BlogPostRow } from "@/lib/supabase/types";

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category, q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();
  const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });

  const posts = (data ?? []) as BlogPostRow[];

  const counts = new Map<string, number>();
  for (const post of posts) {
    if (post.category) counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  const categories = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  const activeCategory = category && counts.has(category) ? category : undefined;
  const filteredPosts = posts.filter((p) => {
    if (activeCategory && p.category !== activeCategory) return false;
    if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  function buildHref(overrides: { category?: string; q?: string }) {
    const merged = { category, q, ...overrides };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/admin/blog?${qs}` : "/admin/blog";
  }

  const navItemClass = (active: boolean) =>
    `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active ? "bg-brand-soft text-brand-ink" : "text-foreground-soft hover:bg-surface"
    }`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">블로그</h1>
          <p className="mt-1 text-sm text-foreground-soft">사이트에 게시할 블로그 글을 작성하고 관리합니다.</p>
        </div>
        <Link href="/admin/blog/new" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
          새 글 작성
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-52">
          <nav className="space-y-1">
            <Link href={buildHref({ category: undefined })} className={navItemClass(!activeCategory)}>
              전체 <span>{posts.length}</span>
            </Link>
            {categories.map(([name, count]) => (
              <Link key={name} href={buildHref({ category: name })} className={navItemClass(activeCategory === name)}>
                {name} <span>{count}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <form action="/admin/blog" method="get" className="flex gap-2">
            {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="제목으로 검색"
              className="w-full max-w-sm rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90">
              검색
            </button>
            {query && (
              <Link
                href={buildHref({ q: undefined })}
                className="flex items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
              >
                초기화
              </Link>
            )}
          </form>

          {error && <p className="mt-4 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}
          {!error && filteredPosts.length === 0 && <p className="mt-4 text-sm text-foreground-soft">조건에 맞는 글이 없습니다.</p>}

          {!error && filteredPosts.length > 0 && (
            <div className="mt-4 max-h-[70vh] overflow-auto rounded-2xl border border-border bg-background">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs text-foreground-soft">
                  <tr>
                    <th className="px-4 py-3 font-semibold">제목</th>
                    <th className="px-4 py-3 font-semibold">카테고리</th>
                    <th className="px-4 py-3 font-semibold">작성일</th>
                    <th className="px-4 py-3 font-semibold">출처</th>
                    <th className="px-4 py-3 font-semibold">상태</th>
                    <th className="px-4 py-3 font-semibold">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPosts.map((post) => (
                    <tr key={post.id}>
                      <td className="whitespace-nowrap px-4 py-3 font-semibold">
                        <Link href={`/blog/${post.id}`} target="_blank" className="hover:text-brand-ink hover:underline">
                          {post.title}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{post.category ?? "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{post.post_date ?? "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{post.source}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                            post.status === "published" ? "bg-brand-soft text-brand-ink" : "bg-surface text-foreground-soft"
                          }`}
                        >
                          {post.status === "published" ? "공개" : "임시저장"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/blog/${post.id}`} className="font-semibold text-brand-ink hover:underline">
                            수정
                          </Link>
                          <ConfirmDeleteButton onDelete={deleteBlogPost.bind(null, post.id)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
