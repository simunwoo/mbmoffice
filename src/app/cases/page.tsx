import Image from "next/image";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { getInstalls } from "@/lib/data";
import { joinBrandName } from "@/lib/data/types";
import { Pagination } from "@/components/Pagination";
import { cumulativeInstalls } from "@/lib/site-config";
import { AdminWriteButton } from "@/components/admin/AdminWriteButton";

export const metadata = buildMetadata({
  title: "설치사례 | 복합기·프린터 실제 설치 후기",
  description: "관공서, 사무실, 매장 등 다양한 현장의 복합기·프린터 설치사례를 확인하세요.",
  path: "/cases",
});

// 3열 그리드 기준 6줄(=18개)까지만 보여주고, 그 아래는 페이지네이션으로 넘겨봅니다.
const PAGE_SIZE = 18;

export default async function CasesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const cases = await getInstalls();
  const canonCount = cases.filter((c) => c.brand?.includes("캐논")).length;
  const fujifilmCount = cases.filter((c) => c.brand?.includes("후지필름")).length;

  const totalPages = Math.max(1, Math.ceil(cases.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const pagedCases = cases.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = [
    { label: "누적 설치 실적", value: `${cumulativeInstalls.toLocaleString()}+` },
    { label: "등록된 사례", value: cases.length.toLocaleString(), unit: "지역·기종별 기록" },
    { label: "캐논 설치", value: canonCount.toLocaleString(), unit: "건" },
    { label: "후지필름 설치", value: fujifilmCount.toLocaleString(), unit: "건" },
  ];

  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: "설치사례", path: "/cases" }])} />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-soft via-[#f3f1ea] to-[#f7ece6] px-4 py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(1,160,129,0.28)_1.5px,transparent_1.5px)] [background-size:20px_20px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm text-foreground-soft">
            <Link href="/" className="hover:text-brand-ink">홈</Link> <span aria-hidden>›</span> 설치사례
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-brand-ink">
                <span className="h-px w-6 bg-brand-ink" /> INSTALLATION CASES
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">직접 설치한 사무실의 기록</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground-soft sm:text-base">
                1989년 삼천교역으로 시작해 진코텍, 엠비엠까지 이어온 35년의 시간. 그 동안 누적{" "}
                {cumulativeInstalls.toLocaleString()}건의 복합기를 직접 배송·설치했습니다. 사무실·법무법인·건축사사무소·카페·공공기관 등
                다양한 업종의 실제 설치사례를 확인해보세요.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-background p-5 shadow-sm">
                  <p className="text-xs font-semibold text-foreground-soft">{s.label}</p>
                  <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-bold">
                    {s.value}
                    {s.unit && <span className="text-xs font-semibold text-foreground-soft">{s.unit}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pagedCases.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`} className="overflow-hidden rounded-xl border border-border hover:border-brand hover:shadow-sm">
              {c.images[0] && (
                <div className="relative aspect-video bg-surface">
                  <Image src={c.images[0]} alt={c.title} fill className="object-cover" sizes="(min-width: 1024px) 30vw, 50vw" />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs font-semibold text-brand-ink">{[c.region, c.industry].filter(Boolean).join(" · ")}</p>
                <p className="mt-1 font-medium leading-snug">{c.title}</p>
                {c.brand && c.model && (
                  <p className="mt-2 text-sm text-foreground-soft">{joinBrandName(c.brand, c.model)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/cases" />
          <AdminWriteButton href="/admin/cases/new" />
        </div>
      </div>
    </div>
  );
}
