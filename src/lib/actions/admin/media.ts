"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface UploadMediaResult {
  url?: string;
  error?: string;
}

const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

/** 블로그·설치사례 리치 텍스트 에디터에서 이미지·첨부파일을 storage의 media 버킷에 올립니다. */
export async function uploadMedia(formData: FormData): Promise<UploadMediaResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return { error: "관리자만 업로드할 수 있습니다." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "파일을 선택해 주세요." };
  if (file.size > MAX_SIZE_BYTES) return { error: "파일 용량은 20MB 이하만 업로드할 수 있습니다." };

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error } = await admin.storage.from("media").upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) return { error: error.message };

  const { data } = admin.storage.from("media").getPublicUrl(path);
  return { url: data.publicUrl };
}
