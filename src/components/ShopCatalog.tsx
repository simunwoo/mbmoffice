"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { joinBrandName, type Product } from "@/lib/data/types";
import { shopCategories, siteConfig } from "@/lib/site-config";
import { CatalogPagination } from "@/components/CatalogPagination";

const PAGE_SIZE = 16; // 데스크톱 기준 4열 x 4줄

// 화면에 노출되는 탭 문구만 별도로 지정합니다 (다른 페이지에서 쓰는 shopCategories.label은 그대로 둡니다).
const TAB_LABELS: Record<string, string> = {
  copier: "복합기·프린터",
  pc: "PC·노트북",
  supplies: "복합기 소모품",
  parts: "부품",
  shredder: "문서세단기",
  nas: "나스(NAS)",
};

// 화면에 노출되는 탭 순서
const TAB_ORDER = ["copier", "pc", "supplies", "parts", "shredder", "nas"];
const CATEGORY_TABS = TAB_ORDER.map((slug) => shopCategories.find((c) => c.slug === slug)!).filter(Boolean);

type SortKey = "default" | "price-asc" | "price-desc";
type ColorFilter = "all" | "color" | "mono";
type SizeFilter = "all" | "a3" | "a4";

function amountOf(p: Product): number | null {
  return p.purchasePrice ?? null;
}

function shopSlugFor(p: Product): string {
  return shopCategories.find((c) => c.categories.includes(p.category))?.slug ?? "copier";
}

function hrefFor(p: Product): string {
  return `/shop/${shopSlugFor(p)}/${p.id}`;
}

