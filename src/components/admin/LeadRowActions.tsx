"use client";

import { useTransition } from "react";
import { deleteLead, updateLeadStatus } from "@/lib/actions/admin/leads";

export type LeadStatus = "new" | "contacted" | "closed" | "won" | "lost";

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "신규" },
  { value: "contacted", label: "연락완료" },
  { value: "won", label: "계약성공" },
  { value: "lost", label: "계약실패" },
];

export function LeadRowActions({ id, status }: { id: string; status: LeadStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-center gap-2">
      <select
        defaultValue={status}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as LeadStatus;
          startTransition(() => updateLeadStatus(id, next));
        }}
        className="rounded-lg border border-border bg-transparent px-2 py-1.5 text-xs font-semibold outline-none focus:border-brand"
      >
        {/* 과거 데이터에 "종결" 상태가 남아있을 수 있어 선택지에는 없어도 값으로는 허용합니다. */}
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
          if (confirm("이 문의를 삭제할까요?")) startTransition(() => deleteLead(id));
        }}
        className="text-xs font-semibold text-foreground-soft hover:text-red-600"
      >
        삭제
      </button>
    </div>
  );
}
