import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseOrderRow } from "@/lib/supabase/types";
import { updateFulfillmentStatus, updateShippingInfo } from "@/lib/actions/admin/purchase-orders";

const PAYMENT_STATUS_LABEL: Record<PurchaseOrderRow["status"], string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "결제 실패",
  canceled: "취소",
};

const FULFILLMENT_LABEL: Record<NonNullable<PurchaseOrderRow["fulfillment_status"]>, string> = {
  preparing: "상품준비중",
  ready_to_ship: "배송대기",
  shipping: "배송중",
  delivered: "배송완료",
  cancel_requested: "취소접수",
  return_requested: "반품접수",
};

// 결제대기 → 상품준비중 → 배송대기 → 배송중 → 배송완료 (취소접수/반품접수는 아무 단계에서나 예외적으로 발생) 까지
// 한 주문의 전체 진행 단계를 하나의 버튼 줄로 보여주고 바로 바꿀 수 있게 합니다.
const FULFILLMENT_STEPS = ["preparing", "ready_to_ship", "shipping", "delivered", "cancel_requested", "return_requested"] as const;

export default async function AdminPurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase.from("purchase_orders").select("*").eq("id", id).maybeSingle<PurchaseOrderRow>();
  if (!order) notFound();

  const { data: items } = await supabase.from("purchase_order_items").select("*").eq("order_id", id);

  const productIds = [order.product_id, ...(items ?? []).map((i) => i.product_id)].filter((v): v is string => !!v);
  const { data: productRows } = productIds.length ? await supabase.from("products").select("id, images").in("id", productIds) : { data: [] };
  const imageByProductId = new Map((productRows ?? []).map((p) => [p.id, p.images?.[0] as string | undefined]));

  const statusKey = order.status === "paid" ? order.fulfillment_status ?? "preparing" : order.status;
  const statusLabel = order.status === "paid" ? FULFILLMENT_LABEL[order.fulfillment_status ?? "preparing"] : PAYMENT_STATUS_LABEL[order.status];

  const productAmount = order.unit_price * order.quantity + (items ?? []).reduce((sum, i) => sum + i.line_amount, 0);

  return (
    <div>
      <div>
        <Link href="/admin/purchase-orders" className="text-xs text-foreground-soft hover:text-brand-ink">
          ← 구매주문 목록
        </Link>
        <h1 className="mt-1 text-2xl font-bold">{order.toss_order_id}</h1>
        <p className="mt-1 text-xs text-foreground-soft">
          {new Date(order.created_at).toLocaleString("ko-KR", { dateStyle: "long", timeStyle: "short" })}
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {/* 상태·품목 */}
          <div className="rounded-2xl border border-border bg-background p-6">
            {order.status === "paid" ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground-soft">
                  결제완료
                </span>
                <span aria-hidden className="text-foreground-soft">
                  →
                </span>
                {FULFILLMENT_STEPS.map((step) => (
                  <form key={step} action={updateFulfillmentStatus.bind(null, order.id, step)}>
                    <button
                      type="submit"
                      disabled={statusKey === step}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                        statusKey === step
                          ? "border-brand bg-brand text-white"
                          : "border-border text-foreground-soft hover:border-brand/50"
                      }`}
                    >
                      {FULFILLMENT_LABEL[step]}
                    </button>
                  </form>
                ))}
              </div>
            ) : (
              <span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-bold text-brand-ink">{statusLabel}</span>
            )}

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                  {order.product_id && imageByProductId.get(order.product_id) && (
                    <Image src={imageByProductId.get(order.product_id)!} alt="" fill className="object-contain p-1.5" sizes="56px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {order.product_name}
                    {order.option_label ? ` (${order.option_label})` : ""}
                  </p>
                  <p className="text-xs text-foreground-soft">
                    {order.unit_price.toLocaleString()}원 x {order.quantity}개
                  </p>
                </div>
                <p className="shrink-0 font-semibold">{(order.unit_price * order.quantity).toLocaleString()}원</p>
              </div>
              {(items ?? []).map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-t border-border pt-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                    {item.product_id && imageByProductId.get(item.product_id) && (
                      <Image src={imageByProductId.get(item.product_id)!} alt="" fill className="object-contain p-1.5" sizes="56px" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">+ {item.product_name}</p>
                    <p className="text-xs text-foreground-soft">
                      {item.unit_price.toLocaleString()}원 x {item.quantity}개
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold">{item.line_amount.toLocaleString()}원</p>
                </div>
              ))}
            </div>
          </div>

          {/* 배송 정보 입력 */}
          <div className="rounded-2xl border border-border bg-background p-6">
            <p className="text-sm font-bold">배송 정보</p>
            <p className="mt-1 text-xs text-foreground-soft">
              택배사·송장번호를 입력하면 상태가 자동으로 &ldquo;배송중&rdquo;으로 바뀝니다.
            </p>
            <form action={updateShippingInfo.bind(null, order.id)} className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                name="carrier"
                defaultValue={order.carrier ?? ""}
                placeholder="택배사 (예: CJ대한통운)"
                className="rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <input
                name="trackingNumber"
                defaultValue={order.tracking_number ?? ""}
                placeholder="송장번호"
                className="rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button type="submit" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
                저장
              </button>
            </form>
          </div>

          {(order.notes || order.delivery_memo) && (
            <div className="rounded-2xl border border-border bg-background p-6 text-sm">
              {order.delivery_memo && (
                <p>
                  <span className="text-foreground-soft">배송메모</span> {order.delivery_memo}
                </p>
              )}
              {order.notes && (
                <p className="mt-1">
                  <span className="text-foreground-soft">요청사항</span> {order.notes}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-background p-6">
            <p className="text-sm font-bold">결제 정보</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-foreground-soft">결제수단</dt>
                <dd>토스페이먼츠</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-soft">상품 금액</dt>
                <dd>{productAmount.toLocaleString()}원</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <dt>결제 금액</dt>
                <dd className="text-brand-ink">{order.amount.toLocaleString()}원</dd>
              </div>
              {order.paid_at && (
                <div className="flex justify-between text-xs text-foreground-soft">
                  <dt>결제완료</dt>
                  <dd>{new Date(order.paid_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6">
            <p className="text-sm font-bold">구매자</p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-semibold">
                {order.applicant_name}
                {order.company_name ? ` (${order.company_name})` : ""}
              </p>
              <p className="text-foreground-soft">{order.applicant_phone}</p>
              {order.applicant_email && <p className="text-foreground-soft">{order.applicant_email}</p>}
              {order.business_reg_number && <p className="text-foreground-soft">사업자등록번호 {order.business_reg_number}</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6">
            <p className="text-sm font-bold">배송지</p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="font-semibold">{order.receiver_name}</p>
              <p className="text-foreground-soft">{order.receiver_phone}</p>
              <p className="text-foreground-soft">
                {order.zip_code ? `[${order.zip_code}] ` : ""}
                {order.shipping_address}
              </p>
              <p className="text-xs text-foreground-soft">배송메모: {order.delivery_memo || "없음"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
