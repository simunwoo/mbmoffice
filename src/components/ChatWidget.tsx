"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/site-config";

type Role = "user" | "assistant";
type Message = { role: Role; content: string };
type ProductCard = { id: string; name: string; price: number | null; pricingType: "rental" | "purchase" | "maintenance" | null; image: string | null; href: string };

const QUICK_QUESTIONS = ["복합기 렌탈료 얼마예요?", "A3 컬러복합기 추천해주세요", "토너 구매하고 싶어요", "IT유지보수 비용이 궁금해요", "고장났어요, A/S 요청할게요", "렌탈이랑 구매 중 뭐가 나아요?"];

function sessionKey() {
  return "mbm-chat-session-id";
}
function historyKey(sessionId: string) {
  return `mbm-chat-history-${sessionId}`;
}

function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(sessionKey());
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(sessionKey(), id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function money(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [products, setProducts] = useState<ProductCard[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = getOrCreateSessionId();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 클라이언트에만 있어 마운트 시 1회 동기화가 불가피합니다.
    setSessionId(id);
    try {
      const saved = localStorage.getItem(historyKey(id));
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      /* 저장된 대화가 없거나 손상됨 — 새로 시작 */
    }
  }, []);

  useEffect(() => {
    if (!sessionId || messages.length === 0) return;
    try {
      localStorage.setItem(historyKey(sessionId), JSON.stringify(messages.slice(-40)));
    } catch {
      /* 저장 공간 부족 등 — 무시 */
    }
  }, [messages, sessionId]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, sending]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, sessionId, page: window.location.pathname }),
      });
      const data = await res.json().catch(() => null);
      const reply = typeof data?.reply === "string" ? data.reply : "지금은 답변을 받아오지 못했어요. 잠시 후 다시 시도해 주세요.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setProducts(Array.isArray(data?.products) ? data.products : []);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: `연결이 원활하지 않아요. 카카오톡 채널(${siteConfig.kakaoChatUrl})로 문의해 주세요.` }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "AI 상담 닫기" : "AI 상담 시작하기"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:opacity-90"
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
            <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 8.4 8.4 0 0 1-3.5-.75L3 21l1.8-5.4A8.5 8.5 0 1 1 21 11.5Z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute bottom-[72px] right-0 flex h-[600px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center gap-2.5 border-b border-border bg-brand px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-bold">엠비</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">엠비엠 AI 판매원 엠비</p>
              <p className="text-xs text-white/80">24시간 상담 가능</p>
            </div>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div>
                <div className="rounded-2xl rounded-tl-sm bg-surface px-3.5 py-2.5 text-sm">
                  안녕하세요! 엠비엠 AI 판매원 엠비예요. 복합기 렌탈·구매, 소모품, IT유지보수 뭐든 편하게 물어보세요.
                </div>
                <p className="mb-2 mt-3 text-xs font-semibold text-foreground-soft">빠른 질문</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="rounded-lg border border-border px-2.5 py-2 text-left text-xs font-semibold text-foreground-soft hover:border-brand hover:text-brand-ink"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user" ? "rounded-tr-sm bg-brand text-white" : "rounded-tl-sm bg-surface"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-surface px-3.5 py-2.5 text-sm text-foreground-soft">...</div>
              </div>
            )}

            {!sending && products.length > 0 && (
              <div className="space-y-2">
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={p.href}
                    className="flex items-center gap-3 rounded-xl border border-border p-2.5 transition hover:border-brand"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                      {p.image && <Image src={p.image} alt="" fill className="object-contain p-1" sizes="44px" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{p.name}</p>
                      <p className="text-xs text-foreground-soft">
                        {p.price ? (p.pricingType === "purchase" ? money(p.price) : `월 ${money(p.price)}`) : "상담 시 확정"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="궁금한 걸 물어보세요"
              disabled={sending}
              className="min-w-0 flex-1 rounded-full border border-border bg-transparent px-3.5 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
              style={{ fontSize: 16 }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="보내기"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
