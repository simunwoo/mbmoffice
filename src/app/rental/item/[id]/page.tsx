import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema, productSchema } from "@/lib/schema";
import { siteConfig } from "@/lib/site-config";
import { getProductById, getProductsByCategory } from "@/lib/data";
import { joinBrandName } from "@/lib/data/types";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductTabs } from "@/components/ProductTabs";
import { WishlistButton } from "@/components/WishlistButton";

type Params = { id: string };

const CATEGORY_LABEL: Record<string, string> = {
  pc: "조립PC",
  notebook: "노트북",
  shredder: "문서세단기",
  nas: "NAS",
};

const CATEGORY_LIST_PATH: Record<string, string> = {
  pc: "/pc-rental",
  notebook: "/pc-rental",
  shredder: "/shredder",
  nas: "/rental",
};

async function loadProduct(id: string) {
  const product = await getProductById(id);
  // 복합기·프린터(용지크기·컬러가 있는 기종)는 전용 상세페이지(/rental/[size]/[color]/[model])가 따로 있어
  // 이 공용 페이지 대상이 아닙니다.
  if (!product || product.pricingType !== "rental" || product.category === "mfp" || product.category === "printer") return null;
  return product;
}

export async function generateStaticParams() {
  const categories = ["pc", "notebook", "shredder", "nas"] as const;
  const lists = await Promise.all(categories.map((c) => getProductsByCategory(c)));
  return lists
    .flat()
    .filter((p) => p.pricingType === "rental")
    .map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) return {};
  const label = joinBrandName(product.brand, product.name);
  return buildMetadata({
    title: `${label} 렌탈`,
    description: `${label} 렌탈 조건${product.priceMonthly ? `, ${product.priceMonthly.toLocaleString()}원/월 (VAT 별도)` : ""}. ${siteConfig.name}에서 설치·A/S까지 한 번에 관리합니다.`,
    path: `/rental/item/${id}`,
    images: product.images,
  });
}

export default async function RentalItemPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) notFound();

  const path = `/rental/item/${id}`;
  const productLabel = joinBrandName(product.brand, product.name);
  const categoryLabel = CATEGORY_LABEL[product.category] ?? product.category;
  const listPath = CATEGORY_LIST_PATH[product.category] ?? "/rental";
  const related = (await getProductsByCategory(product.category)).filter((p) => p.id !== product.id && p.pricingType === "rental").slice(0, 4);

  const applyHref = `/rental/apply?product=${product.id}`;
  const contactHref = `/contact?product=${encodeURIComponent(productLabel)}`;

  return (
    <div className="bg-[#fafafa]">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <JsonLd data={productSchema(product, path)} />
        <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: `${categoryLabel} 렌탈`, path: listPath }, { name: product.name, path }])} />
        <p className="text-sm text-foreground-soft">
          <Link href={listPath} className="hover:text-brand-ink">{categoryLabel} 렌탈</Link>
        </p>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <ProductGallery images={product.images} alt={productLabel} />

          <div className="rounded-2xl border border-border bg-background p-6">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground-soft">{product.brand}</span>
              <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">{categoryLabel}</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold leading-snug">{product.name}</h1>
            {product.termMonths && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-brand-ink">
                <span aria-hidden>•</span> {product.termMonths}개월 약정 · 보증금 없음
              </p>
            )}

            <div className="mt-5 rounded-xl bg-surface p-5">
              <p className="text-xs text-foreground-soft">월 렌탈료</p>
              {product.priceMonthly ? (
                <p className="mt-1 text-3xl font-bold text-brand-ink">
                  {product.priceMonthly.toLocaleString()}원<span className="ml-1 text-sm font-normal text-foreground-soft">/월</span>
                </p>
              ) : (
                <p className="mt-1 text-lg font-semibold">정확한 렌탈료는 전화 문의 시 안내해 드립니다.</p>
              )}
              <p className="mt-1 text-xs text-foreground-soft">부가세 별도 · 약정·설치 조건은 상담 시 확정됩니다.</p>
            </div>

            {product.specs && product.specs.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm text-foreground-soft">
                {product.specs.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}

            <div className="mt-6 flex flex-col gap-3">
              <div className="flex gap-3">
                <Link href={applyHref} className="flex-1 rounded-full bg-brand py-3.5 text-center text-sm font-bold text-white hover:opacity-90">
                  렌탈 신청 →
                </Link>
                <WishlistButton productId={product.id} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link href={contactHref} className="rounded-full border border-border bg-background py-3.5 text-center text-sm font-bold hover:opacity-80">
                  렌탈 견적 문의
                </Link>
                <a
                  href={siteConfig.kakaoChatUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#FEE500] py-3.5 text-center text-sm font-bold text-[#3C1E1E] hover:opacity-90"
                >
                  카카오톡 상담
                </a>
              </div>
            </div>

            <div className="mt-5 space-y-1 text-sm">
              <p>
                <span className="text-foreground-soft">배송</span>{" "}
                <span className="font-medium">상담 시 지역·배송 및 설치 조건 확정</span>
              </p>
              <p>
                <span className="text-foreground-soft">문의</span>{" "}
                <span className="font-medium">{siteConfig.phone} ({siteConfig.businessHours.weekday}) · 카카오 채널</span>
              </p>
            </div>
          </div>
        </div>

        <ProductTabs specs={product.specs ?? []} contactHref={contactHref} descriptionHtml={product.descriptionHtml} />

        {related.length > 0 && (
          <div className="mt-14">
            <p className="text-lg font-bold">함께 보는 상품</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/rental/item/${p.id}`}
                  className="overflow-hidden rounded-xl border border-border transition hover:border-brand hover:shadow-sm"
                >
                  {p.images[0] && (
                    <div className="relative aspect-square bg-surface">
                      <Image
                        src={p.images[0]}
                        alt={joinBrandName(p.brand, p.name)}
                        fill
                        className="object-contain p-4"
                        sizes="(min-width: 1024px) 20vw, 45vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs font-semibold text-brand-ink">{p.brand}</p>
                    <p className="mt-1 text-sm font-semibold leading-snug">{p.name}</p>
                    {p.priceMonthly ? (
                      <p className="mt-2 text-sm font-bold">
                        {p.priceMonthly.toLocaleString()}원<span className="text-xs font-normal text-foreground-soft"> /월 (VAT 별도)</span>
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-foreground-soft">가격 문의</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
