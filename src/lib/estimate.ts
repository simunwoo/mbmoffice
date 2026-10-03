import type { Product, ProductCategory } from "./data/types";

export type EstimateCategory = "mfp" | "printer" | "pc" | "notebook" | "shredder";

export const estimateCategories: { slug: EstimateCategory; label: string; productCategory: ProductCategory }[] = [
  { slug: "mfp", label: "복합기", productCategory: "mfp" },
  { slug: "printer", label: "프린터", productCategory: "printer" },
  { slug: "pc", label: "컴퓨터", productCategory: "pc" },
  { slug: "notebook", label: "노트북", productCategory: "notebook" },
  { slug: "shredder", label: "문서세단기", productCategory: "shredder" },
];

export interface MfpVolumeInput {
  monoVolume: number;
  colorVolume: number;
}

export interface MfpMatchInput extends MfpVolumeInput {
  size: "a3" | "a4";
}

export type MfpPlanKey = "color" | "mono";

/**
 * 복합기 렌탈 요금제 (2026-09-25 대표님 지정 기준). 두 가지 요금제 중 선택합니다.
 * - 컬러 요금제: 기본료 70,000원에 흑백 월 2,000매 + 컬러 월 200매 포함.
 * - 흑백 요금제: 기본료 60,000원에 흑백 월 3,000매 포함 (컬러 기본 제공 없음, 컬러 사용 시 처음부터 초과 요금 적용).
 * 초과 요금: 흑백은 장당 8원, 컬러는 장당 80원(100매당 8,000원) 추가.
 * 모든 금액은 부가세(VAT) 별도입니다.
 */
export const MFP_PLANS: Record<MfpPlanKey, { label: string; basePrice: number; monoBase: number; colorBase: number }> = {
  color: { label: "컬러 요금제", basePrice: 70000, monoBase: 2000, colorBase: 200 },
  mono: { label: "흑백 요금제", basePrice: 60000, monoBase: 3000, colorBase: 0 },
};

export const MFP_OVERAGE = {
  mono: { stepPages: 1, stepPrice: 8 },
  color: { stepPages: 100, stepPrice: 8000 },
} as const;

/**
 * 잉크젯 복합기(예: MAXIFY GX7190) 요금제. 컬러/흑백 구분 없이 월 총 출력량 기준 단일 요금입니다.
 * 1,000매까지 30,000원 / 2,000매까지 35,000원 / 3,000매까지 40,000원 구간별 고정 요금이며,
 * 3,000매를 넘는 초과분부터는 매당 15원씩 추가됩니다 (부가세 별도).
 */
export const INKJET_PRICING = {
  tiers: [
    { upToPages: 1000, price: 30000 },
    { upToPages: 2000, price: 35000 },
    { upToPages: 3000, price: 40000 },
  ],
  overagePerPage: 15,
} as const;

export function calcInkjetMonthlyPrice(totalVolume: number): number {
  const lastTier = INKJET_PRICING.tiers[INKJET_PRICING.tiers.length - 1];
  const tier = INKJET_PRICING.tiers.find((t) => totalVolume <= t.upToPages);
  if (tier) return tier.price;
  const overage = totalVolume - lastTier.upToPages;
  return lastTier.price + overage * INKJET_PRICING.overagePerPage;
}

export function calcMfpMonthlyPrice(plan: MfpPlanKey, { monoVolume, colorVolume }: MfpVolumeInput): number {
  const p = MFP_PLANS[plan];
  const monoOverage = Math.max(0, monoVolume - p.monoBase);
  const monoSteps = Math.ceil(monoOverage / MFP_OVERAGE.mono.stepPages);
  const colorOverage = Math.max(0, colorVolume - p.colorBase);
  const colorSteps = Math.ceil(colorOverage / MFP_OVERAGE.color.stepPages);
  return p.basePrice + monoSteps * MFP_OVERAGE.mono.stepPrice + colorSteps * MFP_OVERAGE.color.stepPrice;
}

export function isWithinBaseBundle(plan: MfpPlanKey, { monoVolume, colorVolume }: MfpVolumeInput): boolean {
  const p = MFP_PLANS[plan];
  return monoVolume <= p.monoBase && colorVolume <= p.colorBase;
}

/** 기본료 구간에서 가장 저렴한 추천 기종 2종을 실제 카탈로그에서 찾습니다. */
const ENTRY_MODEL_QUERIES = ["C2561", "C3922"];

export function getEntryModels(products: Product[]): Product[] {
  return ENTRY_MODEL_QUERIES.map((query) => products.find((p) => p.name.includes(query))).filter(
    (p): p is Product => p !== undefined
  );
}

export interface MatchedProduct {
  product: Product;
  /** 입력한 월 출력량과 이 모델 권장 구간의 거리 — 0에 가까울수록 딱 맞는 매칭 */
  fitScore: number;
  fitLabel: "적정" | "여유 있음" | "다소 부족할 수 있음";
}

/**
 * 복합기/프린터: 규격·월 출력량 조건에 맞는 실제 모델을 근접도 순으로 추천합니다.
 * 컬러 겸용 모델은 컬러 매수, 흑백 전용 모델은 흑백 매수를 기준으로 적합도를 판단합니다.
 */
export function matchMfpOrPrinter(
  products: Product[],
  category: "mfp" | "printer",
  input: MfpMatchInput
): MatchedProduct[] {
  const candidates = products.filter((p) => p.category === category && p.size === input.size);

  const scored = candidates.map((product) => {
    const relevantVolume = product.color === "mono" ? input.monoVolume : input.colorVolume;
    const min = product.volumeMin ?? 0;
    const max = product.volumeMax ?? Infinity;
    let fitScore: number;
    let fitLabel: MatchedProduct["fitLabel"];
    if (relevantVolume < min) {
      fitScore = min - relevantVolume;
      fitLabel = "여유 있음";
    } else if (relevantVolume > max) {
      fitScore = relevantVolume - max;
      fitLabel = "다소 부족할 수 있음";
    } else {
      fitScore = 0;
      fitLabel = "적정";
    }
    return { product, fitScore, fitLabel };
  });

  scored.sort((a, b) => a.fitScore - b.fitScore);
  return scored.slice(0, 3);
}

export function matchByCategory(products: Product[], category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category);
}
