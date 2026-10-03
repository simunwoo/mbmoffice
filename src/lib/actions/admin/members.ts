"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function updateMemberRole(id: string, role: "member" | "admin") {
  const admin = createAdminClient();
  await admin.from("profiles").update({ role }).eq("id", id);
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${id}`);
}

export async function updateMemberNote(id: string, note: string) {
  const admin = createAdminClient();
  await admin.from("profiles").update({ admin_note: note || null }).eq("id", id);
  revalidatePath(`/admin/members/${id}`);
}

export async function updateMemberNoteAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  const note = String(formData.get("note") || "");
  if (!id) return;
  await updateMemberNote(id, note);
}

export async function deleteMember(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id === id) return; // 본인 계정은 여기서 삭제할 수 없습니다.

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(id);
  revalidatePath("/admin/members");
  revalidatePath("/admin");
}

export async function deleteMemberAndRedirect(id: string) {
  await deleteMember(id);
  redirect("/admin/members");
}
