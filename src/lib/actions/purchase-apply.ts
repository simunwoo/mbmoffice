"use server";

import { randomBytes } from "crypto";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmTossPayment, getTossPayment, tossErrorKo, type TossPaymentData } from "@/lib/payments/toss";
import { sendPurchaseOrderNotification } from "@/lib/email";
import type { PurchaseOrderRow } from "@/lib/supabase/types";

export interface StartOrderAddonInput {
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface StartOrderInput {
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  /** 조합형 옵션 상품일 때 선택한 조합 (옵션이 없는 상품이면 둘 다 null) */
  variantId?: string | null;
  optionLabel?: string | null;
  /** 상세페이지에서 함께 선택한 추가 구매 상품들 */
  addonItems?: StartOrderAddonInput[];
  applicantName: string;
  applicantPhone: string;
  applicantEmail: string;
  companyName: string;
  businessRegNumber: string;
  receiverName: string;
  receiverPhone: string;
  zipCode: string;
  shippingAddress: string;
  deliveryMemo: string;
  notes: string;
}

export interface StartOrderResult {
  success: boolean;
  message?: string;
  order?: { dbId: string; tossOrderId: string; amount: number };
}

/** 토스페이먼츠 orderId 규칙(영문 대소문자·숫자·특수문자 -_=.@, 6~64자)에 맞는 주문번호를 생성합니다. */
function generateTossOrderId(): string {
  return `MBM${Date.now()}${randomBytes(4).toString("hex")}`;
}

/** 결제창을 띄우기 전, 주문 내용을 'pending' 상태로 먼저 저장합니다 (아직 결제는 진행되지 않습니다). */
export async function startPurchaseOrder(input: StartOrderInput): Promise<StartOrderResult> {
  if (
    !input.applicantName.trim() ||
    !input.applicantPhone.trim() ||
    !input.receiverName.trim() ||
    !input.receiverPhone.trim() ||
    !input.shippingAddress.trim()
  ) {
    return { success: false, message: "이름·연락처·배송 주소를 입력해 주세요." };
  }
  if (!isSupabaseConfigured()) {
    return { success: false, message: "지금은 온라인 주문이 준비 중입니다. 전화로 문의해 주세요." };
  }

  const supabase = await createClient();

  // 옵션 상품이면 재고·판매상태를 다시 한번 서버에서 확인합니다 (화면에 떠 있던 재고가 그 사이 바뀌었을 수 있음).
  if (input.variantId) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("id, product_id, status, stock")
      .eq("id", input.variantId)
      .maybeSingle();
    if (!variant || variant.product_id !== input.productId) {
      return { success: false, message: "선택한 옵션을 찾을 수 없습니다. 상품 페이지에서 다시 선택해 주세요." };
    }
    if (variant.status !== "selling" || variant.stock <= 0) {
      return { success: false, message: "선택한 옵션은 현재 품절입니다. 다른 옵션을 선택해 주세요." };
    }
  }

  const addonItems = input.addonItems ?? [];
  const amount = input.unitPrice * input.quantity + addonItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tossOrderId = generateTossOrderId();

  const { data, error } = await supabase
    .from("purchase_orders")
    .insert({
      product_id: input.productId,
      product_name: input.productName,
      unit_price: input.unitPrice,
      quantity: input.quantity,
      amount,
      applicant_name: input.applicantName.trim(),
      applicant_phone: input.applicantPhone.trim(),
      applicant_email: input.applicantEmail.trim() || null,
      company_name: input.companyName.trim() || null,
      business_reg_number: input.businessRegNumber.trim() || null,
      receiver_name: input.receiverName.trim(),
      receiver_phone: input.receiverPhone.trim(),
      zip_code: input.zipCode.trim() || null,
      shipping_address: input.shippingAddress.trim(),
      delivery_memo: input.deliveryMemo.trim() || null,
      notes: input.notes.trim() || null,
      toss_order_id: tossOrderId,
      variant_id: input.variantId ?? null,
      option_label: input.optionLabel ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[purchase-apply] insert error", error);
    return { success: false, message: "주문 생성 중 문제가 발생했습니다. 전화(1833-2613)로 문의해 주세요." };
  }

  if (addonItems.length > 0) {
    const { error: itemsError } = await supabase.from("purchase_order_items").insert(
      addonItems.map((item) => ({
        order_id: data.id,
        product_id: item.productId,
        product_name: item.productName,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        line_amount: item.unitPrice * item.quantity,
      }))
    );
    if (itemsError) {
      console.error("[purchase-apply] addon items insert error", itemsError);
    }
  }

  return { success: true, order: { dbId: data.id, tossOrderId, amount } };
}

export interface CompleteOrderResult {
  success: boolean;
  message?: string;
  order?: { productName: string; quantity: number; amount: number };
}

/**
 * 결제 승인 결과(토스가 검증해 준 상태)만 신뢰해 주문 상태를 반영합니다. 우리가 보낸 값이 아니라
 * 토스 응답의 orderId/amount/paymentKey가 주문과 일치하는지 다시 한번 교차 검증합니다.
 */
async function syncVerifiedPayment(
  admin: ReturnType<typeof createAdminClient>,
  order: PurchaseOrderRow,
  payment: TossPaymentData
): Promise<{ ok: true; status: PurchaseOrderRow["status"] } | { ok: false; message: string }> {
  if (payment.orderId !== order.toss_order_id || payment.totalAmount !== order.amount) {
    return { ok: false, message: "결제사 주문 정보가 일치하지 않습니다." };
  }
  if (order.toss_payment_key && order.toss_payment_key !== payment.paymentKey) {
    return { ok: false, message: "결제사 주문 정보가 일치하지 않습니다." };
  }

  let status: PurchaseOrderRow["status"];
  if (payment.status === "DONE") status = "paid";
  else if (payment.status === "CANCELED" || payment.status === "EXPIRED" || payment.status === "ABORTED") status = "failed";
  else return { ok: false, message: "결제 상태를 확인하지 못했습니다. 재결제하지 말고 담당자에게 문의해 주세요." };

  // 낙관적 동시성 제어: 그 사이 다른 요청이 이미 이 주문을 바꿨다면(updated_at 불일치) 이번 갱신은 건너뜁니다.
  const { data, error } = await admin
    .from("purchase_orders")
    .update({
      status,
      toss_payment_key: payment.paymentKey,
      paid_at: status === "paid" ? payment.approvedAt ?? new Date().toISOString() : order.paid_at,
    })
    .eq("id", order.id)
    .eq("updated_at", order.updated_at)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    // 이미 다른 요청이 같은 결과로 반영했을 가능성이 높으므로, 재조회 없이 성공으로 간주합니다(토스 상태 기준 멱등).
    return { ok: true, status };
  }
  return { ok: true, status };
}

