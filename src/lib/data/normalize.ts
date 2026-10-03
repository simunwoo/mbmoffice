import { industryCopy, regionCopy } from "../site-config";
import type { InstallCase, Product, ProductCategory } from "./types";

/**
 * data/raw/products.json, installs.json은 크롤링 에이전트가 mbmoffice.co.kr에서 실측한 원본 형태이고,
 * 이 앱의 Product/InstallCase 타입과는 필드 형태가 다릅니다 (예: color가 "컬러"/"흑백" 한글 문자열,
 * priceOrTerm이 "70,000원 / 100,000원 / 3년 약정" 같은 한 줄 문자열). 여기서 실제 앱이 쓰는 구조로 변환합니다.
 */

// 회사 리브랜딩(후지제록스→후지필름) 등으로 크롤링 데이터에 브랜드 표기가 섞여 있어 표준화합니다.
const BRAND_ALIASES: Record<string, string> = {
  후지제록스: "후지필름",
  후지필름: "후지필름",
  캐논: "캐논",
  교세라: "교세라",
  삼성: "삼성",
  세돌이: "세돌이",
};

function parseMoneyNumbers(text: string): number[] {
  const matches = text.matchAll(/([\d,]+)\s*원/g);
  return [...matches].map((m) => Number(m[1].replace(/,/g, ""))).filter((n) => Number.isFinite(n) && n > 0);
}

function parseTermMonths(text: string): number | null {
  const monthsMatch = text.match(/(\d+)\s*개월/);
  if (monthsMatch) return Number(monthsMatch[1]);
  const yearsMatch = text.match(/(\d+)\s*년/);
  if (yearsMatch) return Number(yearsMatch[1]) * 12;
  return null;
}

function inferProductCategory(rawCategory: string, name: string): ProductCategory | null {
  if (rawCategory === "IT유지보수 서비스") return "maintenance";
  if (rawCategory === "문서세단기") return "shredder";
  if (rawCategory === "PC" || rawCategory === "PC 조립PC") return "pc";
  if (rawCategory === "NAS" || rawCategory.startsWith("나스")) return "nas";
  if (rawCategory.startsWith("복합기 소모품")) return "supplies";
  if (rawCategory === "부품") return "parts";
  if (rawCategory.startsWith("복합기, 프린터")) {
    const isPrinterOnly = name.includes("프린터") && !name.includes("복합기");
    return isPrinterOnly ? "printer" : "mfp";
  }
  return null;
}

function inferSize(rawSize: string | null, name: string, specsText: string, category: ProductCategory): "a3" | "a4" | null {
  // 상품명에 규격이 명시된 경우가 가장 신뢰도 높은 값입니다 (크롤링된 size 필드가 인접 상품 값과
  // 뒤섞여 틀린 사례가 실제로 있었습니다 — 예: 이름은 "A4"인데 size 필드는 "A3"로 잘못 채워진 상품).
  // "MA3500"처럼 모델명 안에 우연히 A3/A4가 섞여있는 경우를 걸러내기 위해 단어 경계를 확인합니다.
  if (/(?<![A-Za-z0-9])A3(?![A-Za-z0-9])/i.test(name)) return "a3";
  if (/(?<![A-Za-z0-9])A4(?![A-Za-z0-9])/i.test(name)) return "a4";
  // 이름에 규격이 없으면 스펙 텍스트(예: "A4 컬러 잉크젯 복합기")를 확인합니다. GX7190처럼 이름에
  // 규격 표기가 없는 소형 잉크젯 복합기가 카테고리 기본값(A3)으로 잘못 분류되던 문제를 막기 위함입니다.
  if (/(?<![A-Za-z0-9])A3(?![A-Za-z0-9])/i.test(specsText)) return "a3";
  if (/(?<![A-Za-z0-9])A4(?![A-Za-z0-9])/i.test(specsText)) return "a4";
  if (rawSize === "A3") return "a3";
  if (rawSize === "A4") return "a4";
  if (category === "mfp") return "a3"; // 이 카탈로그의 복합기는 사실상 전부 A3급 사무용 모델
  if (category === "printer") return "a4"; // 프린터로 분류된 항목은 소형 A4 데스크탑 기종
  return null;
}

