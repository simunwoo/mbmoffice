import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { getProducts } from "@/lib/data";
import { EstimatorForm } from "@/components/EstimatorForm";

export const metadata = buildMetadata({
  title: "예상 렌탈 견적 | 복합기·PC·프린터·문서세단기",
  description: "월 출력량, 대수, 규격 등 조건을 입력하면 복합기·PC·프린터·문서세단기의 예상 렌탈료를 바로 확인할 수 있습니다.",
  path: "/estimate",
});

export default async function EstimatePage() {
  const products = await getProducts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: "예상 렌탈 견적", path: "/estimate" }])} />
      <h1 className="text-3xl font-bold">예상 렌탈 견적 내보기</h1>
      <p className="mt-3 max-w-2xl text-foreground-soft">
        품목을 고르고 사용 조건을 입력하면 조건에 맞는 모델과 예상 월 렌탈료를 바로 확인할 수 있습니다.
        정확한 최종 견적은 상담을 통해 확정됩니다.
      </p>

      <div className="mt-10">
        <EstimatorForm products={products} />
      </div>
    </div>
  );
}
