import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { shopCategories, siteConfig } from "@/lib/site-config";
import { getPurchaseProductsByCategories } from "@/lib/data";
import { joinBrandName } from "@/lib/data/types";

type Params = { category: string };

function findCategory(slug: string) {
  return shopCategories.find((c) => c.slug === slug);
}

export async function generateStaticParams() {
  return shopCategories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category } = await params;
  const entry = findCategory(category);
  if (!entry) return {};
  return buildMetadata({
    title: `${entry.label} 구매`,
    description: `${entry.label} 구매 가능한 전체 상품과 가격을 확인하세요.`,
    path: `/shop/${category}`,
  });
}

export default async function ShopCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { category } = await params;
  const { q } = await searchParams;
  const entry = findCategory(category);
  if (!entry) notFound();
  const allProducts = await getPurchaseProductsByCategories(entry.categories);

  const query = (q ?? "").trim().toLowerCase();
  const products = query
    ? allProducts.filter((p) => [p.brand, p.name, ...(p.specs ?? [])].join(" ").toLowerCase().includes(query))
    : allProducts;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <JsonLd
        data={breadcrumbSchema([
          { name: "홈", path: "/" },
          { name: "구매", path: "/shop" },
          { name: entry.label, path: `/shop/${category}` },
        ])}
      />
      <p className="text-sm text-foreground-soft">
        <Link href="/shop" className="hover:text-brand-ink">구매</Link> / {entry.label}
      </p>
      <h1 className="mt-2 text-3xl font-bold">{entry.label} 구매</h1>

      <form className="mt-6 flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={`${entry.label} 모델명·규격 검색`}
          className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
        <button type="submit" className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:border-brand hover:text-brand-ink">
          검색
        </button>
        {query && (
          <Link href={`/shop/${category}`} className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-surface">
            초기화
          </Link>
        )}
      </form>

      <p className="mt-4 text-sm text-foreground-soft">
        전체 {allProducts.length}개 중 <span className="font-semibold text-brand-ink">{products.length}개</span> 표시
      </p>

      {products.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-8 text-foreground-soft">
          <p>{query ? `"${q}"에 대한 검색 결과가 없습니다.` : `현재 온라인에 등록된 ${entry.label} 구매 상품이 없습니다.`}</p>
          <a href={siteConfig.phoneHref} className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            전화로 재고 문의 {siteConfig.phone}
          </a>
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/shop/${category}/${p.id}`}
              className="overflow-hidden rounded-xl border border-border hover:border-brand hover:shadow-sm"
            >
              {p.images[0] && (
                <div className="relative aspect-square bg-surface">
                  <Image src={p.images[0]} alt={joinBrandName(p.brand, p.name)} fill className="object-contain p-4" sizes="(min-width: 1024px) 30vw, 50vw" />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-semibold text-brand-ink">{p.brand}</p>
                <p className="mt-1 font-bold">{p.name}</p>
                {p.purchasePrice ? (
                  <p className="mt-2 text-sm text-foreground-soft">{p.purchasePrice.toLocaleString()}원 (VAT 별도)</p>
                ) : (
                  <p className="mt-2 text-sm text-foreground-soft">가격 문의</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
