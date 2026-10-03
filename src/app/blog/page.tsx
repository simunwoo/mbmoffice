import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { getBlogPosts } from "@/lib/data";
import { LinkPagination } from "@/components/LinkPagination";
import { AdminWriteButton } from "@/components/admin/AdminWriteButton";

export const metadata = buildMetadata({
  title: "블로그 | 복합기 드라이버·에러코드·제품정보",
  description: "복합기·프린터 드라이버 설치법, 에러코드 해결법, 제품 정보를 안내합니다.",
  path: "/blog",
});

// 실제 게시글 카테고리 중 가장 많이 쓰인 상위 3개만 탭으로 노출합니다.
const TOP_CATEGORY_COUNT = 3;
const PAGE_SIZE = 12; // 데스크톱 기준 3열 x 4줄

export default async function BlogListPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  const { category, page: pageParam } = await searchParams;
  const posts = await getBlogPosts();

  const categoryCounts = new Map<string, number>();
  for (const post of posts) {
    if (post.category) categoryCounts.set(post.category, (categoryCounts.get(post.category) ?? 0) + 1);
  }
  const topCategories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP_CATEGORY_COUNT);

  const tabs = [{ value: "", label: "전체", count: posts.length }, ...topCategories.map(([value, count]) => ({ value, label: value, count }))];
  const activeCategory = tabs.find((t) => t.value === category)?.value ?? "";
  const filteredPosts = activeCategory ? posts.filter((p) => p.category === activeCategory) : posts;

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const pagePosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function hrefFor(page: number) {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/blog?${qs}` : "/blog";
  }

  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: "블로그", path: "/blog" }])} />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-soft via-[#f3f1ea] to-[#f7ece6] px-4 py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(1,160,129,0.28)_1.5px,transparent_1.5px)] [background-size:20px_20px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm text-foreground-soft">
            <Link href="/" className="hover:text-brand-ink">홈</Link> <span aria-hidden>›</span> 블로그
          </p>

          <p className="mt-6 flex items-center gap-2 text-xs font-bold tracking-widest text-brand-ink">
            <span className="h-px w-6 bg-brand-ink" /> MBM BLOG
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">현장에서 정리한 사무기기 이야기</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground-soft sm:text-base">
            복합기 사용법부터 렌탈·구매 선택 기준, 기종별 특징까지. 사무기기를 고르고 운영하면서 한 번쯤 궁금해지는
            내용을 현장에서 직접 설치하는 엠비엠이 알기 쉽게 정리해 드립니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.value || "all"}
                href={tab.value ? `/blog?category=${encodeURIComponent(tab.value)}` : "/blog"}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === tab.value ? "bg-[#12241c] text-white" : "bg-background text-foreground-soft hover:text-brand-ink"
                }`}
              >
                {tab.label}
                <span className={activeCategory === tab.value ? "text-white/70" : "text-foreground-soft/70"}>{tab.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14">
        {filteredPosts.length === 0 ? (
          <p className="text-foreground-soft">해당 카테고리에 등록된 글이 없습니다.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {pagePosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="overflow-hidden rounded-xl border border-border transition hover:border-brand hover:shadow-sm"
              >
                {post.images[0] && (
                  <div className="relative aspect-video bg-surface">
                    <Image src={post.images[0]} alt={post.title} fill className="object-contain p-2" sizes="(min-width: 1024px) 30vw, 50vw" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    {post.category && <p className="text-xs font-semibold text-brand-ink">{post.category}</p>}
                    {post.date && <p className="text-xs text-foreground-soft">{post.date}</p>}
                  </div>
                  <p className="mt-2 font-medium leading-snug">{post.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <LinkPagination page={currentPage} totalPages={totalPages} hrefFor={hrefFor} />
          <AdminWriteButton href="/admin/blog/new" />
        </div>
      </div>
    </div>
  );
}
