"use client";

import { useTransition } from "react";
import { deleteLeadAndRedirect, updateLeadStatus } from "@/lib/actions/admin/leads";

type Status = "new" | "contacted" | "closed" | "won" | "lost";

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "new", label: "신규" },
  { value: "contacted", label: "연락완료" },
  { value: "won", label: "계약성공" },
  { value: "lost", label: "계약실패" },
];

export function LeadStatusSelect({ id, status }: { id: string; status: Status }) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const next = e.target.value as Status;
        startTransition(() => updateLeadStatus(id, next));
      }}
      className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold outline-none focus:border-brand"
    >
      {status === "closed" && <option value="closed">종결(구분없음)</option>}
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function LeadDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (confirm("이 문의를 삭제할까요? 되돌릴 수 없습니다.")) startTransition(() => deleteLeadAndRedirect(id));
      }}
      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
    >
      문의 삭제
    </button>
  );
}
