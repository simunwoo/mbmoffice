"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateLeadStatus(id: string, status: "new" | "contacted" | "closed" | "won" | "lost") {
  const supabase = await createClient();
  await supabase.from("inquiries").update({ status }).eq("id", id);
  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin");
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  await supabase.from("inquiries").delete().eq("id", id);
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
}

export async function deleteLeadAndRedirect(id: string) {
  await deleteLead(id);
  redirect("/admin/leads");
}
