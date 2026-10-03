import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { getProducts } from "@/lib/data";
import { RecommendWizard } from "@/components/RecommendWizard";

export const metadata = buildMetadata({
  title: "1분 사무기기 추천",
  description: "몇 가지만 선택하면 복합기·프린터와 PC·노트북 중 우리 사무실에 맞는 장비와 권장 사양을 빠르게 확인할 수 있습니다.",
  path: "/recommend",
});

export default async function RecommendPage() {
  const products = await getProducts();

  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: "1분 사무기기 추천", path: "/recommend" }])} />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-soft via-[#f3f1ea] to-[#f7ece6] px-4 py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(1,160,129,0.28)_1.5px,transparent_1.5px)] [background-size:20px_20px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-brand-ink">
            <span className="h-px w-6 bg-brand-ink" /> FIND YOUR PRINTER
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">
            우리 사무실에 맞는 복합기,
            <br />
            1분이면 후보가 보입니다.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-foreground-soft sm:text-base">
            네 가지 사용 조건을 알려주세요. 확인된 사양과 함께 비교할 기종을 안내합니다.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-14">
        <RecommendWizard products={products} />
      </div>
    </div>
  );
}
