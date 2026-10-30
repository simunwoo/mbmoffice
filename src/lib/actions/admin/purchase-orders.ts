"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseOrderRow } from "@/lib/supabase/types";
import { sendOrderStatusEmailToCustomer, type OrderStatusEmailKind } from "@/lib/email";

export type FulfillmentStatus = NonNullable<PurchaseOrderRow["fulfillment_status"]>;

// 상품준비중·배송대기처럼 세세한 내부 단계는 메일을 보내지 않고, 고객이 실제로 궁금해할 핵심
// 단계로 바뀔 때만 보냅니다.
const EMAIL_KIND_BY_FULFILLMENT: Partial<Record<FulfillmentStatus, OrderStatusEmailKind>> = {
  shipping: "shipping",
  delivered: "delivered",
  cancel_requested: "cancel_requested",
  return_requested: "return_requested",
};

async function notifyCustomerOfStatus(order: PurchaseOrderRow, kind: OrderStatusEmailKind) {
  if (!order.applicant_email) return;
  await sendOrderStatusEmailToCustomer({
    to: order.applicant_email,
    kind,
    applicantName: order.applicant_name,
    productName: order.product_name,
    optionLabel: order.option_label,
    orderId: order.toss_order_id,
    carrier: order.carrier,
    trackingNumber: order.tracking_number,
  });
}

/** 배송 진행 단계만 바꿉니다 (예: 상품준비중 → 배송대기 → 배송중 → 배송완료). 핵심 단계면 고객에게 메일도 보냅니다. */
export async function updateFulfillmentStatus(id: string, fulfillmentStatus: FulfillmentStatus) {
  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("purchase_orders")
    .update({ fulfillment_status: fulfillmentStatus })
    .eq("id", id)
    .select("*")
    .single<PurchaseOrderRow>();

  revalidatePath("/admin/purchase-orders");
  revalidatePath(`/admin/purchase-orders/${id}`);
  revalidatePath("/admin");

  if (!error && order) {
    const kind = EMAIL_KIND_BY_FULFILLMENT[fulfillmentStatus];
    if (kind) await notifyCustomerOfStatus(order, kind);
  }
}

/** 택배사·송장번호를 저장합니다 — 입력하면 배송 단계가 자동으로 "배송중"으로 바뀌고, 고객에게 발송 안내 메일이 갑니다. */
export async function updateShippingInfo(id: string, formData: FormData) {
  const carrier = String(formData.get("carrier") || "").trim();
  const trackingNumber = String(formData.get("trackingNumber") || "").trim();

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("purchase_orders")
    .update({
      carrier: carrier || null,
      tracking_number: trackingNumber || null,
      ...(trackingNumber ? { fulfillment_status: "shipping" as const } : {}),
    })
    .eq("id", id)
    .select("*")
    .single<PurchaseOrderRow>();

  revalidatePath("/admin/purchase-orders");
  revalidatePath(`/admin/purchase-orders/${id}`);

  if (!error && order && trackingNumber) {
    await notifyCustomerOfStatus(order, "shipping");
  }
}

/**
 * 결제 전(결제대기) 또는 결제 실패 주문을 관리자가 직접 취소 처리합니다 — 고객이 결제를 끝내지
 * 않고 이탈했거나, 다른 사유로 더 이상 유효하지 않은 주문을 정리할 때 씁니다. 이미 결제가 완료된
 * (status='paid') 주문은 여기서 취소할 수 없고, 배송 단계의 "취소접수" 버튼을 써야 합니다 — 실수로
 * 결제된 주문을 취소 처리해 환불 누락 사고가 나는 것을 막기 위함입니다.
 */
export async function cancelUnpaidOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_orders")
    .update({ status: "canceled" as const })
    .eq("id", id)
    .in("status", ["pending", "failed"]);

  if (!error) {
    revalidatePath("/admin/purchase-orders");
    revalidatePath(`/admin/purchase-orders/${id}`);
    revalidatePath("/admin");
  }
}

/**
 * 배송완료 건을 관리자가 "구매확정(정산)" 처리합니다 — 목록에서 사라지고 정산 내역으로 넘어갑니다.
 * 매출 기록은 지우지 않고 settled_at만 채웁니다(배송완료 상태가 아니면 아무 일도 하지 않습니다,
 * 실수로 진행 중인 주문을 정산 처리하는 사고를 막기 위함).
 */
export async function confirmSettlement(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("purchase_orders")
    .update({ settled_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "paid")
    .eq("fulfillment_status", "delivered");

  if (!error) {
    revalidatePath("/admin/purchase-orders");
    revalidatePath("/admin/settlements");
    revalidatePath("/admin");
    redirect("/admin/purchase-orders");
  }
}
