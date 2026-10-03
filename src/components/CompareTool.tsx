"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { joinBrandName, type Product } from "@/lib/data/types";
import { colorLabels, sizeLabels } from "@/lib/site-config";
import { TIER_META, getProductTierPricing } from "@/lib/pricingTiers";

type Mode = "rental" | "purchase";
const MAX_SELECT = 3;

function amountOf(p: Product, mode: Mode): number | null {
  return mode === "rental" ? (p.priceMonthly ?? null) : (p.purchasePrice ?? p.priceMonthly ?? null);
}

/** 선택한 요금제 등급(0=Starter/1=Professional/2=Enterprise)으로 통일했을 때 이 상품의 월 렌탈료입니다.
 * 요금제 대상이 아닌 상품(PC·NAS·문서세단기 등)은 원래 등록 가격을 그대로 씁니다. */
function tierPriceOf(p: Product, tierIndex: number): number | null {
  const pricing = getProductTierPricing(p);
  if (pricing.type === "none") return p.priceMonthly ?? null;
  return pricing.tiers[tierIndex]?.price ?? null;
}

function tierUsageOf(p: Product, tierIndex: number): string {
  const pricing = getProductTierPricing(p);
  if (pricing.type === "color") {
    const tier = pricing.tiers[tierIndex];
    return tier.options.map((o) => `흑백 ${o.mono.toLocaleString()}/컬러 ${o.color.toLocaleString()}`).join(" · ");
  }
  if (pricing.type === "mono") {
    return `흑백 월 ${pricing.tiers[tierIndex].monoPages.toLocaleString()}매까지`;
  }
  if (pricing.type === "inkjet") {
    return `흑백·컬러 구분 없이 월 ${pricing.tiers[tierIndex].pages.toLocaleString()}매까지`;
  }
  return p.volumeMin || p.volumeMax
    ? `${p.volumeMin?.toLocaleString() ?? "0"}~${p.volumeMax?.toLocaleString() ?? "∞"}매 (요금제 미적용 상품)`
    : "상담 후 확정";
}

function hrefFor(p: Product, mode: Mode): string {
  if (mode === "rental" && (p.category === "mfp" || p.category === "printer") && p.size && p.color) {
    return `/rental/${p.size}/${p.color}/${p.id}`;
  }
  if (mode === "purchase") return `/shop/${p.category}/${p.id}`;
  return "/rental";
}

