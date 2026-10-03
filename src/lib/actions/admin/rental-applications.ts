"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrigin } from "@/lib/origin";
import { buildContractTerms, hashContractTerms, type ContractCategory } from "@/lib/contract";
import { sendContractInviteEmail } from "@/lib/email";
import type { RentalApplicationRow } from "@/lib/supabase/types";

export async function updateRentalApplicationStatus(id: string, status: "new" | "contacted" | "closed" | "won" | "lost") {
  const supabase = await createClient();
  await supabase.from("rental_applications").update({ status }).eq("id", id);
  revalidatePath("/admin/rental-applications");
  revalidatePath(`/admin/rental-applications/${id}`);
  revalidatePath("/admin");
}

export async function deleteRentalApplication(id: string) {
  const supabase = await createClient();
  await supabase.from("rental_applications").delete().eq("id", id);
  revalidatePath("/admin/rental-applications");
  revalidatePath("/admin");
}

export async function deleteRentalApplicationAndRedirect(id: string) {
  await deleteRentalApplication(id);
  redirect("/admin/rental-applications");
}

/** 설치 당일에 확정되는 기종·기계번호·요금계산 개시일·개시메타를 담당 직원이 입력합니다. */
export async function updateInstallInfo(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const model = String(formData.get("install_model") || "").trim();
  const serialNumber = String(formData.get("install_serial_number") || "").trim();
  const billingStartDate = String(formData.get("install_billing_start_date") || "").trim();
  const meterRaw = String(formData.get("install_initial_meter") || "").trim();
  const meter = meterRaw ? Number(meterRaw) : null;

  const supabase = await createClient();
  await supabase
    .from("rental_applications")
    .update({
      install_model: model || null,
      install_serial_number: serialNumber || null,
      install_billing_start_date: billingStartDate || null,
      install_initial_meter: meter != null && !Number.isNaN(meter) ? meter : null,
    })
    .eq("id", id);

  revalidatePath(`/admin/rental-applications/${id}`);
}

export interface SendContractResult {
  success: boolean;
  message?: string;
}

/**
 * 전자계약 서명 링크를 새로 발급해 고객에게 이메일로 보냅니다. 다시 보낼 때마다 토큰을
 * 새로 발급해서 이전 링크는 무효화됩니다 (계약조건이 바뀐 뒤 재발송하는 경우 대비).
 */
export async function sendRentalContract(id: string): Promise<SendContractResult> {
  const admin = createAdminClient();
  const { data: app } = await admin.from("rental_applications").select("*").eq("id", id).maybeSingle<RentalApplicationRow>();

  if (!app) return { success: false, message: "신청 정보를 찾을 수 없습니다." };
  if (!app.applicant_email) return { success: false, message: "신청자 이메일이 없어 전자계약을 보낼 수 없습니다." };
  if (app.contract_agreed_at) return { success: false, message: "이미 서명 완료된 계약입니다." };

  let category: ContractCategory = "mfp";
  if (app.product_id) {
    const { data: product } = await admin.from("products").select("category").eq("id", app.product_id).maybeSingle();
    if (product?.category === "pc" || product?.category === "notebook") category = "pc";
  }

  const token = randomUUID();
  const termsText = buildContractTerms(app, category);
  const termsHash = hashContractTerms(termsText);
  const snapshot = {
    productName: app.product_name,
    planLabel: app.plan_label,
    termMonths: app.term_months,
    monthlyPrice: app.monthly_price,
    faxOption: app.fax_option,
    usageSummary: app.usage_summary,
  };

  const { error } = await admin
    .from("rental_applications")
    .update({
      contract_token: token,
      contract_sent_at: new Date().toISOString(),
      contract_terms_snapshot: snapshot,
      contract_terms_text: termsText,
      contract_terms_hash: termsHash,
    })
    .eq("id", id);

  if (error) return { success: false, message: "계약서 발송 준비 중 오류가 발생했습니다." };

  const origin = await getOrigin();
  await sendContractInviteEmail({
    to: app.applicant_email,
    applicantName: app.applicant_name,
    productName: app.product_name,
    contractUrl: `${origin}/contract/${token}`,
  });

  revalidatePath(`/admin/rental-applications/${id}`);
  return { success: true };
}
