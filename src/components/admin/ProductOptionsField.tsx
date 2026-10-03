"use client";

import { useMemo, useState } from "react";
import type { ProductOptionGroup, ProductVariant } from "@/lib/data/types";

const inputClass = "w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand";

type DraftVariant = {
  combo: Record<string, string>;
  label: string;
  priceDelta: number;
  stock: number;
  status: "selling" | "soldout";
};

function comboKey(combo: Record<string, string>): string {
  return Object.entries(combo)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

function cartesian(groups: ProductOptionGroup[]): Record<string, string>[] {
  const valid = groups.filter((g) => g.name.trim() && g.values.length > 0);
  if (valid.length === 0) return [];
  return valid.reduce<Record<string, string>[]>(
    (acc, group) =>
      acc.flatMap((combo) => group.values.map((value) => ({ ...combo, [group.name.trim()]: value }))),
    [{}]
  );
}

export function ProductOptionsField({
  defaultGroups,
  defaultVariants,
}: {
  defaultGroups?: ProductOptionGroup[];
  defaultVariants?: ProductVariant[];
}) {
  const [groups, setGroups] = useState<{ name: string; valuesText: string }[]>(
    (defaultGroups ?? []).map((g) => ({ name: g.name, valuesText: g.values.join(", ") }))
  );
  const [variants, setVariants] = useState<DraftVariant[]>(
    (defaultVariants ?? []).map((v) => ({
      combo: v.combo,
      label: v.label,
      priceDelta: v.priceDelta,
      stock: v.stock,
      status: v.status,
    }))
  );

  const parsedGroups: ProductOptionGroup[] = groups.map((g) => ({
    name: g.name.trim(),
    values: g.valuesText
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  }));

  function regenerate() {
    const combos = cartesian(parsedGroups);
    const existing = new Map(variants.map((v) => [comboKey(v.combo), v]));
    setVariants(
      combos.map((combo) => {
        const found = existing.get(comboKey(combo));
        const label = Object.values(combo).join(" / ");
        return found ? { ...found, combo, label } : { combo, label, priceDelta: 0, stock: 0, status: "selling" };
      })
    );
  }

  function updateVariant(index: number, patch: Partial<DraftVariant>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  const json = useMemo(
    () => JSON.stringify({ groups: parsedGroups.filter((g) => g.name && g.values.length > 0), variants }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- parsedGroups는 groups로부터 매 렌더 새로 계산되므로 groups만 추적합니다.
    [groups, variants]
  );

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-background p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold">옵션 (조합형, 재고 관리)</p>
          <p className="mt-0.5 text-xs text-foreground-soft">
            예: &ldquo;색상&rdquo; 그룹에 &ldquo;빨강, 파랑&rdquo;을 입력하면 색상별로 재고·추가금을 따로 관리할 수 있습니다. 옵션이 필요 없으면 비워두세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setGroups((prev) => [...prev, { name: "", valuesText: "" }])}
          className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-surface"
        >
          + 옵션 그룹 추가
        </button>
      </div>

      {groups.map((g, i) => (
        <div key={i} className="flex gap-2">
          <input
            value={g.name}
            onChange={(e) => setGroups((prev) => prev.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)))}
            placeholder="옵션 이름 (예: 색상)"
            className={`${inputClass} max-w-[160px]`}
          />
          <input
            value={g.valuesText}
            onChange={(e) => setGroups((prev) => prev.map((row, idx) => (idx === i ? { ...row, valuesText: e.target.value } : row)))}
            placeholder="값을 쉼표로 구분 (예: 빨강, 파랑)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setGroups((prev) => prev.filter((_, idx) => idx !== i))}
            className="shrink-0 rounded-lg border border-border px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      ))}

      {groups.length > 0 && (
        <button
          type="button"
          onClick={regenerate}
          className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand-ink hover:opacity-90"
        >
          옵션 조합 생성/반영
        </button>
      )}

      {variants.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-border bg-surface text-xs text-foreground-soft">
              <tr>
                <th className="px-3 py-2 font-semibold">조합</th>
                <th className="px-3 py-2 font-semibold">추가 금액(원)</th>
                <th className="px-3 py-2 font-semibold">재고</th>
                <th className="px-3 py-2 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {variants.map((v, i) => (
                <tr key={comboKey(v.combo)}>
                  <td className="px-3 py-2 font-semibold">{v.label}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={v.priceDelta}
                      onChange={(e) => updateVariant(i, { priceDelta: Number(e.target.value) || 0 })}
                      className={`${inputClass} w-28`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => updateVariant(i, { stock: Math.max(0, Number(e.target.value) || 0) })}
                      className={`${inputClass} w-20`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={v.status}
                      onChange={(e) => updateVariant(i, { status: e.target.value as "selling" | "soldout" })}
                      className={inputClass}
                    >
                      <option value="selling">판매중</option>
                      <option value="soldout">품절</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <input type="hidden" name="optionsJson" value={json} readOnly />
    </div>
  );
}
