import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ChatSessionRow } from "@/lib/supabase/types";

export default async function AdminChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: session } = await supabase.from("chat_sessions").select("*").eq("id", id).maybeSingle<ChatSessionRow>();
  if (!session) notFound();

  return (
    <div>
      <Link href="/admin/chats" className="text-xs text-foreground-soft hover:text-brand-ink">
        ← AI 상담 내역
      </Link>
      <h1 className="mt-1 text-2xl font-bold">
        {session.member_name ? `${session.member_name} (회원)` : "비회원"} 상담
      </h1>
      <p className="mt-1 text-xs text-foreground-soft">
        페이지 {session.page ?? "-"} · 메시지 {session.message_count}개
        {session.inquiry_id && (
          <>
            {" · "}
            <Link href={`/admin/leads/${session.inquiry_id}`} className="font-semibold text-brand-ink hover:underline">
              저장된 리드 보기
            </Link>
          </>
        )}
      </p>

      <div className="mt-6 space-y-3 rounded-2xl border border-border bg-background p-6">
        {session.messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "rounded-tr-sm bg-brand text-white" : "rounded-tl-sm bg-surface"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {session.messages.length === 0 && <p className="text-sm text-foreground-soft">대화 내용이 없습니다.</p>}
      </div>
    </div>
  );
}
