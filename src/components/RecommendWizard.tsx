"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { joinBrandName, type Product } from "@/lib/data/types";
import { siteConfig } from "@/lib/site-config";
import { calcInkjetMonthlyPrice, calcMfpMonthlyPrice, INKJET_PRICING, MFP_OVERAGE, MFP_PLANS } from "@/lib/estimate";

type Device = "mfp" | "pc";
type PrintTech = "laser" | "inkjet";
type PaperSize = "a3" | "a4";
type ColorType = "color" | "mono";
type ScanFreq = "low" | "high";
export type PcWork = "basic" | "office" | "meeting" | "creative";
type Monitor = "0" | "1" | "2";
type Cycle = "36" | "48";

const STEPS = [
  { n: 1, label: "장비 선택" },
  { n: 2, label: "사용환경" },
  { n: 3, label: "사용량" },
  { n: 4, label: "추천 결과" },
];

// A3 레이저 복합기의 팩스 옵션 추가 월 요금 (A4는 기본 포함이라 옵션이 없습니다).
export const FAX_OPTION_PRICE = 10000;

export const PC_WORK_OPTIONS: { value: PcWork; label: string; desc: string }[] = [
  { value: "basic", label: "문서·인터넷", desc: "문서 작성, 웹서핑, 이메일 중심의 기본 업무" },
  { value: "office", label: "엑셀·사무프로그램", desc: "엑셀 등 여러 프로그램을 동시에 쓰는 일반 사무" },
  { value: "meeting", label: "화상회의·발표", desc: "화상회의, 프레젠테이션 자료 제작이 잦은 업무" },
  { value: "creative", label: "디자인·영상편집", desc: "그래픽·영상 등 고사양이 필요한 작업" },
];

const PRINTER_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
    <path d="M7 8.5V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4.5" />
    <rect x="3.5" y="8.5" width="17" height="7" rx="2" />
    <circle cx="17" cy="11.7" r="0.5" fill="currentColor" stroke="none" />
    <path d="M7 14v6a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-6" />
  </svg>
);

const LAPTOP_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
    <rect x="4.5" y="4.5" width="15" height="10" rx="1.5" />
    <path d="M2.5 17.5h19l-1.1 2.1a1.5 1.5 0 0 1-1.33.9H4.93a1.5 1.5 0 0 1-1.33-.9Z" />
  </svg>
);

function SegButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-40 ${
        active ? "border-brand bg-brand text-white" : "border-border bg-background text-foreground-soft hover:border-brand/50"
      }`}
    >
      {children}
    </button>
  );
}

function pickMfpRecommendation(products: Product[], size: PaperSize, color: ColorType, totalVolume: number) {
  const candidates = products.filter(
    (p) =>
      (p.category === "mfp" || p.category === "printer") &&
      p.printTech !== "inkjet" &&
      p.size === size &&
      p.color === color &&
      p.pricingType === "rental" &&
      p.priceMonthly
  );
  if (candidates.length === 0) return null;

  const scored = candidates.map((p) => {
    const min = p.volumeMin ?? 0;
    const max = p.volumeMax ?? Infinity;
    let distance = 0;
    if (totalVolume < min) distance = min - totalVolume;
    else if (totalVolume > max) distance = totalVolume - max;
    return { p, distance };
  });
  scored.sort((a, b) => a.distance - b.distance || (a.p.priceMonthly ?? 0) - (b.p.priceMonthly ?? 0));
  return scored[0].p;
}

function pickInkjetRecommendation(products: Product[]) {
  const candidates = products.filter(
    (p) => (p.category === "mfp" || p.category === "printer") && p.printTech === "inkjet" && p.pricingType === "rental" && p.priceMonthly
  );
  return candidates[0] ?? null;
}

/** 흑백 전용 복합기(예: Apeos 3060)는 보유 모델이 한정적이라 용지 크기가 정확히 맞지 않아도 흑백 복합기 카테고리 안에서 추천합니다.
 * 단일 기능 흑백 프린터(예: LBP243DW)는 복합기가 아니므로 제외합니다. */
function pickMonoMfpRecommendation(products: Product[], size: PaperSize) {
  const candidates = products.filter(
    (p) => p.category === "mfp" && p.color === "mono" && p.printTech !== "inkjet" && p.pricingType === "rental" && p.priceMonthly
  );
  if (candidates.length === 0) return null;
  return candidates.find((p) => p.size === size) ?? candidates[0];
}

/**
 * A3 컬러 레이저 복합기 진입 등급(캐논 iR ADV DX C3922, 후지필름 Apeos C2561)은 가격·성능이 사실상 동급이라,
 * 업종에 따라 더 잘 맞는 모델을 함께 비교해서 보여줍니다.
 */
const ENTRY_A3_COLOR_MODELS: { modelKey: string; industryText: string }[] = [
  { modelKey: "iR ADV DX C3922", industryText: "세무사·노무사·변호사·행정사·법무사 등 전문직 사무실에 추천" },
  { modelKey: "Apeos C2561", industryText: "디자인 사무실, 건축사사무소에 추천" },
];

function pickEntryA3ColorModels(products: Product[]): { product: Product; industryText: string }[] {
  return ENTRY_A3_COLOR_MODELS.map(({ modelKey, industryText }) => {
    const product = products.find(
      (p) =>
        (p.category === "mfp" || p.category === "printer") &&
        p.name.includes(modelKey) &&
        p.pricingType === "rental" &&
        p.priceMonthly
    );
    return product ? { product, industryText } : null;
  }).filter((x): x is { product: Product; industryText: string } => x !== null);
}

function pickPcRecommendation(products: Product[], work: PcWork) {
  const candidates = products
    .filter((p) => (p.category === "pc" || p.category === "notebook") && p.pricingType === "rental" && p.priceMonthly)
    .sort((a, b) => (a.priceMonthly ?? 0) - (b.priceMonthly ?? 0));
  if (candidates.length === 0) return null;
  // 기본/사무 업무는 저렴한 구성, 화상회의·디자인은 그나마 상위 구성을 우선 추천 (실보유 사양이 세분화되어 있지 않아 상담으로 안내)
  if (work === "basic") return candidates[0];
  return candidates[candidates.length - 1];
}

export function RecommendWizard({ products }: { products: Product[] }) {
  const [step, setStep] = useState(1);
  const [device, setDevice] = useState<Device | null>(null);

  const [printTech, setPrintTech] = useState<PrintTech>("laser");
  const [paperSize, setPaperSize] = useState<PaperSize>("a4");
  const [colorType, setColorType] = useState<ColorType>("mono");
  const [scanFreq, setScanFreq] = useState<ScanFreq>("low");

  function selectScanFreq(v: ScanFreq) {
    setScanFreq(v);
    // 스캔이 많으면 스캔 속도가 빠른 A3 복합기가 꼭 필요합니다.
    if (v === "high") setPaperSize("a3");
  }
  const [bwPages, setBwPages] = useState(2000);
  const [colorPages, setColorPages] = useState(200);

  function selectColorType(v: ColorType) {
    setColorType(v);
    // 흑백 위주를 선택하면 컬러 입력칸이 필요 없어 값도 함께 초기화합니다.
    if (v === "mono") setColorPages(0);
  }

  const [inkjetVolume, setInkjetVolume] = useState<number>(INKJET_PRICING.tiers[0].upToPages);
  const [faxOption, setFaxOption] = useState(false);

  function selectPaperSize(v: PaperSize) {
    setPaperSize(v);
    // A4 복합기는 팩스 기능이 기본 내장이라 별도 옵션이 필요 없습니다.
    if (v === "a4") setFaxOption(false);
  }

  const [pcWork, setPcWork] = useState<PcWork>("basic");
  const [monitor, setMonitor] = useState<Monitor>("1");
  const [pcQty, setPcQty] = useState(3);
  const [cycle, setCycle] = useState<Cycle>("36");

  const totalVolume = bwPages + colorPages;
  const effectiveColor: ColorType = colorType === "color" || colorPages > 0 ? "color" : "mono";

  const mfpResult = useMemo(() => {
    if (device !== "mfp") return null;
    if (printTech === "inkjet") return pickInkjetRecommendation(products);
    if (effectiveColor === "mono") return pickMonoMfpRecommendation(products, paperSize);
    return pickMfpRecommendation(products, paperSize, effectiveColor, totalVolume);
  }, [device, printTech, products, paperSize, effectiveColor, totalVolume]);
  const pcResult = useMemo(() => (device === "pc" ? pickPcRecommendation(products, pcWork) : null), [device, products, pcWork]);
  const monoMfpPrice = calcMfpMonthlyPrice("mono", { monoVolume: bwPages, colorVolume: 0 });

  const entryA3ColorPair = useMemo(() => {
    if (device !== "mfp" || printTech !== "laser" || effectiveColor !== "color" || paperSize !== "a3") return [];
    return pickEntryA3ColorModels(products);
  }, [device, printTech, effectiveColor, paperSize, products]);
  const showEntryA3ColorPair = entryA3ColorPair.length === ENTRY_A3_COLOR_MODELS.length;

  const workOption = PC_WORK_OPTIONS.find((o) => o.value === pcWork)!;

  function goTo(n: number) {
    setStep(n);
    if (typeof window !== "undefined") window.scrollTo({ top: 160, behavior: "smooth" });
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-background shadow-sm">
      {/* 진행 표시줄 */}
      <div className="grid grid-cols-4 border-b border-border bg-surface">
        {STEPS.map((s) => (
          <div key={s.n} className={`relative flex items-center justify-center gap-2 px-2 py-4 text-xs font-extrabold sm:text-sm ${
            step === s.n ? "text-foreground" : step > s.n ? "text-brand-ink" : "text-foreground-soft"
          }`}>
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                step >= s.n ? "bg-brand text-white" : "bg-background text-foreground-soft"
              }`}
            >
              {s.n}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
            {step === s.n && <span className="absolute inset-x-4 -bottom-px h-[3px] rounded-full bg-brand" />}
          </div>
        ))}
      </div>

      <div className="px-6 py-10 sm:px-10 sm:py-12">
        {/* STEP 1 */}
        {step === 1 && (
          <div>
            <p className="text-xs font-extrabold tracking-widest text-brand">STEP 01</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">어떤 장비를 찾고 계신가요?</h2>
            <p className="mt-2 text-sm text-foreground-soft">필요한 장비를 먼저 선택해주세요.</p>

            <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDevice("mfp")}
                className={`rounded-2xl border p-6 text-left transition active:scale-[0.97] ${
                  device === "mfp" ? "border-2 border-brand bg-brand-soft" : "border-border hover:border-brand/50"
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">{PRINTER_ICON}</span>
                <p className="mt-4 text-lg font-bold">복합기·프린터</p>
                <p className="mt-1 text-sm text-foreground-soft">A3/A4, 흑백·컬러, 월 출력량을 기준으로 추천합니다.</p>
              </button>
              <button
                type="button"
                onClick={() => setDevice("pc")}
                className={`rounded-2xl border p-6 text-left transition active:scale-[0.97] ${
                  device === "pc" ? "border-2 border-brand bg-brand-soft" : "border-border hover:border-brand/50"
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">{LAPTOP_ICON}</span>
                <p className="mt-4 text-lg font-bold">PC·노트북</p>
                <p className="mt-1 text-sm text-foreground-soft">업무 종류와 필요 대수에 따라 적정 사양을 추천합니다.</p>
              </button>
            </div>

            <div className="mt-10 flex justify-end border-t border-border pt-6">
              <button
                type="button"
                disabled={!device}
                onClick={() => goTo(2)}
                className="rounded-xl bg-brand px-6 py-3 text-sm font-extrabold text-white transition active:scale-95 disabled:cursor-not-allowed disabled:active:scale-100 disabled:bg-border disabled:text-foreground-soft"
              >
                다음 단계 →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && device === "mfp" && (
          <div>
            <p className="text-xs font-extrabold tracking-widest text-brand">STEP 02</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">복합기 사용 환경을 알려주세요.</h2>
            <p className="mt-2 text-sm text-foreground-soft">선택하신 장비에 맞는 기본 조건을 확인합니다.</p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border p-6 sm:col-span-2">
                <p className="text-sm font-bold">인쇄 방식</p>
                <p className="mt-1 text-xs text-foreground-soft">
                  레이저젯은 가격은 더 높지만 인쇄·스캔 품질이 우수하고, 잉크젯은 품질은 보통이지만 가격이 매우 저렴합니다.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SegButton active={printTech === "laser"} onClick={() => setPrintTech("laser")}>레이저젯 (고품질)</SegButton>
                  <SegButton active={printTech === "inkjet"} onClick={() => setPrintTech("inkjet")}>잉크젯 (저비용)</SegButton>
                </div>
              </div>

              {printTech === "laser" && (
                <>
                  <div className="rounded-2xl border border-border p-6">
                    <p className="text-sm font-bold">용지 크기</p>
                    {scanFreq === "high" && (
                      <p className="mt-1 text-xs text-brand-ink">스캔이 많아 A3로 자동 선택했어요. 스캔 속도가 더 빠릅니다.</p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SegButton active={paperSize === "a4"} onClick={() => selectPaperSize("a4")} disabled={scanFreq === "high"}>
                        A4면 충분해요
                      </SegButton>
                      <SegButton active={paperSize === "a3"} onClick={() => selectPaperSize("a3")}>A3도 필요해요</SegButton>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border p-6">
                    <p className="text-sm font-bold">출력 유형</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SegButton active={colorType === "mono"} onClick={() => selectColorType("mono")}>흑백 위주</SegButton>
                      <SegButton active={colorType === "color"} onClick={() => selectColorType("color")}>컬러 필요</SegButton>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border p-6">
                    <p className="text-sm font-bold">스캔 빈도</p>
                    <p className="mt-1 text-xs text-foreground-soft">스캔을 많이 하신다면 스캔 속도가 빠른 A3 복합기가 꼭 필요해요.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SegButton active={scanFreq === "low"} onClick={() => selectScanFreq("low")}>스캔 적음</SegButton>
                      <SegButton active={scanFreq === "high"} onClick={() => selectScanFreq("high")}>스캔 많음</SegButton>
                    </div>
                  </div>
                </>
              )}

              {printTech === "inkjet" && (
                <div className="rounded-2xl border border-border p-6 sm:col-span-2">
                  <p className="text-sm text-foreground-soft">
                    잉크젯 복합기는 컬러·흑백 구분 없이 동일 요금이 적용되는 A4 소형 모델로 안내해 드려요. 팩스 기능은 별도
                    옵션 없이 기본 장착되어 있습니다.
                  </p>
                </div>
              )}

              {printTech === "laser" && paperSize === "a3" && (
                <div className="rounded-2xl border border-border p-6">
                  <p className="text-sm font-bold">팩스 옵션</p>
                  <p className="mt-1 text-xs text-foreground-soft">
                    팩스 기능이 필요하면 선택해주세요. 월 {FAX_OPTION_PRICE.toLocaleString()}원이 추가됩니다.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <SegButton active={!faxOption} onClick={() => setFaxOption(false)}>팩스 필요없음</SegButton>
                    <SegButton active={faxOption} onClick={() => setFaxOption(true)}>
                      팩스 옵션 추가 (+{FAX_OPTION_PRICE.toLocaleString()}원)
                    </SegButton>
                  </div>
                </div>
              )}

              {printTech === "laser" && paperSize === "a4" && (
                <div className="rounded-2xl border border-border p-6">
                  <p className="text-sm text-foreground-soft">
                    A4 복합기는 팩스 기능이 별도 옵션 없이 기본 장착되어 있습니다.
                  </p>
                </div>
              )}
            </div>

            <StepNav onBack={() => goTo(1)} onNext={() => goTo(3)} />
          </div>
        )}

        {step === 2 && device === "pc" && (
          <div>
            <p className="text-xs font-extrabold tracking-widest text-brand">STEP 02</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">PC 사용 환경을 알려주세요.</h2>
            <p className="mt-2 text-sm text-foreground-soft">선택하신 장비에 맞는 기본 조건을 확인합니다.</p>

            <div className="mt-8 rounded-2xl border border-border p-6">
              <p className="text-sm font-bold">주요 업무</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PC_WORK_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setPcWork(o.value)}
                    className={`rounded-xl border p-3.5 text-left transition active:scale-[0.97] ${
                      pcWork === o.value ? "border-brand bg-brand-soft" : "border-border hover:border-brand/50"
                    }`}
                  >
                    <p className="text-sm font-bold">{o.label}</p>
                    <p className="mt-0.5 text-xs text-foreground-soft">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-border p-6">
              <p className="text-sm font-bold">모니터 구성</p>
              <p className="mt-1 text-xs text-foreground-soft">노트북만 쓰신다면 모니터가 필요 없을 수도 있어요. 필요한 대수를 확인해주세요.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <SegButton active={monitor === "0"} onClick={() => setMonitor("0")}>모니터 필요없음</SegButton>
                <SegButton active={monitor === "1"} onClick={() => setMonitor("1")}>1대</SegButton>
                <SegButton active={monitor === "2"} onClick={() => setMonitor("2")}>2대</SegButton>
              </div>
            </div>

            <StepNav onBack={() => goTo(1)} onNext={() => goTo(3)} />
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && device === "mfp" && (
          <div>
            <p className="text-xs font-extrabold tracking-widest text-brand">STEP 03</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">한 달 출력량을 알려주세요.</h2>
            <p className="mt-2 text-sm text-foreground-soft">정확하지 않아도 괜찮습니다. 대략적인 사용량만 입력해주세요.</p>

            {printTech === "inkjet" ? (
              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl border border-border p-6">
                  <p className="text-sm font-bold">월 출력량 (컬러·흑백 무관)</p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={inkjetVolume}
                      onChange={(e) => setInkjetVolume(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
                    />
                    <span className="whitespace-nowrap text-sm font-bold text-foreground-soft">매 / 월</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`mt-8 grid gap-5 ${colorType === "mono" ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
                <div className="rounded-2xl border border-border p-6">
                  <p className="text-sm font-bold">월 흑백 출력량</p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={bwPages}
                      onChange={(e) => setBwPages(Number(e.target.value) || 0)}
                      className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
                    />
                    <span className="whitespace-nowrap text-sm font-bold text-foreground-soft">매 / 월</span>
                  </div>
                </div>
                {colorType === "color" && (
                  <div className="rounded-2xl border border-border p-6">
                    <p className="text-sm font-bold">월 컬러 출력량</p>
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        step={100}
                        value={colorPages}
                        onChange={(e) => setColorPages(Number(e.target.value) || 0)}
                        className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
                      />
                      <span className="whitespace-nowrap text-sm font-bold text-foreground-soft">매 / 월</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="mt-3 text-[11px] text-foreground-soft">참고: A4 용지 1박스 = 2,500매</p>

            <StepNav onBack={() => goTo(2)} onNext={() => goTo(4)} nextLabel="추천 결과 보기 →" />
          </div>
        )}

        {step === 3 && device === "pc" && (
          <div>
            <p className="text-xs font-extrabold tracking-widest text-brand">STEP 03</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">필요한 PC 수량을 알려주세요.</h2>
            <p className="mt-2 text-sm text-foreground-soft">정확하지 않아도 괜찮습니다. 대략적인 수량만 입력해주세요.</p>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border p-6">
                <p className="text-sm font-bold">필요한 PC 수량</p>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={pcQty}
                    onChange={(e) => setPcQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-brand"
                  />
                  <span className="whitespace-nowrap text-sm font-bold text-foreground-soft">대</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border p-6">
                <p className="text-sm font-bold">교체 주기</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SegButton active={cycle === "36"} onClick={() => setCycle("36")}>36개월</SegButton>
                  <SegButton active={cycle === "48"} onClick={() => setCycle("48")}>48개월</SegButton>
                </div>
              </div>
            </div>

            <StepNav onBack={() => goTo(2)} onNext={() => goTo(4)} nextLabel="추천 결과 보기 →" />
          </div>
        )}

        {/* STEP 4: 결과 */}
        {step === 4 && (
          <div>
            <p className="text-xs font-extrabold tracking-widest text-brand">RESULT</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">우리 사무실 추천 결과</h2>
            <p className="mt-2 text-sm text-foreground-soft">입력하신 조건을 기준으로 실제 렌탈 상품 중 가장 가까운 구성을 안내해 드립니다.</p>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="relative overflow-hidden rounded-2xl bg-[#0f231d] p-8 text-white">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand/25" />
                <p className="relative text-xs font-extrabold tracking-widest text-brand">MBM RECOMMENDATION</p>

                {device === "mfp" && (
                  <div className="relative">
                    {showEntryA3ColorPair ? (
                      <>
                        <h3 className="mt-3 text-xl font-bold sm:text-2xl">A3 컬러 복합기 추천 모델 2종</h3>
                        <p className="mt-2 text-sm leading-relaxed text-white/70">
                          같은 등급의 A3 컬러 복합기예요. 업종에 따라 더 잘 맞는 모델을 함께 안내해 드려요.
                        </p>
                        <div className="mt-5 space-y-3">
                          {entryA3ColorPair.map(({ product, industryText }) => (
                            <div key={product.id} className="flex items-center gap-4 rounded-xl bg-white/5 p-4">
                              {product.images[0] && (
                                <div className="relative h-20 w-20 shrink-0">
                                  <Image
                                    src={product.images[0]}
                                    alt={joinBrandName(product.brand, product.name)}
                                    fill
                                    className="object-contain"
                                    sizes="80px"
                                  />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold">{joinBrandName(product.brand, product.name)}</p>
                                <p className="mt-1 text-xs font-semibold text-brand-soft">{industryText}</p>
                                {product.priceMonthly && (
                                  <p className="mt-1 text-lg font-bold">
                                    {(product.priceMonthly + (faxOption ? FAX_OPTION_PRICE : 0)).toLocaleString()}원
                                    <span className="text-xs font-normal text-white/70"> 부터 /월 (VAT 별도)</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {[
                            sizeLabel(paperSize),
                            colorLabel(effectiveColor),
                            `흑백 ${bwPages.toLocaleString()}매`,
                            ...(colorType === "color" ? [`컬러 ${colorPages.toLocaleString()}매`] : []),
                            ...(faxOption ? ["팩스 옵션"] : []),
                          ].map((t) => (
                            <span key={t} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{t}</span>
                          ))}
                        </div>
                      </>
                    ) : mfpResult ? (
                      <>
                        <h3 className="mt-3 text-2xl font-bold sm:text-3xl">{joinBrandName(mfpResult.brand, mfpResult.name)}</h3>
                        {printTech === "inkjet" ? (
                          <>
                            <p className="mt-2 text-sm leading-relaxed text-white/70">
                              월 약 {inkjetVolume.toLocaleString()}매 사용 기준으로, 컬러·흑백 구분 없이 한 가지 요금이 적용되는
                              소형 잉크젯 복합기를 추천합니다.
                            </p>
                            <p className="mt-4 text-xl font-bold">
                              {calcInkjetMonthlyPrice(inkjetVolume).toLocaleString()}원
                              <span className="text-sm font-normal text-white/70"> /월 (VAT 별도)</span>
                            </p>
                            <p className="mt-1 text-xs text-white/60">
                              {INKJET_PRICING.tiers
                                .map((t) => `${t.upToPages.toLocaleString()}매 ${t.price.toLocaleString()}원`)
                                .join(" / ")}
                              , 이후 초과분은 매당 {INKJET_PRICING.overagePerPage.toLocaleString()}원 (팩스 기본 포함)
                            </p>
                            <div className="mt-5 flex flex-wrap gap-2">
                              {["A4", "잉크젯", `월 ${inkjetVolume.toLocaleString()}매`, "팩스 기본 포함"].map((t) => (
                                <span key={t} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{t}</span>
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="mt-2 text-sm leading-relaxed text-white/70">
                              월 약 {totalVolume.toLocaleString()}매 사용 기준으로, 출력 안정성과 유지관리 효율을 고려해 이 모델을
                              추천합니다.
                              {scanFreq === "high" && " 스캔이 잦은 환경이라 스캔 속도가 빠른 A3 복합기로 안내해 드려요."}
                            </p>
                            {effectiveColor === "mono" ? (
                              <>
                                <p className="mt-4 text-xl font-bold">
                                  {(monoMfpPrice + (faxOption ? FAX_OPTION_PRICE : 0)).toLocaleString()}원
                                  <span className="text-sm font-normal text-white/70"> /월 (VAT 별도)</span>
                                </p>
                                <p className="mt-1 text-xs text-white/60">
                                  기본 {MFP_PLANS.mono.monoBase.toLocaleString()}매 {MFP_PLANS.mono.basePrice.toLocaleString()}원 +
                                  초과분 장당 {MFP_OVERAGE.mono.stepPrice.toLocaleString()}원
                                  {faxOption && ` + 팩스 옵션 ${FAX_OPTION_PRICE.toLocaleString()}원`}
                                </p>
                              </>
                            ) : (
                              mfpResult.priceMonthly && (
                                <>
                                  <p className="mt-4 text-xl font-bold">
                                    {(mfpResult.priceMonthly + (faxOption ? FAX_OPTION_PRICE : 0)).toLocaleString()}원
                                    <span className="text-sm font-normal text-white/70"> 부터 /월 (VAT 별도)</span>
                                  </p>
                                  {faxOption && (
                                    <p className="mt-1 text-xs text-white/60">
                                      기본 {mfpResult.priceMonthly.toLocaleString()}원 + 팩스 옵션 {FAX_OPTION_PRICE.toLocaleString()}원
                                    </p>
                                  )}
                                </>
                              )
                            )}
                            <div className="mt-5 flex flex-wrap gap-2">
                              {[
                                sizeLabel(paperSize),
                                colorLabel(effectiveColor),
                                `흑백 ${bwPages.toLocaleString()}매`,
                                ...(colorType === "color" ? [`컬러 ${colorPages.toLocaleString()}매`] : []),
                                ...(paperSize === "a4" ? ["팩스 기본 포함"] : faxOption ? ["팩스 옵션"] : []),
                              ].map((t) => (
                                <span key={t} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{t}</span>
                              ))}
                            </div>
                          </>
                        )}
                        {mfpResult.images[0] && (
                          <div className="relative mt-6 h-32 w-32">
                            <Image src={mfpResult.images[0]} alt={joinBrandName(mfpResult.brand, mfpResult.name)} fill className="object-contain" sizes="128px" />
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="mt-4 text-sm text-white/80">조건에 딱 맞는 등록 모델이 아직 없습니다. 상담을 통해 안내해 드릴게요.</p>
                    )}
                  </div>
                )}

                {device === "pc" && (
                  <div className="relative">
                    <h3 className="mt-3 text-2xl font-bold sm:text-3xl">{workOption.label} 맞춤 PC</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">
                      {pcWork === "meeting" || pcWork === "creative"
                        ? "고사양 구성이 필요한 업무로, 실제 보유 사양을 확인 후 맞춤 견적을 안내해 드립니다."
                        : "선택하신 업무 유형에 적합한 사무용 PC를 추천합니다."}
                    </p>
                    {pcResult?.priceMonthly && (
                      <p className="mt-4 text-xl font-bold">
                        대당 {pcResult.priceMonthly.toLocaleString()}원<span className="text-sm font-normal text-white/70"> /월 (VAT 별도)</span>
                      </p>
                    )}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {[workOption.label, `모니터 ${monitorLabel(monitor)}`, `${pcQty}대`, `${cycle}개월`].map((t) => (
                        <span key={t} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border p-6">
                <p className="text-sm font-bold">입력 조건</p>
                <div className="mt-3 divide-y divide-border/70 text-sm">
                  {device === "mfp" ? (
                    printTech === "inkjet" ? (
                      <>
                        <Row label="장비" value="복합기·프린터" />
                        <Row label="인쇄 방식" value="잉크젯" />
                        <Row label="월 출력량" value={`${inkjetVolume.toLocaleString()}매`} />
                        <Row label="팩스 옵션" value="기본 포함 (별도 옵션 없음)" />
                      </>
                    ) : (
                      <>
                        <Row label="장비" value="복합기·프린터" />
                        <Row label="인쇄 방식" value="레이저젯" />
                        <Row label="용지" value={sizeLabel(paperSize)} />
                        <Row label="출력 유형" value={colorLabel(effectiveColor)} />
                        <Row label="스캔 빈도" value={scanFreq === "high" ? "많음" : "적음"} />
                        <Row label="월 흑백" value={`${bwPages.toLocaleString()}매`} />
                        {colorType === "color" && <Row label="월 컬러" value={`${colorPages.toLocaleString()}매`} />}
                        <Row
                          label="팩스 옵션"
                          value={
                            paperSize === "a4"
                              ? "기본 포함 (별도 옵션 없음)"
                              : faxOption
                                ? `추가 (+${FAX_OPTION_PRICE.toLocaleString()}원)`
                                : "필요없음"
                          }
                        />
                      </>
                    )
                  ) : (
                    <>
                      <Row label="장비" value="PC·노트북" />
                      <Row label="주요 업무" value={workOption.label} />
                      <Row label="모니터 구성" value={monitorLabel(monitor)} />
                      <Row label="수량" value={`${pcQty}대`} />
                      <Row label="교체 주기" value={`${cycle}개월`} />
                    </>
                  )}
                </div>
                <p className="mt-4 rounded-xl bg-surface p-3 text-xs leading-relaxed text-foreground-soft">
                  실제 최종 견적은 설치환경·약정조건에 따라 달라질 수 있어, 정확한 견적은 상담을 통해 확인해 주세요.
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setDevice(null);
                    }}
                    className="flex-1 rounded-xl border border-border py-3 text-sm font-bold transition active:scale-95 hover:bg-surface"
                  >
                    다시 선택
                  </button>
                  <a
                    href={siteConfig.phoneHref}
                    className="flex-1 rounded-xl bg-brand py-3 text-center text-sm font-bold text-white transition active:scale-95 hover:opacity-90"
                  >
                    전화 상담
                  </a>
                </div>
                <Link
                  href="/contact"
                  className="mt-2 block rounded-xl bg-[#12241c] py-3 text-center text-sm font-bold text-white transition active:scale-[0.98] hover:opacity-90"
                >
                  이 조건으로 견적문의 보내기
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepNav({ onBack, onNext, nextLabel = "다음 단계 →" }: { onBack: () => void; onNext: () => void; nextLabel?: string }) {
  return (
    <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
      <button
        type="button"
        onClick={onBack}
        className="rounded-xl bg-surface px-5 py-3 text-sm font-bold text-foreground-soft transition active:scale-95 hover:text-foreground"
      >
        ← 이전
      </button>
      <button
        type="button"
        onClick={onNext}
        className="rounded-xl bg-brand px-6 py-3 text-sm font-extrabold text-white transition active:scale-95 hover:opacity-90"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-foreground-soft">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function sizeLabel(s: PaperSize) {
  return s === "a3" ? "A3" : "A4";
}
function colorLabel(c: ColorType) {
  return c === "color" ? "컬러" : "흑백";
}
function monitorLabel(m: Monitor) {
  return m === "0" ? "필요없음" : `${m}대`;
}
