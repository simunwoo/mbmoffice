import { createAdminClient } from "@/lib/supabase/admin";
import { AsRequestRowActions } from "@/components/admin/AsRequestRowActions";
import type { AsRequestRow, ProfileRow } from "@/lib/supabase/types";

const STATUS_LABEL: Record<AsRequestRow["status"], string> = { new: "신규", in_progress: "처리중", done: "완료" };
const STATUS_BADGE: Record<AsRequestRow["status"], string> = {
  new: "bg-brand-soft text-brand-ink",
  in_progress: "bg-amber-100 text-amber-800",
  done: "bg-surface text-foreground-soft",
};
const TYPE_LABEL: Record<AsRequestRow["request_type"], string> = { as: "A/S", toner: "토너" };

export default async function AdminAsRequestsPage() {
  const admin = createAdminClient();
  const [{ data: requests, error }, { data: profiles }, { data: usersPage }] = await Promise.all([
    admin.from("as_requests").select("*").order("created_at", { ascending: false }),
    admin.from("profiles").select("*"),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  const profileById = new Map((profiles as ProfileRow[] | null)?.map((p) => [p.id, p]) ?? []);
  const emailById = new Map(usersPage?.users.map((u) => [u.id, u.email ?? "-"]) ?? []);

  return (
    <div>
      <h1 className="text-2xl font-bold">A/S·토너 요청</h1>
      <p className="mt-1 text-sm text-foreground-soft">마이페이지에서 회원이 접수한 A/S·토너 요청 목록입니다.</p>

      {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}

      {!error && (!requests || requests.length === 0) && (
        <p className="mt-10 text-sm text-foreground-soft">아직 접수된 요청이 없습니다.</p>
      )}

      {!error && requests && requests.length > 0 && (
        <div className="mt-6 space-y-3">
          {(requests as AsRequestRow[]).map((r) => {
            const profile = profileById.get(r.member_id);
            return (
              <div key={r.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="text-xs text-foreground-soft">
                      {new Date(r.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                    <span className="font-semibold">{profile?.name || "회원"}</span>
                    <span className="text-sm text-foreground-soft">
                      {emailById.get(r.member_id) ?? "-"}
                      {profile?.phone ? ` · ${profile.phone}` : ""}
                    </span>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-foreground-soft">
                      {TYPE_LABEL[r.request_type]}
                    </span>
                    {r.contract_label && <span className="text-sm font-semibold text-brand-ink">{r.contract_label}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    <AsRequestRowActions id={r.id} status={r.status} />
                  </div>
                </div>
                {r.description && <p className="mt-2 text-sm text-foreground-soft">{r.description}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
