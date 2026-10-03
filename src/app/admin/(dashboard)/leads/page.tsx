import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LeadRowActions } from "@/components/admin/LeadRowActions";
import type { InquiryRow } from "@/lib/supabase/types";

const STATUS_LABEL: Record<InquiryRow["status"], string> = {
  new: "신규",
  contacted: "연락완료",
  closed: "종결(구분없음)",
  won: "계약성공",
  lost: "계약실패",
};

const STATUS_BADGE: Record<InquiryRow["status"], string> = {
  new: "bg-brand-soft text-brand-ink",
  contacted: "bg-amber-100 text-amber-800",
  closed: "bg-surface text-foreground-soft",
  won: "bg-blue-100 text-blue-700",
  lost: "bg-red-100 text-red-700",
};

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const { data: leads, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">리드 (온라인 견적문의)</h1>
      <p className="mt-1 text-sm text-foreground-soft">홈페이지 견적문의 폼으로 들어온 고객 문의 목록입니다.</p>

      {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}

      {!error && (!leads || leads.length === 0) && (
        <p className="mt-10 text-sm text-foreground-soft">아직 접수된 문의가 없습니다.</p>
      )}

      {!error && leads && leads.length > 0 && (
        <div className="mt-6 space-y-3">
          {(leads as InquiryRow[]).map((lead) => (
            <div key={lead.id} className="relative rounded-2xl border border-border bg-background p-4 transition hover:border-brand/40">
              <Link href={`/admin/leads/${lead.id}`} className="absolute inset-0 z-0" aria-label="상세보기" />
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-xs text-foreground-soft">
                    {new Date(lead.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span className="font-semibold">{lead.name}</span>
                  <span className="text-sm text-foreground-soft">
                    {lead.phone}
                    {lead.email ? ` · ${lead.email}` : ""}
                    {lead.company_name ? ` · ${lead.company_name}` : ""}
                  </span>
                  {lead.interest && <span className="text-sm font-semibold text-brand-ink">{lead.interest}</span>}
                </div>
                <div className="relative z-10 flex items-center gap-2">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[lead.status]}`}>
                    {STATUS_LABEL[lead.status]}
                  </span>
                  <LeadRowActions id={lead.id} status={lead.status} />
                </div>
              </div>

              {lead.message && (
                <p className="mt-2 text-sm text-foreground-soft">문의내용: {lead.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
