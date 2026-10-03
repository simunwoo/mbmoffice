import type { Product } from "@/lib/data/types";
import { INKJET_PRICING } from "@/lib/estimate";

// 요금제 등급 공통 이름·색상 (레이저·잉크젯 모두 동일하게 씁니다).
export const TIER_META = [
  { key: "starter", label: "Starter", accent: "#f5a623" },
  { key: "professional", label: "Professional", accent: "#01a081" },
  { key: "enterprise", label: "Enterprise", accent: "#5b5fc7" },
] as const;

// MBM 요금제 정책 (공통사항: 36개월 약정 · 보증금 없음 · 초과요금 흑백10원/컬러100원(A4)/A3컬러200원).
// 기준 가격(75,000/95,000/155,000원)은 공식 요금제 페이지 기준이며, 실제 모델별로는 그 모델의
// 카탈로그 가격(priceMonthly)을 Starter 기준으로, 두 번째 등록 가격(listPrice)이 있으면 Enterprise로
// 사용하고 그 사이를 Professional로 비례 계산합니다.
export const PLAN_TIERS = [
  {
    ...TIER_META[0],
    basePrice: 75000,
    options: [
      { mono: 3000, color: 100 },
      { mono: 2000, color: 200 },
      { mono: 1000, color: 300 },
    ],
  },
  {
    ...TIER_META[1],
    basePrice: 95000,
    options: [
      { mono: 3000, color: 300 },
      { mono: 2000, color: 400 },
      { mono: 1000, color: 500 },
    ],
  },
  {
    ...TIER_META[2],
    basePrice: 155000,
    options: [
      { mono: 7000, color: 800 },
      { mono: 5000, color: 1000 },
      { mono: 3000, color: 1200 },
    ],
  },
] as const;

// 흑백(mono) 전용 레이저 복합기 요금제 (MBM 요금제 공식 안내 기준: Starter 60,000원/3,000매,
// Professional 70,000원/4,000매, Enterprise 80,000원/7,000매). 컬러 옵션이 없어 등급당 매수 1개뿐입니다.
export const MONO_PLAN_TIERS = [
  { ...TIER_META[0], basePrice: 60000, monoPages: 3000 },
  { ...TIER_META[1], basePrice: 70000, monoPages: 4000 },
  { ...TIER_META[2], basePrice: 80000, monoPages: 7000 },
] as const;

function scaleByAnchor<T extends { basePrice: number }>(product: Product, tiers: readonly T[]): (T & { price: number })[] {
  const starterPrice = product.priceMonthly ?? tiers[0].basePrice;
  const enterprisePrice =
    product.listPrice && product.listPrice > starterPrice
      ? product.listPrice
      : Math.round((starterPrice * (tiers[2].basePrice / tiers[0].basePrice)) / 1000) * 1000;
  const professionalPrice = Math.round((starterPrice + enterprisePrice) / 2 / 1000) * 1000;
  const prices = [starterPrice, professionalPrice, enterprisePrice];
  return tiers.map((t, i) => ({ ...t, price: prices[i] }));
}

// 특정 모델의 실제 공식 요금표(가격 + 등급별 흑백/컬러 매수 조합)입니다. 모델명에 이 키가 포함되면
// 아래 비례 계산(scaleByAnchor) 대신 이 값을 그대로 씁니다 — 회사에서 정확한 요금표를 받은 모델만
// 여기 추가하고, 나머지 모델은 지금처럼 등록 가격 기준 비례 계산을 그대로 사용합니다.
const COLOR_TIER_OVERRIDES: Record<string, { price: number; options: { mono: number; color: number }[] }[]> = {
  C3067: [
    {
      price: 140000,
      options: [
        { mono: 3000, color: 500 },
        { mono: 4000, color: 400 },
        { mono: 5000, color: 300 },
      ],
    },
    {
      price: 160000,
      options: [
        { mono: 5000, color: 500 },
        { mono: 8000, color: 200 },
        { mono: 2000, color: 800 },
      ],
    },
    {
      price: 230000,
      options: [
        { mono: 8000, color: 1000 },
        { mono: 10000, color: 800 },
        { mono: 3000, color: 1500 },
      ],
    },
  ],
  // C3567은 C3067과 매수 조합은 동일하고 등급별 가격만 5,000원씩 높습니다 (회사 확인 사항).
  C3567: [
    { price: 145000, options: [{ mono: 3000, color: 500 }, { mono: 4000, color: 400 }, { mono: 5000, color: 300 }] },
    { price: 165000, options: [{ mono: 5000, color: 500 }, { mono: 8000, color: 200 }, { mono: 2000, color: 800 }] },
    { price: 235000, options: [{ mono: 8000, color: 1000 }, { mono: 10000, color: 800 }, { mono: 3000, color: 1500 }] },
  ],
};

export function getScaledColorTiers(product: Product) {
  const overrideKey = Object.keys(COLOR_TIER_OVERRIDES).find((k) => product.name.includes(k));
  if (overrideKey) {
    const override = COLOR_TIER_OVERRIDES[overrideKey];
    return TIER_META.map((t, i) => ({ ...t, price: override[i].price, options: override[i].options }));
  }
  return scaleByAnchor(product, PLAN_TIERS);
}

export function getScaledMonoTiers(product: Product) {
  return scaleByAnchor(product, MONO_PLAN_TIERS);
}

export function getInkjetTiers() {
  return INKJET_PRICING.tiers.map((t, i) => ({ ...TIER_META[i], price: t.price, pages: t.upToPages }));
}

export type ProductTierPricing =
  | { type: "color"; tiers: ReturnType<typeof getScaledColorTiers> }
  | { type: "mono"; tiers: ReturnType<typeof getScaledMonoTiers> }
  | { type: "inkjet"; tiers: ReturnType<typeof getInkjetTiers> }
  | { type: "none" };

/** 이 상품이 MBM 3단계 요금제(Starter/Professional/Enterprise) 대상인지, 대상이면 그 등급별 가격을 반환합니다. */
export function getProductTierPricing(product: Product): ProductTierPricing {
  const isLaser = (product.category === "mfp" || product.category === "printer") && product.printTech === "laser";
  const isInkjet = product.printTech === "inkjet";

  if (isLaser && product.color === "color") return { type: "color", tiers: getScaledColorTiers(product) };
  if (isLaser && product.color === "mono") return { type: "mono", tiers: getScaledMonoTiers(product) };
  if (isInkjet) return { type: "inkjet", tiers: getInkjetTiers() };
  return { type: "none" };
}
