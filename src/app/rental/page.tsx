import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { getProductsByCategories } from "@/lib/data";
import { RentalCatalog } from "@/components/RentalCatalog";

export const metadata = buildMetadata({
  title: "복합기 렌탈·사무기기 렌탈 상품",
  description: "후지필름·캐논 등 검증된 복합기·프린터·문서세단기 렌탈 상품을 모델명, 가격, 색상, 용지 크기로 검색하세요.",
  path: "/rental",
});

export default async function RentalHubPage() {
  const catalogProducts = (
    await getProductsByCategories(["mfp", "printer", "pc", "notebook", "shredder", "nas"])
  ).filter((p) => p.pricingType === "rental");

  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: "렌탈 상품", path: "/rental" }])} />
      <RentalCatalog products={catalogProducts} />
    </div>
  );
}
