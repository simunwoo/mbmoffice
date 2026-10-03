"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateMyProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const companyName = String(formData.get("company_name") || "").trim();

  if (!name || !phone) return;

  await supabase
    .from("profiles")
    .update({ name, phone, company_name: companyName || null })
    .eq("id", user.id);

  revalidatePath("/mypage");
}

export async function submitAsRequest(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const requestType = formData.get("request_type") === "toner" ? "toner" : "as";
  const description = String(formData.get("description") || "").trim();
  const rentalApplicationId = String(formData.get("rental_application_id") || "") || null;
  const contractLabel = String(formData.get("contract_label") || "") || null;

  if (!description) return;

  await supabase.from("as_requests").insert({
    member_id: user.id,
    rental_application_id: rentalApplicationId,
    contract_label: contractLabel,
    request_type: requestType,
    description,
  });

  revalidatePath("/mypage");
}
