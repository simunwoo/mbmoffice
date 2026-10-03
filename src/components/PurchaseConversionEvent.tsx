"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/gtag";

/** 결제 완료 화면에서 1회만 GA4 purchase 이벤트를 보냅니다 (새로고침해도 같은 주문을 중복 집계하지 않도록 sessionStorage로 막습니다). */
export function PurchaseConversionEvent({
  tossOrderId,
  productName,
  quantity,
  amount,
}: {
  tossOrderId: string;
  productName: string;
  quantity: number;
  amount: number;
}) {
  useEffect(() => {
    const key = `ga_purchase_sent:${tossOrderId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage를 못 쓰면(프라이빗 모드 등) 중복 방지 없이 그냥 보냅니다.
    }
    trackEvent("purchase", {
      transaction_id: tossOrderId,
      value: amount,
      currency: "KRW",
      items: [{ item_name: productName, quantity }],
    });
  }, [tossOrderId, productName, quantity, amount]);

  return null;
}
