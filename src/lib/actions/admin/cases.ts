"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { InstallCaseInsert } from "@/lib/supabase/types";
import { matchSlug } from "@/lib/data/normalize";
import { regionCopy, industryCopy } from "@/lib/site-config";

export interface CaseFormState {
  status: "idle" | "error";
  message?: string;
}

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildCaseInsert(formData: FormData): InstallCaseInsert {
  const region = String(formData.get("region") || "").trim() || null;
  const industry = String(formData.get("industry") || "").trim() || null;

  return {
    title: String(formData.get("title") || "").trim(),
    region,
    region_slug: matchSlug(region, regionCopy),
    industry,
    industry_slug: matchSlug(industry, industryCopy),
    brand: String(formData.get("brand") || "").trim() || null,
    model: String(formData.get("model") || "").trim() || null,
    category: String(formData.get("category") || "").trim() || null,
    body: String(formData.get("body") || "").trim(),
    body_html: String(formData.get("bodyHtml") || "").trim() || null,
    images: linesToArray(String(formData.get("images") || "")),
    case_date: String(formData.get("caseDate") || "").trim() || null,
    status: String(formData.get("status") || "published") as InstallCaseInsert["status"],
  };
}

export async function createInstallCase(_prev: CaseFormState, formData: FormData): Promise<CaseFormState> {
  const payload = buildCaseInsert(formData);
  if (!payload.title || !payload.body) {
    return { status: "error", message: "제목과 본문을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("install_cases").insert(payload);
  if (error) return { status: "error", message: `등록 중 오류가 발생했습니다: ${error.message}` };

  revalidatePath("/admin/cases");
  revalidatePath("/cases");
  redirect("/admin/cases");
}

export async function updateInstallCase(id: string, _prev: CaseFormState, formData: FormData): Promise<CaseFormState> {
  const payload = buildCaseInsert(formData);
  if (!payload.title || !payload.body) {
    return { status: "error", message: "제목과 본문을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("install_cases").update(payload).eq("id", id);
  if (error) return { status: "error", message: `수정 중 오류가 발생했습니다: ${error.message}` };

  revalidatePath("/admin/cases");
  revalidatePath("/cases");
  redirect("/admin/cases");
}

export async function deleteInstallCase(id: string) {
  const supabase = await createClient();
  await supabase.from("install_cases").delete().eq("id", id);
  revalidatePath("/admin/cases");
  revalidatePath("/cases");
}
