import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { colorLabels, sizeLabels } from "@/lib/site-config";
import { getProductsBySizeColor } from "@/lib/data";
import { joinBrandName } from "@/lib/data/types";

type Params = { size: string; color: string };

function assertParams(size: string, color: string) {
  if (!(size in sizeLabels) || !(color in colorLabels)) notFound();
}

export async function generateStaticParams() {
  return Object.keys(sizeLabels).flatMap((size) =>
    Object.keys(colorLabels).map((color) => ({ size, color }))
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { size, color } = await params;
  assertParams(size, color);
  const label = `${sizeLabels[size]} ${colorLabels[color]}`;
  return buildMetadata({
    title: `${label} 복합기 렌탈 모델 목록`,
    description: `${label} 복합기 렌탈 가능한 전체 모델과 월 렌탈료를 확인하세요.`,
    path: `/rental/${size}/${color}`,
  });
}

export default async function RentalSizeColorPage({ params }: { params: Promise<Params> }) {
  const { size, color } = await params;
  assertParams(size, color);
  const label = `${sizeLabels[size]} ${colorLabels[color]}`;
  const products = await getProductsBySizeColor(size, color);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <JsonLd
        data={breadcrumbSchema([
          { name: "홈", path: "/" },
          { name: "복합기 렌탈", path: "/rental" },
          { name: sizeLabels[size], path: `/rental/${size}` },
          { name: label, path: `/rental/${size}/${color}` },
        ])}
      />
      <p className="text-sm text-foreground-soft">
        <Link href="/rental" className="hover:text-brand-ink">복합기 렌탈</Link> /{" "}
        <Link href={`/rental/${size}`} className="hover:text-brand-ink">{sizeLabels[size]}</Link> / {colorLabels[color]}
      </p>
      <h1 className="mt-2 text-3xl font-bold">{label} 복합기 렌탈</h1>

      {products.length === 0 ? (
        <p className="mt-8 text-foreground-soft">현재 등록된 모델이 없습니다. 전화 문의 시 안내해 드립니다.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/rental/${size}/${color}/${p.id}`}
              className="overflow-hidden rounded-xl border border-border hover:border-brand hover:shadow-sm"
            >
              {p.images[0] && (
                <div className="relative aspect-square bg-surface">
                  <Image src={p.images[0]} alt={joinBrandName(p.brand, p.name)} fill className="object-contain p-4" sizes="(min-width: 1024px) 30vw, 50vw" />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-semibold text-brand-ink">{p.brand}</p>
                <p className="mt-1 font-bold">{p.name}</p>
                {p.priceMonthly ? (
                  <p className="mt-2 text-sm text-foreground-soft">{p.priceMonthly.toLocaleString()}원부터 /월 (VAT 별도)</p>
                ) : (
                  <p className="mt-2 text-sm text-foreground-soft">가격 문의</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
