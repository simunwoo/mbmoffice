"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const AUTOPLAY_MS = 6000;

interface Slide {
  key: string;
  theme: "cream" | "dark" | "mint";
  image: string;
  eyebrow: string;
  headlineLines: [string, string];
  accentLine: 1 | 2;
  accentWord?: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  caption: string;
}

const slides: Slide[] = [
  {
    key: "rental",
    theme: "cream",
    image: "/hero/office-copier.png",
    eyebrow: "BETTER OFFICE, BETTER WORK",
    headlineLines: ["사무기기 렌탈은", "역시, MBM."],
    accentLine: 2,
    accentWord: "MBM",
    subtext: "좋은 장비를 넘어, 일하기 좋은 사무실로.\n복합기부터 유지보수까지 MBM이 함께합니다.",
    ctaLabel: "우리 사무실에 맞는 복합기 찾기",
    ctaHref: "/recommend",
    caption: "OFFICE EQUIPMENT RENTAL",
  },
  {
    key: "partner",
    theme: "dark",
    image: "/hero/it-security.png",
    eyebrow: "YOUR RELIABLE IT PARTNER",
    headlineLines: ["업무가 멈추지 않도록.", "든든한 IT 파트너."],
    accentLine: 2,
    subtext: "PC, 네트워크, 사무기기까지.\n복잡한 사무실 IT 관리를 한 곳에서 해결하세요.",
    ctaLabel: "IT 유지보수 알아보기",
    ctaHref: "/maintenance",
    caption: "TOTAL IT CARE SERVICE",
  },
  {
    key: "package",
    theme: "mint",
    image: "/hero/it-helpdesk.png",
    eyebrow: "EVERYTHING YOUR OFFICE NEEDS",
    headlineLines: ["새로운 사무실의 시작,", "한 번에, 더 합리적으로."],
    accentLine: 2,
    subtext: "복합기, PC, 문서세단기까지 필요한 만큼.\n우리 사무실에 꼭 맞는 구성을 제안합니다.",
    ctaLabel: "사무실 패키지 상담하기",
    ctaHref: "/contact",
    caption: "SMART OFFICE PACKAGE",
  },
];

const THEME_STYLES: Record<
  Slide["theme"],
  { ink: string; sub: string; ctaSolid: boolean; fade: string; scrim: string }
> = {
  cream: {
    ink: "text-[#1c1a16]",
    sub: "text-[#4d473d]",
    ctaSolid: true,
    fade: "linear-gradient(to right, rgba(242,239,233,0.99) 0%, rgba(242,239,233,0.96) 45%, rgba(242,239,233,0.7) 65%, rgba(242,239,233,0.2) 85%, rgba(242,239,233,0) 100%)",
    scrim: "bg-[#f2efe9]/80",
  },
  dark: {
    ink: "text-white",
    sub: "text-white/70",
    ctaSolid: false,
    fade: "linear-gradient(to right, rgba(5,7,10,0.99) 0%, rgba(5,7,10,0.94) 45%, rgba(5,7,10,0.7) 65%, rgba(5,7,10,0.25) 85%, rgba(5,7,10,0) 100%)",
    scrim: "bg-black/50",
  },
  mint: {
    ink: "text-[#12241c]",
    sub: "text-[#3c5348]",
    ctaSolid: true,
    fade: "linear-gradient(to right, rgba(234,246,240,0.99) 0%, rgba(234,246,240,0.97) 50%, rgba(234,246,240,0.8) 68%, rgba(234,246,240,0.35) 88%, rgba(234,246,240,0.1) 100%)",
    scrim: "bg-[#eaf6f0]/85",
  },
};

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, index]);

  const slide = slides[index];
  const style = THEME_STYLES[slide.theme];

  const headline = slide.headlineLines.map((line, i) => {
    const isAccentLine = i + 1 === slide.accentLine;
    if (!isAccentLine) return line;
    if (slide.accentWord && line.includes(slide.accentWord)) {
      const [before, after] = line.split(slide.accentWord);
      return (
        <span key={i}>
          {before}
          <span className="text-brand">{slide.accentWord}</span>
          {after}
        </span>
      );
    }
    return (
      <span key={i} className="text-brand">
        {line}
      </span>
    );
  });

  return (
    <section className="relative overflow-hidden bg-black">
      <Image
        key={slide.image}
        src={slide.image}
        alt=""
        fill
        priority={index === 0}
        className="object-cover"
        sizes="100vw"
      />
      {/* 왼쪽(글자 영역)은 짙게, 오른쪽(사진 영역)으로 갈수록 서서히 연해지는 오버레이 */}
      <div className="absolute inset-0" style={{ background: style.fade }} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-24 lg:min-h-[560px] lg:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.15em] text-brand">{slide.eyebrow}</p>
          <h1 className={`mt-4 text-3xl font-bold leading-[1.15] sm:text-4xl lg:text-5xl ${style.ink}`}>
            {headline[0]}
            <br />
            {headline[1]}
          </h1>
          <p className={`mt-5 whitespace-pre-line text-sm leading-relaxed sm:text-base ${style.sub}`}>{slide.subtext}</p>
          <Link
            href={slide.ctaHref}
            className={`mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition active:scale-95 ${
              style.ctaSolid
                ? "bg-brand text-white hover:opacity-90"
                : "border border-white/30 text-white hover:bg-white/10"
            }`}
          >
            {slide.ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 pb-6 sm:px-8">
        <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${style.ink} ${style.scrim}`}>
          <span className="tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
          </span>
          <div className="h-0.5 w-16 overflow-hidden rounded-full bg-current opacity-20">
            <div
              key={`${index}-${paused}`}
              className="h-full bg-current"
              style={{
                width: paused ? "0%" : undefined,
                animationName: paused ? "none" : "hero-progress",
                animationDuration: `${AUTOPLAY_MS}ms`,
                animationTimingFunction: "linear",
                animationFillMode: "forwards",
              }}
            />
          </div>
          <button
            type="button"
            aria-label="이전 슬라이드"
            onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
            className="rounded-full p-1.5 opacity-70 transition hover:bg-current/10 hover:opacity-100 active:scale-90"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="다음 슬라이드"
            onClick={() => setIndex((i) => (i + 1) % slides.length)}
            className="rounded-full p-1.5 opacity-70 transition hover:bg-current/10 hover:opacity-100 active:scale-90"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={paused ? "재생" : "일시정지"}
            onClick={() => setPaused((p) => !p)}
            className="rounded-full p-1.5 opacity-70 transition hover:bg-current/10 hover:opacity-100 active:scale-90"
          >
            {paused ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M8 5v14l11-7-11-7Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M7 5h3v14H7zM14 5h3v14h-3z" />
              </svg>
            )}
          </button>
        </div>

        <p className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] ${style.ink} ${style.scrim}`}>
          {slide.caption} <span className="opacity-60">· MBM OFFICE</span>
        </p>
      </div>
    </section>
  );
}
