"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendContractSignedCopyToCustomer, sendContractSignedNotification } from "@/lib/email";
import { isContractExpired } from "@/lib/contract";
import type { RentalApplicationRow } from "@/lib/supabase/types";

export interface AgreeState {
  status: "idle" | "error" | "success";
  message?: string;
}

function normalizePhone(v: string) {
  return v.replace(/\D/g, "");
}
function normalizeName(v: string) {
  return v.trim().replace(/\s+/g, "");
}

export async function agreeToContract(_prev: AgreeState, formData: FormData): Promise<AgreeState> {
  const token = String(formData.get("token") || "");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const consent = formData.get("consent") === "on";

  if (!token || !name || !phone) {
    return { status: "error", message: "성함과 연락처를 모두 입력해 주세요." };
  }
  if (!consent) {
    return { status: "error", message: "계약 내용에 동의한다는 체크박스를 선택해 주세요." };
  }

  const admin = createAdminClient();
  const { data: app } = await admin
    .from("rental_applications")
    .select("*")
    .eq("contract_token", token)
    .maybeSingle<RentalApplicationRow>();

  if (!app) {
    return { status: "error", message: "유효하지 않은 계약 링크입니다." };
  }
  if (app.contract_agreed_at) {
    return { status: "error", message: "이미 서명이 완료된 계약입니다." };
  }
  if (isContractExpired(app.contract_sent_at)) {
    return { status: "error", message: "계약 링크가 만료되었습니다. 담당자에게 재발송을 요청해 주세요." };
  }

  // 본인 확인: 신청서에 기재된 성함·연락처와 일치해야만 서명할 수 있습니다.
  if (normalizeName(name) !== normalizeName(app.applicant_name) || normalizePhone(phone) !== normalizePhone(app.applicant_phone)) {
    return { status: "error", message: "입력하신 성함 또는 연락처가 신청서 정보와 일치하지 않습니다." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const userAgent = h.get("user-agent");
  const agreedAt = new Date().toISOString();

  const { error } = await admin
    .from("rental_applications")
    .update({
      status: "won",
      contract_agreed_at: agreedAt,
      contract_agreed_name: name,
      contract_agreed_ip: ip,
      contract_agreed_user_agent: userAgent,
    })
    .eq("id", app.id);

  if (error) {
    return { status: "error", message: "서명 처리 중 오류가 발생했습니다. 다시 시도해 주세요." };
  }

  const agreedAtLabel = new Date(agreedAt).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "medium" });
  await sendContractSignedNotification({ applicantName: app.applicant_name, productName: app.product_name, agreedAt: agreedAtLabel });
  if (app.applicant_email) {
    await sendContractSignedCopyToCustomer({
      to: app.applicant_email,
      applicantName: app.applicant_name,
      agreedAt: agreedAtLabel,
      termsText: app.contract_terms_text || "",
    });
  }

  return { status: "success" };
}
