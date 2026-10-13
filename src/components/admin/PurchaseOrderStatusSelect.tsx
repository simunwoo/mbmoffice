"use client";

import { useTransition } from "react";
import { updateFulfillmentStatus, type FulfillmentStatus } from "@/lib/actions/admin/purchase-orders";

const STATUS_OPTIONS: { value: FulfillmentStatus; label: string }[] = [
  { value: "preparing", label: "상품준비중" },
  { value: "ready_to_ship", label: "배송대기" },
  { value: "shipping", label: "배송중" },
  { value: "delivered", label: "배송완료" },
  { value: "cancel_requested", label: "취소접수" },
  { value: "return_requested", label: "반품접수" },
];

const STATUS_CLASS: Record<FulfillmentStatus, string> = {
  preparing: "border-blue-200 bg-blue-100 text-blue-700",
  ready_to_ship: "border-indigo-200 bg-indigo-100 text-indigo-700",
  shipping: "border-purple-200 bg-purple-100 text-purple-700",
  delivered: "border-green-200 bg-green-100 text-green-700",
  cancel_requested: "border-red-200 bg-red-100 text-red-700",
  return_requested: "border-orange-200 bg-orange-100 text-orange-700",
};

export function PurchaseOrderStatusSelect({ id, status }: { id: string; status: FulfillmentStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        const next = e.target.value as FulfillmentStatus;
        startTransition(() => updateFulfillmentStatus(id, next));
      }}
      className={`rounded-full border px-2.5 py-1 text-xs font-bold outline-none disabled:opacity-60 ${STATUS_CLASS[status]}`}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
