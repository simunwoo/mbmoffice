import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { serviceLines, siteConfig } from "@/lib/site-config";
import { getProductsByCategory } from "@/lib/data";

const info = serviceLines.find((s) => s.slug === "pc-rental")!;

export const metadata = buildMetadata({
  title: info.label,
  description: info.description,
  path: "/pc-rental",
});

export default async function PcRentalPage() {
  const [pc, notebook] = await Promise.all([getProductsByCategory("pc"), getProductsByCategory("notebook")]);
  const products = [...pc, ...notebook];

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: info.label, path: "/pc-rental" }])} />
      <h1 className="text-3xl font-bold">{info.label}</h1>
      <p className="mt-3 max-w-2xl text-foreground-soft">{info.description}</p>

      {products.length === 0 ? (
        <p className="mt-8 text-foreground-soft">전화 문의 시 업무 환경에 맞는 조립PC·노트북을 추천해 드립니다.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {products.map((p) => (
            <div key={p.id} className="rounded-xl border border-border p-5">
              <p className="text-xs font-semibold text-brand-ink">{p.brand}</p>
              <p className="mt-1 font-bold">{p.name}</p>
              {p.priceMonthly && <p className="mt-2 text-sm text-foreground-soft">{p.priceMonthly.toLocaleString()}원 /월 (VAT 별도)</p>}
              {p.purchasePrice && <p className="mt-2 text-sm text-foreground-soft">구매가 {p.purchasePrice.toLocaleString()}원 (VAT 별도)</p>}
            </div>
          ))}
        </div>
      )}

      <a href={siteConfig.phoneHref} className="mt-10 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
        전화 상담 {siteConfig.phone}
      </a>
    </div>
  );
}
