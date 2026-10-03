import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site-config";
import { markPurchaseOrderFailed } from "@/lib/actions/purchase-apply";

export const metadata = buildMetadata({
  title: "결제 실패",
  description: "구매 결제가 완료되지 않았습니다.",
  path: "/shop/order/fail",
});

export default async function ShopOrderFailPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; message?: string; orderId?: string }>;
}) {
  const { message, orderId } = await searchParams;

  if (orderId) {
    await markPurchaseOrderFailed(orderId);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-xs font-bold tracking-widest text-red-600">결제 실패</p>
      <h1 className="mt-2 text-2xl font-bold">결제가 완료되지 않았습니다.</h1>
      <p className="mt-3 text-sm text-foreground-soft">{message || "결제 진행 중 문제가 발생했습니다."}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:opacity-90">
          다시 주문하기
        </Link>
        <a href={siteConfig.phoneHref} className="rounded-full border border-border px-6 py-3 text-sm font-bold hover:bg-surface">
          전화 상담 {siteConfig.phone}
        </a>
      </div>
    </div>
  );
}
