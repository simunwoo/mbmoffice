"use server";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { sendInquiryNotification } from "@/lib/email";
import { revalidatePath } from "next/cache";

export interface InquiryFormState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function submitInquiry(_prev: InquiryFormState, formData: FormData): Promise<InquiryFormState> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const companyName = String(formData.get("companyName") || "").trim();
  const interests = formData
    .getAll("interest")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const interest = interests.join(", ");
  const message = String(formData.get("message") || "").trim();
  const consent = formData.get("consent");

  if (!name || !phone || !email || interests.length === 0) {
    return { status: "error", message: "필수 항목(*)을 모두 입력해 주세요." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "이메일 주소 형식을 확인해 주세요." };
  }
  if (!consent) {
    return { status: "error", message: "개인정보 수집 및 이용에 동의해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    console.warn("[inquiry] Supabase 미설정 — 문의 내용이 저장되지 않았습니다:", { name, phone });
    return {
      status: "error",
      message: "죄송합니다. 지금은 온라인 접수가 준비 중입니다. 전화(1833-2613)로 문의해 주세요.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("inquiries").insert({
    name,
    phone,
    company_name: companyName || null,
    interest: interest || null,
    message: message || null,
    email,
    attachments: [],
  });

  if (error) {
    console.error("[inquiry] insert error", error);
    return { status: "error", message: "문의 접수 중 문제가 발생했습니다. 전화(1833-2613)로 문의해 주세요." };
  }

  await sendInquiryNotification({
    name,
    phone,
    email,
    companyName: companyName || null,
    interest: interest || null,
    message: message || null,
  }).catch((e) => {
    console.error("[email] 알림 발송 실패", e);
  });

  revalidatePath("/admin/inquiries");

  return { status: "success", message: "문의가 접수되었습니다. 영업시간 기준 당일 회신드리겠습니다." };
}
