"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { joinBrandName, type Product } from "@/lib/data/types";
import {
  calcMfpMonthlyPrice,
  estimateCategories,
  getEntryModels,
  isWithinBaseBundle,
  matchByCategory,
  matchMfpOrPrinter,
  MFP_OVERAGE,
  MFP_PLANS,
  type EstimateCategory,
  type MfpPlanKey,
} from "@/lib/estimate";
import { siteConfig, sizeLabels } from "@/lib/site-config";

const MONO_PRESETS = [1000, 2000, 3000, 5000, 8000];
const COLOR_PRESETS = [100, 200, 500, 1000, 2000];

function formatWon(n: number) {
  return `${n.toLocaleString()}원`;
}

function StepHeader({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
        {step}
      </span>
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {hint && <p className="mt-0.5 text-sm text-foreground-soft">{hint}</p>}
      </div>
    </div>
  );
}

function VolumeField({
  label,
  hint,
  value,
  onChange,
  presets,
  unit = "매",
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  presets: number[];
  unit?: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-foreground-soft">{hint}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {presets.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              value === v ? "border-brand bg-brand-soft text-brand-ink" : "border-border text-foreground-soft"
            }`}
          >
            {v.toLocaleString()}{unit}
          </button>
        ))}
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-28 rounded-full border border-border px-3.5 py-1.5 text-sm"
          aria-label={`${label} 직접 입력`}
        />
      </div>
    </div>
  );
}

export function EstimatorForm({ products }: { products: Product[] }) {
  const [category, setCategory] = useState<EstimateCategory>("mfp");
  const [size, setSize] = useState<"a3" | "a4">("a3");
  const [plan, setPlan] = useState<MfpPlanKey>("color");
  const [monoVolume, setMonoVolume] = useState(2000);
  const [colorVolume, setColorVolume] = useState(200);
  const [quantity, setQuantity] = useState(1);

  const isPrintDevice = category === "mfp" || category === "printer";

  const mfpMatches = useMemo(() => {
    if (!isPrintDevice) return [];
    return matchMfpOrPrinter(products, category, { size, monoVolume, colorVolume });
  }, [products, category, isPrintDevice, size, monoVolume, colorVolume]);

  const mfpPrice = useMemo(() => calcMfpMonthlyPrice(plan, { monoVolume, colorVolume }), [plan, monoVolume, colorVolume]);
  const entryTier = isWithinBaseBundle(plan, { monoVolume, colorVolume });
  const entryModels = useMemo(() => getEntryModels(products), [products]);

  const activePlan = MFP_PLANS[plan];
  const monoOverage = Math.max(0, monoVolume - activePlan.monoBase);
  const monoSteps = Math.ceil(monoOverage / MFP_OVERAGE.mono.stepPages);
  const colorOverage = Math.max(0, colorVolume - activePlan.colorBase);
  const colorSteps = Math.ceil(colorOverage / MFP_OVERAGE.color.stepPages);

  const bestMatch = mfpMatches[0];
  const recommendedLabel = entryTier
    ? entryModels.map((m) => joinBrandName(m.brand, m.name)).join(", ")
    : bestMatch
      ? joinBrandName(bestMatch.product.brand, bestMatch.product.name)
      : "상담을 통해 안내";

  const pcMatches = useMemo(() => {
    if (category !== "pc" && category !== "notebook") return [];
    return matchByCategory(products, category);
  }, [products, category]);

  const shredderMatches = useMemo(() => {
    if (category !== "shredder") return [];
    return matchByCategory(products, "shredder");
  }, [products, category]);

  return (
    <div>
      <StepHeader step={1} title="품목 선택" />
      <div className="mt-4 flex flex-wrap gap-2 pl-10">
        {estimateCategories.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => setCategory(c.slug)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
              category === c.slug ? "bg-brand text-white" : "bg-surface text-foreground-soft hover:text-brand-ink"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="my-8 ml-3.5 h-8 w-px bg-border" />

      <StepHeader
        step={2}
        title="사용 조건 입력"
        hint={isPrintDevice ? "흑백·컬러 매수를 함께 입력하면 두 매수를 모두 반영한 정확한 견적이 나옵니다." : undefined}
      />

      <div className="mt-4 ml-10 rounded-2xl border border-border p-6 sm:p-8">
        {isPrintDevice && (
          <div className="grid gap-6">
            <div>
              <p className="text-sm font-semibold">규격 (참고 모델 필터)</p>
              <div className="mt-2 flex gap-2">
                {Object.entries(sizeLabels).map(([slug, label]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setSize(slug as "a3" | "a4")}
                    className={`rounded-full border px-4 py-2 text-sm font-medium ${
                      size === slug ? "border-brand bg-brand-soft text-brand-ink" : "border-border text-foreground-soft"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold">요금제</p>
              <div className="mt-2 flex gap-2">
                {(Object.keys(MFP_PLANS) as MfpPlanKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPlan(key)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium ${
                      plan === key ? "border-brand bg-brand-soft text-brand-ink" : "border-border text-foreground-soft"
                    }`}
                  >
                    {MFP_PLANS[key].label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-foreground-soft">
                {activePlan.label}: 월 {formatWon(activePlan.basePrice)}에 흑백 {activePlan.monoBase.toLocaleString()}매
                {activePlan.colorBase > 0 ? ` + 컬러 ${activePlan.colorBase.toLocaleString()}매` : " (컬러 기본 제공 없음)"} 포함
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <VolumeField
                label="흑백 예상 출력량"
                hint={`기본료에 월 ${activePlan.monoBase.toLocaleString()}매까지 포함`}
                value={monoVolume}
                onChange={setMonoVolume}
                presets={MONO_PRESETS}
              />
              <VolumeField
                label="컬러 예상 출력량"
                hint={
                  activePlan.colorBase > 0
                    ? `기본료에 월 ${activePlan.colorBase.toLocaleString()}매까지 포함`
                    : "이 요금제는 컬러 기본 제공이 없어 사용한 만큼 전부 추가됩니다"
                }
                value={colorVolume}
                onChange={setColorVolume}
                presets={COLOR_PRESETS}
              />
            </div>
          </div>
        )}

        {(category === "pc" || category === "notebook") && (
          <div>
            <p className="text-sm font-semibold">필요 대수</p>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
              className="mt-2 w-32 rounded-full border border-border px-4 py-2 text-sm"
            />
          </div>
        )}

        {category === "shredder" && (
          <p className="text-sm text-foreground-soft">
            사무실 규모와 세단 용량에 따라 맞는 모델이 달라집니다. 아래 모델 중 참고하시고, 정확한 추천은 상담을 통해 안내해 드립니다.
          </p>
        )}
      </div>

      <div className="my-8 ml-3.5 h-8 w-px bg-border" />

      <StepHeader step={3} title="예상 견적" />

      <div className="mt-4 ml-10">
        <p className="text-sm text-foreground-soft">
          표시된 모든 금액은 부가세(VAT) 별도이며, 실제 렌탈료는 설치환경·약정조건에 따라 달라질 수 있어 정확한
          견적은 상담을 통해 확인해 주세요.
        </p>

        {isPrintDevice && (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border-2 border-brand bg-brand-soft p-6 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-ink">예상 월 렌탈료</p>
                <p className="mt-2 text-3xl font-bold text-brand-ink">{formatWon(mfpPrice)}</p>
                <p className="mt-1 text-sm text-foreground-soft">/월 (VAT 별도)</p>
              </div>

              <div className="rounded-2xl border border-border p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-soft">추천 기종</p>
                <p className="mt-2 text-sm font-bold leading-snug">{recommendedLabel}</p>
                {entryTier && <p className="mt-1 text-xs text-foreground-soft">현재 조건은 기본료만으로 이용 가능한 구간입니다</p>}
              </div>

              <div className="rounded-2xl border border-border p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-soft">계산 기준</p>
                <ul className="mt-2 space-y-1 text-sm text-foreground-soft">
                  <li>{activePlan.label} 기본료 {formatWon(activePlan.basePrice)}</li>
                  <li>흑백 초과 {monoSteps}단계 × {formatWon(MFP_OVERAGE.mono.stepPrice)}</li>
                  <li>컬러 초과 {colorSteps}단계 × {formatWon(MFP_OVERAGE.color.stepPrice)}</li>
                </ul>
              </div>
            </div>

            <p className="mt-8 text-sm font-semibold">이 조건에 맞는 실제 모델</p>
            <ResultList
              items={mfpMatches.map((m) => ({
                key: m.product.id,
                title: joinBrandName(m.product.brand, m.product.name),
                badge: m.fitLabel,
                price: m.product.priceMonthly,
                showFrom: true,
                term: m.product.termMonths,
                href:
                  m.product.size && m.product.color
                    ? `/rental/${m.product.size}/${m.product.color}/${m.product.id}`
                    : undefined,
              }))}
              emptyMessage="조건에 맞는 등록 모델이 아직 없습니다. 전화 상담으로 추천해 드립니다."
            />
          </>
        )}

        {(category === "pc" || category === "notebook") && (
          <ResultList
            items={pcMatches.map((p) => ({
              key: p.id,
              title: joinBrandName(p.brand, p.name),
              price: p.priceMonthly ? p.priceMonthly * quantity : null,
              priceNote: p.priceMonthly ? `대당 ${formatWon(p.priceMonthly)} × ${quantity}대` : undefined,
              purchasePrice: p.purchasePrice ? p.purchasePrice * quantity : null,
              term: p.termMonths,
            }))}
            emptyMessage="전화 상담으로 업무 환경에 맞는 사양을 추천해 드립니다."
          />
        )}

        {category === "shredder" && (
          <ResultList
            items={shredderMatches.map((p) => ({
              key: p.id,
              title: joinBrandName(p.brand, p.name),
              price: p.priceMonthly,
              purchasePrice: p.purchasePrice,
              term: p.termMonths,
              note: p.specs?.join(" · "),
            }))}
            emptyMessage="전화 상담으로 사무실 규모에 맞는 모델을 추천해 드립니다."
          />
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <a href={siteConfig.phoneHref} className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:opacity-90">
          이 조건으로 정확한 견적 상담하기
        </a>
        <Link href="/contact" className="rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-surface">
          문의 남기기
        </Link>
      </div>
    </div>
  );
}

interface ResultItem {
  key: string;
  title: string;
  badge?: string;
  price?: number | null;
  /** 복합기·프린터처럼 사용량에 따라 요금이 올라가는 상품만 "~원부터"로 표시합니다. */
  showFrom?: boolean;
  priceNote?: string;
  purchasePrice?: number | null;
  term?: number | null;
  note?: string;
  href?: string;
}

function ResultList({ items, emptyMessage }: { items: ResultItem[]; emptyMessage: string }) {
  if (items.length === 0) {
    return <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-sm text-foreground-soft">{emptyMessage}</p>;
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <ResultCard key={item.key} item={item} />
      ))}
    </div>
  );
}

function ResultCard({ item }: { item: ResultItem }) {
  const body = (
    <>
      {item.badge && (
        <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-ink">
          {item.badge}
        </span>
      )}
      <p className="mt-2 font-bold">{item.title}</p>
      {item.note && <p className="mt-1 text-xs text-foreground-soft">{item.note}</p>}
      {item.price ? (
        <p className="mt-3 text-lg font-bold text-brand-ink">
          {formatWon(item.price)}
          <span className="text-sm font-normal text-foreground-soft">{item.showFrom ? " 부터" : ""} /월 (VAT 별도)</span>
        </p>
      ) : item.purchasePrice ? (
        <p className="mt-3 text-lg font-bold text-brand-ink">
          {formatWon(item.purchasePrice)}
          <span className="text-sm font-normal text-foreground-soft"> (구매가, VAT 별도)</span>
        </p>
      ) : (
        <p className="mt-3 text-sm font-semibold text-foreground-soft">가격 문의</p>
      )}
      {item.priceNote && <p className="mt-1 text-xs text-foreground-soft">{item.priceNote}</p>}
      {item.term && <p className="mt-1 text-xs text-foreground-soft">{item.term}개월 약정 기준</p>}
    </>
  );

  if (item.href) {
    return (
      <Link href={item.href} className="rounded-xl border border-border p-5 hover:border-brand hover:shadow-sm">
        {body}
      </Link>
    );
  }

  return <div className="rounded-xl border border-border p-5">{body}</div>;
}
