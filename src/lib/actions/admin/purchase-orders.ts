"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseOrderRow } from "@/lib/supabase/types";

export type FulfillmentStatus = NonNullable<PurchaseOrderRow["fulfillment_status"]>;

/** 배송 진행 단계만 바꿉니다 (예: 상품준비중 → 배송대기 → 배송중 → 배송완료). */
export async function updateFulfillmentStatus(id: string, fulfillmentStatus: FulfillmentStatus) {
  const supabase = await createClient();
  await supabase.from("purchase_orders").update({ fulfillment_status: fulfillmentStatus }).eq("id", id);
  revalidatePath("/admin/purchase-orders");
  revalidatePath(`/admin/purchase-orders/${id}`);
  revalidatePath("/admin");
}

/** 택배사·송장번호를 저장합니다 — 입력하면 배송 단계가 자동으로 "배송중"으로 바뀝니다. */
export async function updateShippingInfo(id: string, formData: FormData) {
  const carrier = String(formData.get("carrier") || "").trim();
  const trackingNumber = String(formData.get("trackingNumber") || "").trim();

  const supabase = await createClient();
  await supabase
    .from("purchase_orders")
    .update({
      carrier: carrier || null,
      tracking_number: trackingNumber || null,
      ...(trackingNumber ? { fulfillment_status: "shipping" as const } : {}),
    })
    .eq("id", id);

  revalidatePath("/admin/purchase-orders");
  revalidatePath(`/admin/purchase-orders/${id}`);
}
