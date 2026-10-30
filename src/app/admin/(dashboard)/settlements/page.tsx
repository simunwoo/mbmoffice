import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PurchaseOrderRow } from "@/lib/supabase/types";

/** 월별로 묶어 건수·매출합계를 보여주는 정산 요약입니다. key는 "YYYY-MM". */
function groupByMonth(orders: PurchaseOrderRow[]) {
  const map = new Map<string, { count: number; total: number }>();
  for (const o of orders) {
    const key = (o.settled_at ?? o.created_at).slice(0, 7);
    const entry = map.get(key) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += o.amount;
    map.set(key, entry);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
}

export default async function AdminSettlementsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select("*")
    .not("settled_at", "is", null)
    .order("settled_at", { ascending: false });
  const orders = (data ?? []) as PurchaseOrderRow[];

  const monthly = groupByMonth(orders);
  const grandTotal = orders.reduce((sum, o) => sum + o.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold">정산내역</h1>
      <p className="mt-1 text-sm text-foreground-soft">
        배송완료 후 &ldquo;구매확정&rdquo; 처리된 주문의 매출 기록입니다. 실제 결제대금 입금은 토스페이먼츠 자체 정산일정에
        따라 사장님 계좌로 들어옵니다 — 이 페이지는 내부 매출 확인·장부용 기록입니다.
      </p>

      {error && <p className="mt-6 text-sm text-red-600">불러오는 중 오류가 발생했습니다: {error.message}</p>}

      {!error && orders.length === 0 && (
        <p className="mt-10 text-sm text-foreground-soft">아직 구매확정 처리된 주문이 없습니다.</p>
      )}

      {!error && orders.length > 0 && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-5">
              <p className="text-xs font-semibold text-foreground-soft">정산 확정 건수</p>
              <p className="mt-2 text-2xl font-bold">{orders.length.toLocaleString()}건</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5 sm:col-span-2">
              <p className="text-xs font-semibold text-foreground-soft">누적 매출</p>
              <p className="mt-2 text-2xl font-bold text-brand-ink">{grandTotal.toLocaleString()}원</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-background">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface text-xs text-foreground-soft">
                <tr>
                  <th className="px-4 py-3 font-semibold">월</th>
                  <th className="px-4 py-3 font-semibold">정산 건수</th>
                  <th className="px-4 py-3 font-semibold">매출 합계</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {monthly.map(([month, v]) => (
                  <tr key={month}>
                    <td className="px-4 py-3 font-semibold">{month}</td>
                    <td className="px-4 py-3">{v.count.toLocaleString()}건</td>
                    <td className="px-4 py-3 font-bold text-brand-ink">{v.total.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 max-h-[60vh] overflow-auto rounded-2xl border border-border bg-background">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-border bg-surface text-xs text-foreground-soft">
                <tr>
                  <th className="px-4 py-3 font-semibold">정산일</th>
                  <th className="px-4 py-3 font-semibold">주문 정보</th>
                  <th className="px-4 py-3 font-semibold">상품</th>
                  <th className="px-4 py-3 font-semibold">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface">
                    <td className="px-4 py-3 text-xs text-foreground-soft">
                      {order.settled_at && new Date(order.settled_at).toLocaleDateString("ko-KR", { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/purchase-orders/${order.id}`} className="font-semibold hover:text-brand-ink hover:underline">
                        {order.toss_order_id}
                      </Link>
                      <p className="text-xs text-foreground-soft">{order.applicant_name}</p>
                    </td>
                    <td className="px-4 py-3">
                      {order.product_name}
                      {order.option_label ? ` (${order.option_label})` : ""}
                    </td>
                    <td className="px-4 py-3 font-bold text-brand-ink">{order.amount.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
