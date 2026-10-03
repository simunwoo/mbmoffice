import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { addressText, siteConfig } from "@/lib/site-config";
import { ContactForm } from "@/components/ContactForm";

export const metadata = buildMetadata({
  title: "견적문의",
  description: `${siteConfig.name} 무료 견적문의: 인원, 월 출력량, 예산만 알려주시면 기종과 요금제를 무료로 설계해 드립니다.`,
  path: "/contact",
});

const BADGES = ["상담·견적 무료", "당일 회신"];

export default function ContactPage() {
  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: "견적문의", path: "/contact" }])} />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-soft via-[#f3f1ea] to-[#f7ece6] px-4 py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(1,160,129,0.28)_1.5px,transparent_1.5px)] [background-size:20px_20px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-brand-ink">
            <span className="h-px w-6 bg-brand-ink" /> CONTACT
          </p>
          <h1 className="mt-4 max-w-xl text-3xl font-bold leading-snug sm:text-4xl">
            사무환경 구축,
            <br />
            어렵게 고민하지 마세요
          </h1>
          <p className="mt-4 max-w-xl text-sm text-foreground-soft sm:text-base">
            인원, 월 출력량, 예산만 알려주시면 기종과 요금제를 무료로 설계해 드립니다. 접수 후 영업시간 기준 당일
            회신을 원칙으로 합니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {BADGES.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-background/70 px-3.5 py-1.5 text-xs font-semibold text-brand-ink"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1fr_320px]">
        <Suspense fallback={<div className="rounded-2xl border border-border bg-background p-6 sm:p-8" />}>
          <ContactForm />
        </Suspense>

        <div className="space-y-3">
          <a
            href={siteConfig.phoneHref}
            className="flex items-center gap-3 rounded-xl border border-border p-4 hover:border-brand"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>
              <span className="block text-xs text-foreground-soft">전화 상담</span>
              <span className="block text-lg font-bold">{siteConfig.phone}</span>
            </span>
          </a>

          <a
            href={siteConfig.kakaoChatUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl border border-border p-4 hover:border-brand"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEE500] text-[#3C1E1E]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.9 5.3 4.7 6.7-.2.7-.8 2.7-.9 3.1 0 0-.02.2.1.3.1.1.3 0 .3 0 .4-.1 3-2 3.5-2.3.8.1 1.6.2 2.4.2 5.5 0 10-3.6 10-8S17.5 3 12 3Z" />
              </svg>
            </span>
            <span>
              <span className="block text-xs text-foreground-soft">카카오톡 채널</span>
              <span className="block text-sm font-bold">카톡으로 바로 상담</span>
            </span>
          </a>

          <div className="rounded-xl border border-border p-4 text-sm">
            <p className="text-xs text-foreground-soft">이메일</p>
            <a href={`mailto:${siteConfig.email}`} className="font-semibold text-brand-ink">
              {siteConfig.email}
            </a>
          </div>

          <div className="rounded-xl border border-border p-4 text-sm">
            <p className="text-xs text-foreground-soft">주소</p>
            <p className="mt-1 font-medium">{addressText}</p>
          </div>

          <div className="rounded-xl border border-border p-4 text-sm">
            <p className="text-xs text-foreground-soft">운영시간</p>
            <p className="mt-1 font-medium">{siteConfig.businessHours.weekday}</p>
            <p className="text-foreground-soft">
              {siteConfig.businessHours.lunch} · {siteConfig.businessHours.closed}
            </p>
          </div>

          <div className="rounded-xl border border-border p-4 text-sm">
            <p className="text-xs text-foreground-soft">서비스 지역</p>
            <p className="mt-1 font-medium">{siteConfig.areaServed.map((a) => a.replace("특별시", "").replace("광역시", "")).join(" · ")} (수도권 직접 배송·설치)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
