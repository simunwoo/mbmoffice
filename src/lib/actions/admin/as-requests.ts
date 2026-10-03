"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateAsRequestStatus(id: string, status: "new" | "in_progress" | "done") {
  const admin = createAdminClient();
  await admin.from("as_requests").update({ status }).eq("id", id);
  revalidatePath("/admin/as-requests");
  revalidatePath("/admin");
}

export async function deleteAsRequest(id: string) {
  const admin = createAdminClient();
  await admin.from("as_requests").delete().eq("id", id);
  revalidatePath("/admin/as-requests");
  revalidatePath("/admin");
}
