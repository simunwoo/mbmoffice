import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RentalApplicationRowActions } from "@/components/admin/RentalApplicationRowActions";
import type { RentalApplicationRow } from "@/lib/supabase/types";

const STATUS_LABEL: Record<RentalApplicationRow["status"], string> = {
  new: "신규",
  contacted: "연락완료",
  closed: "종결(구분없음)",
  won: "계약성공",
  lost: "계약실패",
};

const STATUS_BADGE: Record<RentalApplicationRow["status"], string> = {
  new: "bg-brand-soft text-brand-ink",
  contacted: "bg-amber-100 text-amber-800",
  closed: "bg-surface text-foreground-soft",
  won: "bg-blue-100 text-blue-700",
  lost: "bg-red-100 text-red-700",
};

export default async function AdminRentalApplicationsPage() {
  const supabase = await createClient();
  const { data: applications, error } = await supabase
    .from("rental_applications")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">렌탈신청</h1>
      <p className="mt-1 text-sm text-foreground-soft">상품 상세페이지 &ldquo;렌탈 신청&rdquo; 버튼으로 들어온 신청 목록입니다.</p>

      {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}

      {!error && (!applications || applications.length === 0) && (
        <p className="mt-10 text-sm text-foreground-soft">아직 접수된 렌탈 신청이 없습니다.</p>
      )}

      {!error && applications && applications.length > 0 && (
        <div className="mt-6 space-y-3">
          {(applications as RentalApplicationRow[]).map((app) => (
            <div key={app.id} className="relative rounded-2xl border border-border bg-background p-4 transition hover:border-brand/40">
              <Link href={`/admin/rental-applications/${app.id}`} className="absolute inset-0 z-0" aria-label="상세보기" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-xs text-foreground-soft">
                    {new Date(app.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span className="font-semibold">{app.product_name}</span>
                  <span className="text-sm text-foreground-soft">
                    {app.plan_label ?? "-"}
                    {app.term_months ? ` · ${app.term_months}개월` : ""}
                    {app.fax_option ? " · 팩스" : ""}
                  </span>
                  {app.usage_summary && <span className="text-sm font-semibold text-brand-ink">{app.usage_summary}</span>}
                  <span className="text-sm font-semibold">
                    {app.monthly_price ? `${app.monthly_price.toLocaleString()}원` : "상담 후 확정"}
                  </span>
                </div>
                <div className="relative z-10 flex items-center gap-2">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[app.status]}`}>
                    {STATUS_LABEL[app.status]}
                  </span>
                  <RentalApplicationRowActions id={app.id} status={app.status} />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground-soft">
                <span>
                  {app.applicant_name}
                  {app.company_name ? ` (${app.company_name})` : ""} · {app.applicant_phone}
                </span>
                <span>
                  {app.install_address}
                  {app.install_date ? ` (희망일: ${app.install_date})` : ""}
                </span>
                {app.notes && <span>요청사항: {app.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
