export const siteConfig = {
  name: "엠비엠",
  legalName: "엠비엠",
  shortDescription: "서울·수도권 복합기·프린터·조립PC·노트북 렌탈 및 구매 전문업체",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.mbmoffice.co.kr",
  phone: "1833-2613",
  phoneHref: "tel:1833-2613",
  email: "admin@mbmoffice.co.kr",
  // 문의 페이지에 노출되는 실제 담당자 연락 이메일 (mbmoffice.co.kr에 게시된 값)
  contactEmail: "unwoo.sim@mbmoffice.co.kr",
  // 실제 사이트에서 확인된 카카오톡 채널
  kakaoChannelUrl: "https://pf.kakao.com/_xeGxfdn",
  kakaoChatUrl: "https://pf.kakao.com/_xeGxfdn/chat",
  // 실제 게시된 값을 찾지 못해 잠정 기재한 통상적인 국내 사무기기업체 운영시간입니다 — 확인 후 교체해 주세요.
  businessHours: {
    weekday: "평일 09:00 ~ 18:00",
    lunch: "점심 12:00~13:00",
    closed: "주말·공휴일 휴무",
  },
  address: {
    street: "양천로 400-12 (등촌동, 더리브골드타워) 503호",
    locality: "강서구",
    region: "서울특별시",
    postalCode: "07573",
    country: "KR",
  },
  areaServed: ["서울특별시", "경기도", "인천광역시"],
  // 렌탈 계약서(전자계약)에 표기되는 회사 등록 정보
  businessRegNumber: "102-52-00829",
  ceoName: "심언우",
} as const;

export const addressText = `${siteConfig.address.region} ${siteConfig.address.locality} ${siteConfig.address.street}`;

// 1989년 삼천교역 창업 이래 누적 복합기 설치 대수. /about, /cases에서 공유합니다.
export const cumulativeInstalls = 5531;

export type ServiceLine = {
  slug: string;
  label: string;
  short: string;
  description: string;
};

// 상단 내비게이션에 동일 비중으로 노출되는 사업 라인 (2026-09-23 논의 결정 사항)
export const serviceLines: ServiceLine[] = [
  {
    slug: "rental",
    label: "복합기 렌탈",
    short: "A3/A4 컬러·흑백 복합기 렌탈",
    description:
      "후지필름, 캐논, 교세라 등 정품 복합기를 규격·색상별로 골라 렌탈할 수 있습니다. 설치부터 소모품, A/S까지 한 번에 관리합니다.",
  },
  {
    slug: "pc-rental",
    label: "PC·노트북 렌탈",
    short: "사무용 PC·노트북 렌탈/구매",
    description:
      "업무 환경에 맞춘 PC와 노트북을 렌탈 또는 구매로 제공하고, 초기 세팅까지 지원합니다.",
  },
  {
    slug: "shredder",
    label: "문서세단기 렌탈",
    short: "사무실·기업용 문서세단기",
    description:
      "개인정보 보안이 중요한 사무실에 적합한 세단 용량별 문서세단기를 렌탈로 제공합니다.",
  },
  {
    slug: "maintenance",
    label: "IT·PC 유지보수",
    short: "사무실 IT 환경 유지보수",
    description:
      "복합기 외에도 사무실 전체 IT/PC 환경을 정기 점검하고 장애 발생 시 신속히 대응합니다.",
  },
  {
    slug: "shop",
    label: "구매",
    short: "복합기·PC·소모품 구매",
    description: "렌탈이 아닌 직접 구매를 원하시면, 복합기·PC·NAS·문서세단기·소모품·부품을 바로 구매하실 수 있습니다.",
  },
];

export type ShopCategory = {
  slug: string;
  label: string;
  categories: import("./data/types").ProductCategory[];
};

// /shop 하위 카테고리. copier는 렌탈과 동일하게 mfp+printer를 함께 묶어 보여줍니다.
export const shopCategories: ShopCategory[] = [
  { slug: "copier", label: "복합기", categories: ["mfp", "printer"] },
  { slug: "pc", label: "PC", categories: ["pc", "notebook"] },
  { slug: "nas", label: "NAS", categories: ["nas"] },
  { slug: "shredder", label: "문서세단기", categories: ["shredder"] },
  { slug: "supplies", label: "소모품", categories: ["supplies"] },
  { slug: "parts", label: "부품", categories: ["parts"] },
];

