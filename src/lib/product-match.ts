import type { Product, ProductCategory } from "./data/types";
import { shopCategories } from "./site-config";

const MATCHABLE_CATEGORIES = new Set<ProductCategory>(["mfp", "printer", "pc", "notebook", "shredder"]);

function normalizeModelKey(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/**
 * 설치사례에 기록된 브랜드·모델명으로 실제 판매중인 카탈로그 상품을 찾습니다. 소모품/부품은 제외하고,
 * 렌탈 상품과 가격 정보가 있는 상품을 우선합니다. 카탈로그에 없는 모델(단종 등)은 null을 반환합니다.
 */
export function findProductForInstall(products: Product[], model: string | null): Product | null {
  if (!model) return null;
  const key = normalizeModelKey(model);
  if (!key) return null;

  const candidates = products.filter((p) => MATCHABLE_CATEGORIES.has(p.category) && normalizeModelKey(p.name).includes(key));
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const rentalScore = (p: Product) => (p.pricingType === "rental" ? 0 : 1);
    const priceScore = (p: Product) => (p.priceMonthly || p.purchasePrice ? 0 : 1);
    return rentalScore(a) - rentalScore(b) || priceScore(a) - priceScore(b);
  });
  return candidates[0];
}

/** 상품 상세/카테고리 페이지 링크를 상품 종류에 맞게 만들어줍니다. */
export function productHref(p: Product): string {
  if ((p.category === "mfp" || p.category === "printer") && p.size && p.color && p.pricingType === "rental") {
    return `/rental/${p.size}/${p.color}/${p.id}`;
  }
  if (p.pricingType === "purchase") {
    const entry = shopCategories.find((c) => c.categories.includes(p.category));
    if (entry) return `/shop/${entry.slug}/${p.id}`;
  }
  if (p.category === "pc" || p.category === "notebook") return "/pc-rental";
  if (p.category === "shredder") return "/shredder";
  return "/rental";
}
