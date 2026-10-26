// AI 상담 엔진 — Anthropic 도구 정의 + 서버측 에이전트 루프(최대 3회 도구 라운드)
import type Anthropic from "@anthropic-ai/sdk";
import { buildChatSystemPrompt } from "@/lib/chat/context";
import { buildMemberSystemBlock, type MemberContext } from "@/lib/chat/member-context";
import { createClient } from "@/lib/supabase/server";
import { sendInquiryNotification } from "@/lib/email";
import { getProducts } from "@/lib/data";
import { joinBrandName, type Product } from "@/lib/data/types";
import { productHref } from "@/lib/product-match";

export const MODEL = "claude-sonnet-5";
export const MAX_TOKENS = 800;
const MAX_TOOL_ROUNDS = 3;

export type ChatClient = {
  messages: { create(params: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> };
};

export type ChatContext = {
  sessionId?: string;
  page?: string;
  ip?: string;
  ua?: string;
  member?: MemberContext | null;
};

export type ProductCard = { id: string; name: string; price: number | null; pricingType: Product["pricingType"]; image: string | null; href: string };

export type ChatMessageParam = { role: "user" | "assistant"; content: string };

export type ChatResult = {
  reply: string;
  leadSaved?: true;
  inquiryId?: string;
  products?: ProductCard[];
  toolCalls: string[];
};

const TOOLS: Anthropic.Tool[] = [
  {
    name: "save_consultation",
    description:
      "고객이 연락처(전화번호)를 남긴 시점에 상담 내용을 리드로 저장하고 담당 매니저에게 알린다. 같은 대화에서 한 번만 호출. kind: quote=견적/도입/IT유지보수, callback=A/S·고장·전화 요청, chat=기타 상담.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["quote", "callback", "chat"] },
        name: { type: "string", description: "고객 성함" },
        phone: { type: "string", description: "연락처 (예: 010-1234-5678)" },
        company: { type: "string", description: "회사명" },
        email: { type: "string", description: "이메일 (알면)" },
        interest_products: { type: "array", items: { type: "string" }, description: "관심 상품명 목록" },
        summary: { type: "string", description: "담당자가 읽을 상담 요약 2~4문장 (요청 내용·파악한 프로필·추천 기종·특이사항)" },
      },
      required: ["kind", "phone", "summary"],
    },
  },
  {
    name: "lookup_products",
    description: "상품 검색. 프롬프트 카탈로그에 없는 기종·소모품이나 조건(브랜드·컬러/흑백·A3/A4·가격대)으로 찾을 때 사용. 최대 6개 반환.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "검색어 (모델명·브랜드·컬러·A3·토너 등)" },
        pricingType: { type: "string", enum: ["rental", "purchase", "maintenance"], description: "생략 시 전체" },
      },
      required: ["query"],
    },
  },
];

