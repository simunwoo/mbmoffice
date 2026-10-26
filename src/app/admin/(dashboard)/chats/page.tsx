import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminChatsPage() {
  const supabase = await createClient();
  const { data: sessions, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="text-2xl font-bold">AI 상담 내역</h1>
      <p className="mt-1 text-sm text-foreground-soft">AI 판매원 엠비와 나눈 대화 기록입니다.</p>

      {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}
      {!error && (!sessions || sessions.length === 0) && <p className="mt-10 text-sm text-foreground-soft">아직 상담 기록이 없습니다.</p>}

      {!error && sessions && sessions.length > 0 && (
        <div className="mt-6 max-h-[70vh] overflow-auto rounded-2xl border border-border bg-background">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs text-foreground-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">마지막 메시지</th>
                <th className="px-4 py-3 font-semibold">방문자</th>
                <th className="px-4 py-3 font-semibold">페이지</th>
                <th className="px-4 py-3 font-semibold">대화 수</th>
                <th className="px-4 py-3 font-semibold">리드 저장</th>
                <th className="px-4 py-3 font-semibold">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground-soft">
                    {s.last_message_at ? new Date(s.last_message_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "-"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {s.member_name ? (
                      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-ink">회원 · {s.member_name}</span>
                    ) : (
                      <span className="text-foreground-soft">비회원</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-foreground-soft">{s.page ?? "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{s.message_count}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {s.inquiry_id ? (
                      <Link href={`/admin/leads/${s.inquiry_id}`} className="font-semibold text-brand-ink hover:underline">
                        리드 보기
                      </Link>
                    ) : (
                      <span className="text-foreground-soft">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link href={`/admin/chats/${s.id}`} className="font-semibold text-brand-ink hover:underline">
                      대화 보기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
