import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { shopCategories } from "@/lib/site-config";
import { getPurchaseProductsByCategories } from "@/lib/data";
import { ShopCatalog } from "@/components/ShopCatalog";

export const metadata = buildMetadata({
  title: "복합기·소모품·PC 구매 상품",
  description: "복합기·프린터 구매부터 정품 토너·드럼 소모품, 사무용 PC, 문서세단기까지 모델명, 가격, 색상, 용지 크기로 검색하세요.",
  path: "/shop",
});

export default async function ShopHubPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const allCategories = shopCategories.flatMap((c) => c.categories);
  const products = await getPurchaseProductsByCategories(allCategories);

  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: "구매 상품", path: "/shop" }])} />
      <ShopCatalog products={products} initialTab={tab} />
    </div>
  );
}
