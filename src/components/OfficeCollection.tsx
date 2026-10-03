"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { joinBrandName, type Product } from "@/lib/data/types";

export interface CollectionTab {
  key: "color" | "mono" | "pc" | "shredder";
  label: string;
  products: Product[];
}

function hrefFor(tabKey: CollectionTab["key"], p: Product): string {
  if (tabKey === "pc") return "/pc-rental";
  if (tabKey === "shredder") return "/shredder";
  return `/rental/${p.size}/${p.color}/${p.id}`;
}

export function OfficeCollection({ tabs }: { tabs: CollectionTab[] }) {
  const visibleTabs = tabs.filter((t) => t.products.length > 0);
  const [active, setActive] = useState(visibleTabs[0]?.key);
  const current = visibleTabs.find((t) => t.key === active) ?? visibleTabs[0];

  if (!current) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.15em] text-brand">OFFICE COLLECTION</p>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">일 잘하는 사무실의 선택.</h2>
          <p className="mt-2 text-sm text-foreground-soft">사무실에 꼭 맞는 복합기, 관리까지 편하게.</p>
        </div>
        <Link href="/rental" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:opacity-80">
          렌탈 상품 전체보기
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition ${
                current.key === t.key ? "bg-[#12241c] text-white" : "bg-surface text-foreground-soft hover:text-brand-ink"
              }`}
            >
              {t.label}
              {current.key === t.key && <span aria-hidden>→</span>}
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground-soft">정품 소모품 · 출장 AS 포함</p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {current.products.map((p) => {
          const discount =
            p.listPrice && p.priceMonthly && p.listPrice > p.priceMonthly
              ? Math.round(((p.listPrice - p.priceMonthly) / p.listPrice) * 100)
              : null;
          return (
            <Link
              key={p.id}
              href={hrefFor(current.key, p)}
              className="group overflow-hidden rounded-xl border border-border transition hover:border-brand hover:shadow-sm"
            >
              <div className="relative aspect-square bg-surface">
                <span className="absolute left-3 top-3 z-10 rounded-full bg-background px-2.5 py-1 text-[11px] font-bold shadow-sm">
                  렌탈
                </span>
                {p.images[0] && (
                  <Image
                    src={p.images[0]}
                    alt={joinBrandName(p.brand, p.name)}
                    fill
                    className="object-contain p-4 transition group-hover:scale-105"
                    sizes="(min-width: 1024px) 24vw, 45vw"
                  />
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold leading-snug">{p.name}</p>
                {p.termMonths && <p className="mt-1.5 text-xs text-foreground-soft">{Math.round(p.termMonths / 12)}년 약정</p>}
                <p className="mt-2">
                  {p.listPrice && (
                    <span className="mr-1.5 text-xs text-foreground-soft line-through">{p.listPrice.toLocaleString()}원</span>
                  )}
                </p>
                <p className="flex flex-wrap items-baseline gap-1.5">
                  {discount !== null && <span className="text-base font-bold text-brand-ink">{discount}%</span>}
                  <span className="text-lg font-bold">{p.priceMonthly!.toLocaleString()}원</span>
                  <span className="text-xs text-foreground-soft">
                    {p.category === "mfp" || p.category === "printer" ? "부터 " : ""}/월 (VAT 별도)
                  </span>
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
