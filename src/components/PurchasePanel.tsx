"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Product, ProductOptionGroup, ProductVariant } from "@/lib/data/types";
import { joinBrandName } from "@/lib/data/types";
import { WishlistButton } from "@/components/WishlistButton";

function comboMatches(combo: Record<string, string>, selected: Record<string, string>): boolean {
  return Object.keys(combo).every((k) => combo[k] === selected[k]);
}

export function PurchasePanel({
  productId,
  basePrice,
  optionGroups,
  variants,
  addons,
}: {
  productId: string;
  basePrice: number;
  optionGroups: ProductOptionGroup[];
  variants: ProductVariant[];
  addons: Product[];
}) {
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [addonIds, setAddonIds] = useState<string[]>([]);

  const hasOptions = optionGroups.length > 0;
  const allChosen = optionGroups.every((g) => selected[g.name]);
  const matchedVariant = useMemo(
    () => (allChosen ? variants.find((v) => comboMatches(v.combo, selected)) : undefined),
    [variants, selected, allChosen]
  );

  const finalPrice = basePrice + (matchedVariant?.priceDelta ?? 0);
  const soldOut = hasOptions && allChosen && (!matchedVariant || matchedVariant.status === "soldout" || matchedVariant.stock <= 0);
  const canBuy = !hasOptions || (allChosen && matchedVariant && matchedVariant.status === "selling" && matchedVariant.stock > 0);

  const addonTotal = addons.filter((a) => addonIds.includes(a.id)).reduce((sum, a) => sum + (a.purchasePrice ?? 0), 0);

  function toggleAddon(id: string) {
    setAddonIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const applyHref = `/shop/apply?product=${productId}${matchedVariant ? `&variant=${matchedVariant.id}` : ""}${
    addonIds.length > 0 ? `&addons=${addonIds.join(",")}` : ""
  }`;

  return (
    <div className="mt-6">
      {optionGroups.map((group) => (
        <div key={group.name} className="mb-3">
          <label className="text-xs font-semibold text-foreground-soft">{group.name} 선택</label>
          <select
            value={selected[group.name] ?? ""}
            onChange={(e) => setSelected((prev) => ({ ...prev, [group.name]: e.target.value }))}
            className="mt-1.5 w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
          >
            <option value="" disabled>
              선택해 주세요
            </option>
            {group.values.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      ))}

      {hasOptions && allChosen && (
        <p className={`mb-3 text-sm font-semibold ${soldOut ? "text-red-600" : "text-brand-ink"}`}>
          {soldOut ? "선택한 옵션은 품절입니다." : `선택 옵션 가격: ${finalPrice.toLocaleString()}원`}
        </p>
      )}

      {addons.length > 0 && (
        <div className="mb-4 rounded-xl border border-border p-4">
          <p className="text-sm font-bold">함께 구매하면 좋은 상품</p>
          <div className="mt-2.5 space-y-2">
            {addons.map((a) => (
              <label key={a.id} className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={addonIds.includes(a.id)}
                  onChange={() => toggleAddon(a.id)}
                  className="h-4 w-4 accent-brand"
                />
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-border bg-surface">
                  {a.images[0] && <Image src={a.images[0]} alt="" fill className="object-contain p-1" sizes="36px" />}
                </div>
                <span className="min-w-0 flex-1 truncate">{joinBrandName(a.brand, a.name)}</span>
                {a.purchasePrice != null && <span className="shrink-0 font-semibold">+{a.purchasePrice.toLocaleString()}원</span>}
              </label>
            ))}
          </div>
          {addonIds.length > 0 && (
            <p className="mt-2.5 text-right text-xs text-foreground-soft">
              상품 합계 {(finalPrice + addonTotal).toLocaleString()}원
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {canBuy ? (
          <Link
            href={applyHref}
            className="flex-1 rounded-full bg-brand py-3.5 text-center text-sm font-bold text-white hover:opacity-90"
          >
            구매하기 →
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex-1 rounded-full bg-border py-3.5 text-center text-sm font-bold text-foreground-soft"
          >
            {hasOptions && !allChosen ? "옵션을 선택해 주세요" : "품절"}
          </button>
        )}
        <WishlistButton productId={productId} />
      </div>
    </div>
  );
}
