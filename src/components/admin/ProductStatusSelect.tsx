"use client";

import { useTransition } from "react";
import { updateProductStatus } from "@/lib/actions/admin/products";
import type { ProductRow } from "@/lib/supabase/types";

const STATUS_OPTIONS: { value: ProductRow["status"]; label: string }[] = [
  { value: "selling", label: "판매중" },
  { value: "soldout", label: "품절" },
  { value: "hidden", label: "숨김" },
];

const STATUS_CLASS: Record<ProductRow["status"], string> = {
  selling: "border-brand/40 bg-brand-soft text-brand-ink",
  soldout: "border-border bg-surface text-foreground-soft",
  hidden: "border-border bg-surface text-foreground-soft",
};

export function ProductStatusSelect({ id, status }: { id: string; status: ProductRow["status"] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as ProductRow["status"];
        startTransition(() => updateProductStatus(id, next));
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
