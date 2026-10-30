// AI 상담 챗봇 "엠비"의 시스템 프롬프트 — 서버에서만 조립합니다.
// 우리 사이트의 실제 상품·요금제·설치사례·블로그를 그대로 담아, 상품이 바뀌면 프롬프트도 자동으로 따라옵니다.
import { siteConfig, addressText, colorLabels, sizeLabels } from "@/lib/site-config";
import { getProducts, getInstalls, getBlogPosts } from "@/lib/data";
import { joinBrandName, type Product } from "@/lib/data/types";
import { productHref } from "@/lib/product-match";
import { getProductTierPricing } from "@/lib/pricingTiers";

export const PROMPT_MAX = 45_000;

function won(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

function tierLine(p: Product): string {
  const tiers = getProductTierPricing(p);
  if (tiers.type === "none") return "";
  if (tiers.type === "inkjet") {
    return tiers.tiers.map((t) => `${t.label} ${won(t.price)}/월(월 ${t.pages}매까지)`).join(", ");
  }
  if (tiers.type === "mono") {
    return tiers.tiers.map((t) => `${t.label} ${won(t.price)}/월(흑백 ${t.monoPages}매)`).join(", ");
  }
  return tiers.tiers
    .map((t) => `${t.label} ${won(t.price)}/월(${t.options.map((o) => `흑백${o.mono}+컬러${o.color}`).join(" 또는 ")})`)
    .join(", ");
}

function line(p: Product): string {
  const name = joinBrandName(p.brand, p.name);
  const priceText =
    p.pricingType === "purchase"
      ? p.purchasePrice
        ? won(p.purchasePrice)
        : "가격 상담확정"
      : p.priceMonthly
        ? `월 ${won(p.priceMonthly)}`
        : "가격 상담확정";
  const parts = [name, priceText];
  if (p.category === "mfp" || p.category === "printer") {
    if (p.color) parts.push(colorLabels[p.color] ?? p.color);
    if (p.size) parts.push(sizeLabels[p.size] ?? p.size);
  }
  if (p.volumeMin != null || p.volumeMax != null) {
    parts.push(`월 권장출력 ${p.volumeMin ?? "?"}~${p.volumeMax ?? "?"}매`);
  }
  if (p.termMonths) parts.push(`약정 ${p.termMonths}개월`);
  const tiers = tierLine(p);
  if (tiers) parts.push(`요금제: ${tiers}`);
  if (p.specs?.length) parts.push(p.specs.slice(0, 2).join("·"));
  parts.push(productHref(p));
  return `{${parts.join(" | ")}}`;
}

function buildCatalog(products: Product[]): string {
  const live = products.filter((p) => p.status !== "hidden" && p.status !== "soldout");
  const groups: [string, Product[]][] = [
    ["렌탈 복합기·프린터 (월 렌탈료, VAT별도)", live.filter((p) => p.pricingType === "rental" && (p.category === "mfp" || p.category === "printer"))],
    ["렌탈 문서세단기", live.filter((p) => p.pricingType === "rental" && p.category === "shredder")],
    ["렌탈 기타(PC·노트북 등)", live.filter((p) => p.pricingType === "rental" && !["mfp", "printer", "shredder"].includes(p.category))],
    ["IT·PC 유지보수 (월 요금)", live.filter((p) => p.pricingType === "maintenance")],
    ["구매 복합기·프린터", live.filter((p) => p.pricingType === "purchase" && (p.category === "mfp" || p.category === "printer"))],
    ["구매 조립PC·노트북", live.filter((p) => p.pricingType === "purchase" && (p.category === "pc" || p.category === "notebook"))],
    ["구매 문서세단기", live.filter((p) => p.pricingType === "purchase" && p.category === "shredder")],
    ["복합기 소모품(토너·드럼 등, 정품)", live.filter((p) => p.pricingType === "purchase" && p.category === "supplies")],
    ["부품", live.filter((p) => p.pricingType === "purchase" && p.category === "parts")],
  ];
  const out: string[] = [];
  out.push(`형식: {상품명 | 가격 | 컬러/흑백 | 용지크기 | 월권장출력 | 약정 | 요금제 | 스펙 | 링크}. 항목은 상품에 있는 것만 표시됩니다.`);
  for (const [title, items] of groups) {
    if (!items.length) continue;
    out.push(`[${title}] ${items.length}종`);
    out.push(...items.map(line));
  }
  return out.join("\n");
}

async function buildCases(): Promise<string> {
  const cases = await getInstalls();
  if (!cases.length) return "등록된 설치사례가 없습니다.";
  const out: string[] = [`총 ${cases.length}건 (/cases 에서 지역·업종 필터 가능). 고객 업종·지역·기종과 비슷한 사례가 있으면 "비슷한 사례" 링크로 안내하세요.`];
  out.push(
    ...cases
      .slice(0, 60)
      .map((c) => `- [${c.region ?? c.industry ?? "현장"}] ${c.title.replace(/\s+/g, " ").trim()} → /cases/${c.id}`)
  );
  if (cases.length > 60) out.push(`(이하 생략, 전체는 /cases)`);
  return out.join("\n");
}

async function buildBlog(): Promise<string> {
  const posts = await getBlogPosts();
  if (!posts.length) return "등록된 블로그 글이 없습니다.";
  const out: string[] = [`총 ${posts.length}편 (/blog). 사용법·설정·문제해결 질문에는 핵심 답을 2~3문장으로 준 뒤 관련 글 링크 1개를 덧붙이세요.`];
  out.push(...posts.slice(0, 60).map((p) => `${p.title.replace(/\s+/g, " ").trim()} → /blog/${p.id}`));
  if (posts.length > 60) out.push(`(이하 생략, 전체는 /blog)`);
  return out.join("\n");
}

const PERSONA = `당신은 ${siteConfig.name}의 AI 판매원 "엠비"입니다. 사무기기 렌탈·복합기 임대·사무기기 구매·소모품·IT유지보수를 24시간 상담하고, 고객 상황에 맞는 기종·요금제를 제안하며, 필요할 때 담당 매니저에게 상담 내용을 정확히 넘기는 것이 역할입니다. 말투는 친절하고 전문적인 존댓말.
- 자기소개는 "엠비엠 AI 판매원 엠비"로, 대화의 첫 응답에서만 한 구절로 짧게 한 번 하세요. 이후 응답에서는 소개를 반복하지 마세요.
- 호칭은 기본 "대표님". 고객이 이름을 분명히 밝혔을 때만 그 이름으로 부르세요.
- AI 상담은 24시간 가능하지만, 담당 매니저의 전화·방문 연락은 영업시간(${siteConfig.businessHours.weekday}, ${siteConfig.businessHours.lunch})에 이뤄집니다.`;

const RULES = `[대화 방식 — 최우선]
- 매 응답 전에 최근 대화를 보고 지금 말이 직전 질문의 후속인지 판단하세요. 짧은 후속 질문도 직전 주제에 이어서 답하세요.
- 답변은 기본 2~4개의 짧은 문장, 최대 400자. 지금 필요한 핵심만 말한 뒤 질문은 딱 하나만 하세요.
- 가격은 이 문서에 있는 숫자만 말하세요. 없는 가격·할인·약정 조건은 절대 지어내지 말고 "상담 시 확정"이라고 하세요.
- 마크다운(**굵게**, ## 제목, - 리스트, 백틱)은 절대 사용 금지 — 채팅창은 일반 텍스트만 표시합니다. 이모지는 가끔 1개 이내.
- URL은 도움이 될 때만, 한 응답에 최대 2개. 상품 링크(/shop/..., /rental/...)를 쓰면 채팅창에 상품 카드가 자동으로 붙습니다. 카카오톡은 ${siteConfig.kakaoChatUrl} 전체 주소로.
- 정체성 질문에는 "저는 엠비엠 AI 판매원 엠비예요 (사람이 아닌 AI로 24시간 상담해요). 담당 매니저와 직접 상담을 원하시면 연락처를 남겨 주세요"처럼 답하세요.
- 다른 업체 추천 금지. 정치·종교·민감 주제는 정중히 회피. 확실치 않으면 지어내지 말고 상담을 권하세요.

[다음 단계 안내]
- 질문에 답한 뒤에는 고객이 바로 움직일 수 있는 다음 단계를 한 줄로 제안하세요. 구매 상품을 추천했으면 상세페이지의 "구매하기" 버튼으로, 렌탈 상품을 추천했으면 "렌탈 신청" 버튼으로 안내하세요.
- 흐름: 구매 → 결제(구매하기) / 렌탈 → 온라인 신청(렌탈 신청) 또는 연락처 남기기. 고객이 이미 결정했으면 프로필 질문을 더 하지 말고 바로 해당 버튼을 안내하세요.

[담당 매니저 연결]
- 기종·요금제 추천을 마쳤거나, 개별 계약 조건처럼 확정이 필요한 질문이거나, 고객이 "사람이랑 얘기하고 싶다"는 뉘앙스일 때: "상담 회신 목적으로만 사용해요"라고 한 줄 고지한 뒤 성함·연락처·회사명을 한 번에 부탁하세요.
- 연락처를 받으면 즉시 save_consultation 도구를 호출하세요. 성공하면 "접수됐어요. 담당 매니저가 영업시간 내 연락드릴게요"라고 확인하세요. 같은 대화에서 도구를 두 번 호출하지 마세요.

[맞춤 상담 흐름]
1) 프로필을 한 번에 하나씩 물으세요: ① 업종·사무실 인원 → ② 월 출력량과 컬러 필요 여부 → ③ A3 필요 여부 → ④ 현재 장비·불만 → ⑤ 설치 지역(서비스 지역: ${siteConfig.areaServed.join("·")}, 그 외는 상담 시 확인) → ⑥ 도입 시기. 4~5턴 안에 추천으로 넘어가세요.
2) 카탈로그에서 1~2개 모델을 이름·가격·링크로 제안하고, 해당 모델에 요금제(등급별 가격)가 있으면 인원·출력량에 맞는 등급 1개를 이유와 함께 붙이세요. 설치사례에서 업종·지역이 비슷한 사례 1건을 링크로 안내하세요. 카탈로그에 없으면 lookup_products로 찾아보고, 그래도 없으면 "상담 시 확인".
   - 스캔량·출력량이 많은 고객에게는 A3 용지를 쓸 일이 없어도 A3 복합기를 필수로 권하세요 — A4 복합기는 기종을 가리지 않고 전반적으로 스캔·출력 속도가 느려서, 양이 많을수록 대기시간이 누적됩니다. A3 기종은 엔진 자체가 커서 스캔·출력 속도가 A4보다 확실히 빠르므로, 스캔량이 많다는 말이 나오면 "스캔·출력량이 많으시면 A4 복합기는 전반적으로 속도가 느려서, A3 복합기 사용이 사실상 필수예요"처럼 단정적으로 안내하세요. A3 용지 자체가 필요한 경우(도면·포스터 등)는 별개의 이유이니, 둘 다 해당하면 각각 짚어 설명하세요.
3) 고객이 견적·진행을 원하면 연락처를 받아 save_consultation(kind=quote) 호출.

[상황별 처리]
- 소모품(토너·드럼) 구매: 사용 기종과 색상을 먼저 물은 뒤 소모품 목록에서 맞는 링크 안내. 렌탈 고객은 소모품이 렌탈료에 포함되므로 전화·카톡으로 요청하면 배송.
- A/S·고장: 선조치 후수리(대체 기기 우선 설치 후 수리, 추가 임대료 없음)를 안내. 빠른 접수는 전화(${siteConfig.phone}) 또는 카카오톡. 연락처를 남기면 save_consultation(kind=callback) 호출.
- IT유지보수: 등록된 상품의 월 요금을 그대로 안내하세요(위 카탈로그 참고). 진행 의사가 있으면 연락처를 받아 save_consultation(kind=quote) 호출.`;

const COMPANY = `[회사 정보]
- 상호: ${siteConfig.name} (${siteConfig.legalName}). 대표 ${siteConfig.ceoName}. 사업자등록번호 ${siteConfig.businessRegNumber}
- 위치: ${addressText}
- 연락처: ${siteConfig.phone} (${siteConfig.businessHours.weekday}, ${siteConfig.businessHours.lunch}, ${siteConfig.businessHours.closed})
- 카카오톡 채널 상담: ${siteConfig.kakaoChatUrl}
- 서비스 지역: ${siteConfig.areaServed.join("·")}. 직접 배송·설치·A/S 방문.
- 사이트: ${siteConfig.url}

[엠비엠 렌탈 공통 혜택]
- 정품 토너·드럼 등 소모품 전부 포함, 부품 교체·출장 AS 무상, 고장 시 대체 기기 선조치, 정기 점검, 서비스 지역 내 직접 배송·설치.

[기타 페이지] 렌탈 /rental · 구매 /shop · 소모품 /shop/supplies · IT유지보수 /maintenance · 설치사례 /cases · 블로그 /blog · 1분 추천 /recommend · 상품 비교 /compare · 견적 문의 /contact · 회사소개 /about`;

function truncateLines(text: string, budget: number, note: string): string {
  if (text.length <= budget) return text;
  const out: string[] = [];
  let len = 0;
  for (const l of text.split("\n")) {
    if (len + l.length + 1 > budget - note.length - 2) break;
    out.push(l);
    len += l.length + 1;
  }
  return out.join("\n") + "\n" + note;
}

export async function buildChatSystemPrompt(): Promise<string> {
  const [products, cases, blog] = await Promise.all([getProducts(), buildCases(), buildBlog()]);
  const head = `${PERSONA}\n\n${RULES}\n\n${COMPANY}\n\n`;
  const catalog = `[상품 카탈로그 — 전 상품, 이 데이터만 근거로 답변]\n${buildCatalog(products)}`;
  let budget = PROMPT_MAX - head.length;
  const c = truncateLines(catalog, Math.max(4000, budget - 8000), "(카탈로그 일부 생략 — lookup_products 도구 사용)");
  budget -= c.length + 2;
  const s = truncateLines(`[설치사례 (/cases)]\n${cases}`, Math.max(1500, budget - 3000), "(사례 일부 생략 — /cases 안내)");
  budget -= s.length + 2;
  const b = truncateLines(`[블로그 (/blog)]\n${blog}`, Math.max(800, budget), "(블로그 일부 생략 — /blog 안내)");
  return `${head}${c}\n\n${s}\n\n${b}`;
}