/**
 * 토스페이먼츠 결제창에서 돌아온 뒤(successUrl) 서버에서 결제를 최종 승인합니다. 동시 요청(중복 클릭·
 * 새로고침)에도 실제 승인 API는 단 한 번만 호출되도록 DB 락(claim_purchase_order_operation)을 먼저
 * 선점하고, 이미 다른 요청이 선점했다면 승인을 다시 시도하지 않고 토스에서 현재 상태만 재조회합니다.
 */
export async function completePurchaseOrder(params: {
  paymentKey: string;
  tossOrderId: string;
  amount: number;
}): Promise<CompleteOrderResult> {
  const admin = createAdminClient();

  const { data: order } = await admin
    .from("purchase_orders")
    .select("*")
    .eq("toss_order_id", params.tossOrderId)
    .maybeSingle<PurchaseOrderRow>();

  if (!order) {
    return { success: false, message: "주문 정보를 찾을 수 없습니다." };
  }
  if (order.status === "paid") {
    return { success: true, order: { productName: order.product_name, quantity: order.quantity, amount: order.amount } };
  }
  if (order.status === "failed" || order.status === "canceled") {
    return { success: false, message: "이미 처리되었거나 취소된 주문입니다." };
  }
  if (order.amount !== params.amount) {
    return { success: false, message: "결제 금액이 주문 금액과 일치하지 않습니다. 전화로 문의해 주세요." };
  }

  const { data: claim, error: claimError } = await admin.rpc("claim_purchase_order_operation", {
    p_toss_order_id: params.tossOrderId,
  });
  if (claimError) {
    return { success: false, message: "결제 처리 중 문제가 발생했습니다. 전화로 문의해 주세요." };
  }
  const fresh = claim?.fresh === true;

  let result = fresh
    ? await confirmTossPayment(params.paymentKey, params.tossOrderId, params.amount)
    : await getTossPayment(params.paymentKey);
  if (!result.ok) result = await getTossPayment(params.paymentKey);
  if (!result.ok) {
    return { success: false, message: tossErrorKo(result.error.code, "결제 결과를 확인 중입니다. 재결제하지 말고 담당자에게 문의해 주세요.") };
  }

  const synced = await syncVerifiedPayment(admin, order, result.data);
  if (!synced.ok) {
    return { success: false, message: synced.message };
  }
  if (synced.status === "failed") {
    return { success: false, message: "취소되었거나 완료되지 않은 결제입니다." };
  }

  if (synced.status === "paid" && order.status === "pending") {
    const { data: items } = await admin.from("purchase_order_items").select("product_name, quantity").eq("order_id", order.id);
    await sendPurchaseOrderNotification({
      productName: order.product_name,
      quantity: order.quantity,
      optionLabel: order.option_label,
      amount: order.amount,
      applicantName: order.applicant_name,
      applicantPhone: order.applicant_phone,
      receiverName: order.receiver_name,
      receiverPhone: order.receiver_phone,
      shippingAddress: order.shipping_address,
      deliveryMemo: order.delivery_memo,
      addonItems: (items ?? []).map((i) => ({ productName: i.product_name, quantity: i.quantity })),
    });
  }

  return { success: true, order: { productName: order.product_name, quantity: order.quantity, amount: order.amount } };
}

/** 토스페이먼츠 결제창에서 실패/취소로 돌아왔을 때 주문 상태만 갱신합니다. */
export async function markPurchaseOrderFailed(tossOrderId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("purchase_orders").update({ status: "failed" }).eq("toss_order_id", tossOrderId).eq("status", "pending");
}
