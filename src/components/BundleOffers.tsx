import Image from "next/image";
import Link from "next/link";
import { joinBrandName, type Product } from "@/lib/data/types";

const BUNDLE_DISCOUNT = 10000;

export interface Bundle {
  key: string;
  label: string;
  items: [Product, Product];
}

function ItemThumb({ p }: { p: Product }) {
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      <div className="relative h-20 w-20 sm:h-24 sm:w-24">
        {p.images[0] && <Image src={p.images[0]} alt={joinBrandName(p.brand, p.name)} fill className="object-contain" sizes="96px" />}
      </div>
      <p className="mt-2 line-clamp-2 min-h-[2.25rem] text-xs font-semibold leading-snug">{p.name}</p>
      <p className="text-xs text-foreground-soft">
        {p.priceMonthly?.toLocaleString()}원{p.category === "mfp" || p.category === "printer" ? "부터" : ""} /월 (VAT 별도)
      </p>
    </div>
  );
}

export function BundleOffers({ bundles }: { bundles: Bundle[] }) {
  if (bundles.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-bold tracking-[0.15em] text-brand">SMART OFFICE PACKAGE</p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">패키지로 묶으면 더 싸다.</h2>
        <p className="mt-2 text-sm text-foreground-soft">함께 렌탈하면 결합 할인이 바로 적용됩니다.</p>

        <div className="mt-9 grid gap-5 sm:grid-cols-2">
          {bundles.map((b) => {
            const [a, c] = b.items;
            const sum = (a.priceMonthly ?? 0) + (c.priceMonthly ?? 0);
            const total = sum - BUNDLE_DISCOUNT;
            return (
              <div key={b.key} className="flex h-full flex-col rounded-2xl border border-border bg-background p-6">
                <p className="text-sm font-bold text-brand-ink">{b.label}</p>

                <div className="mt-5 flex items-center gap-3">
                  <ItemThumb p={a} />
                  <span className="text-lg font-bold text-foreground-soft" aria-hidden>
                    +
                  </span>
                  <ItemThumb p={c} />
                </div>

                <div className="mt-auto">
                  <div className="mt-6 rounded-xl bg-surface p-4">
                    <div className="flex items-center justify-between text-sm text-foreground-soft">
                      <span>{a.priceMonthly!.toLocaleString()}원 + {c.priceMonthly!.toLocaleString()}원</span>
                      <span className="font-semibold text-brand-ink">-{BUNDLE_DISCOUNT.toLocaleString()}원 결합할인</span>
                    </div>
                    <p className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold">{total.toLocaleString()}원</span>
                      <span className="text-sm text-foreground-soft">부터 /월 (VAT 별도)</span>
                    </p>
                  </div>

                  <Link
                    href={`/contact?package=${encodeURIComponent(b.label)}`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand py-3 text-sm font-bold text-white hover:opacity-90"
                  >
                    이 패키지로 상담하기
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-foreground-soft">
          위 패키지 가격은 대표 상품 기준 예시이며, 실제 기종·수량에 따라 상담을 통해 정확한 견적을 안내해 드립니다.
        </p>
      </div>
    </section>
  );
}
