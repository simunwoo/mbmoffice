import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { JsonLd, breadcrumbSchema } from "@/lib/schema";
import { addressText, cumulativeInstalls, serviceLines, siteConfig } from "@/lib/site-config";

export const metadata = buildMetadata({
  title: "회사소개",
  description: `${siteConfig.name}(MBM)은 ${siteConfig.shortDescription}. ${addressText}.`,
  path: "/about",
});

const ABOUT_STATS = [
  { label: "누적 설치 대수", value: `${cumulativeInstalls.toLocaleString()}`, unit: "건+", note: "수도권 직접 설치" },
  { label: "고객 만족도", value: "4.8", unit: "/5", note: "5점 만점" },
  { label: "직접 서비스지역", value: "수도권", note: "서울·경기·인천" },
  { label: "AS 응대", value: "1시간", note: "콜 접수 후 응대 기준" },
];

const HISTORY = [
  { year: "1989", label: "삼천교역", note: "창업" },
  { year: "2007", label: "진코텍", note: "상호 변경" },
  { year: "2023", label: "엠비엠", note: "브랜드 리뉴얼" },
];

const WORK_STEPS = [
  { step: "01", title: "필요한 장비부터", body: "비싼 장비보다 인원, 사용량, 업무환경에 적합한 구성을 먼저 검토합니다." },
  { step: "02", title: "설치와 설정까지", body: "실제 업무에서 바로 사용할 수 있도록 장비 연결과 기본 설정을 확인합니다." },
  { step: "03", title: "빠른 현장 대응", body: "자체 SLA 기준에 따라 AS 콜 접수 후 1시간 이내 응대, 2시간 이내 방문을 원칙으로 운영합니다." },
  { step: "04", title: "하나의 관리 접점", body: "복합기·프린터부터 PC, 문서세단기까지 사무실 장비를 하나의 창구에서 관리합니다." },
];

const HUB_ITEMS = [
  { label: "복합기·프린터", href: "/rental", note: "출력·스캔·유지관리", position: "col-start-2 row-start-1" },
  { label: "PC", href: "/pc-rental", note: "사무용 PC·노트북", position: "col-start-1 row-start-2" },
  { label: "문서세단기", href: "/shredder", note: "문서 파쇄·정보보호", position: "col-start-3 row-start-2" },
  { label: "NAS", href: "/shop/nas", note: "파일 공유·백업", position: "col-start-2 row-start-3" },
];

