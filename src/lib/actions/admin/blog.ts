"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BlogPostInsert } from "@/lib/supabase/types";

export interface BlogFormState {
  status: "idle" | "error";
  message?: string;
}

function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildBlogInsert(formData: FormData): BlogPostInsert {
  return {
    title: String(formData.get("title") || "").trim(),
    category: String(formData.get("category") || "").trim() || null,
    body: String(formData.get("body") || "").trim(),
    body_html: String(formData.get("bodyHtml") || "").trim() || null,
    images: linesToArray(String(formData.get("images") || "")),
    post_date: String(formData.get("postDate") || "").trim() || null,
    source: "admin",
    status: String(formData.get("status") || "published") as BlogPostInsert["status"],
  };
}

export async function createBlogPost(_prev: BlogFormState, formData: FormData): Promise<BlogFormState> {
  const payload = buildBlogInsert(formData);
  if (!payload.title || !payload.body) {
    return { status: "error", message: "제목과 본문을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").insert(payload);
  if (error) return { status: "error", message: `등록 중 오류가 발생했습니다: ${error.message}` };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function updateBlogPost(id: string, _prev: BlogFormState, formData: FormData): Promise<BlogFormState> {
  const payload = buildBlogInsert(formData);
  if (!payload.title || !payload.body) {
    return { status: "error", message: "제목과 본문을 입력해 주세요." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").update(payload).eq("id", id);
  if (error) return { status: "error", message: `수정 중 오류가 발생했습니다: ${error.message}` };

  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function deleteBlogPost(id: string) {
  const supabase = await createClient();
  await supabase.from("blog_posts").delete().eq("id", id);
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
}
