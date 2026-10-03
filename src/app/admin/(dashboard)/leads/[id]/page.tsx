import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadDeleteButton, LeadStatusSelect } from "@/components/admin/LeadDetailActions";
import { PrintButton } from "@/components/admin/PrintButton";
import type { InquiryRow } from "@/lib/supabase/types";

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lead } = await supabase.from("inquiries").select("*").eq("id", id).maybeSingle<InquiryRow>();

  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-2xl print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/admin/leads" className="text-sm font-semibold text-foreground-soft hover:text-brand-ink">
          ← 리드 목록
        </Link>
        <PrintButton />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-6 print:mt-0 print:rounded-none print:border-none print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{lead.name}</h1>
            <p className="mt-1 text-sm text-foreground-soft">
              {new Date(lead.created_at).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" })} 접수
            </p>
          </div>
          <div className="print:hidden">
            <LeadStatusSelect id={lead.id} status={lead.status} />
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-foreground-soft">연락처</dt>
            <dd className="mt-0.5 font-semibold">{lead.phone}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-soft">이메일</dt>
            <dd className="mt-0.5 font-semibold">{lead.email || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-soft">회사명</dt>
            <dd className="mt-0.5 font-semibold">{lead.company_name || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-foreground-soft">관심 상품</dt>
            <dd className="mt-0.5 font-semibold">{lead.interest || "-"}</dd>
          </div>
        </dl>

        {lead.message && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs text-foreground-soft">문의내용</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{lead.message}</p>
          </div>
        )}

        {lead.attachments && lead.attachments.length > 0 && (
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs text-foreground-soft">첨부파일</p>
            <ul className="mt-2 space-y-1">
              {lead.attachments.map((url) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-brand-ink hover:underline">
                    {url.split("/").pop()}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end print:hidden">
        <LeadDeleteButton id={lead.id} />
      </div>
    </div>
  );
}
