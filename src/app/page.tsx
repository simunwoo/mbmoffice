import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { getBlogPosts, getInstalls, getProducts, getProductsBySizeColor, getProductsByCategory } from "@/lib/data";
import { HeroCarousel } from "@/components/HeroCarousel";
import { BusinessAreas } from "@/components/BusinessAreas";
import { OfficeCollection, type CollectionTab } from "@/components/OfficeCollection";
import { BundleOffers, type Bundle } from "@/components/BundleOffers";
import { CompanyStory } from "@/components/CompanyStory";
import type { Product } from "@/lib/data/types";

export const metadata = buildMetadata({
  title: `${siteConfig.name} | 서울·수도권 복합기·PC 렌탈`,
  description: siteConfig.shortDescription,
  path: "/",
});

function cheapestFirst(products: Product[], limit: number): Product[] {
  return products
    .filter((p) => p.priceMonthly)
    .sort((a, b) => (a.priceMonthly ?? 0) - (b.priceMonthly ?? 0))
    .slice(0, limit);
}

// 홈 화면 "컬러 복합기" 탭에 직접 고른 추천 라인업 (2026-09-24 요청: iR ADV DX C3926 대신 Apeos C3067).
// MAXIFY GX7190은 A4 잉크젯으로 재분류되어 A3 컬러 복합기 탭에서 제외했습니다.
const FEATURED_COLOR_MFP_NAMES = ["iR ADV DX C3922", "Apeos C2561", "Apeos C3067", "Apeos C4571"];
// 어떤 이유로든 이름 매칭이 전부 실패해 cheapestFirst로 대체될 때도 이 모델만은 노출되지 않도록 안전장치를 둡니다.
const EXCLUDED_COLOR_MFP_NAMES = ["iR ADV DX C3926"];

function pickByNames(products: Product[], names: string[]): Product[] {
  return names.map((n) => products.find((p) => p.name.includes(n))).filter((p): p is Product => p !== undefined);
}

export default async function HomePage() {
  const [installsAll, blogPostsAll, allProducts, a3ColorProductsRaw, a3MonoProducts, shredderProducts] = await Promise.all([
    getInstalls(),
    getBlogPosts(),
    getProducts(),
    getProductsBySizeColor("a3", "color"),
    getProductsBySizeColor("a3", "mono"),
    getProductsByCategory("shredder"),
  ]);

  const installs = installsAll.slice(0, 3);
  const blogPosts = blogPostsAll.slice(0, 3);

  const a3ColorProducts = a3ColorProductsRaw.filter((p) => !EXCLUDED_COLOR_MFP_NAMES.some((n) => p.name.includes(n)));
  const curatedColorMfp = pickByNames(a3ColorProducts, FEATURED_COLOR_MFP_NAMES);
  const colorMfp = curatedColorMfp.length === FEATURED_COLOR_MFP_NAMES.length ? curatedColorMfp : cheapestFirst(a3ColorProducts, 4);
  const monoMfp = cheapestFirst(a3MonoProducts, 4);
  const pcRental = cheapestFirst(
    allProducts.filter((p) => (p.category === "pc" || p.category === "notebook") && p.pricingType === "rental"),
    4
  );
  const shredderRental = cheapestFirst(shredderProducts.filter((p) => p.pricingType === "rental"), 4);

  const tabs: CollectionTab[] = [
    { key: "color", label: "컬러 복합기", products: colorMfp },
    { key: "mono", label: "흑백 복합기", products: monoMfp },
    { key: "pc", label: "PC·노트북", products: pcRental },
    { key: "shredder", label: "문서세단기", products: shredderRental },
  ];

  const flagshipMfp = colorMfp[0];
  const pcBundleMfp = colorMfp.find((p) => p.name.includes("Apeos C2561")) ?? flagshipMfp;
  const bundles: Bundle[] = [];
  if (flagshipMfp && shredderRental[0]) {
    bundles.push({ key: "mfp-shredder", label: "복합기 + 문서세단기", items: [flagshipMfp, shredderRental[0]] });
  }
  if (pcBundleMfp && pcRental[0]) {
    bundles.push({ key: "mfp-pc", label: "복합기 + 컴퓨터", items: [pcBundleMfp, pcRental[0]] });
  }

  return (
    <div>
      <HeroCarousel />

      <BusinessAreas />

      <OfficeCollection tabs={tabs} />

      <CompanyStory />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.15em] text-brand">WITH MBM</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">좋은 변화는, 현장에서.</h2>
            <p className="mt-2 text-sm text-foreground-soft">다양한 사무공간에 함께한 MBM의 실제 설치 이야기.</p>
          </div>
          <Link href="/cases" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:opacity-80">
            전체 설치사례 보기
            <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {installs.map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="overflow-hidden rounded-xl border border-border transition hover:border-brand hover:shadow-sm"
            >
              {c.images[0] && (
                <div className="relative aspect-video bg-surface">
                  <Image src={c.images[0]} alt={c.title} fill className="object-cover" sizes="(min-width: 1024px) 30vw, 100vw" />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-semibold text-brand-ink">
                  {[c.region, c.industry].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-2 font-medium leading-snug">{c.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <BundleOffers bundles={bundles} />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[0.15em] text-brand">OFFICE JOURNAL</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">알아두면 편한, 사무실 이야기.</h2>
            <p className="mt-2 text-sm text-foreground-soft">장비 선택부터 관리 팁까지, MBM이 알려드립니다.</p>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:opacity-80">
            블로그 전체보기
            <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {blogPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="overflow-hidden rounded-xl border border-border transition hover:border-brand hover:shadow-sm"
            >
              {post.images[0] && (
                <div className="relative aspect-video bg-surface">
                  <Image src={post.images[0]} alt={post.title} fill className="object-contain p-2" sizes="(min-width: 1024px) 30vw, 100vw" />
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
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d2723] to-[#125e51] px-6 py-10 text-white sm:px-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.35)_1.5px,transparent_1.5px)] [background-size:20px_20px]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:flex-1">
              <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-brand">
                <span className="h-px w-6 bg-brand" /> 무료 상담
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">우리 사무실에 맞는 사무기기, 지금 바로 상담하세요</h2>
              <p className="mt-2 text-sm text-white/70">전화 한 통이면 사무환경에 맞는 기종과 요금제를 제안해 드립니다. 상담과 견적은 무료입니다.</p>
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
                href="/contact"
                className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90"
              >
                온라인 견적 받기 →
              </Link>
              <p className="whitespace-nowrap text-center text-xs text-white/60">{siteConfig.businessHours.weekday} · 당일 회신</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
