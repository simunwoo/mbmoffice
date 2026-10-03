import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ConfirmDeleteButton } from "@/components/admin/ConfirmDeleteButton";
import { deleteInstallCase } from "@/lib/actions/admin/cases";

type SearchParams = { brand?: string; category?: string; q?: string };

export default async function AdminCasesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { brand, category, q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();
  const { data, error } = await supabase.from("install_cases").select("*");
  // 날짜 없는 사례는 맨 뒤로, 있는 사례는 설치일(case_date) 최신순으로 — 등록한 순서(created_at)가 아니라
  // 실제 설치 시점 기준으로 보여야 뒤죽박죽으로 보이지 않습니다.
  const all = data
    ? [...data].sort((a, b) => {
        if (!a.case_date && !b.case_date) return 0;
        if (!a.case_date) return 1;
        if (!b.case_date) return -1;
        return b.case_date.localeCompare(a.case_date);
      })
    : data;

  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  for (const c of all ?? []) {
    if (c.brand) brandCounts.set(c.brand, (brandCounts.get(c.brand) ?? 0) + 1);
    if (c.category) categoryCounts.set(c.category, (categoryCounts.get(c.category) ?? 0) + 1);
  }
  const brands = [...brandCounts.entries()].sort((a, b) => b[1] - a[1]);
  const categories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);

  const activeBrand = brand && brandCounts.has(brand) ? brand : undefined;
  const activeCategory = category && categoryCounts.has(category) ? category : undefined;

  const cases = (all ?? []).filter((c) => {
    if (activeBrand && c.brand !== activeBrand) return false;
    if (activeCategory && c.category !== activeCategory) return false;
    if (query && !c.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  function buildHref(overrides: Partial<SearchParams>) {
    const merged = { brand, category, q, ...overrides };
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/admin/cases?${qs}` : "/admin/cases";
  }

  const navItemClass = (active: boolean) =>
    `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active ? "bg-brand-soft text-brand-ink" : "text-foreground-soft hover:bg-surface"
    }`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">설치사례</h1>
          <p className="mt-1 text-sm text-foreground-soft">실제 설치사례 게시글을 작성하고 관리합니다.</p>
        </div>
        <Link href="/admin/cases/new" className="rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90">
          새 사례 작성
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-52">
          <p className="text-xs font-bold text-foreground-soft">제조사</p>
          <nav className="mt-2 space-y-1">
            <Link href={buildHref({ brand: undefined })} className={navItemClass(!activeBrand)}>
              전체 <span>{all?.length ?? 0}</span>
            </Link>
            {brands.map(([name, count]) => (
              <Link key={name} href={buildHref({ brand: name })} className={navItemClass(activeBrand === name)}>
                {name} <span>{count}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <form action="/admin/cases" method="get" className="flex gap-2">
            {activeBrand && <input type="hidden" name="brand" value={activeBrand} />}
            {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="제목으로 검색"
              className="w-full max-w-sm rounded-lg border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:opacity-90">
              검색
            </button>
            {query && (
              <Link
                href={buildHref({ q: undefined })}
                className="flex items-center rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-surface"
              >
                초기화
              </Link>
            )}
          </form>

          {categories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={buildHref({ category: undefined })}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  !activeCategory ? "border-brand bg-brand text-white" : "border-border text-foreground-soft hover:border-brand/50"
                }`}
              >
                전체 기기
              </Link>
              {categories.map(([name, count]) => (
                <Link
                  key={name}
                  href={buildHref({ category: name })}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeCategory === name ? "border-brand bg-brand text-white" : "border-border text-foreground-soft hover:border-brand/50"
                  }`}
                >
                  {name} <span className="text-[10px] opacity-70">({count})</span>
                </Link>
              ))}
            </div>
          )}

          {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}
          {!error && cases.length === 0 && <p className="mt-6 text-sm text-foreground-soft">조건에 맞는 설치사례가 없습니다.</p>}

          {!error && cases.length > 0 && (
            <div className="mt-4 max-h-[70vh] overflow-auto rounded-2xl border border-border bg-background">
              <table className="w-full min-w-[840px] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs text-foreground-soft">
                  <tr>
                    <th className="px-4 py-3 font-semibold">제목</th>
                    <th className="px-4 py-3 font-semibold">기기 종류</th>
                    <th className="px-4 py-3 font-semibold">지역</th>
                    <th className="px-4 py-3 font-semibold">업종</th>
                    <th className="px-4 py-3 font-semibold">모델</th>
                    <th className="px-4 py-3 font-semibold">설치일</th>
                    <th className="px-4 py-3 font-semibold">상태</th>
                    <th className="px-4 py-3 font-semibold">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cases.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-semibold">
                        <Link href={`/cases/${c.id}`} target="_blank" className="hover:text-brand-ink hover:underline">
                          {c.title}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{c.category ?? "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{c.region ?? "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{c.industry ?? "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{c.model ?? "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{c.case_date ?? "-"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                            c.status === "published" ? "bg-brand-soft text-brand-ink" : "bg-surface text-foreground-soft"
                          }`}
                        >
                          {c.status === "published" ? "공개" : "임시저장"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/cases/${c.id}`} className="font-semibold text-brand-ink hover:underline">
                            수정
                          </Link>
                          <ConfirmDeleteButton onDelete={deleteInstallCase.bind(null, c.id)} />
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
