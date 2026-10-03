import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function countRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "inquiries" | "products" | "blog_posts" | "install_cases" | "rental_applications",
  match?: Record<string, string>
) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  if (match) {
    for (const [key, value] of Object.entries(match)) {
      query = query.eq(key, value);
    }
  }
  const { count } = await query;
  return count ?? 0;
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    newLeads,
    totalLeads,
    wonLeads,
    newApplications,
    totalApplications,
    wonApplications,
    totalProducts,
    totalBlogPosts,
    totalCases,
    totalMembers,
    newAsRequests,
    pendingContracts,
  ] = await Promise.all([
    countRows(supabase, "inquiries", { status: "new" }),
    countRows(supabase, "inquiries"),
    countRows(supabase, "inquiries", { status: "won" }),
    countRows(supabase, "rental_applications", { status: "new" }),
    countRows(supabase, "rental_applications"),
    countRows(supabase, "rental_applications", { status: "won" }),
    countRows(supabase, "products"),
    countRows(supabase, "blog_posts"),
    countRows(supabase, "install_cases"),
    // profiles·as_requests는 본인 행만 조회 가능한 RLS라, 전체 집계는 service role 클라이언트로 셉니다.
    createAdminClient()
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "member")
      .then(({ count }) => count ?? 0),
    createAdminClient()
      .from("as_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "new")
      .then(({ count }) => count ?? 0),
    supabase
      .from("rental_applications")
      .select("*", { count: "exact", head: true })
      .not("contract_token", "is", null)
      .is("contract_agreed_at", null)
      .then(({ count }) => count ?? 0),
  ]);

  const cards = [
    { label: "새 리드(문의)", value: newLeads, href: "/admin/leads", accent: true },
    { label: "새 렌탈신청", value: newApplications, href: "/admin/rental-applications", accent: true },
    { label: "전체 리드", value: totalLeads, href: "/admin/leads" },
    { label: "전체 렌탈신청", value: totalApplications, href: "/admin/rental-applications" },
    { label: "리드 계약성공", value: wonLeads, href: "/admin/leads" },
    { label: "렌탈신청 계약성공", value: wonApplications, href: "/admin/rental-applications" },
    { label: "등록 상품", value: totalProducts, href: "/admin/products" },
    { label: "블로그 글", value: totalBlogPosts, href: "/admin/blog" },
    { label: "설치사례", value: totalCases, href: "/admin/cases" },
    { label: "전체 회원", value: totalMembers, href: "/admin/members" },
    { label: "새 A/S·토너 요청", value: newAsRequests, href: "/admin/as-requests", accent: true },
    { label: "전자계약 서명 대기중", value: pendingContracts, href: "/admin/rental-contracts", accent: true },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">대시보드</h1>
      <p className="mt-1 text-sm text-foreground-soft">사이트 운영 현황을 한눈에 확인하세요.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-2xl border p-5 transition hover:shadow-sm ${
              c.accent ? "border-brand bg-brand-soft" : "border-border bg-background"
            }`}
          >
            <p className="text-xs font-semibold text-foreground-soft">{c.label}</p>
            <p className={`mt-2 text-3xl font-bold ${c.accent ? "text-brand-ink" : ""}`}>{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