export default function AboutPage() {
  return (
    <div>
      <JsonLd data={breadcrumbSchema([{ name: "홈", path: "/" }, { name: "회사소개", path: "/about" }])} />

      <section className="relative overflow-hidden bg-gradient-to-br from-brand-soft via-[#f3f1ea] to-[#f7ece6] px-4 py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(rgba(1,160,129,0.28)_1.5px,transparent_1.5px)] [background-size:20px_20px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-sm text-foreground-soft">
            <Link href="/" className="hover:text-brand-ink">홈</Link> <span aria-hidden>›</span> 회사소개
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-brand-ink">
                <span className="h-px w-6 bg-brand-ink" /> ABOUT MBM
              </p>
              <h1 className="mt-4 text-3xl font-bold leading-snug sm:text-4xl">
                PC, 복합기, 프린터 렌탈은
                <br />
                역시 <span className="text-brand-ink">엠비엠</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground-soft sm:text-base">
                엠비엠(MBM)은 서울 강서구에 자리한 사무용 OA 전문기업입니다. 복합기·프린터 렌탈부터 소모품, PC,
                문서세단기, IT유지보수까지 사무실에 필요한 장비를 한 곳에서 책임집니다. 대행 없이 직접 설치하고 직접
                AS 하기 때문에 응답이 빠릅니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {ABOUT_STATS.map((s) => (
                <div key={s.label} className="rounded-2xl bg-background p-5 shadow-sm">
                  <p className="text-xs font-semibold text-foreground-soft">{s.label}</p>
                  <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-bold">
                    {s.value}
                    {s.unit && <span className="text-base font-semibold text-foreground-soft">{s.unit}</span>}
                  </p>
                  <p className="mt-1 text-xs text-foreground-soft">{s.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT MBM: 창업 스토리 */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-brand-ink">ABOUT MBM</p>
            <p className="mt-3 inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-ink">
              1989년부터 이어온 35년 업력
            </p>
            <h2 className="mt-4 text-2xl font-bold leading-snug sm:text-3xl">
              복합기·프린터에서 시작해
              <br />
              사무실 장비를 책임지는 회사로.
            </h2>

            <div className="mt-8 space-y-4">
              {HISTORY.map((h) => (
                <div key={h.year} className="flex items-baseline gap-4 border-l-2 border-brand-soft pl-4">
                  <span className="text-sm font-bold text-brand-ink">{h.year}</span>
                  <span className="font-semibold text-foreground">{h.label}</span>
                  <span className="text-xs text-foreground-soft">{h.note}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-sm leading-relaxed text-foreground-soft sm:text-base">
            <p>
              1989년 삼천교역으로 출발해 2007년 진코텍으로, 2023년에는{" "}
              <strong className="text-foreground">엠비엠(MBM)</strong>으로 브랜드를 새롭게 하며 35년간 사무기기 전문성을
              쌓아왔습니다. MBM은 &lsquo;Multi Business Machine&rsquo;의 줄임말로, 복합사무기기를 뜻합니다.
            </p>
            <p className="mt-4">
              그 시간 동안 고객이 겪는 불편은 복합기·프린터 하나에서 끝나지 않았습니다.{" "}
              <strong className="text-foreground">PC가 느려지고, 소모품이 떨어지고, 문서 보안이 걱정되면 업무 전체가 멈춥니다.</strong>
            </p>
            <p className="mt-4">
              그래서 MBM은 복합기·프린터 렌탈을 넘어 PC, 문서세단기, IT·PC 유지보수까지{" "}
              <strong className="text-foreground">사무실에 필요한 장비를 함께 관리하는 회사</strong>로 서비스 영역을
              넓혀가고 있습니다.
            </p>
            <div className="mt-8 border-l-4 border-brand bg-surface px-6 py-5 text-base font-bold text-foreground sm:text-lg">
              여러 업체를 따로 부르지 않아도 되도록.
              <br />
              사무실 장비의 접점을 하나로.
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE DO: 사업 분야 */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <p className="text-xs font-bold tracking-[0.14em] text-brand-ink">WHAT WE DO</p>
          <h2 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">
            사무실에 필요한 장비를
            <br />
            하나의 흐름으로 연결합니다.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-foreground-soft sm:text-base">
            장비 판매가 목적이 아니라 실제 업무환경에서 안정적으로 사용할 수 있도록 구성하고 관리하는 것이 MBM의
            역할입니다.
          </p>

          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            {serviceLines.map((s, i) => (
              <Link
                key={s.slug}
                href={`/${s.slug}`}
                className="group rounded-2xl border border-border bg-background p-7 transition hover:-translate-y-1 hover:border-brand hover:shadow-md"
              >
                <p className="text-xs font-bold text-brand-ink">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-3 text-lg font-bold">{s.label}</h3>
                <p className="mt-2 text-sm text-foreground-soft">{s.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE WORK: 일하는 방식 */}
      <section className="bg-[#0d1a15] text-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs font-bold tracking-[0.14em] text-brand">HOW WE WORK</p>
          <h2 className="mt-3 max-w-2xl text-2xl font-bold leading-snug sm:text-3xl">
            설치보다 중요한 것은
            <br />
            설치 이후의 업무입니다.
          </h2>
          <p className="mt-3 max-w-xl text-sm text-white/70 sm:text-base">
            MBM은 장비를 가져다 놓는 것으로 업무가 끝난다고 생각하지 않습니다.
          </p>

          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {WORK_STEPS.map((s) => (
              <div key={s.step} className="border-t border-white/25 pt-5">
                <p className="text-xs font-bold text-brand">{s.step}</p>
                <h3 className="mt-3 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 35 YEARS: 연혁 메시지 */}
      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold tracking-[0.14em] text-brand-ink">35 YEARS OF EXPERIENCE</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-bold leading-snug sm:text-3xl">
            35년 동안 바뀐 것은 장비였습니다.
            <br />
            바뀌지 않은 것은 현장이었습니다.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-foreground-soft sm:text-base">
            팩스와 복사기를 사용하던 사무실에서 복합기·프린터와 PC, 문서세단기까지 함께 갖추는 지금까지. 기술은 계속
            달라졌지만 고객이 원하는 것은 크게 달라지지 않았습니다.
          </p>
          <p className="mx-auto mt-10 max-w-xl text-3xl font-black leading-snug text-brand-ink sm:text-4xl">
            &ldquo;업무가 멈추지 않는 것.&rdquo;
          </p>
          <p className="mx-auto mt-5 max-w-xl text-sm text-foreground-soft">
            MBM은 그 기본을 지키기 위해 35년째 한 자리에서 현장을 지켜왔습니다.
          </p>
        </div>
      </section>

      {/* ONE OFFICE, ONE PARTNER: 장비 허브 */}
      <section className="bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-xs font-bold tracking-[0.14em] text-brand-ink">ONE OFFICE, ONE PARTNER</p>
          <h2 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">
            하나의 사무실,
            <br />
            하나의 관리 파트너.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-foreground-soft sm:text-base">
            사무실 안에서 각각 따로 관리되는 장비를 MBM이 하나의 창구로 연결합니다.
          </p>

          <div className="mx-auto mt-12 grid max-w-md grid-cols-3 grid-rows-3 items-center justify-items-center gap-4 sm:max-w-lg sm:gap-6">
            <div className="col-start-2 row-start-2 flex h-24 w-24 items-center justify-center rounded-full bg-brand text-lg font-black text-white shadow-lg sm:h-28 sm:w-28">
              MBM
            </div>
            {HUB_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${item.position} flex w-full flex-col items-center gap-1 rounded-xl border border-border bg-background px-3 py-4 text-center transition hover:border-brand hover:shadow-sm`}
              >
                <span className="text-sm font-bold">{item.label}</span>
                <span className="text-xs text-foreground-soft">{item.note}</span>
              </Link>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-xl text-sm text-foreground-soft">
            장비마다 다른 업체를 찾는 대신, 복합기·프린터부터 PC·문서세단기·NAS까지 MBM 하나로 관리하세요.
          </p>
        </div>
      </section>

      {/* SERVICE AREA */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-brand-ink">SERVICE AREA</p>
            <h2 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">
              서울 · 경기 · 인천
              <br />
              수도권 기업과 함께합니다.
            </h2>
            <p className="mt-3 max-w-md text-sm text-foreground-soft sm:text-base">
              장비 설치부터 유지관리까지, 수도권 기업 고객의 사무환경에 필요한 서비스를 현장에서 직접 지원합니다.
              일부 대기업 고객은 제조사 본사의 위탁을 받아 전국 단위로 유지관리를 지원하고 있습니다.
            </p>
          </div>
          <div className="rounded-2xl bg-[#0d2723] p-10 text-white">
            <p className="text-xs font-bold text-brand">MBM SERVICE AREA</p>
            <p className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              서울
              <br />
              경기
              <br />
              인천
            </p>
            <p className="mt-4 text-sm text-white/70">수도권 직접 설치 · 대기업 위탁 유지관리는 전국 지원</p>
          </div>
        </div>
      </section>

      {/* 1분 사무기기 추천 CTA */}
      <section className="bg-brand-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-14 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-brand-ink">1 MINUTE RECOMMENDATION</p>
            <h2 className="mt-3 text-2xl font-bold leading-snug sm:text-3xl">
              어떤 장비가 필요한지
              <br />
              모르겠다면?
            </h2>
            <p className="mt-3 max-w-md text-sm text-foreground-soft sm:text-base">
              몇 가지 질문에 답하면 우리 사무실의 업무환경과 사용량에 맞는 장비를 찾을 수 있습니다.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["A3 / A4", "컬러 / 흑백", "월 사용량", "사용 인원"].map((t) => (
                <span key={t} className="rounded-full border border-brand-ink/20 bg-background px-3 py-1.5 text-xs font-semibold">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <Link
            href="/recommend"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white hover:opacity-90"
          >
            1분 사무기기 추천 시작하기
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>

      {/* 최종 CTA */}
      <section className="px-4 py-20 text-center">
        <h2 className="text-2xl font-bold leading-snug sm:text-4xl">
          사무실 장비, 이제
          <br />
          여러 곳에 물어보지 마세요.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-foreground-soft sm:text-base">
          복합기부터 PC와 문서세단기까지.
          <br />
          사무실의 업무환경을 MBM이 함께 관리하겠습니다.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90">
            상담 신청하기
          </Link>
          <a
            href={siteConfig.kakaoChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-border px-6 py-3 text-sm font-bold hover:bg-surface"
          >
            카카오톡 상담
          </a>
        </div>
      </section>

      {/* 회사 정보 */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a href={siteConfig.phoneHref} className="rounded-xl border border-border bg-background p-4 text-sm hover:border-brand">
              <p className="text-xs text-foreground-soft">대표전화</p>
              <p className="mt-1 font-semibold text-brand-ink">{siteConfig.phone}</p>
            </a>

            <a href={`mailto:${siteConfig.email}`} className="rounded-xl border border-border bg-background p-4 text-sm hover:border-brand">
              <p className="text-xs text-foreground-soft">이메일</p>
              <p className="mt-1 font-medium">{siteConfig.email}</p>
            </a>

            <div className="rounded-xl border border-border bg-background p-4 text-sm">
              <p className="text-xs text-foreground-soft">주소</p>
              <p className="mt-1 font-medium">{addressText}</p>
            </div>

            <div className="rounded-xl border border-border bg-background p-4 text-sm">
              <p className="text-xs text-foreground-soft">직접 서비스지역</p>
              <p className="mt-1 font-medium">{siteConfig.areaServed.join(", ")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
