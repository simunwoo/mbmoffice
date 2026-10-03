import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateMemberNoteAction } from "@/lib/actions/admin/members";
import { MemberDeleteButton, MemberRoleSelect } from "@/components/admin/MemberDetailActions";
import type { ProfileRow } from "@/lib/supabase/types";

const PROVIDER_LABEL: Record<string, string> = {
  email: "이메일",
  kakao: "카카오",
  naver: "네이버",
  google: "구글",
};

export default async function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const [{ data: profile }, { data: authUser }] = await Promise.all([
    admin.from("profiles").select("*").eq("id", id).maybeSingle<ProfileRow>(),
    admin.auth.admin.getUserById(id),
  ]);

  if (!profile) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin/members" className="text-sm font-semibold text-foreground-soft hover:text-brand-ink">
        ← 회원 목록
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-background p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{profile.name || "이름 없음"}</h1>
            <p className="mt-1 text-sm text-foreground-soft">{authUser?.user?.email ?? "-"}</p>
          </div>
          <MemberRoleSelect id={profile.id} role={profile.role} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-foreground-soft">연락처</dt>
            <dd className="mt-0.5 font-semibold">{profile.phone || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-soft">가입 방법</dt>
            <dd className="mt-0.5 font-semibold">{PROVIDER_LABEL[profile.provider] ?? profile.provider}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-soft">가입일</dt>
            <dd className="mt-0.5 font-semibold">
              {new Date(profile.created_at).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" })}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-soft">최근 정보 수정</dt>
            <dd className="mt-0.5 font-semibold">
              {new Date(profile.updated_at).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" })}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-6">
        <p className="text-sm font-bold">관리자 메모</p>
        <p className="mt-1 text-xs text-foreground-soft">이 회원에 대한 특이사항을 남겨두면 다른 담당자도 확인할 수 있습니다.</p>
        <form action={updateMemberNoteAction} className="mt-3">
          <input type="hidden" name="id" value={profile.id} />
          <textarea
            name="note"
            defaultValue={profile.admin_note ?? ""}
            rows={4}
            placeholder="예: 렌탈 3건 진행 중, 결제 관련 특이사항 등"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          <button type="submit" className="mt-3 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
            메모 저장
          </button>
        </form>
      </div>

      <div className="mt-4 flex justify-end">
        <MemberDeleteButton id={profile.id} isSelf={profile.id === currentUser?.id} />
      </div>
    </div>
  );
}
