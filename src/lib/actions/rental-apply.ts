"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { sendRentalApplicationNotification } from "@/lib/email";

export interface StartApplicationInput {
  productId: string | null;
  productName: string;
  planLabel: string | null;
  termMonths: number | null;
  faxOption: boolean;
  monthlyPrice: number | null;
  usageSummary: string | null;
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  companyName: string;
  businessRegNumber: string;
  installAddress: string;
  installDate: string;
  notes: string;
}

export interface StartApplicationResult {
  success: boolean;
  message?: string;
}

/** 렌탈 신청서(계약조건·신청자정보·설치장소) 내용을 저장하고 관리자에게 알림 메일을 보냅니다. */
export async function startRentalApplication(input: StartApplicationInput): Promise<StartApplicationResult> {
  if (!input.applicantName.trim() || !input.applicantPhone.trim() || !input.installAddress.trim()) {
    return { success: false, message: "이름·연락처·설치 주소를 입력해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, message: "지금은 온라인 신청 접수가 준비 중입니다. 전화로 문의해 주세요." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("rental_applications").insert({
    product_id: input.productId,
    product_name: input.productName,
    plan_label: input.planLabel,
    term_months: input.termMonths,
    fax_option: input.faxOption,
    monthly_price: input.monthlyPrice,
    usage_summary: input.usageSummary,
    applicant_name: input.applicantName.trim(),
    applicant_phone: input.applicantPhone.trim(),
    applicant_email: input.applicantEmail.trim() || null,
    company_name: input.companyName.trim() || null,
    business_reg_number: input.businessRegNumber.trim() || null,
    install_address: input.installAddress.trim(),
    install_date: input.installDate || null,
    notes: input.notes.trim() || null,
  });

  if (error) {
    console.error("[rental-apply] insert error", error);
    return { success: false, message: "신청 접수 중 문제가 발생했습니다. 전화(1833-2613)로 문의해 주세요." };
  }

  await sendRentalApplicationNotification({
    productName: input.productName,
    planLabel: input.planLabel,
    termMonths: input.termMonths,
    monthlyPrice: input.monthlyPrice,
    usageSummary: input.usageSummary,
    applicantName: input.applicantName,
    applicantPhone: input.applicantPhone,
    installAddress: input.installAddress,
  });

  return { success: true };
}
