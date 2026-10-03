export type ProductCategory =
  | "mfp" // 복합기
  | "printer" // 프린터
  | "pc" // 조립PC
  | "notebook" // 노트북
  | "nas" // NAS
  | "shredder" // 문서세단기
  | "maintenance" // IT/PC 유지보수
  | "supplies" // 복합기 소모품 (토너, 회수통 등)
  | "parts"; // 부품 (급지롤러 등)

export type ProductSize = "a3" | "a4" | null;
export type ProductColor = "color" | "mono" | null;

/** 조합형 옵션 그룹 (예: 이름 "색상", 값 ["빨강", "파랑"]) */
export interface ProductOptionGroup {
  name: string;
  values: string[];
}

/** 옵션 조합 1개의 재고·추가금 (예: {"색상":"빨강"} → +0원, 재고 5개) */
export interface ProductVariant {
  id: string;
  combo: Record<string, string>;
  label: string;
  priceDelta: number;
  stock: number;
  status: "selling" | "soldout";
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  size?: ProductSize;
  color?: ProductColor;
  /** 인쇄 방식 (복합기/프린터에만 적용). 잉크젯은 별도 요금 체계를 사용합니다. */
  printTech?: "laser" | "inkjet" | null;
  /** 이 모델이 감당 가능한 월 권장 출력량 범위 (매/월). 복합기·프린터에만 적용. */
  volumeMin?: number | null;
  volumeMax?: number | null;
  /** 약정 개월 수 (예: 36) */
  termMonths?: number | null;
  /** rental: 월 렌탈료 / purchase: 해당없음(null) */
  priceMonthly?: number | null;
  /** 정가/할인 전 가격 (원), 있는 경우만 */
  listPrice?: number | null;
  /** purchase 상품의 1회성 구매가 (원) */
  purchasePrice?: number | null;
  pricingType?: "rental" | "purchase" | "maintenance" | null;
  /** 구조화 파싱이 애매한 경우를 위한 원본 가격 문구 (예: "7,500원 / 10,000원 / 복합기 렌탈과 같이하면...") */
  priceNote?: string | null;
  specs?: string[];
  images: string[];
  sourceUrl?: string;
  status?: "selling" | "soldout" | "hidden";
  stock?: number | null;
  /** 관리자가 에디터로 작성한 상품 상세 설명 (상세정보 탭에 본문 이미지들보다 먼저 표시). */
  descriptionHtml?: string | null;
  /** 구매 상품의 조합형 옵션 — 상세페이지에서 직접 조회할 때만 채워집니다(목록 조회 시에는 비어 있음). */
  optionGroups?: ProductOptionGroup[];
  variants?: ProductVariant[];
}

export interface InstallCase {
  id: string;
  title: string;
  region: string | null;
  regionSlug: string | null;
  industry: string | null;
  industrySlug: string | null;
  brand: string | null;
  model: string | null;
  /** 기기 종류 소분류 (예: 컬러복합기, 흑백복합기, PC·노트북 등) */
  category?: string | null;
  body: string;
  /** 원본 게시글의 서식(굵게/글자크기/인용구)과 본문 중간 설치 사진을 보존한 정제된 HTML. 없으면 body(순수 텍스트)로 대체 표시합니다. */
  bodyHtml?: string | null;
  images: string[];
  date: string | null;
  sourceUrl: string;
}

/** 브랜드+이름 표시용 문구. 이름에 브랜드가 이미 포함된 경우(크롤링 원본 상품명이 흔히 그렇습니다) 중복 표기를 피합니다. */
export function joinBrandName(brand: string | null | undefined, name: string | null | undefined): string {
  if (!name) return brand ?? "";
  if (!brand) return name;
  return name.includes(brand) ? name : `${brand} ${name}`;
}

export interface BlogPost {
  id: string;
  title: string;
  category: string | null;
  body: string;
  /** 원본 게시글의 서식(굵게/글자크기/인용구)과 본문 중간 이미지를 보존한 정제된 HTML. 없으면 body(순수 텍스트)로 대체 표시합니다. */
  bodyHtml?: string | null;
  images: string[];
  date: string | null;
  sourceUrl: string;
  source: "site" | "naver";
}
