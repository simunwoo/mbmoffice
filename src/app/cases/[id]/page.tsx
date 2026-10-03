import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { siteConfig } from "@/lib/site-config";
import { getInstallById, getInstalls, getProducts } from "@/lib/data";
import { joinBrandName } from "@/lib/data/types";
import { findProductForInstall, productHref } from "@/lib/product-match";

type Params = { id: string };

export async function generateStaticParams() {
  const installs = await getInstalls();
  return installs.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const item = await getInstallById(id);
  if (!item) return {};
  return buildMetadata({
    title: item.title,
    description: item.body.slice(0, 140),
    path: `/cases/${id}`,
    images: item.images,
  });
}

export default async function CaseDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const item = await getInstallById(id);
  if (!item) notFound();

  const products = await getProducts();
  const recommended = findProductForInstall(products, item.model);

  return (
    <article className="mx-auto max-w-3xl px-4 py-14">
      <JsonLd
        data={breadcrumbSchema([
          { name: "홈", path: "/" },
          { name: "설치사례", path: "/cases" },
          { name: item.title, path: `/cases/${id}` },
        ])}
      />
      <p className="text-sm font-semibold text-brand-ink">{[item.region, item.industry].filter(Boolean).join(" · ")}</p>
      <h1 className="mt-2 text-3xl font-bold">{item.title}</h1>
      {item.brand && item.model && (
        <p className="mt-2 text-sm text-foreground-soft">설치 모델: {joinBrandName(item.brand, item.model)}</p>
      )}

      {item.images[0] && (
        <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-border bg-surface">
          <Image src={item.images[0]} alt={item.title} fill className="object-cover" sizes="(min-width: 768px) 640px, 100vw" priority />
        </div>
      )}

      {item.bodyHtml ? (
        <div
          className="prose prose-neutral mt-8 max-w-none text-foreground-soft [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-4 [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_p]:my-3"
          dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
        />
      ) : (
        <div className="prose prose-neutral mt-8 max-w-none whitespace-pre-line text-foreground-soft">{item.body}</div>
      )}

      {recommended && (
        <div className="mt-10 rounded-2xl border-2 border-brand bg-brand-soft p-6">
          <p className="text-xs font-extrabold tracking-widest text-brand">AI 상품 추천</p>
          <p className="mt-1 text-sm text-foreground-soft">
            이 사례에 설치된 장비와 같은 모델을 지금 렌탈·구매하실 수 있어요.
          </p>
          <Link href={productHref(recommended)} className="mt-4 flex items-center gap-4 rounded-xl bg-background p-4 transition hover:shadow-sm">
            {recommended.images[0] && (
              <div className="relative h-16 w-16 shrink-0">
                <Image src={recommended.images[0]} alt={joinBrandName(recommended.brand, recommended.name)} fill className="object-contain" sizes="64px" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{joinBrandName(recommended.brand, recommended.name)}</p>
              <p className="mt-1 text-sm font-bold text-brand-ink">
                {recommended.priceMonthly
                  ? `${recommended.priceMonthly.toLocaleString()}원${
                      recommended.category === "mfp" || recommended.category === "printer" ? "부터" : ""
                    } /월 (VAT 별도)`
                  : recommended.purchasePrice
                    ? `${recommended.purchasePrice.toLocaleString()}원 (VAT 별도)`
                    : "가격 문의"}
              </p>
            </div>
            <span aria-hidden className="shrink-0 text-brand-ink">→</span>
          </Link>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <a href={siteConfig.phoneHref} className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
          우리 사무실도 상담받기
        </a>
        <Link href="/cases" className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-surface">
          다른 설치사례 보기
        </Link>
      </div>
    </article>
  );
}