const BRAND_NAME_HINTS: [RegExp, string][] = [
  [/캐논|canon/i, "캐논"],
  [/후지필름|후지제록스|fujifilm|fuji\s*xerox|apeos/i, "후지필름"],
  [/교세라|kyocera/i, "교세라"],
  [/신도리코|sindoh/i, "신도리코"],
  [/삼성|samsung/i, "삼성"],
  [/세돌이/i, "세돌이"],
];

/** 상품명에 브랜드가 명시적으로 등장하면 그 값을 우선합니다 (크롤링된 brand 필드가 다른 상품 값과 뒤섞인 사례가 있었습니다). */
function inferBrand(rawBrand: string | null, name: string): string {
  for (const [pattern, brand] of BRAND_NAME_HINTS) {
    if (pattern.test(name)) return brand;
  }
  return (rawBrand && BRAND_ALIASES[rawBrand]) || rawBrand || "엠비엠";
}

function inferPrintTech(name: string, specsText: string, category: ProductCategory): "laser" | "inkjet" | null {
  if (category !== "mfp" && category !== "printer") return null;
  if (/잉크젯/i.test(name) || /잉크젯/i.test(specsText)) return "inkjet";
  return "laser"; // 이 카탈로그의 복합기·프린터는 잉크젯으로 명시된 것 외에는 전부 레이저젯 기종
}

function inferColor(rawColor: string | null): "color" | "mono" | null {
  if (rawColor === "컬러") return "color";
  if (rawColor === "흑백") return "mono";
  return null;
}

/**
 * 월 권장 출력량 구간(volumeMin/Max)은 사이트에 공개되어 있지 않아, 스펙에 적힌 분당 출력 속도(ppm)로
 * 업계 통상 듀티사이클 추정치를 적용한 잠정값입니다. 실제 스펙시트의 "권장 월 인쇄량"이 확보되면 교체하세요.
 */
function inferVolumeBand(specs: string): { volumeMin: number | null; volumeMax: number | null } {
  const match = specs.match(/분당\s*(\d+)\s*매/);
  if (!match) return { volumeMin: null, volumeMax: null };
  const ppm = Number(match[1]);
  return { volumeMin: ppm * 40, volumeMax: ppm * 160 };
}

interface RawProduct {
  id: string;
  name: string;
  brand: string | null;
  listingType: string;
  category: string;
  categoryPath?: string;
  size: string | null;
  color: string | null;
  specs: string | null;
  priceOrTerm: string | null;
  images: string[];
  sourceUrl: string;
}

export function normalizeProduct(raw: RawProduct): Product | null {
  const category = inferProductCategory(raw.category, raw.name);
  if (!category) return null;

  const specsText = raw.specs ?? "";
  const size = inferSize(raw.size, raw.name, specsText, category);
  const color = inferColor(raw.color);
  const printTech = inferPrintTech(raw.name, specsText, category);
  const specs = specsText
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  const priceText = raw.priceOrTerm ?? "";
  const nums = parseMoneyNumbers(priceText);
  const termMonths = parseTermMonths(priceText);
  const pricingType: Product["pricingType"] = raw.listingType === "구매 상품" ? "purchase" : "rental";

  const brand = inferBrand(raw.brand, raw.name);

  const base: Product = {
    id: raw.id,
    name: raw.name,
    brand,
    category,
    size,
    color,
    printTech,
    specs,
    images: raw.images,
    sourceUrl: raw.sourceUrl,
    pricingType,
    priceNote: priceText || null,
    termMonths,
    priceMonthly: null,
    listPrice: null,
    purchasePrice: null,
    volumeMin: null,
    volumeMax: null,
    status: "selling",
    stock: null,
    descriptionHtml: null,
  };

  if (pricingType === "purchase") {
    base.purchasePrice = nums[0] ?? null;
    base.listPrice = nums[1] && nums[1] !== nums[0] ? nums[1] : null;
  } else {
    base.priceMonthly = nums[0] ?? null;
    base.listPrice = nums[1] && nums[1] !== nums[0] ? nums[1] : null;
  }

  if (category === "mfp" || category === "printer") {
    const band = inferVolumeBand(specsText);
    base.volumeMin = band.volumeMin;
    base.volumeMax = band.volumeMax;
  }

  return base;
}

