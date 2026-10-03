import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { serviceLines, siteConfig } from "@/lib/site-config";
import { getProductsByCategory } from "@/lib/data";

const info = serviceLines.find((s) => s.slug === "shredder")!;

export const metadata = buildMetadata({
  title: info.label,
  description: info.description,
  path: "/shredder",
});

export default async function ShredderPage() {
  const products = await getProductsByCategory("shredder");
  const hasPurchaseOnly = products.some((p) => p.pricingType === "purchase");

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: info.label, path: "/shredder" }])} />
      <h1 className="text-3xl font-bold">{info.label}</h1>
      <p className="mt-3 max-w-2xl text-foreground-soft">{info.description}</p>
      {hasPurchaseOnly && (
        <p className="mt-2 text-sm text-foreground-soft">
          아래 가격은 구매가 기준입니다. 렌탈 조건은 전화 상담을 통해 확인해 주세요.
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {products.map((p) => (
          <div key={p.id} className="rounded-xl border border-border p-5">
            <p className="text-xs font-semibold text-brand-ink">{p.brand}</p>
            <p className="mt-1 font-bold">{p.name}</p>
            {p.specs?.map((s) => (
              <p key={s} className="mt-1 text-sm text-foreground-soft">{s}</p>
            ))}
            {p.priceMonthly && <p className="mt-2 text-sm text-foreground-soft">{p.priceMonthly.toLocaleString()}원 /월 (VAT 별도)</p>}
            {p.purchasePrice && <p className="mt-2 text-sm text-foreground-soft">구매가 {p.purchasePrice.toLocaleString()}원 (VAT 별도)</p>}
          </div>
        ))}
      </div>

      <a href={siteConfig.phoneHref} className="mt-10 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
        전화 상담 {siteConfig.phone}
      </a>
    </div>
  );
}
