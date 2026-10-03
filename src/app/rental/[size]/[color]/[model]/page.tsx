import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema, productSchema } from "@/lib/schema";
import { colorLabels, sizeLabels, siteConfig } from "@/lib/site-config";
import { getProductById, getProductsBySizeColor } from "@/lib/data";
import { joinBrandName } from "@/lib/data/types";
import { ProductTabs } from "@/components/ProductTabs";
import { ProductBuyBox } from "@/components/ProductBuyBox";

type Params = { size: string; color: string; model: string };

export async function generateStaticParams() {
  const sizes = Object.keys(sizeLabels);
  const colors = Object.keys(colorLabels);
  const combos = await Promise.all(
    sizes.flatMap((size) => colors.map((color) => getProductsBySizeColor(size, color).then((ps) => ps.map((p) => ({ size, color, model: p.id })))))
  );
  return combos.flat();
}

async function loadProduct(size: string, color: string, model: string) {
  if (!(size in sizeLabels) || !(color in colorLabels)) return null;
  const product = await getProductById(model);
  if (!product || product.size !== size || product.color !== color) return null;
  return product;
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { size, color, model } = await params;
  const product = await loadProduct(size, color, model);
  if (!product) return {};
  return buildMetadata({
    title: `${joinBrandName(product.brand, product.name)} | ${sizeLabels[size]} ${colorLabels[color]} 복합기 렌탈`,
    description: `${joinBrandName(product.brand, product.name)} 상세 조건${
      product.priceMonthly ? `, ${product.priceMonthly.toLocaleString()}원부터 /월 (VAT 별도)` : ""
    }. ${siteConfig.name}에서 설치·A/S까지 한 번에 관리합니다.`,
    path: `/rental/${size}/${color}/${model}`,
    images: product.images,
  });
}

export default async function RentalModelPage({ params }: { params: Promise<Params> }) {
  const { size, color, model } = await params;
  const product = await loadProduct(size, color, model);
  if (!product) notFound();

  const path = `/rental/${size}/${color}/${model}`;
  const productLabel = joinBrandName(product.brand, product.name);
  const related = (await getProductsBySizeColor(size, color)).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="bg-[#fafafa]">
    <div className="mx-auto max-w-6xl px-4 py-14">
      <JsonLd data={productSchema(product, path)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "홈", path: "/" },
          { name: "복합기 렌탈", path: "/rental" },
          { name: sizeLabels[size], path: `/rental/${size}` },
          { name: `${sizeLabels[size]} ${colorLabels[color]}`, path: `/rental/${size}/${color}` },
          { name: product.name, path },
        ])}
      />
      <p className="text-sm text-foreground-soft">
        <Link href="/rental" className="hover:text-brand-ink">복합기 렌탈</Link> /{" "}
        <Link href={`/rental/${size}`} className="hover:text-brand-ink">{sizeLabels[size]}</Link> /{" "}
        <Link href={`/rental/${size}/${color}`} className="hover:text-brand-ink">{colorLabels[color]}</Link>
      </p>

      {/* 사진+구매패널 그리드와 그 아래 조건 요약 카드는 ProductBuyBox 안에서 함께 구성됩니다
          (조건 요약이 그리드 바깥의 형제 블록이라, 구매패널이 사진보다 길어져도 가려지지 않습니다). */}
      <div className="mt-6">
        <ProductBuyBox
          product={product}
          images={product.images}
          size={size}
          colorLabel={colorLabels[color]}
          sizeLabel={sizeLabels[size]}
        />
      </div>

      {/* 상세정보·리뷰·문의: 대표사진 외 나머지 이미지는 모두 상세정보 탭에서 한 번에 이어서 보여줍니다 */}
      <ProductTabs
        specs={product.specs ?? []}
        contactHref={`/contact?product=${encodeURIComponent(productLabel)}`}
        descriptionHtml={product.descriptionHtml}
      />

      {related.length > 0 && (
        <div className="mt-14">
          <p className="text-lg font-bold">함께 보는 상품</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/rental/${size}/${color}/${p.id}`}
                className="overflow-hidden rounded-xl border border-border transition hover:border-brand hover:shadow-sm"
              >
                {p.images[0] && (
                  <div className="relative aspect-square bg-surface">
                    <Image src={p.images[0]} alt={joinBrandName(p.brand, p.name)} fill className="object-contain p-4" sizes="(min-width: 1024px) 20vw, 45vw" />
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs font-semibold text-brand-ink">{p.brand}</p>
                  <p className="mt-1 text-sm font-semibold leading-snug">{p.name}</p>
                  {p.priceMonthly ? (
                    <p className="mt-2 text-sm font-bold">
                      {p.priceMonthly.toLocaleString()}원<span className="text-xs font-normal text-foreground-soft"> 부터 /월 (VAT 별도)</span>
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

      <div className="relative mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d2723] to-[#125e51] px-6 py-10 text-white sm:px-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.35)_1.5px,transparent_1.5px)] [background-size:20px_20px]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="sm:flex-1">
            <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-brand">
              <span className="h-px w-6 bg-brand" /> 무료 상담
            </p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">이 기종, 우리 사무실에 맞을까요?</h2>
            <p className="mt-2 text-sm text-white/70 sm:whitespace-nowrap">전화 한 통이면 사용량·예산에 맞는 기종과 조건을 바로 안내해 드립니다.</p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-64">
            <a
              href={siteConfig.phoneHref}
              className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0d2723] hover:opacity-90"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {siteConfig.phone}
            </a>
            <Link
              href={`/contact?product=${encodeURIComponent(productLabel)}`}
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              온라인 견적 받기 →
            </Link>
            <p className="whitespace-nowrap text-center text-xs text-white/60">{siteConfig.businessHours.weekday} · 당일 회신</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
