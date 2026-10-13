"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

/**
 * 배송완료 건을 고객 대신 관리자가 구매확정 처리합니다 — 더 이상 관리가 필요 없는 주문이라고
 * 보고 목록에서 완전히 삭제합니다(배송완료 상태가 아니면 아무 일도 하지 않습니다, 실수로 진행 중인
 * 주문을 지우는 사고를 막기 위함).
 */
export async function confirmAndDeleteOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_orders")
    .delete()
    .eq("id", id)
    .eq("status", "paid")
    .eq("fulfillment_status", "delivered");

  if (!error) {
    revalidatePath("/admin/purchase-orders");
    revalidatePath("/admin");
    redirect("/admin/purchase-orders");
  }
}
