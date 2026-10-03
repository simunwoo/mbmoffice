"use client";

import { useTransition } from "react";
import { deleteRentalApplication, updateRentalApplicationStatus } from "@/lib/actions/admin/rental-applications";

export type RentalApplicationStatus = "new" | "contacted" | "closed" | "won" | "lost";

const STATUS_OPTIONS: { value: RentalApplicationStatus; label: string }[] = [
  { value: "new", label: "신규" },
  { value: "contacted", label: "연락완료" },
  { value: "won", label: "계약성공" },
  { value: "lost", label: "계약실패" },
];

export function RentalApplicationRowActions({ id, status }: { id: string; status: RentalApplicationStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-center gap-2">
      <select
        defaultValue={status}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as RentalApplicationStatus;
          startTransition(() => updateRentalApplicationStatus(id, next));
        }}
        className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-xs font-semibold outline-none focus:border-brand"
      >
        {status === "closed" && <option value="closed">종결(구분없음)</option>}
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm("이 렌탈 신청을 삭제할까요?")) startTransition(() => deleteRentalApplication(id));
        }}
        className="text-xs font-semibold text-foreground-soft hover:text-red-600"
      >
        삭제
      </button>
    </div>
  );
}
