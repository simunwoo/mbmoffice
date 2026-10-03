import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { getProductsByCategories, getPurchaseProductsByCategories } from "@/lib/data";
import { CompareTool } from "@/components/CompareTool";

export const metadata = buildMetadata({
  title: "상품 비교",
  description: "월 렌탈료와 일시 구매가 등 조건을 나란히 비교하세요.",
  path: "/compare",
});

const CATEGORIES = ["mfp", "printer", "pc", "notebook", "nas", "shredder"] as const;

export default async function ComparePage() {
  const [rentalAll, purchaseAll] = await Promise.all([
    getProductsByCategories([...CATEGORIES]),
    getPurchaseProductsByCategories([...CATEGORIES, "supplies", "parts"]),
  ]);
  const rentalProducts = rentalAll.filter((p) => p.pricingType === "rental");

  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: "상품 비교", path: "/compare" }])} />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-soft via-[#f3f1ea] to-[#f7ece6] px-4 py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(1,160,129,0.28)_1.5px,transparent_1.5px)] [background-size:20px_20px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm text-foreground-soft">
            <Link href="/" className="hover:text-brand-ink">홈</Link> <span aria-hidden>›</span> 상품 비교
          </p>

          <p className="mt-6 flex items-center gap-2 text-xs font-bold tracking-widest text-brand-ink">
            <span className="h-px w-6 bg-brand-ink" /> COMPARE
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">조건을 나란히 비교하세요</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground-soft sm:text-base">
            월 렌탈료와 일시 구매가는 서로 다른 금액입니다. 약정·부가세·기본 매수까지 함께 확인하세요.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14">
        <CompareTool rentalProducts={rentalProducts} purchaseProducts={purchaseAll} />
      </div>
    </div>
  );
}
