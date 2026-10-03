import Image from "next/image";
import Link from "next/link";
import { carePoints } from "@/lib/site-config";

export function CompanyStory() {
  return (
    <section className="bg-[#0d1a15]">
      <div className="grid lg:grid-cols-2">
        <div className="relative h-72 sm:h-96 lg:h-auto">
          <Image
            src="/about/office-story.webp"
            alt="MBM과 함께 일하는 사무실"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>

        <div className="relative overflow-hidden px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
          <p
            aria-hidden
            className="pointer-events-none absolute -bottom-10 -right-4 select-none text-[9rem] font-black leading-none text-white/5 sm:text-[12rem]"
          >
            MBM
          </p>

          <div className="relative">
            <p className="text-xs font-bold tracking-[0.2em] text-white/60">WE CARE. YOU WORK.</p>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl">
              장비를 빌려드리는 일.
              <br />그 이상의 <span className="text-brand">책임.</span>
            </h2>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/70 sm:text-base">
              복합기가 잘 되는 날은 당연하게.
              <br />
              문제가 생긴 날은 누구보다 든든하게.
              <br />
              MBM은 여러분의 업무가 이어지도록 함께합니다.
            </p>
            <Link
              href="/about"
              className="mt-8 inline-flex items-center gap-2 border-b border-white/40 pb-1 text-sm font-bold text-white transition hover:border-brand hover:text-brand"
            >
              MBM을 소개합니다
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-background px-6 py-12 sm:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-3">
          {carePoints.map((c, i) => (
            <div key={c.headline}>
              <p className="text-sm font-bold tabular-nums text-foreground-soft/60">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-3 text-xs font-semibold tracking-wide text-brand-ink">{c.eyebrow}</p>
              <p className="mt-2 text-lg font-bold text-foreground">{c.headline}</p>
              <p className="mt-2 text-sm leading-relaxed text-foreground-soft">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