interface RawInstall {
  id: string;
  title: string;
  region: string | null;
  industry: string | null;
  brand: string | null;
  model: string | null;
  body: string;
  bodyHtml?: string | null;
  images: string[];
  date: string | null;
  sourceUrl: string;
}

export function matchSlug(text: string | null, copy: Record<string, { keywords: string[] }>): string | null {
  if (!text) return null;
  for (const [slug, entry] of Object.entries(copy)) {
    if (entry.keywords.some((k) => text.includes(k))) return slug;
  }
  return null;
}

// next.config.ts에 등록된 이미지 도메인만 허용합니다. 등록되지 않은 외부 도메인(예: 본문에 인용된 뉴스
// 기사 이미지)을 대표 이미지로 쓰면 next/image가 렌더링 시 500 에러를 던지므로, 알려진 안전한 도메인의
// 이미지만 고릅니다. mblogthumb-phinf.pstatic.net은 네이버가 오래된 썸네일을 만료시켜 깨지는 경우가 많아
// 제외합니다.
const ALLOWED_IMAGE_HOSTS = new Set(["cdn.imweb.me", "cdn-optimized.imweb.me", "postfiles.pstatic.net"]);

function isAllowedImageUrl(url: string): boolean {
  try {
    return ALLOWED_IMAGE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** 본문 HTML에서 알려진 안전한 도메인의 첫 번째 이미지를 찾습니다. */
function extractFirstImage(html: string): string | null {
  const matches = html.matchAll(/<img[^>]+src="([^"]+)"/g);
  for (const m of matches) {
    if (isAllowedImageUrl(m[1])) return m[1];
  }
  return null;
}

/** 블로그 크롤링 결과 필드명이 요청한 스키마와 다소 다를 수 있어 관대하게 매핑합니다. */
export function normalizeBlogPost(
  raw: Record<string, unknown>,
  source: "site" | "naver"
): import("./types").BlogPost | null {
  const id = raw.id ?? raw.logNo ?? raw.idx;
  const title = raw.title;
  const body = raw.body ?? raw.content ?? raw.text;
  const sourceUrl = raw.sourceUrl ?? raw.url;
  if (!id || !title || !body || !sourceUrl) return null;
  const category = raw.category ?? (Array.isArray(raw.tags) ? (raw.tags as string[])[0] : null) ?? null;
  const bodyHtml = typeof raw.bodyHtml === "string" && raw.bodyHtml.trim() ? raw.bodyHtml : null;
  // 네이버 블로그의 원본 썸네일(mblogthumb-phinf.pstatic.net)은 시간이 지나 만료되어 깨지는 경우가 많아,
  // 본문에서 다시 확인된 실제 이미지(postfiles.pstatic.net 등)를 대표 이미지로 우선 사용합니다.
  const bodyHtmlImage = bodyHtml ? extractFirstImage(bodyHtml) : null;
  const rawImages = (Array.isArray(raw.images) ? (raw.images as string[]) : []).filter(isAllowedImageUrl);

  return {
    id: String(id),
    title: String(title),
    category: category ? String(category) : null,
    body: String(body),
    bodyHtml,
    images: bodyHtmlImage ? [bodyHtmlImage] : rawImages,
    date: raw.date ? String(raw.date) : null,
    sourceUrl: String(sourceUrl),
    source,
  };
}

export function normalizeInstall(raw: RawInstall): InstallCase {
  return {
    id: raw.id,
    title: raw.title,
    region: raw.region,
    regionSlug: matchSlug(raw.region, regionCopy),
    industry: raw.industry,
    industrySlug: matchSlug(raw.industry, industryCopy),
    brand: raw.brand ? BRAND_ALIASES[raw.brand] ?? raw.brand : null,
    model: raw.model,
    body: raw.body,
    bodyHtml: raw.bodyHtml && raw.bodyHtml.trim() ? raw.bodyHtml : null,
    images: raw.images,
    date: raw.date,
    sourceUrl: raw.sourceUrl,
  };
}
