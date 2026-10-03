import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { ProductStatusSelect } from "@/components/admin/ProductStatusSelect";
import { deleteProduct } from "@/lib/actions/admin/products";
import type { ProductRow } from "@/lib/supabase/types";

const CATEGORY_TABS: { value: ProductRow["category"] | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "mfp", label: "복합기" },
  { value: "printer", label: "프린터" },
  { value: "pc", label: "PC" },
  { value: "notebook", label: "노트북" },
  { value: "nas", label: "NAS" },
  { value: "shredder", label: "문서세단기" },
  { value: "maintenance", label: "IT·PC 유지보수" },
  { value: "supplies", label: "소모품" },
  { value: "parts", label: "부품" },
];

const STATUS_TABS: { value: ProductRow["status"] | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "selling", label: "판매중" },
  { value: "soldout", label: "품절" },
  { value: "hidden", label: "숨김" },
];

const PRICING_TABS: { value: ProductRow["pricing_type"] | ""; label: string }[] = [
  { value: "", label: "전체 상품" },
  { value: "rental", label: "렌탈 상품" },
  { value: "purchase", label: "구매 상품" },
  { value: "maintenance", label: "유지보수 상품" },
];

const PRICING_LABEL: Record<ProductRow["pricing_type"], string> = {
  rental: "렌탈",
  purchase: "구매",
  maintenance: "유지보수",
};

type SearchParams = {
  type?: string;
  category?: string;
  status?: string;
  q?: string;
  maxPrice?: string;
  sort?: string;
  color?: string;
  size?: string;
  vol?: string;
  priceConfirmed?: string;
};