export function CompareTool({ rentalProducts, purchaseProducts }: { rentalProducts: Product[]; purchaseProducts: Product[] }) {
  const [mode, setMode] = useState<Mode>("rental");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [tierIndex, setTierIndex] = useState(0);

  const activeProducts = mode === "rental" ? rentalProducts : purchaseProducts;
  const selectedProducts = useMemo(
    () => selectedIds.map((id) => activeProducts.find((p) => p.id === id)).filter((p): p is Product => !!p),
    [selectedIds, activeProducts]
  );

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeProducts;
    return activeProducts.filter((p) => [p.brand, p.name, ...(p.specs ?? [])].join(" ").toLowerCase().includes(q));
  }, [activeProducts, query]);

  function switchMode(next: Mode) {
    setMode(next);
    setSelectedIds([]);
    setQuery("");
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (prev.length >= MAX_SELECT) return prev;
      return [...prev, id];
    });
  }

  return (
    <div>
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        {selectedProducts.length < 2 ? (
          <p className="text-sm font-semibold">상품 목록에서 비교할 상품을 2~3개 선택해 주세요.</p>
        ) : (
          <p className="text-sm font-semibold text-brand-ink">{selectedProducts.length}개 상품을 비교하고 있습니다.</p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => switchMode("rental")}
            className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-bold transition ${
              mode === "rental" ? "bg-brand-ink text-white" : "bg-background text-foreground-soft hover:text-brand-ink"
            }`}
          >
            렌탈 상품
          </button>
          <button
            type="button"
            onClick={() => switchMode("purchase")}
            className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-bold transition ${
              mode === "purchase" ? "bg-brand-ink text-white" : "bg-background text-foreground-soft hover:text-brand-ink"
            }`}
          >
            구매 상품
          </button>
        </div>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="mt-3 cursor-pointer text-xs font-semibold text-foreground-soft hover:text-brand-ink"
          >
            선택 초기화
          </button>
        )}
      </div>

      {selectedProducts.length >= 2 && mode === "rental" && selectedProducts.some((p) => getProductTierPricing(p).type !== "none") && (
        <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <p className="text-sm font-bold">요금제 기준으로 같은 조건에서 비교하기</p>
          <p className="mt-1 text-xs text-foreground-soft">
            상품마다 기본 제공 매수는 다르지만, 같은 등급(Starter/Professional/Enterprise)을 선택하면 그 조건에서의
            월 렌탈료를 나란히 비교할 수 있습니다.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TIER_META.map((t, i) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTierIndex(i)}
                className={`cursor-pointer rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
                  tierIndex === i ? "bg-brand-soft" : "border-border text-foreground-soft hover:border-brand/50"
                }`}
                style={tierIndex === i ? { borderColor: t.accent, color: t.accent } : undefined}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedProducts.length >= 2 && (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-background">
          <table className="w-full min-w-[560px] table-fixed text-left text-sm">
            <tbody className="divide-y divide-border">
              <tr>
                <th className="w-28 bg-surface px-4 py-3 text-xs font-semibold text-foreground-soft">상품</th>
                {selectedProducts.map((p) => (
                  <td key={p.id} className="px-4 py-4">
                    <Link href={hrefFor(p, mode)} className="block">
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface">
                        {p.images[0] && (
                          <Image src={p.images[0]} alt={joinBrandName(p.brand, p.name)} fill className="object-contain p-3" sizes="200px" />
                        )}
                      </div>
                      <p className="mt-2 text-xs font-semibold text-brand-ink">{p.brand}</p>
                      <p className="text-sm font-semibold leading-snug hover:underline">{p.name}</p>
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleSelect(p.id)}
                      className="mt-1.5 cursor-pointer text-xs font-semibold text-foreground-soft hover:text-red-600"
                    >
                      비교에서 제외
                    </button>
                  </td>
                ))}
              </tr>
              <tr>
                <th className="bg-surface px-4 py-3 text-xs font-semibold text-foreground-soft">
                  {mode === "rental" ? `월 렌탈료 (${TIER_META[tierIndex].label} 기준)` : "구매가"}
                </th>
                {selectedProducts.map((p) => {
                  const price = mode === "rental" ? tierPriceOf(p, tierIndex) : amountOf(p, mode);
                  return (
                    <td key={p.id} className="px-4 py-3 font-bold">
                      {price ? `${price.toLocaleString()}원${mode === "rental" ? " /월" : ""}` : "가격 문의"}
                      <span className="ml-1 text-xs font-normal text-foreground-soft">(VAT 별도)</span>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <th className="bg-surface px-4 py-3 text-xs font-semibold text-foreground-soft">용지 크기</th>
                {selectedProducts.map((p) => (
                  <td key={p.id} className="px-4 py-3">{p.size ? sizeLabels[p.size] : "-"}</td>
                ))}
              </tr>
              <tr>
                <th className="bg-surface px-4 py-3 text-xs font-semibold text-foreground-soft">출력 색상</th>
                {selectedProducts.map((p) => (
                  <td key={p.id} className="px-4 py-3">{p.color ? colorLabels[p.color] : "-"}</td>
                ))}
              </tr>
              {mode === "rental" && (
                <>
                  <tr>
                    <th className="bg-surface px-4 py-3 text-xs font-semibold text-foreground-soft">약정 기간</th>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="px-4 py-3">{p.termMonths ? `${p.termMonths}개월` : "상담 후 확정"}</td>
                    ))}
                  </tr>
                  <tr>
                    <th className="bg-surface px-4 py-3 text-xs font-semibold text-foreground-soft">
                      기본 제공 매수 ({TIER_META[tierIndex].label} 기준)
                    </th>
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="px-4 py-3 text-xs leading-relaxed">{tierUsageOf(p, tierIndex)}</td>
                    ))}
                  </tr>
                </>
              )}
              <tr>
                <th className="bg-surface px-4 py-3 align-top text-xs font-semibold text-foreground-soft">주요 사양</th>
                {selectedProducts.map((p) => (
                  <td key={p.id} className="px-4 py-3 align-top">
                    {p.specs && p.specs.length > 0 ? (
                      <ul className="space-y-1 text-xs text-foreground-soft">
                        {p.specs.slice(0, 5).map((s) => (
                          <li key={s}>• {s}</li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="bg-surface px-4 py-3 text-xs font-semibold text-foreground-soft">바로가기</th>
                {selectedProducts.map((p) => (
                  <td key={p.id} className="px-4 py-3">
                    <Link href={hrefFor(p, mode)} className="inline-block rounded-full bg-brand px-4 py-2 text-xs font-bold text-white hover:opacity-90">
                      상세보기 →
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 flex items-baseline justify-between gap-2">
        <p className="text-sm font-bold">
          {mode === "rental" ? "렌탈" : "구매"} 상품 목록 <span className="text-foreground-soft">({selectedIds.length}/{MAX_SELECT} 선택됨)</span>
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-surface p-6">
        <label className="text-xs font-semibold text-foreground-soft">모델명·브랜드 검색</label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="예: DocuCentre, 캐논, 후지필름"
          className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
        />
      </div>

      {activeProducts.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-soft">등록된 상품이 없습니다.</p>
      ) : visibleProducts.length === 0 ? (
        <p className="mt-4 text-sm text-foreground-soft">&quot;{query}&quot;에 대한 검색 결과가 없습니다.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleProducts.map((p) => {
            const selected = selectedIds.includes(p.id);
            const order = selectedIds.indexOf(p.id) + 1;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleSelect(p.id)}
                disabled={!selected && selectedIds.length >= MAX_SELECT}
                className={`cursor-pointer overflow-hidden rounded-xl border-2 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  selected ? "border-brand-ink" : "border-border hover:border-brand/50"
                }`}
              >
                <div className="relative aspect-square bg-surface">
                  {selected && (
                    <span className="absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-ink text-xs font-bold text-white">
                      {order}
                    </span>
                  )}
                  {p.images[0] && (
                    <Image src={p.images[0]} alt={joinBrandName(p.brand, p.name)} fill className="object-contain p-4" sizes="(min-width: 1024px) 24vw, 45vw" />
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs font-semibold text-brand-ink">{p.brand}</p>
                  <p className="mt-1 text-sm font-semibold leading-snug">{p.name}</p>
                  {amountOf(p, mode) != null ? (
                    <p className="mt-2 text-sm font-bold">
                      {amountOf(p, mode)!.toLocaleString()}원{mode === "rental" ? " /월" : ""}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-foreground-soft">가격 문의</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