export function ShopCatalog({ products, initialTab }: { products: Product[]; initialTab?: string }) {
  const [activeTab, setActiveTab] = useState<string>(
    initialTab && CATEGORY_TABS.some((t) => t.slug === initialTab) ? initialTab : "all"
  );
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [color, setColor] = useState<ColorFilter>("all");
  const [size, setSize] = useState<SizeFilter>("all");
  const [sort, setSort] = useState<SortKey>("default");
  const [priceConfirmedOnly, setPriceConfirmedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tab of CATEGORY_TABS) {
      map[tab.slug] = products.filter((p) => tab.categories.includes(p.category)).length;
    }
    return map;
  }, [products]);

  function selectTab(slug: string) {
    setActiveTab(slug);
    setColor("all");
    setSize("all");
  }

  function reset() {
    setQuery("");
    setMaxPrice("");
    setColor("all");
    setSize("all");
    setSort("default");
    setPriceConfirmedOnly(false);
  }

  const activeCategories = useMemo(() => {
    if (activeTab === "all") return new Set(CATEGORY_TABS.flatMap((t) => t.categories));
    return new Set(CATEGORY_TABS.find((t) => t.slug === activeTab)!.categories);
  }, [activeTab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const max = maxPrice ? Number(maxPrice) : null;

    let list = products.filter((p) => {
      if (!activeCategories.has(p.category)) return false;
      if (q) {
        const haystack = [p.brand, p.name, ...(p.specs ?? [])].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (activeTab === "copier") {
        if (color !== "all" && p.color !== color) return false;
        if (size !== "all" && p.size !== size) return false;
      }
      if (priceConfirmedOnly && amountOf(p) == null) return false;
      if (max != null && !Number.isNaN(max) && max > 0) {
        const amount = amountOf(p);
        if (amount == null || amount > max) return false;
      }
      return true;
    });

    if (sort === "price-asc") {
      list = [...list].sort((a, b) => (amountOf(a) ?? Infinity) - (amountOf(b) ?? Infinity));
    } else if (sort === "price-desc") {
      list = [...list].sort((a, b) => (amountOf(b) ?? -Infinity) - (amountOf(a) ?? -Infinity));
    }

    return list;
  }, [products, activeCategories, activeTab, query, maxPrice, color, size, sort, priceConfirmedOnly]);

  const [prevFiltered, setPrevFiltered] = useState(filtered);
  if (filtered !== prevFiltered) {
    setPrevFiltered(filtered);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-soft via-[#f3f1ea] to-[#f7ece6] px-4 py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(1,160,129,0.28)_1.5px,transparent_1.5px)] [background-size:20px_20px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm text-foreground-soft">
            <Link href="/" className="hover:text-brand-ink">홈</Link> <span aria-hidden>›</span> 구매 상품
          </p>

          <p className="mt-6 flex items-center gap-2 text-xs font-bold tracking-widest text-brand-ink">
            <span className="h-px w-6 bg-brand-ink" /> SHOP
          </p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">복합기·소모품·PC 구매 상품</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground-soft sm:text-base">
            복합기·프린터 구매부터 정품 토너·드럼 소모품, 사무용 PC, 문서세단기까지 한곳에서 준비하세요. 복합기
            렌탈 대신 구매를 원하시는 사무실에 합리적인 가격으로 제안해 드리며, 수도권(서울·경기·인천)은 직접
            배송·설치해 드립니다.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => selectTab("all")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                activeTab === "all" ? "border-brand bg-background text-brand-ink" : "border-border bg-background/60 text-foreground-soft hover:border-brand/50"
              }`}
            >
              전체 {products.length}
            </button>
            {CATEGORY_TABS.map((tab) => {
              const active = activeTab === tab.slug;
              const count = counts[tab.slug] ?? 0;
              return (
                <button
                  key={tab.slug}
                  type="button"
                  onClick={() => selectTab(tab.slug)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active ? "border-brand bg-background text-brand-ink" : "border-border bg-background/60 text-foreground-soft hover:border-brand/50"
                  }`}
                >
                  {TAB_LABELS[tab.slug] ?? tab.label}
                  {count > 0 ? ` ${count}` : ""}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm font-bold">
            전체 <span className="text-brand-ink">{products.length}</span>개 상품
          </p>
          <p className="text-xs text-foreground-soft">서울·경기·인천 (수도권 직접 배송·설치)</p>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-surface p-6">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr_0.9fr]">
            <div>
              <label className="text-xs font-semibold text-foreground-soft">모델명·소모품·호환 기종 검색</label>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: C3922, CT202488, 캐논"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground-soft">최대 금액 (구매가)</label>
              <input
                type="number"
                min={0}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="금액 제한 없음"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground-soft">정렬</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="default">기본순</option>
                <option value="price-asc">가격 낮은순</option>
                <option value="price-desc">가격 높은순</option>
              </select>
            </div>
          </div>

          {activeTab === "copier" && (
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-foreground-soft">출력 색상</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value as ColorFilter)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="all">전체</option>
                  <option value="color">컬러</option>
                  <option value="mono">흑백</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground-soft">용지 크기</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as SizeFilter)}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="all">전체</option>
                  <option value="a3">A3</option>
                  <option value="a4">A4</option>
                </select>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={priceConfirmedOnly}
                onChange={(e) => setPriceConfirmedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              가격 확인된 상품만
            </label>
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:border-brand hover:text-brand-ink"
            >
              조건 초기화
            </button>
          </div>

          <p className="mt-4 text-xs text-foreground-soft">
            색상·용지 필터는 확인된 정보만 표시합니다. 참고 금액의 부가세·공급 가능 여부는 상품 상세에서 확인해 주세요.
          </p>
        </div>

        <div className="mt-8 flex items-baseline justify-between">
          <p className="text-lg font-bold">{filtered.length}개 상품</p>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center text-sm text-foreground-soft">
            조건에 맞는 상품이 없습니다. 조건을 조정하거나 전화 상담을 이용해 주세요.
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pageItems.map((p) => (
              <Link
                key={p.id}
                href={hrefFor(p)}
                className="group overflow-hidden rounded-xl border border-border transition hover:border-brand hover:shadow-sm"
              >
                <div className="relative aspect-square bg-surface">
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
                  <p className="text-xs font-semibold text-brand-ink">{p.brand}</p>
                  <p className="mt-1 text-sm font-semibold leading-snug">{p.name}</p>
                  {amountOf(p) != null ? (
                    <p className="mt-2 text-base font-bold">
                      {amountOf(p)!.toLocaleString()}원<span className="text-xs font-normal text-foreground-soft"> (VAT 별도)</span>
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-foreground-soft">가격 문의</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <CatalogPagination page={currentPage} totalPages={totalPages} onChange={setPage} />

        <div className="relative mt-12 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0d2723] to-[#125e51] px-6 py-10 text-white sm:px-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.35)_1.5px,transparent_1.5px)] [background-size:20px_20px]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:flex-1">
              <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-brand">
                <span className="h-px w-6 bg-brand" /> 무료 상담
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">우리 사무실에 맞는 복합기, 지금 바로 구매 상담하세요</h2>
              <p className="mt-2 text-sm text-white/70">전화 한 통이면 사무환경에 맞는 기종과 구매 가격을 제안해 드립니다. 상담과 견적은 무료입니다.</p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-64">
              <a
                href={siteConfig.phoneHref}
                className="flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 py-3 text-sm font-bold text-[#0d2723] hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                  <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {siteConfig.phone}
              </a>
              <Link
                href="/contact"
                className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90"
              >
                온라인 견적 받기 →
              </Link>
              <p className="whitespace-nowrap text-center text-xs text-white/60">{siteConfig.businessHours.weekday} · 당일 회신</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