// "WE CARE. YOU WORK." 브랜드 메시지 3원칙 — 홈 화면 회사소개 섹션과 /solution 페이지에서 공유합니다.
export const carePoints = [
  {
    eyebrow: "선조치 후수리",
    headline: "멈춤 없는 업무",
    body: "고장 시 대체 기기를 먼저 설치합니다. 수리하는 동안에도 업무는 계속됩니다.",
  },
  {
    eyebrow: "소모품부터 출장 AS까지",
    headline: "부담 없는 관리",
    body: "정품 토너와 부품, 출장 AS를 월 렌탈료에 포함해 관리 부담을 줄입니다.",
  },
  {
    eyebrow: "사용량에 맞춘 제안",
    headline: "우리 사무실에 딱",
    body: "출력량, 업무 특성, 사무실 규모를 살펴 필요한 기기와 요금제를 제안합니다.",
  },
] as const;

export const secondaryNav = [
  { slug: "cases", label: "설치사례" },
  { slug: "blog", label: "블로그" },
  { slug: "contact", label: "문의하기" },
];

// 헤더 상단 내비게이션과 푸터 메뉴가 동일한 항목을 공유합니다.
export const navLinks = [
  { slug: "about", label: "회사소개" },
  { slug: "rental", label: "렌탈" },
  { slug: "shop", label: "구매" },
  { slug: "maintenance", label: "유지보수" },
  { slug: "recommend", label: "1분 사무기기 추천" },
  { slug: "cases", label: "설치사례" },
  { slug: "blog", label: "블로그" },
];

export const sizeLabels: Record<string, string> = {
  a3: "A3",
  a4: "A4",
};

export const colorLabels: Record<string, string> = {
  color: "컬러",
  mono: "흑백",
};

export const brandLabels: Record<string, string> = {
  fujifilm: "후지필름",
  canon: "캐논",
  kyocera: "교세라",
  sindoh: "신도리코",
};

export const regionCopy: Record<string, { label: string; intro: string; keywords: string[] }> = {
  "gangseo-gu": {
    label: "강서구",
    intro:
      "엠비엠 본사가 위치한 서울 강서구 지역은 당일 방문 설치와 가장 빠른 A/S 대응이 가능한 권역입니다.",
    keywords: ["강서구", "강서", "등촌", "화곡", "가양", "염창", "발산"],
  },
  gimpo: {
    label: "김포",
    intro: "김포 지역 사무실·매장을 대상으로 정기 순회 점검과 신속한 출동 A/S를 제공합니다.",
    keywords: ["김포"],
  },
  bucheon: {
    label: "부천",
    intro: "부천 지역은 강서구 본사에서 가까워 설치·소모품 교체·긴급 출동이 빠른 편입니다.",
    keywords: ["부천"],
  },
  incheon: {
    label: "인천",
    intro: "인천 전역(서비스 지역: 인천광역시)에 걸쳐 복합기 렌탈과 IT 유지보수를 지원합니다.",
    keywords: ["인천"],
  },
};

export const industryCopy: Record<string, { label: string; intro: string; keywords: string[] }> = {
  hospital: {
    label: "병원",
    intro:
      "환자 접수·처방전 출력이 끊기면 안 되는 병·의원 환경에 맞춰, 장애 발생 시 우선 순위로 대응합니다.",
    keywords: ["병원", "의원", "한의원", "치과"],
  },
  "tax-accounting": {
    label: "세무·회계",
    intro: "대량 인쇄와 보안 출력이 중요한 세무·회계 사무소에 적합한 모델을 추천합니다.",
    keywords: ["세무", "회계"],
  },
  law: {
    label: "법률",
    intro: "문서 보안과 스캔 품질이 중요한 법률사무소를 위한 구성을 제안합니다.",
    keywords: ["법률", "법무", "변호사", "법무사"],
  },
  architecture: {
    label: "건축설계",
    intro: "대형 도면 출력·스캔이 잦은 건축설계사무소에 맞는 고성능 복합기를 제안합니다.",
    keywords: ["건축"],
  },
};
