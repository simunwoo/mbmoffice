"use server";

import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getOrigin } from "@/lib/origin";

export interface AuthState {
  status: "idle" | "error" | "check-email";
  message?: string;
}

export async function customerSignup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "회원 서비스가 아직 설정되지 않았습니다." };
  }

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    return { status: "error", message: "이름·이메일·비밀번호를 입력해 주세요." };
  }
  if (password.length < 8) {
    return { status: "error", message: "비밀번호는 8자 이상이어야 합니다." };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone, provider: "email" },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { status: "error", message: error.message.includes("already registered") ? "이미 가입된 이메일입니다." : "회원가입 중 문제가 발생했습니다." };
  }

  if (data.session) {
    redirect("/mypage");
  }

  return { status: "check-email", message: "가입을 완료하려면 이메일로 보내드린 확인 링크를 눌러 주세요." };
}

export async function customerLogin(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "회원 서비스가 아직 설정되지 않았습니다." };
  }

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/mypage");

  if (!email || !password) {
    return { status: "error", message: "이메일과 비밀번호를 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }

  redirect(next.startsWith("/admin") ? "/mypage" : next);
}

export async function customerLogout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) {
    return { status: "error", message: "회원 서비스가 아직 설정되지 않았습니다." };
  }

  const email = String(formData.get("email") || "").trim();
  if (!email) {
    return { status: "error", message: "이메일을 입력해 주세요." };
  }

  const supabase = await createClient();
  const origin = await getOrigin();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/login/reset/confirm` });

  // 가입 여부를 노출하지 않기 위해 항상 같은 안내 문구를 보여줍니다.
  return { status: "check-email", message: "비밀번호 재설정 링크를 이메일로 보내드렸습니다." };
}

export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    return { status: "error", message: "비밀번호는 8자 이상이어야 합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { status: "error", message: "비밀번호 변경에 실패했습니다. 링크가 만료되었을 수 있습니다." };
  }

  redirect("/mypage");
}
