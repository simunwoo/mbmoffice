import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { carePoints, siteConfig } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "서비스",
  description: "엠비엠(MBM)의 유지보수·A/S 서비스 원칙: 선조치 후수리, 소모품·출장 AS 포함, 사용량 맞춤 제안.",
  path: "/solution",
});

export default function SolutionPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: "서비스", path: "/solution" }])} />
      <p className="text-sm font-semibold text-brand-ink">WE CARE. YOU WORK.</p>
      <h1 className="mt-2 text-3xl font-bold">엠비엠의 서비스 원칙</h1>
      <p className="mt-3 max-w-2xl text-foreground-soft">
        복합기를 들여놓는 순간부터가 진짜 시작이라고 생각합니다. 설치 이후를 책임지는 세 가지 원칙입니다.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {carePoints.map((c) => (
          <div key={c.headline} className="rounded-xl border border-border p-6">
            <p className="text-xs font-semibold text-brand-ink">{c.eyebrow}</p>
            <p className="mt-1 font-bold">{c.headline}</p>
            <p className="mt-2 text-sm text-foreground-soft">{c.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-surface p-6">
        <p className="font-bold">IT·PC 유지보수가 필요하신가요?</p>
        <p className="mt-2 text-sm text-foreground-soft">복합기 외 사무실 전체 IT/PC 환경 점검도 함께 진행합니다.</p>
        <Link href="/maintenance" className="mt-4 inline-block rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
          IT·PC 유지보수 자세히 보기
        </Link>
      </div>

      <a href={siteConfig.phoneHref} className="mt-10 inline-block rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-surface">
        전화 상담 {siteConfig.phone}
      </a>
    </div>
  );
}
