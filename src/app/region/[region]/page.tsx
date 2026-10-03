import Link from "next/link";
import { notFound } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { regionCopy, siteConfig } from "@/lib/site-config";
import { getInstallsByRegionSlug } from "@/lib/data";

type Params = { region: string };

export async function generateStaticParams() {
  return Object.keys(regionCopy).map((region) => ({ region }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { region } = await params;
  const entry = regionCopy[region];
  if (!entry) return {};
  return buildMetadata({
    title: `${entry.label} 복합기 렌탈`,
    description: `${entry.label} 지역 복합기 렌탈 안내와 실제 설치사례. ${entry.intro}`,
    path: `/region/${region}`,
  });
}

export default async function RegionPage({ params }: { params: Promise<Params> }) {
  const { region } = await params;
  const entry = regionCopy[region];
  if (!entry) notFound();
  const cases = await getInstallsByRegionSlug(region);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: `${entry.label} 복합기 렌탈`, path: `/region/${region}` }])} />
      <h1 className="text-3xl font-bold">{entry.label} 복합기 렌탈</h1>
      <p className="mt-3 max-w-2xl text-foreground-soft">{entry.intro}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/rental" className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          {entry.label} 복합기 렌탈 모델 보기
        </Link>
        <a href={siteConfig.phoneHref} className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold hover:bg-surface">
          전화 상담 {siteConfig.phone}
        </a>
      </div>

      <h2 className="mt-14 text-xl font-bold">{entry.label} 설치사례</h2>
      {cases.length === 0 ? (
        <p className="mt-4 text-foreground-soft">아직 등록된 {entry.label} 설치사례가 없습니다.</p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((c) => (
            <Link key={c.id} href={`/cases/${c.id}`} className="rounded-xl border border-border p-5 hover:border-brand hover:shadow-sm">
              <p className="text-xs font-semibold text-brand-ink">{c.industry}</p>
              <p className="mt-1 font-medium">{c.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
