import { createClient } from "@/lib/supabase/server";
import type { PurchaseOrderItemRow, PurchaseOrderRow } from "@/lib/supabase/types";

const STATUS_LABEL: Record<PurchaseOrderRow["status"], string> = {
  pending: "결제 대기",
  paid: "결제 완료",
  failed: "결제 실패",
  canceled: "취소",
};

const STATUS_BADGE: Record<PurchaseOrderRow["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700",
  canceled: "bg-surface text-foreground-soft",
};

export default async function AdminPurchaseOrdersPage() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("purchase_orders")
    .select("*")
    .order("created_at", { ascending: false });

  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: allItems } = orderIds.length
    ? await supabase.from("purchase_order_items").select("*").in("order_id", orderIds)
    : { data: [] as PurchaseOrderItemRow[] };
  const itemsByOrder = new Map<string, PurchaseOrderItemRow[]>();
  for (const item of allItems ?? []) {
    itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) ?? []), item]);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">구매주문</h1>
      <p className="mt-1 text-sm text-foreground-soft">구매 상품 상세페이지 &ldquo;구매하기&rdquo; 버튼으로 들어온 주문·결제 목록입니다.</p>

      {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}

      {!error && (!orders || orders.length === 0) && (
        <p className="mt-10 text-sm text-foreground-soft">아직 접수된 구매 주문이 없습니다.</p>
      )}

      {!error && orders && orders.length > 0 && (
        <div className="mt-6 space-y-3">
          {(orders as PurchaseOrderRow[]).map((order) => (
            <div key={order.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-xs text-foreground-soft">
                    {new Date(order.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  <span className="font-semibold">
                    {order.product_name}
                    {order.option_label ? ` (${order.option_label})` : ""}
                  </span>
                  <span className="text-sm text-foreground-soft">{order.quantity}개</span>
                  <span className="text-sm font-semibold text-brand-ink">{order.amount.toLocaleString()}원</span>
                </div>
                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              {(itemsByOrder.get(order.id)?.length ?? 0) > 0 && (
                <ul className="mt-2 space-y-0.5 border-t border-border pt-2 text-sm text-foreground-soft">
                  {itemsByOrder.get(order.id)!.map((item) => (
                    <li key={item.id}>
                      + {item.product_name} x {item.quantity}개 ({item.line_amount.toLocaleString()}원)
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-foreground-soft">
                <span>
                  {order.applicant_name}
                  {order.company_name ? ` (${order.company_name})` : ""} · {order.applicant_phone}
                </span>
                <span>
                  수령인: {order.receiver_name} ({order.receiver_phone})
                </span>
                <span>
                  배송지: {order.zip_code ? `[${order.zip_code}] ` : ""}
                  {order.shipping_address}
                </span>
                {order.delivery_memo && <span>배송메모: {order.delivery_memo}</span>}
                {order.notes && <span>요청사항: {order.notes}</span>}
                {order.paid_at && (
                  <span>결제완료: {new Date(order.paid_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