function amountOf(p: ProductRow): number | null {
  return p.pricing_type === "purchase" ? p.purchase_price : p.price_monthly;
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { type, category, status, q, maxPrice, sort, color, size, vol, priceConfirmed } = await searchParams;
  const activePricing = PRICING_TABS.find((t) => t.value === type)?.value || undefined;
  const activeCategory = CATEGORY_TABS.find((t) => t.value === category)?.value || undefined;
  const activeStatus = STATUS_TABS.find((t) => t.value === status)?.value || undefined;
  const query = (q ?? "").trim();
  const maxPriceNum = maxPrice ? Number(maxPrice) : null;
  const volNum = vol ? Number(vol) : null;

  const supabase = await createClient();
  const { data: all, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });

  const pricingCounts = {
    "": all?.length ?? 0,
    rental: all?.filter((p) => p.pricing_type === "rental").length ?? 0,
    purchase: all?.filter((p) => p.pricing_type === "purchase").length ?? 0,
    maintenance: all?.filter((p) => p.pricing_type === "maintenance").length ?? 0,
  } as Record<string, number>;

  const statusCounts = {
    "": all?.length ?? 0,
    selling: all?.filter((p) => p.status === "selling").length ?? 0,
    soldout: all?.filter((p) => p.status === "soldout").length ?? 0,
    hidden: all?.filter((p) => p.status === "hidden").length ?? 0,
  } as Record<string, number>;

  let products = (all ?? []).filter((p) => {
    if (activePricing && p.pricing_type !== activePricing) return false;
    if (activeCategory && p.category !== activeCategory) return false;
    if (activeStatus && p.status !== activeStatus) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase()) && !p.brand.toLowerCase().includes(query.toLowerCase())) return false;
    if (maxPriceNum != null && !Number.isNaN(maxPriceNum)) {
      const amount = amountOf(p);
      if (amount == null || amount > maxPriceNum) return false;
    }
    if (color && color !== "all" && p.color !== color) return false;
    if (size && size !== "all" && p.size !== size) return false;
    if (volNum != null && !Number.isNaN(volNum)) {
      if (p.volume_min != null && volNum < p.volume_min) return false;
      if (p.volume_max != null && volNum > p.volume_max) return false;
    }
    if (priceConfirmed === "1" && amountOf(p) == null) return false;
    return true;
  });

  if (sort === "price-asc" || sort === "price-desc") {
    const dir = sort === "price-asc" ? 1 : -1;
    products = [...products].sort((a, b) => dir * ((amountOf(a) ?? Infinity) - (amountOf(b) ?? Infinity)));
  }

  function buildHref(overrides: Partial<SearchParams>) {
    const current = { type, category, status, q, maxPrice, sort, color, size, vol, priceConfirmed };
    const merged = { ...current, ...overrides };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  }

  // 지금 보고 있는 필터·검색 상태 그대로의 목록 URL — 상품 수정 페이지에 "돌아갈 곳"으로 넘겨줍니다.
  const editReturnTo = encodeURIComponent(buildHref({}));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">상품 관리</h1>
          <p className="mt-1 text-sm text-foreground-soft">카테고리별로 렌탈·구매 상품을 등록하고 관리합니다.</p>
        </div>
        <Link href="/admin/products/new" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
          새 상품 등록
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="shrink-0 lg:w-48">
          <p className="text-xs font-bold text-foreground-soft">판매 방식</p>
          <nav className="mt-2 space-y-1">
            {PRICING_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={buildHref({ type: tab.value })}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  (type ?? "") === tab.value ? "bg-brand-soft text-brand-ink" : "text-foreground-soft hover:bg-surface"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-xs">{pricingCounts[tab.value] ?? 0}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={buildHref({ category: tab.value })}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  (category ?? "") === tab.value ? "border-brand bg-brand text-white" : "border-border text-foreground-soft hover:border-brand/50"
                }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 border-b border-border pb-3">
            {STATUS_TABS.map((tab) => (
              <Link
                key={tab.value}
                href={buildHref({ status: tab.value })}
                className={`border-b-2 pb-2 text-sm font-semibold transition ${
                  (status ?? "") === tab.value ? "border-brand-ink text-foreground" : "border-transparent text-foreground-soft hover:text-foreground"
                }`}
              >
                {tab.label} <span className="text-foreground-soft">({statusCounts[tab.value] ?? 0})</span>
              </Link>
            ))}
          </div>

          <form
            key={`${q ?? ""}|${maxPrice ?? ""}|${sort ?? ""}|${color ?? ""}|${size ?? ""}|${vol ?? ""}|${priceConfirmed ?? ""}`}
            action="/admin/products" method="get" className="mt-4 rounded-2xl border border-border bg-background p-4"
          >
            {type && <input type="hidden" name="type" value={type} />}
            {category && <input type="hidden" name="category" value={category} />}
            {status && <input type="hidden" name="status" value={status} />}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className="text-xs font-semibold text-foreground-soft">모델명·브랜드</label>
                <input
                  type="search"
                  name="q"
                  defaultValue={q}
                  placeholder="예: 캐논, 후지필름"
                  className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground-soft">최대 금액</label>
                <input
                  type="number"
                  name="maxPrice"
                  defaultValue={maxPrice}
                  placeholder="제한 없음"
                  className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground-soft">정렬</label>
                <select
                  name="sort"
                  defaultValue={sort ?? "default"}
                  className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  <option value="default">기본순</option>
                  <option value="price-asc">가격 낮은순</option>
                  <option value="price-desc">가격 높은순</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground-soft">출력 색상</label>
                <select
                  name="color"
                  defaultValue={color ?? "all"}
                  className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  <option value="all">전체</option>
                  <option value="color">컬러</option>
                  <option value="mono">흑백</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground-soft">용지 크기</label>
                <select
                  name="size"
                  defaultValue={size ?? "all"}
                  className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
                >
                  <option value="all">전체</option>
                  <option value="a3">A3</option>
                  <option value="a4">A4</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground-soft">월 출력량(매)</label>
                <input
                  type="number"
                  name="vol"
                  defaultValue={vol}
                  placeholder="감당 가능 매수"
                  className="mt-1 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="priceConfirmed" value="1" defaultChecked={priceConfirmed === "1"} className="h-4 w-4 accent-brand" />
                가격 확인된 상품만
              </label>
              <div className="flex gap-2">
                <Link
                  href={buildHref({
                    q: "",
                    maxPrice: "",
                    sort: "",
                    color: "",
                    size: "",
                    vol: "",
                    priceConfirmed: "",
                  })}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
                >
                  조건 초기화
                </Link>
                <button type="submit" className="rounded-lg bg-brand px-5 py-2 text-sm font-bold text-white hover:opacity-90">
                  검색
                </button>
              </div>
            </div>
          </form>

      {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}

      {!error && products.length === 0 && <p className="mt-10 text-sm text-foreground-soft">조건에 맞는 상품이 없습니다.</p>}

      {!error && products.length > 0 && (
        <div className="mt-6 max-h-[70vh] overflow-auto rounded-2xl border border-border bg-background">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs text-foreground-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">상품</th>
                <th className="px-4 py-3 font-semibold">카테고리</th>
                <th className="px-4 py-3 font-semibold">판매방식</th>
                <th className="px-4 py-3 font-semibold">가격</th>
                <th className="px-4 py-3 font-semibold">상태</th>
                <th className="px-4 py-3 font-semibold">재고</th>
                <th className="px-4 py-3 font-semibold">등록일</th>
                <th className="px-4 py-3 font-semibold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                        {p.images?.[0] && <Image src={p.images[0]} alt="" fill className="object-contain p-1" sizes="40px" />}
                      </div>
                      <div>
                        <Link
                          href={`/admin/products/${p.id}?from=${editReturnTo}`}
                          className="font-semibold hover:text-brand-ink hover:underline"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-foreground-soft">{p.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{CATEGORY_TABS.find((t) => t.value === p.category)?.label ?? p.category}</td>
                  <td className="whitespace-nowrap px-4 py-3">{PRICING_LABEL[p.pricing_type]}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {p.pricing_type === "purchase"
                      ? p.purchase_price
                        ? `${p.purchase_price.toLocaleString()}원`
                        : "-"
                      : p.price_monthly
                        ? `${p.price_monthly.toLocaleString()}원/월`
                        : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <ProductStatusSelect id={p.id} status={p.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground-soft">{p.stock ?? "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground-soft">
                    {new Date(p.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/products/${p.id}?from=${editReturnTo}`} className="font-semibold text-brand-ink hover:underline">
                        수정
                      </Link>
                      <ConfirmDeleteButton onDelete={deleteProduct.bind(null, p.id)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