function won(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

async function lookupProducts(query: string, pricingType?: string): Promise<string> {
  const q = query.toLowerCase().replace(/\s+/g, " ").trim();
  if (!q) return "검색어가 비어 있습니다.";
  const wantColor = /컬러|칼라|color/.test(q) ? "color" : /흑백|mono/.test(q) ? "mono" : "";
  const wantSize = /\ba3\b/.test(q) ? "a3" : /\ba4\b/.test(q) ? "a4" : "";
  const tokens = q.split(" ").filter((t) => t.length >= 2 && !/^(컬러|칼라|흑백|a3|a4|복합기|프린터|렌탈|임대|구매|추천|사무실|용|가격|얼마)$/.test(t));

  const all = await getProducts();
  const scored = all
    .filter((p) => (!pricingType || p.pricingType === pricingType) && p.status !== "hidden" && p.status !== "soldout")
    .map((p) => {
      const hay = `${p.brand} ${p.name} ${(p.specs ?? []).join(" ")}`.toLowerCase();
      let score = 0;
      for (const t of tokens) if (hay.includes(t)) score += t.length >= 4 ? 3 : 2;
      if (wantColor) score += p.color === wantColor ? 2 : p.color ? -3 : 0;
      if (wantSize) score += p.size === wantSize ? 2 : p.size ? -3 : 0;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (!scored.length) return "일치하는 상품이 없습니다. 카탈로그 범위 밖이면 '상담 시 확인'으로 안내하세요.";
  return scored
    .map(({ p }) => {
      const price = p.pricingType === "purchase" ? p.purchasePrice : p.priceMonthly;
      const parts = [joinBrandName(p.brand, p.name), price ? (p.pricingType === "purchase" ? won(price) : `월 ${won(price)}`) : "상담 시 확정"];
      if (p.color) parts.push(p.color === "color" ? "컬러" : "흑백");
      if (p.size) parts.push(p.size.toUpperCase());
      parts.push(productHref(p));
      return `{${parts.join(" | ")}}`;
    })
    .join("\n");
}

async function extractProductCards(text: string): Promise<ProductCard[]> {
  const all = await getProducts();
  const out: ProductCard[] = [];
  for (const p of all) {
    const href = productHref(p);
    // /pc-rental, /shredder, /rental 처럼 상품 id가 없는 공용 링크는 카드로 안 만듭니다.
    if (!/\/[0-9a-fA-F-]{10,}$/.test(href)) continue;
    if (!text.includes(href)) continue;
    out.push({
      id: p.id,
      name: joinBrandName(p.brand, p.name),
      price: p.pricingType === "purchase" ? (p.purchasePrice ?? null) : (p.priceMonthly ?? null),
      pricingType: p.pricingType,
      image: p.images[0] ?? null,
      href,
    });
    if (out.length >= 4) break;
  }
  return out;
}

const s = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

type SaveInput = { kind?: unknown; name?: unknown; phone?: unknown; company?: unknown; email?: unknown; interest_products?: unknown; summary?: unknown };

function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

async function runSaveConsultation(input: SaveInput, ctx: ChatContext, state: { inquiryId?: string }): Promise<string> {
  if (state.inquiryId) return JSON.stringify({ ok: true, inquiryId: state.inquiryId, note: "이미 저장됨 — 다시 저장하지 말고 답변만 하세요." });

  const member = ctx.member ?? null;
  const phoneRaw = s(input.phone, 30) || member?.phone || "";
  const phone = normalizePhone(phoneRaw);
  if (!/^0\d{8,10}$/.test(phone)) {
    return JSON.stringify({ ok: false, error: "전화번호 형식이 올바르지 않습니다. 고객에게 숫자 10~11자리 연락처를 다시 확인하세요." });
  }

  const kindRaw = s(input.kind, 20);
  const kindLabel = kindRaw === "quote" ? "AI상담-견적" : kindRaw === "callback" ? "AI상담-A/S·전화요청" : "AI상담-기타";
  const name = s(input.name, 50) || member?.name || "";
  const company = s(input.company, 100) || member?.company || "";
  const email = s(input.email, 100) || null;
  const interestProducts = Array.isArray(input.interest_products) ? input.interest_products.map((x) => s(x, 80)).filter(Boolean) : [];
  const summary = s(input.summary, 2000);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      name: name || "AI상담 고객",
      phone,
      email,
      company_name: company || null,
      interest: interestProducts.join(", ") || kindLabel,
      message: summary,
      attachments: [],
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[chat] inquiry insert error", error);
    return JSON.stringify({ ok: false, error: "저장 중 오류가 발생했습니다. 전화로 문의하도록 안내하세요." });
  }

  state.inquiryId = data.id;
  await sendInquiryNotification({ name: name || "AI상담 고객", phone, email: email ?? "", companyName: company || null, interest: interestProducts.join(", ") || kindLabel, message: summary }).catch(
    (e) => console.error("[chat] notify failed", e)
  );
  return JSON.stringify({ ok: true, inquiryId: data.id });
}

const FALLBACK_AFTER_SAVE = "연락처 확인했어요. 담당 매니저가 영업시간 내에 연락드릴게요.";

export async function runConsultation(client: ChatClient, history: ChatMessageParam[], ctx: ChatContext): Promise<ChatResult> {
  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  const state: { inquiryId?: string } = {};
  const toolCalls: string[] = [];
  let reply = "";
  const systemPrompt = await buildChatSystemPrompt();

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        { type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } },
        ...(ctx.member ? [{ type: "text" as const, text: buildMemberSystemBlock(ctx.member) }] : []),
      ],
      tools: TOOLS,
      messages: [...messages],
    });

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (text) reply = text;

    const toolUses = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (res.stop_reason !== "tool_use" || !toolUses.length) break;
    if (round === MAX_TOOL_ROUNDS) break;

    messages.push({ role: "assistant", content: res.content });
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      toolCalls.push(tu.name);
      let content: string;
      let isError = false;
      try {
        const input = (tu.input && typeof tu.input === "object" ? tu.input : {}) as Record<string, unknown>;
        if (tu.name === "save_consultation") content = await runSaveConsultation(input as SaveInput, ctx, state);
        else if (tu.name === "lookup_products") content = await lookupProducts(s(input.query, 200), s(input.pricingType, 20) || undefined);
        else {
          content = `알 수 없는 도구: ${tu.name}`;
          isError = true;
        }
      } catch (err) {
        console.error(`[chat] tool ${tu.name} failed`, err);
        content = "도구 실행 오류 — 고객에게 전화 안내로 대체하세요.";
        isError = true;
      }
      results.push({ type: "tool_result", tool_use_id: tu.id, content, ...(isError ? { is_error: true } : {}) });
    }
    messages.push({ role: "user", content: results });
    reply = "";
  }

  if (!reply && state.inquiryId) reply = FALLBACK_AFTER_SAVE;
  const products = await extractProductCards(reply);
  return {
    reply,
    ...(state.inquiryId ? { leadSaved: true as const, inquiryId: state.inquiryId } : {}),
    ...(products.length ? { products } : {}),
    toolCalls,
  };
}
