import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RentalApplicationDeleteButton, RentalApplicationStatusSelect } from "@/components/admin/RentalApplicationDetailActions";
import { PrintButton } from "@/components/admin/PrintButton";
import { SendContractButton } from "@/components/admin/SendContractButton";
import { CopyLinkField } from "@/components/admin/CopyLinkField";
import { ContractDocument } from "@/components/ContractDocument";
import { getOrigin } from "@/lib/origin";
import { isEmailConfigured } from "@/lib/email";
import { buildContractTerms, type ContractCategory } from "@/lib/contract";
import { updateInstallInfo } from "@/lib/actions/admin/rental-applications";
import type { RentalApplicationRow } from "@/lib/supabase/types";

export default async function AdminRentalApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: app } = await supabase
    .from("rental_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle<RentalApplicationRow>();

  if (!app) notFound();

  const origin = await getOrigin();
  const contractUrl = app.contract_token ? `${origin}/contract/${app.contract_token}` : null;

  let previewCategory: ContractCategory = "mfp";
  if (app.product_id) {
    const { data: product } = await supabase.from("products").select("category").eq("id", app.product_id).maybeSingle();
    if (product?.category === "pc" || product?.category === "notebook") previewCategory = "pc";
  }
  const previewText = buildContractTerms(app, previewCategory);

  return (
    <div className="mx-auto max-w-2xl print:max-w-none">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/admin/rental-applications" className="text-sm font-semibold text-foreground-soft hover:text-brand-ink">
          ← 렌탈신청 목록
        </Link>
        <PrintButton />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-6 print:mt-0 print:rounded-none print:border-none print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">{app.product_name}</h1>
            <p className="mt-1 text-sm text-foreground-soft">
              {new Date(app.created_at).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" })} 접수
            </p>
          </div>
          <div className="print:hidden">
            <RentalApplicationStatusSelect id={app.id} status={app.status} />
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-sm font-bold">계약조건</p>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-foreground-soft">요금제</dt>
              <dd className="mt-0.5 font-semibold">{app.plan_label || "상담 후 결정"}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-soft">약정 기간</dt>
              <dd className="mt-0.5 font-semibold">{app.term_months ? `${app.term_months}개월` : "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-soft">월 예상 금액</dt>
              <dd className="mt-0.5 font-semibold">{app.monthly_price ? `${app.monthly_price.toLocaleString()}원 (VAT 별도)` : "상담 후 확정"}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-soft">팩스 옵션</dt>
              <dd className="mt-0.5 font-semibold">{app.fax_option ? "포함" : "미포함"}</dd>
            </div>
            {app.usage_summary && (
              <div className="col-span-2">
                <dt className="text-xs text-foreground-soft">흑백·컬러 매수</dt>
                <dd className="mt-0.5 font-semibold text-brand-ink">{app.usage_summary}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-sm font-bold">신청자 정보</p>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-xs text-foreground-soft">이름</dt>
              <dd className="mt-0.5 font-semibold">{app.applicant_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-soft">연락처</dt>
              <dd className="mt-0.5 font-semibold">{app.applicant_phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-soft">이메일</dt>
              <dd className="mt-0.5 font-semibold">{app.applicant_email || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-soft">회사명</dt>
              <dd className="mt-0.5 font-semibold">{app.company_name || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-soft">사업자등록번호</dt>
              <dd className="mt-0.5 font-semibold">{app.business_reg_number || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-soft">월 렌탈료 결제일</dt>
              <dd className="mt-0.5 font-semibold">{app.payment_day ? `매월 ${app.payment_day}일` : "-"}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-sm font-bold">설치장소·일정</p>
          <dl className="mt-3 grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2">
              <dt className="text-xs text-foreground-soft">설치 주소</dt>
              <dd className="mt-0.5 font-semibold">{app.install_address}</dd>
            </div>
            <div>
              <dt className="text-xs text-foreground-soft">희망 설치일</dt>
              <dd className="mt-0.5 font-semibold">{app.install_date || "-"}</dd>
            </div>
          </dl>
          {app.notes && (
            <div className="mt-3">
              <p className="text-xs text-foreground-soft">요청사항</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{app.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-6 print:hidden">
        <p className="text-sm font-bold">설치 정보 입력 (계약서 제2조 반영)</p>
        <p className="mt-1 text-xs text-foreground-soft">
          기종·기계번호·요금계산 개시일·개시메타는 설치 당일에 확정되는 값입니다. 여기서 입력하면 아직 발급하지 않은
          계약서에 반영됩니다 (이미 발급된 계약서는 발급 당시 내용이 고정되어 바뀌지 않습니다).
        </p>
        <form action={updateInstallInfo} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={app.id} />
          <div>
            <label className="text-xs font-semibold text-foreground-soft">기종</label>
            <input
              name="install_model"
              defaultValue={app.install_model ?? ""}
              placeholder={app.product_name}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground-soft">기계번호 (SERIAL NO.)</label>
            <input
              name="install_serial_number"
              defaultValue={app.install_serial_number ?? ""}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground-soft">요금계산 개시일</label>
            <input
              type="date"
              name="install_billing_start_date"
              defaultValue={app.install_billing_start_date ?? ""}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-foreground-soft">개시메타 (매) — 요금 종류별로 따로 입력</label>
            <div className="mt-1 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[11px] text-foreground-soft">흑백</p>
                <input
                  type="number"
                  min={0}
                  name="install_initial_meter_mono"
                  defaultValue={app.install_initial_meter_mono ?? ""}
                  className="mt-0.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <p className="text-[11px] text-foreground-soft">컬러</p>
                <input
                  type="number"
                  min={0}
                  name="install_initial_meter_color"
                  defaultValue={app.install_initial_meter_color ?? ""}
                  className="mt-0.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <div>
                <p className="text-[11px] text-foreground-soft">A3 컬러</p>
                <input
                  type="number"
                  min={0}
                  name="install_initial_meter_a3_color"
                  defaultValue={app.install_initial_meter_a3_color ?? ""}
                  className="mt-0.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
              저장
            </button>
          </div>
        </form>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-6 print:hidden">
        <p className="text-sm font-bold">전자계약</p>

        {!app.contract_sent_at && (
          <details className="mt-2 rounded-lg border border-border">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-semibold text-brand-ink">
              계약서 내용 미리보기 ({previewCategory === "mfp" ? "복합기용" : "컴퓨터용"})
            </summary>
            <div className="max-h-[32rem] overflow-y-auto border-t border-border p-3">
              <ContractDocument text={previewText} />
            </div>
          </details>
        )}

        {!isEmailConfigured() && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            이메일 발송이 아직 설정되지 않았습니다(RESEND_API_KEY 미설정). 고객에게 자동으로 메일이 가지 않으니,
            아래 링크를 직접 복사해서 전달해 주세요.
          </p>
        )}

        {app.contract_agreed_at ? (
          <div className="mt-3 space-y-1 text-sm">
            <p className="font-semibold text-brand-ink">
              서명 완료 · {new Date(app.contract_agreed_at).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" })}
            </p>
            <p className="text-foreground-soft">서명자: {app.contract_agreed_name}</p>
            <p className="text-foreground-soft">IP: {app.contract_agreed_ip || "-"}</p>
          </div>
        ) : (
          <>
            <p className="mt-1 text-xs text-foreground-soft">
              {app.contract_sent_at
                ? `발급됨 · ${new Date(app.contract_sent_at).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" })} (서명 대기 중)`
                : "아직 계약서를 발급하지 않았습니다."}
            </p>
            {contractUrl && <CopyLinkField url={contractUrl} />}
            <div className="mt-3">
              <SendContractButton id={app.id} alreadySent={!!app.contract_sent_at} />
            </div>
          </>
        )}

        {app.contract_terms_text && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-sm font-bold">
              {app.contract_agreed_at ? "서명된 계약서 원문" : "발급된 계약서 원문 (고객이 보고 있는 내용)"}
            </p>
            <div className="mt-2 max-h-[32rem] overflow-y-auto">
              <ContractDocument text={app.contract_terms_text} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end print:hidden">
        <RentalApplicationDeleteButton id={app.id} />
      </div>
    </div>
  );
}
