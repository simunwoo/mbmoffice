import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema, productSchema } from "@/lib/schema";
import { shopCategories, siteConfig, colorLabels, sizeLabels } from "@/lib/site-config";
import { getProductById, getPurchaseProductsByCategories, getProductOptions, getProductAddons } from "@/lib/data";
import { joinBrandName } from "@/lib/data/types";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductTabs } from "@/components/ProductTabs";
import { PurchasePanel } from "@/components/PurchasePanel";

type Params = { category: string; id: string };

function findCategory(slug: string) {
  return shopCategories.find((c) => c.slug === slug);
}

export async function generateStaticParams() {
  const perCategory = await Promise.all(
    shopCategories.map((c) => getPurchaseProductsByCategories(c.categories).then((ps) => ps.map((p) => ({ category: c.slug, id: p.id }))))
  );
  return perCategory.flat();
}

async function loadProduct(category: string, id: string) {
  const entry = findCategory(category);
  if (!entry) return null;
  const product = await getProductById(id);
  if (!product || !entry.categories.includes(product.category) || product.pricingType !== "purchase") return null;
  return { entry, product };
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { category, id } = await params;
  const loaded = await loadProduct(category, id);
  if (!loaded) return {};
  const { product } = loaded;
  return buildMetadata({
    title: `${joinBrandName(product.brand, product.name)} 구매`,
    description: `${joinBrandName(product.brand, product.name)} 구매 가격${
      product.purchasePrice ? ` ${product.purchasePrice.toLocaleString()}원(VAT 별도)` : ""
    }. ${siteConfig.name}에서 배송·설치까지 지원합니다.`,
    path: `/shop/${category}/${id}`,
    images: product.images,
  });
}

export default async function ShopProductPage({ params }: { params: Promise<Params> }) {
  const { category, id } = await params;
  const loaded = await loadProduct(category, id);
  if (!loaded) notFound();
  const { entry, product } = loaded;
  const path = `/shop/${category}/${id}`;

  const productLabel = joinBrandName(product.brand, product.name);
  const highlightSpecs = (product.specs ?? []).slice(0, 3);
  const [{ optionGroups, variants }, addons] = await Promise.all([
    getProductOptions(product.id),
    getProductAddons(product.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <JsonLd data={productSchema(product, path)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "홈", path: "/" },
          { name: "구매", path: "/shop" },
          { name: entry.label, path: `/shop/${category}` },
          { name: product.name, path },
        ])}
      />
      <p className="text-sm text-foreground-soft">
        <Link href="/shop" className="hover:text-brand-ink">구매</Link> /{" "}
        <Link href={`/shop/${category}`} className="hover:text-brand-ink">{entry.label}</Link>
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <ProductGallery images={product.images.slice(0, 1)} alt={productLabel} />

        <div className="rounded-2xl border border-border bg-background p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground-soft">{product.brand}</span>
            <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">{entry.label}</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-snug">{product.name}</h1>

          <div className="mt-4">
            {product.purchasePrice ? (
              <p className="text-3xl font-bold text-brand-ink">
                {product.purchasePrice.toLocaleString()}원
                <span className="ml-1 text-sm font-normal text-foreground-soft">(VAT 별도)</span>
                {product.listPrice && product.listPrice !== product.purchasePrice && (
                  <span className="ml-2 text-base font-normal text-foreground-soft line-through">
                    {product.listPrice.toLocaleString()}원
                  </span>
                )}
              </p>
            ) : (
              <p className="text-lg font-semibold">정확한 구매가는 전화 문의 시 안내해 드립니다.</p>
            )}
          </div>

          {highlightSpecs.length > 0 && (
            <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm text-foreground-soft">
              {highlightSpecs.map((spec) => (
                <li key={spec}>{spec}</li>
              ))}
            </ul>
          )}

          <div className="mt-5 overflow-hidden rounded-xl border border-border text-sm">
            <InfoRow label="브랜드" value={product.brand} />
            {product.size && <InfoRow label="용지 크기" value={sizeLabels[product.size] ?? product.size} />}
            {product.color && <InfoRow label="출력 색상" value={colorLabels[product.color] ?? product.color} />}
            <InfoRow label="배송" value="전국 배송 · 설치 지원 (지역별 배송비는 상담 시 안내)" />
          </div>

          {product.purchasePrice && (
            <PurchasePanel
              productId={product.id}
              basePrice={product.purchasePrice}
              optionGroups={optionGroups}
              variants={variants}
              addons={addons}
            />
          )}
          <a
            href={siteConfig.phoneHref}
            className="mt-3 block rounded-full border border-border bg-background py-3.5 text-center text-sm font-bold hover:bg-surface"
          >
            전화 상담 {siteConfig.phone}
          </a>
        </div>
      </div>

      {/* 상세정보·리뷰·상품문의: 대표사진 외 나머지 이미지는 모두 상세정보 탭에서 한 번에 이어서 보여줍니다 */}
      <ProductTabs
        specs={product.specs ?? []}
        contactHref={`/contact?product=${encodeURIComponent(productLabel)}`}
        descriptionHtml={product.descriptionHtml}
      />

      <div className="mt-8">
        <Link href={`/shop?tab=${category}`} className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-surface">
          {entry.label} 다른 상품 보기
        </Link>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border bg-surface px-4 py-3 first:border-t-0">
      <p className="shrink-0 font-semibold text-foreground-soft">{label}</p>
      <p className="text-right text-foreground">{value}</p>
    </div>
  );
}
