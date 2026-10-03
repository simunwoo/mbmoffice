import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow } from "@/lib/supabase/types";

const PROVIDER_LABEL: Record<string, string> = {
  email: "이메일",
  kakao: "카카오",
  naver: "네이버",
  google: "구글",
};

const ROLE_LABEL: Record<ProfileRow["role"], string> = { member: "일반회원", admin: "관리자" };
const ROLE_BADGE: Record<ProfileRow["role"], string> = {
  member: "bg-surface text-foreground-soft",
  admin: "bg-blue-100 text-blue-700",
};

type Filter = { role?: ProfileRow["role"]; provider?: string };

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; provider?: string; q?: string }>;
}) {
  const { role, provider, q } = await searchParams;

  const admin = createAdminClient();
  const [{ data: profiles, error }, { data: usersPage }] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  const emailById = new Map(usersPage?.users.map((u) => [u.id, u.email ?? "-"]) ?? []);
  const rows = (profiles ?? []) as ProfileRow[];

  const counts = {
    all: rows.length,
    member: rows.filter((p) => p.role === "member").length,
    admin: rows.filter((p) => p.role === "admin").length,
    byProvider: rows.reduce<Record<string, number>>((acc, p) => {
      acc[p.provider] = (acc[p.provider] ?? 0) + 1;
      return acc;
    }, {}),
  };

  const activeRole = role === "member" || role === "admin" ? role : undefined;
  const activeProvider = provider && Object.keys(PROVIDER_LABEL).includes(provider) ? provider : undefined;
  const query = (q ?? "").trim().toLowerCase();

  const filtered = rows.filter((p) => {
    if (activeRole && p.role !== activeRole) return false;
    if (activeProvider && p.provider !== activeProvider) return false;
    if (query) {
      const email = emailById.get(p.id) ?? "";
      const haystack = [p.name, email, p.phone].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  function filterHref(next: Filter) {
    const params = new URLSearchParams();
    if (next.role) params.set("role", next.role);
    if (next.provider) params.set("provider", next.provider);
    if (query) params.set("q", q!);
    const qs = params.toString();
    return qs ? `/admin/members?${qs}` : "/admin/members";
  }

  const navItemClass = (active: boolean) =>
    `flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
      active ? "bg-brand-soft text-brand-ink" : "text-foreground-soft hover:bg-surface"
    }`;

  return (
    <div>
      <h1 className="text-2xl font-bold">회원관리</h1>
      <p className="mt-1 text-sm text-foreground-soft">이메일·카카오·네이버·구글로 가입한 회원 목록입니다.</p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-52">
          <nav className="space-y-1">
            <Link href={filterHref({})} className={navItemClass(!activeRole && !activeProvider)}>
              전체 사용자 <span>{counts.all}</span>
            </Link>
            <Link href={filterHref({ role: "member" })} className={navItemClass(activeRole === "member" && !activeProvider)}>
              일반회원 <span>{counts.member}</span>
            </Link>
            <Link href={filterHref({ role: "admin" })} className={navItemClass(activeRole === "admin" && !activeProvider)}>
              관리자 <span>{counts.admin}</span>
            </Link>
          </nav>
          <p className="mt-4 px-3 text-xs font-semibold text-foreground-soft">가입 방법</p>
          <nav className="mt-1 space-y-1">
            {Object.entries(PROVIDER_LABEL).map(([value, label]) => (
              <Link key={value} href={filterHref({ provider: value })} className={navItemClass(activeProvider === value)}>
                {label} <span>{counts.byProvider[value] ?? 0}</span>
              </Link>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <form className="flex gap-2">
            <input type="hidden" name="role" value={activeRole ?? ""} />
            <input type="hidden" name="provider" value={activeProvider ?? ""} />
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="이름, 이메일, 연락처로 검색"
              className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
            <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand-ink">
              검색
            </button>
          </form>

          {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}

          {!error && filtered.length === 0 && <p className="mt-10 text-sm text-foreground-soft">조건에 맞는 회원이 없습니다.</p>}

          {!error && filtered.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-background">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-border bg-surface text-xs text-foreground-soft">
                  <tr>
                    <th className="px-4 py-3 font-semibold">이름</th>
                    <th className="px-4 py-3 font-semibold">이메일</th>
                    <th className="px-4 py-3 font-semibold">연락처</th>
                    <th className="px-4 py-3 font-semibold">가입방법</th>
                    <th className="px-4 py-3 font-semibold">회원유형</th>
                    <th className="px-4 py-3 font-semibold">가입일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => (
                    <tr key={p.id} className="cursor-pointer hover:bg-surface">
                      <td className="p-0">
                        <Link href={`/admin/members/${p.id}`} className="block whitespace-nowrap px-4 py-3 font-semibold">
                          {p.name || "이름 없음"}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/admin/members/${p.id}`} className="block whitespace-nowrap px-4 py-3">
                          {emailById.get(p.id) ?? "-"}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/admin/members/${p.id}`} className="block whitespace-nowrap px-4 py-3">
                          {p.phone || "-"}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/admin/members/${p.id}`} className="block whitespace-nowrap px-4 py-3">
                          {PROVIDER_LABEL[p.provider] ?? p.provider}
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/admin/members/${p.id}`} className="block whitespace-nowrap px-4 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${ROLE_BADGE[p.role]}`}>
                            {ROLE_LABEL[p.role]}
                          </span>
                        </Link>
                      </td>
                      <td className="p-0">
                        <Link href={`/admin/members/${p.id}`} className="block whitespace-nowrap px-4 py-3 text-foreground-soft">
                          {new Date(p.created_at).toLocaleDateString("ko-KR")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
