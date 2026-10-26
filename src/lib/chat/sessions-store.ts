import { createClient } from "@/lib/supabase/server";
import type { ChatMessage } from "@/lib/supabase/types";

/** 답변마다 대화 전체를 chat_sessions에 upsert합니다. 실패해도 절대 던지지 않습니다 — 상담 답변을 막으면 안 됩니다. */
export async function upsertSession(input: {
  sessionId: string;
  messages: ChatMessage[];
  page?: string;
  ip?: string;
  ua?: string;
  memberId?: string | null;
  memberName?: string | null;
  inquiryId?: string | null;
  fallback?: boolean;
}): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("chat_sessions").upsert(
      {
        id: input.sessionId,
        messages: input.messages,
        page: input.page ?? null,
        ip: input.ip ?? null,
        ua: input.ua ?? null,
        member_id: input.memberId ?? null,
        member_name: input.memberName ?? null,
        inquiry_id: input.inquiryId ?? null,
        fallback: input.fallback ?? false,
        message_count: input.messages.length,
        last_message_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
  } catch (err) {
    console.error("[chat] session upsert failed", err instanceof Error ? err.message : err);
  }
}
