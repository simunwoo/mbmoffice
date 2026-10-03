"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export interface AddonCandidate {
  id: string;
  name: string;
  brand: string;
  image?: string;
  purchasePrice: number | null;
}

export function ProductAddonPicker({
  candidates,
  defaultSelectedIds,
}: {
  candidates: AddonCandidate[];
  defaultSelectedIds?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultSelectedIds ?? []);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => c.name.toLowerCase().includes(q) || c.brand.toLowerCase().includes(q));
  }, [candidates, query]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-background p-5">
      <div>
        <p className="text-sm font-bold">추가 구매 상품</p>
        <p className="mt-0.5 text-xs text-foreground-soft">
          이 상품의 상세페이지에서 &ldquo;함께 구매하면 좋은 상품&rdquo;으로 보여줄 다른 구매 상품을 선택하세요.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="상품명·브랜드로 검색"
        className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
      />

      <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
        {filtered.length === 0 && <p className="p-2 text-xs text-foreground-soft">검색 결과가 없습니다.</p>}
        {filtered.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-surface"
          >
            <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-brand" />
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded border border-border bg-surface">
              {c.image && <Image src={c.image} alt="" fill className="object-contain p-0.5" sizes="32px" />}
            </div>
            <span className="min-w-0 flex-1 truncate">
              {c.name} <span className="text-xs text-foreground-soft">({c.brand})</span>
            </span>
            {c.purchasePrice != null && <span className="shrink-0 text-xs text-foreground-soft">{c.purchasePrice.toLocaleString()}원</span>}
          </label>
        ))}
      </div>

      {selected.length > 0 && (
        <p className="text-xs text-foreground-soft">{selected.length}개 선택됨</p>
      )}

      <input type="hidden" name="addonIds" value={selected.join(",")} readOnly />
    </div>
  );
}
