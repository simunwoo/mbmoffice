import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { completePurchaseOrder } from "@/lib/actions/purchase-apply";
import { PurchaseConversionEvent } from "@/components/PurchaseConversionEvent";

export const metadata = buildMetadata({
  title: "결제 완료",
  description: "구매 결제 결과를 확인합니다.",
  path: "/shop/order/success",
});

export default async function ShopOrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ paymentKey?: string; orderId?: string; amount?: string }>;
}) {
  const { paymentKey, orderId, amount } = await searchParams;

  if (!paymentKey || !orderId || !amount) {
    return (
      <NoticeLayout title="결제 정보를 확인할 수 없습니다">
        결제 결과 링크가 올바르지 않습니다. 문제가 계속되면 담당자에게 문의해 주세요.
      </NoticeLayout>
    );
  }

  const result = await completePurchaseOrder({ paymentKey, tossOrderId: orderId, amount: Number(amount) });

  if (!result.success || !result.order) {
    return (
      <NoticeLayout title="결제 승인에 실패했습니다">
        {result.message ?? "결제 승인 처리 중 문제가 발생했습니다."} 문제가 계속되면 담당자에게 문의해 주세요.
      </NoticeLayout>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <PurchaseConversionEvent
        tossOrderId={orderId}
        productName={result.order.productName}
        quantity={result.order.quantity}
        amount={result.order.amount}
      />
      <p className="text-xs font-bold tracking-widest text-brand-ink">결제 완료</p>
      <h1 className="mt-2 text-2xl font-bold">주문이 정상적으로 결제되었습니다.</h1>
      <div className="mt-6 rounded-2xl border border-border bg-background p-6 text-left text-sm">
        <p>
          <span className="text-foreground-soft">상품</span> <span className="font-semibold">{result.order.productName}</span>
        </p>
        <p className="mt-1">
          <span className="text-foreground-soft">수량</span> <span className="font-semibold">{result.order.quantity}개</span>
        </p>
        <p className="mt-1">
          <span className="text-foreground-soft">결제 금액</span>{" "}
          <span className="font-semibold">{result.order.amount.toLocaleString()}원 (VAT 포함)</span>
        </p>
      </div>
      <p className="mt-4 text-sm text-foreground-soft">
        입력하신 연락처로 담당 매니저가 배송 일정을 안내해 드립니다. 급하시면 전화 {siteConfig.phone}로 연결해 드립니다.
      </p>
      <Link href="/shop" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90">
        구매 상품 더 보러가기
      </Link>
    </div>
  );
}

function NoticeLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-xl font-bold">{title}</h1>
      <p className="mt-3 text-sm text-foreground-soft">{children}</p>
      <a href={siteConfig.phoneHref} className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90">
        전화 상담 {siteConfig.phone}
      </a>
    </div>
  );
}
