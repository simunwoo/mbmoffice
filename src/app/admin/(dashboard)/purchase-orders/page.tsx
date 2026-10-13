import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseOrderItemRow, PurchaseOrderRow } from "@/lib/supabase/types";

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

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
  canceled: "bg-surface text-foreground-soft",
  preparing: "bg-blue-100 text-blue-700",
  ready_to_ship: "bg-indigo-100 text-indigo-700",
  shipping: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancel_requested: "bg-red-100 text-red-700",
  return_requested: "bg-orange-100 text-orange-700",
};

function orderStatusKey(order: PurchaseOrderRow): string {
  if (order.status !== "paid") return order.status;
  return order.fulfillment_status ?? "preparing";
}

function orderStatusLabel(order: PurchaseOrderRow): string {
  if (order.status !== "paid") return PAYMENT_STATUS_LABEL[order.status];
  return FULFILLMENT_LABEL[order.fulfillment_status ?? "preparing"];
}

const TABS = [
  { key: "all", label: "전체" },
  { key: "pending", label: "결제대기" },
  { key: "preparing", label: "상품준비중" },
  { key: "ready_to_ship", label: "배송대기" },
  { key: "shipping", label: "배송중" },
  { key: "delivered", label: "배송완료" },
  { key: "cancel_requested", label: "취소접수" },
  { key: "return_requested", label: "반품접수" },
] as const;

export default async function AdminPurchaseOrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = TABS.find((t) => t.key === tab)?.key ?? "all";

  const supabase = await createClient();
  const { data, error } = await supabase.from("purchase_orders").select("*").order("created_at", { ascending: false });
  const orders = (data ?? []) as PurchaseOrderRow[];

  const orderIds = orders.map((o) => o.id);
  const { data: allItems } = orderIds.length
    ? await supabase.from("purchase_order_items").select("*").in("order_id", orderIds)
    : { data: [] as PurchaseOrderItemRow[] };
  const itemsByOrder = new Map<string, PurchaseOrderItemRow[]>();
  for (const item of allItems ?? []) {
    itemsByOrder.set(item.order_id, [...(itemsByOrder.get(item.order_id) ?? []), item]);
  }

  // 품목 썸네일용 — 주문·추가상품에 걸린 상품 ID를 모아 한 번에 조회합니다.
  const productIds = Array.from(
    new Set([...orders.map((o) => o.product_id), ...(allItems ?? []).map((i) => i.product_id)].filter((id): id is string => !!id))
  );
  const { data: productRows } = productIds.length ? await supabase.from("products").select("id, images").in("id", productIds) : { data: [] };
  const imageByProductId = new Map((productRows ?? []).map((p) => [p.id, p.images?.[0] as string | undefined]));

  const counts: Record<string, number> = { all: orders.length };
  for (const t of TABS) {
    if (t.key === "all") continue;
    counts[t.key] = orders.filter((o) => orderStatusKey(o) === t.key).length;
  }

  const filtered = activeTab === "all" ? orders : orders.filter((o) => orderStatusKey(o) === activeTab);

  return (
    <div>
      <h1 className="text-2xl font-bold">구매주문</h1>
      <p className="mt-1 text-sm text-foreground-soft">구매 상품 상세페이지 &ldquo;구매하기&rdquo; 버튼으로 들어온 주문·결제 목록입니다.</p>

      <div className="mt-5 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/admin/purchase-orders" : `/admin/purchase-orders?tab=${t.key}`}
            className={`rounded-t-lg border-b-2 px-3.5 py-2.5 text-sm font-semibold transition ${
              activeTab === t.key
                ? "border-brand-ink text-foreground"
                : "border-transparent text-foreground-soft hover:text-foreground"
            }`}
          >
            {t.label} <span className="text-xs text-foreground-soft">{counts[t.key] ?? 0}</span>
          </Link>
        ))}
      </div>

      {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}
      {!error && filtered.length === 0 && <p className="mt-10 text-sm text-foreground-soft">조건에 맞는 주문이 없습니다.</p>}

      {!error && filtered.length > 0 && (
        <div className="mt-4 max-h-[70vh] overflow-auto rounded-2xl border border-border bg-background">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs text-foreground-soft">
              <tr>
                <th className="px-4 py-3 font-semibold">주문 정보</th>
                <th className="px-4 py-3 font-semibold">품목·가격·수량</th>
                <th className="px-4 py-3 font-semibold">배송 정보</th>
                <th className="px-4 py-3 font-semibold">결제 정보</th>
                <th className="px-4 py-3 font-semibold">수령인 정보·메모</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((order) => {
                const items = itemsByOrder.get(order.id) ?? [];
                const statusKey = orderStatusKey(order);
                const mainImage = order.product_id ? imageByProductId.get(order.product_id) : undefined;

                return (
                  <tr key={order.id} className="align-top transition hover:bg-surface">
                    <td className="px-4 py-3">
                      <Link href={`/admin/purchase-orders/${order.id}`} className="font-semibold hover:text-brand-ink hover:underline">
                        {order.toss_order_id}
                      </Link>
                      <p className="mt-0.5 text-xs text-foreground-soft">
                        {new Date(order.created_at).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" })}
                      </p>
                      <p className="mt-1.5 text-sm">
                        {order.applicant_name}
                        {order.company_name ? ` (${order.company_name})` : ""}
                      </p>
                      <p className="text-xs text-foreground-soft">{order.applicant_phone}</p>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`mb-2 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[statusKey] ?? ""}`}>
                        {orderStatusLabel(order)}
                      </span>
                      <div className="flex items-start gap-2.5">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                          {mainImage && <Image src={mainImage} alt="" fill className="object-contain p-1" sizes="40px" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {order.product_name}
                            {order.option_label ? ` (${order.option_label})` : ""}
                          </p>
                          <p className="text-xs text-foreground-soft">
                            {order.unit_price.toLocaleString()}원 x {order.quantity}개
                          </p>
                        </div>
                      </div>
                      {items.map((item) => (
                        <div key={item.id} className="mt-2 flex items-start gap-2.5 border-t border-border pt-2">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
                            {item.product_id && imageByProductId.get(item.product_id) && (
                              <Image src={imageByProductId.get(item.product_id)!} alt="" fill className="object-contain p-1" sizes="40px" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs text-foreground-soft">+ {item.product_name}</p>
                            <p className="text-xs text-foreground-soft">
                              {item.unit_price.toLocaleString()}원 x {item.quantity}개
                            </p>
                          </div>
                        </div>
                      ))}
                    </td>

                    <td className="px-4 py-3">
                      {order.carrier || order.tracking_number ? (
                        <>
                          <p className="font-semibold">{order.carrier || "택배사 미입력"}</p>
                          <p className="text-xs text-foreground-soft">{order.tracking_number || "-"}</p>
                        </>
                      ) : (
                        <p className="text-foreground-soft">-</p>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <p className="text-xs text-foreground-soft">총 결제 금액</p>
                      <p className="font-bold text-brand-ink">{order.amount.toLocaleString()}원</p>
                      <p className="mt-1 text-xs text-foreground-soft">토스페이먼츠</p>
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold">{order.receiver_name}</p>
                      <p className="text-xs text-foreground-soft">{order.receiver_phone}</p>
                      <p className="mt-0.5 max-w-[220px] text-xs text-foreground-soft">
                        {order.zip_code ? `[${order.zip_code}] ` : ""}
                        {order.shipping_address}
                      </p>
                      {order.delivery_memo && <p className="mt-0.5 text-xs text-foreground-soft">메모: {order.delivery_memo}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
