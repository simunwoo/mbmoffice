import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { brandLabels, colorLabels, sizeLabels } from "@/lib/site-config";
import { getProductsByBrand } from "@/lib/data";

type Params = { brand: string };

export async function generateStaticParams() {
  return Object.keys(brandLabels).map((brand) => ({ brand }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { brand } = await params;
  const label = brandLabels[brand];
  if (!label) return {};
  return buildMetadata({
    title: `${label} 복합기 렌탈 | 전 모델 모아보기`,
    description: `${label} 복합기 전 모델을 규격·색상별로 모아 렌탈 조건을 비교하세요.`,
    path: `/brand/${brand}`,
  });
}

export default async function BrandPage({ params }: { params: Promise<Params> }) {
  const { brand } = await params;
  const label = brandLabels[brand];
  if (!label) notFound();
  const products = await getProductsByBrand(label);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: `${label} 복합기 렌탈`, path: `/brand/${brand}` }])} />
      <h1 className="text-3xl font-bold">{label} 복합기 렌탈</h1>
      <p className="mt-3 max-w-2xl text-foreground-soft">
        {label} 정품 복합기 전 모델을 모아봤습니다. 규격(A3/A4)·색상별 상세 조건은 아래에서 바로 확인할 수 있습니다.
      </p>

      {products.length === 0 ? (
        <p className="mt-8 text-foreground-soft">현재 등록된 {label} 모델이 없습니다. 전화 문의 시 안내해 드립니다.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products
            .filter((p) => p.size && p.color)
            .map((p) => (
              <Link
                key={p.id}
                href={`/rental/${p.size}/${p.color}/${p.id}`}
                className="rounded-xl border border-border p-5 hover:border-brand hover:shadow-sm"
              >
                <p className="text-xs font-semibold text-brand-ink">
                  {sizeLabels[p.size as string]} · {colorLabels[p.color as string]}
                </p>
                <p className="mt-1 font-bold">{p.name}</p>
                {p.priceMonthly && <p className="mt-2 text-sm text-foreground-soft">{p.priceMonthly.toLocaleString()}원부터 /월 (VAT 별도)</p>}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
