// POST /api/chat — 엠비엠 AI 상담 "엠비" (Anthropic Claude + 도구: save_consultation / lookup_products)
// body: { messages: [{role:'user'|'assistant', content:string}], sessionId?: string, page?: string }
// 응답: { reply, leadSaved?: true, products?: [...] } · 키 없음/장애 시 { reply, fallback:true } (HTTP 200)
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { siteConfig } from "@/lib/site-config";
import { runConsultation, type ChatMessageParam } from "@/lib/chat/engine";
import { upsertSession } from "@/lib/chat/sessions-store";
import { loadMemberContext } from "@/lib/chat/member-context";

export const runtime = "nodejs";

const HISTORY_MAX = 12;
const CONTENT_MAX = 2000;

const CONTROL_CHARS_RE = new RegExp("[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F\\u2028\\u2029]", "g");

// 메모리 rate limit — 인스턴스 단위. 1분 15회.
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 15;
const rateStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateStore.get(ip) ?? { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }
  entry.count += 1;
  rateStore.set(ip, entry);
  if (rateStore.size > 1000) {
    for (const [k, v] of rateStore) if (now > v.resetAt) rateStore.delete(k);
  }
  return entry.count <= RATE_MAX;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  return fwd.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

const FALLBACK_REPLY = `지금은 AI 상담이 잠시 어려워요. 카카오톡 채널(${siteConfig.kakaoChatUrl})로 문의 주시거나 ${siteConfig.phone}로 전화 주시면 담당 매니저가 바로 도와드릴게요.`;

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ maxRetries: 1, timeout: 45_000 });
  return client;
}

function parseMessages(raw: unknown): ChatMessageParam[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ChatMessageParam[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    const text = content.replace(CONTROL_CHARS_RE, "").trim().slice(0, CONTENT_MAX);
    if (!text) continue;
    const last = out[out.length - 1];
    if (last && last.role === role) {
      last.content = `${last.content}\n${text}`.slice(0, CONTENT_MAX);
    } else {
      out.push({ role, content: text });
    }
  }
  while (out.length && out[0].role !== "user") out.shift();
  const trimmed = out.slice(-HISTORY_MAX);
  while (trimmed.length && trimmed[0].role !== "user") trimmed.shift();
  if (!trimmed.length || trimmed[trimmed.length - 1].role !== "user") return null;
  return trimmed;
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  let body: { messages?: unknown; sessionId?: unknown; page?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const messages = parseMessages(body?.messages);
  if (!messages) {
    return NextResponse.json({ error: "메시지가 비어 있습니다." }, { status: 400 });
  }
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : undefined;
  const page = typeof body.page === "string" ? body.page.replace(/[^\w\-./?=&%#]/g, "").slice(0, 300) : undefined;

  const member = await loadMemberContext();
  const ctx = { sessionId, page, ip, ua: (req.headers.get("user-agent") ?? "").slice(0, 300), member };

  const fallback = async () => {
    if (sessionId) {
      await upsertSession({
        sessionId,
        messages: [...messages, { role: "assistant", content: FALLBACK_REPLY }],
        page,
        ip,
        ua: ctx.ua,
        memberId: member?.memberId,
        memberName: member?.name,
        fallback: true,
      });
    }
    return NextResponse.json({ reply: FALLBACK_REPLY, fallback: true });
  };

  const anthropic = getClient();
  if (!anthropic) {
    console.error("[api/chat] ANTHROPIC_API_KEY missing");
    return fallback();
  }

  try {
    const result = await runConsultation(anthropic, messages, ctx);
    if (!result.reply) {
      console.error("[api/chat] empty reply");
      return fallback();
    }
    if (sessionId) {
      await upsertSession({
        sessionId,
        messages: [...messages, { role: "assistant", content: result.reply }],
        page,
        ip,
        ua: ctx.ua,
        memberId: member?.memberId,
        memberName: member?.name,
        inquiryId: result.inquiryId,
      });
    }
    return NextResponse.json({
      reply: result.reply,
      ...(result.leadSaved ? { leadSaved: true } : {}),
      ...(result.products ? { products: result.products } : {}),
    });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      console.error("[api/chat] Anthropic rate limited");
    } else if (err instanceof Anthropic.AuthenticationError) {
      console.error("[api/chat] Anthropic auth failed — check ANTHROPIC_API_KEY");
    } else if (err instanceof Anthropic.APIError) {
      console.error("[api/chat] Anthropic API error", err.status, err.message);
    } else {
      console.error("[api/chat] error", err);
    }
    return fallback();
  }
}
