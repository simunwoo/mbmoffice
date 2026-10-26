import { createClient } from "@/lib/supabase/server";

export type MemberContext = {
  memberId: string;
  name: string | null;
  phone: string | null;
  company: string | null;
};

/** 로그인한 회원이면 이름·연락처·회사명을 돌려줍니다. 비로그인/오류 시 null (익명 상담으로 진행). */
export async function loadMemberContext(): Promise<MemberContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, phone, company_name")
      .eq("id", user.id)
      .maybeSingle();

    return {
      memberId: user.id,
      name: profile?.name ?? null,
      phone: profile?.phone ?? null,
      company: profile?.company_name ?? null,
    };
  } catch {
    return null;
  }
}

/** 시스템 프롬프트에 별도 블록으로 주입할 로그인 회원 정보 — 요청마다 바뀌므로 캐시 대상 프롬프트와 분리합니다. */
export function buildMemberSystemBlock(member: MemberContext): string {
  const lines = [
    "[로그인한 회원] 아래 정보가 있으니 이름을 다시 묻지 말고, 성함이 있으면 인사에 자연스럽게 섞어 쓰세요. save_consultation 호출 시 고객이 다른 값을 말하지 않았다면 이 정보를 기본값으로 사용하세요.",
    member.name ? `- 성함: ${member.name}` : null,
    member.phone ? `- 연락처: ${member.phone}` : null,
    member.company ? `- 회사명: ${member.company}` : null,
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}
